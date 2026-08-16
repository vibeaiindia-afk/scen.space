import { ImageProviderError, type GeneratedImage, type ImageGenerateInput, type ImageProviderAdapter, type ImageProviderResult } from '../types';

function parseJson(raw:string){try{return raw?JSON.parse(raw):{}}catch{return {raw}}}
function splitModel(model:string){const [owner,name]=model.split('/');if(!owner||!name)throw new ImageProviderError('replicate','Replicate model must be owner/name',400,false,'invalid_model');return {owner,name}}
function outputImages(output:any):GeneratedImage[]{const arr=Array.isArray(output)?output:[output];return arr.flatMap((x:any)=>{if(typeof x==='string')return [{mimeType:'image/webp',url:x}];if(x?.url)return [{mimeType:x.content_type||'image/webp',url:x.url}];return []})}
async function sleep(ms:number){await new Promise(r=>setTimeout(r,ms))}

export const replicateImageAdapter:ImageProviderAdapter={
  id:'replicate',envKey:'REPLICATE_API_TOKEN',defaultModel:process.env.SCEN_REPLICATE_IMAGE_MODEL||'black-forest-labs/flux-1.1-pro',
  isConfigured:()=>Boolean(process.env.REPLICATE_API_TOKEN),
  async test(modelOverride){
    const token=process.env.REPLICATE_API_TOKEN;if(!token)throw new ImageProviderError('replicate','REPLICATE_API_TOKEN is not configured',503,true,'missing_key');
    const model=modelOverride||process.env.SCEN_REPLICATE_IMAGE_MODEL||'black-forest-labs/flux-1.1-pro';const {owner,name}=splitModel(model);
    const r=await fetch(`https://api.replicate.com/v1/models/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`,{headers:{Authorization:`Bearer ${token}`}});const raw=await r.text();const body=parseJson(raw);
    if(!r.ok)throw new ImageProviderError('replicate',body?.detail||`Replicate model check failed (${r.status})`,r.status,r.status===429||r.status>=500,body?.status);
    return {ok:true,model,detail:body?.name||model};
  },
  async generate(input,signal,modelOverride):Promise<ImageProviderResult>{
    const token=process.env.REPLICATE_API_TOKEN;if(!token)throw new ImageProviderError('replicate','REPLICATE_API_TOKEN is not configured',503,true,'missing_key');
    if(input.mode==='edit'||(input.references?.length||0)>0)throw new ImageProviderError('replicate','Generic Replicate rescue is generate-only; choose a model-specific edit adapter for references',400,false,'edit_not_supported');
    const model=modelOverride||process.env.SCEN_REPLICATE_IMAGE_MODEL||'black-forest-labs/flux-1.1-pro';const {owner,name}=splitModel(model);
    const started=Date.now();const r=await fetch(`https://api.replicate.com/v1/models/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/predictions`,{method:'POST',signal,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json','Prefer':'wait=60'},body:JSON.stringify({input:{prompt:input.prompt,aspect_ratio:input.aspectRatio,output_format:input.format,num_outputs:input.count}})});let raw=await r.text();let body=parseJson(raw);
    if(!r.ok)throw new ImageProviderError('replicate',body?.detail||`Replicate request failed (${r.status})`,r.status,r.status===429||r.status>=500,body?.status);
    while(['starting','processing'].includes(body?.status)&&body?.urls?.get){if(signal.aborted)throw new DOMException('Aborted','AbortError');await sleep(1500);const poll=await fetch(body.urls.get,{signal,headers:{Authorization:`Bearer ${token}`}});raw=await poll.text();body=parseJson(raw);if(!poll.ok)throw new ImageProviderError('replicate',body?.detail||`Replicate poll failed (${poll.status})`,poll.status,poll.status===429||poll.status>=500,body?.status)}
    if(body?.status!=='succeeded')throw new ImageProviderError('replicate',body?.error||`Replicate prediction ${body?.status||'failed'}`,502,true,body?.status);
    const images=outputImages(body?.output);if(!images.length)throw new ImageProviderError('replicate','Replicate returned no image URL',502,true,'empty_output');
    return {images:images.slice(0,input.count),provider:'replicate',model,usage:{providerSeconds:Number(body?.metrics?.predict_time||0)||((Date.now()-started)/1000)},providerRequestId:body?.id};
  }
};
