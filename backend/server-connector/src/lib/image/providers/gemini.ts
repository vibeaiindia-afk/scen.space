import { mimeFor } from '../config';
import { ImageProviderError, type GeneratedImage, type ImageGenerateInput, type ImageProviderAdapter, type ImageProviderResult } from '../types';

function parseJson(raw:string){try{return raw?JSON.parse(raw):{}}catch{return {raw}}}
function collectImages(body:any):GeneratedImage[]{
  const out:GeneratedImage[]=[];const seen=new Set<string>();
  function push(x:any){const data=x?.data||x?.data_base64||x?.b64_json;const mime=x?.mime_type||x?.mimeType||'image/png';if(data&&!seen.has(data)){seen.add(data);out.push({mimeType:mime,dataBase64:data})}}
  push(body?.output_image);push(body?.outputImage);
  for(const step of body?.steps||[])for(const c of step?.content||[])if(c?.type==='image')push(c);
  for(const c of body?.output||[])if(c?.type==='image')push(c);
  return out;
}
function geminiSize(size:string){return size==='4K'?'4K':size==='2K'?'2K':'1K'}

export const geminiImageAdapter:ImageProviderAdapter={
  id:'gemini',envKey:'GEMINI_API_KEY',defaultModel:process.env.SCEN_GEMINI_IMAGE_MODEL||'gemini-3.1-flash-image',
  isConfigured:()=>Boolean(process.env.GEMINI_API_KEY),
  async test(modelOverride){
    const key=process.env.GEMINI_API_KEY;if(!key)throw new ImageProviderError('gemini','GEMINI_API_KEY is not configured',503,true,'missing_key');
    const model=modelOverride||process.env.SCEN_GEMINI_IMAGE_MODEL||'gemini-3.1-flash-image';
    const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}`,{headers:{'x-goog-api-key':key}});const raw=await r.text();const body=parseJson(raw);
    if(!r.ok)throw new ImageProviderError('gemini',body?.error?.message||`Gemini model check failed (${r.status})`,r.status,r.status===429||r.status>=500,body?.error?.status);
    return {ok:true,model,detail:body?.displayName||body?.name||model};
  },
  async generate(input,signal,modelOverride):Promise<ImageProviderResult>{
    const key=process.env.GEMINI_API_KEY;if(!key)throw new ImageProviderError('gemini','GEMINI_API_KEY is not configured',503,true,'missing_key');
    const model=modelOverride||process.env.SCEN_GEMINI_IMAGE_MODEL||'gemini-3.1-flash-image', mimeType=mimeFor(input.format);const all:GeneratedImage[]=[];let lastId:string|undefined;
    const refs=input.references||[];const promptInput:any=refs.length?[{type:'text',text:input.prompt},...refs.map(x=>({type:'image',mime_type:x.mimeType,data:x.dataBase64}))]:input.prompt;
    for(let i=0;i<input.count;i++){
      const payload:any={model,input:promptInput,store:false,response_format:{type:'image',mime_type:mimeType,aspect_ratio:input.aspectRatio,image_size:geminiSize(input.size)}};
      const r=await fetch('https://generativelanguage.googleapis.com/v1beta/interactions',{method:'POST',signal,headers:{'x-goog-api-key':key,'Content-Type':'application/json'},body:JSON.stringify(payload)});const raw=await r.text();const body=parseJson(raw);
      if(!r.ok)throw new ImageProviderError('gemini',body?.error?.message||`Gemini image request failed (${r.status})`,r.status,r.status===408||r.status===429||r.status>=500,body?.error?.status);
      lastId=body?.id||lastId;const found=collectImages(body);if(!found.length)throw new ImageProviderError('gemini','Gemini returned no image data',502,true,'empty_output');all.push(...found.slice(0,1));
    }
    return {images:all,provider:'gemini',model,usage:{},providerRequestId:lastId};
  }
};
