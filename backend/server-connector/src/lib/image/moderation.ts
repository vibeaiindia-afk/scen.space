import { ImageProviderError } from './types';
export async function moderateImagePrompt(prompt:string,signal:AbortSignal){
  const mode=process.env.SCEN_IMAGE_MODERATION_MODE||'provider';if(mode!=='openai')return {mode:'provider',flagged:false};
  const key=process.env.OPENAI_API_KEY;if(!key)throw new ImageProviderError('openai','OpenAI prompt moderation is enabled but OPENAI_API_KEY is missing',503,true,'moderation_key_missing');
  const r=await fetch('https://api.openai.com/v1/moderations',{method:'POST',signal,headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model:'omni-moderation-latest',input:prompt})});const raw=await r.text();let body:any={};try{body=raw?JSON.parse(raw):{}}catch{body={raw}}
  if(!r.ok)throw new ImageProviderError('openai',body?.error?.message||`Moderation check failed (${r.status})`,r.status,r.status===429||r.status>=500,body?.error?.code);
  const flagged=Boolean(body?.results?.[0]?.flagged);if(flagged)throw new ImageProviderError('openai','Image prompt was blocked by the configured moderation pre-check',400,false,'moderation_blocked');return {mode:'openai',flagged:false};
}
