import crypto from 'node:crypto';
import { gatewayLimits, routeFor } from './config';
import { provider } from './registry';
import { ProviderError, type GenerateInput, type ProviderResult, type AIProviderId } from './types';

function timeoutSignal(ms:number):{signal:AbortSignal;clear:()=>void}{const controller=new AbortController();const id=setTimeout(()=>controller.abort(new Error('AI provider timeout')),ms);return {signal:controller.signal,clear:()=>clearTimeout(id)}}

async function runOne(id:AIProviderId,input:GenerateInput):Promise<ProviderResult>{
  const adapter=provider(id); if(!adapter.isConfigured()) throw new ProviderError(id,`${adapter.envKey} is not configured`,503,false,'missing_key');
  const limits=gatewayLimits(); const t=timeoutSignal(limits.timeoutMs);
  try{return await adapter.generate({...input,maxOutputTokens:Math.min(input.maxOutputTokens||limits.maxOutputTokens,limits.maxOutputTokens)},t.signal)}
  catch(e:any){if(e?.name==='AbortError') throw new ProviderError(id,'Provider request timed out',504,true,'timeout'); throw e}
  finally{t.clear()}
}

export async function generateWithRouting(input:GenerateInput):Promise<ProviderResult & {requestId:string;fallbackUsed:boolean}>{
  const limits=gatewayLimits();
  if(!input.input?.trim()) throw new ProviderError('openai','Input is required',400,false,'invalid_input');
  if(input.input.length>limits.maxInputChars) throw new ProviderError('openai',`Input exceeds ${limits.maxInputChars} characters`,413,false,'input_too_large');
  const route=routeFor(input.feature); const requestId=`scen_${crypto.randomUUID()}`;
  try{const result=await runOne(route.primary,input);return {...result,requestId,fallbackUsed:false}}
  catch(err:any){
    const first=err instanceof ProviderError?err:new ProviderError(route.primary,String(err?.message||err),500,true);
    if(!route.fallback||!first.retriable) throw first;
    const result=await runOne(route.fallback,input);return {...result,requestId,fallbackUsed:true};
  }
}
