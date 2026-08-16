import { mimeFor, normalizeQuality, openAISize } from '../config';
import { ImageProviderError, type ImageGenerateInput, type ImageProviderAdapter, type ImageProviderResult } from '../types';

function parseJson(raw:string){try{return raw?JSON.parse(raw):{}}catch{return {raw}}}
function ext(mime:string){return mime==='image/jpeg'?'jpg':mime==='image/webp'?'webp':'png'}
function imagesFrom(body:any,mimeType:string){return (body?.data||[]).map((x:any)=>({mimeType,dataBase64:x?.b64_json,url:x?.url})).filter((x:any)=>x.dataBase64||x.url)}

export const openAIImageAdapter:ImageProviderAdapter={
  id:'openai', envKey:'OPENAI_API_KEY', defaultModel:process.env.SCEN_OPENAI_IMAGE_MODEL||'gpt-image-2',
  isConfigured:()=>Boolean(process.env.OPENAI_API_KEY),
  async test(modelOverride){
    const key=process.env.OPENAI_API_KEY;if(!key)throw new ImageProviderError('openai','OPENAI_API_KEY is not configured',503,true,'missing_key');
    const model=modelOverride||process.env.SCEN_OPENAI_IMAGE_MODEL||'gpt-image-2';
    const r=await fetch(`https://api.openai.com/v1/models/${encodeURIComponent(model)}`,{headers:{Authorization:`Bearer ${key}`}});const raw=await r.text();const body=parseJson(raw);
    if(!r.ok)throw new ImageProviderError('openai',body?.error?.message||`OpenAI model check failed (${r.status})`,r.status,r.status===429||r.status>=500,body?.error?.code);
    return {ok:true,model,detail:body?.id||model};
  },
  async generate(input,signal,modelOverride):Promise<ImageProviderResult>{
    const key=process.env.OPENAI_API_KEY;if(!key)throw new ImageProviderError('openai','OPENAI_API_KEY is not configured',503,true,'missing_key');
    const model=modelOverride||process.env.SCEN_OPENAI_IMAGE_MODEL||'gpt-image-2';
    const size=openAISize(input.aspectRatio,input.size), quality=normalizeQuality(input.quality), mimeType=mimeFor(input.format);
    let r:Response;
    if(input.mode==='edit'){
      const refs=input.references||[];if(!refs.length)throw new ImageProviderError('openai','At least one reference image is required for edit mode',400,false,'missing_reference');
      const form=new FormData();form.append('model',model);form.append('prompt',input.prompt);form.append('size',size);form.append('quality',quality);form.append('output_format',input.format);form.append('n',String(input.count));
      refs.forEach((ref,i)=>{const bytes=Buffer.from(ref.dataBase64,'base64');form.append('image[]',new Blob([bytes],{type:ref.mimeType}),`reference-${i+1}.${ext(ref.mimeType)}`)});
      r=await fetch('https://api.openai.com/v1/images/edits',{method:'POST',signal,headers:{Authorization:`Bearer ${key}`},body:form});
    }else{
      r=await fetch('https://api.openai.com/v1/images/generations',{method:'POST',signal,headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model,prompt:input.prompt,n:input.count,size,quality,output_format:input.format,background:'auto'})});
    }
    const raw=await r.text();const body=parseJson(raw);
    if(!r.ok){const message=body?.error?.message||`OpenAI image request failed (${r.status})`;throw new ImageProviderError('openai',message,r.status,r.status===408||r.status===409||r.status===429||r.status>=500,body?.error?.code)}
    const images=imagesFrom(body,mimeType);if(!images.length)throw new ImageProviderError('openai','OpenAI returned no image data',502,true,'empty_output');
    return {images,provider:'openai',model,usage:{inputTokens:Number(body?.usage?.input_tokens||0)||undefined,outputTokens:Number(body?.usage?.output_tokens||0)||undefined,totalTokens:Number(body?.usage?.total_tokens||0)||undefined},providerRequestId:r.headers.get('x-request-id')||body?.id};
  }
};
