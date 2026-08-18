import { modelFrom } from '../safe';
import { ProviderAdapter, ProviderError, type GenerateInput, type ProviderResult } from '../types';

export const anthropicAdapter: ProviderAdapter = {
  id:'anthropic',
  envKey:'ANTHROPIC_API_KEY',
  defaultModel:modelFrom(process.env.SCEN_ANTHROPIC_MODEL,'claude-sonnet-4-20250514'),
  isConfigured:()=>Boolean(process.env.ANTHROPIC_API_KEY),
  async generate(input:GenerateInput, signal:AbortSignal, modelOverride?:string):Promise<ProviderResult>{
    const apiKey=process.env.ANTHROPIC_API_KEY;
    if(!apiKey) throw new ProviderError('anthropic','ANTHROPIC_API_KEY is not configured',503,false,'missing_key');
    const model=modelOverride || modelFrom(process.env.SCEN_ANTHROPIC_MODEL,'claude-sonnet-4-20250514');
    const payload:any={model,max_tokens:Math.max(1,Math.min(input.maxOutputTokens||2048,8192)),messages:[{role:'user',content:input.input}]};
    if(input.system) payload.system=input.system;
    if(typeof input.temperature==='number') payload.temperature=Math.max(0,Math.min(input.temperature,1));
    const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',signal,headers:{'content-type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01'},body:JSON.stringify(payload)});
    const raw=await res.text(); let body:any={}; try{body=raw?JSON.parse(raw):{}}catch{body={raw}}
    if(!res.ok){const message=body?.error?.message||`Anthropic request failed (${res.status})`;throw new ProviderError('anthropic',message,res.status,res.status===429||res.status>=500,body?.error?.type)}
    const text=(body?.content||[]).filter((x:any)=>x?.type==='text').map((x:any)=>x.text).join('\n').trim();
    if(!text) throw new ProviderError('anthropic','Anthropic returned no text',502,true,'empty_output');
    return {text,provider:'anthropic',model,usage:{inputTokens:Number(body?.usage?.input_tokens||0),outputTokens:Number(body?.usage?.output_tokens||0)},providerRequestId:body?.id};
  }
};
