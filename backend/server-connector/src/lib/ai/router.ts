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

/* A caller may name the provider it wants — the studio lets a client pick one
   in the composer. It is a preference, not a promise: an unconfigured or
   failing choice still falls through to the configured route rather than
   leaving the client with nothing. */
export async function generateWithRouting(input:GenerateInput,preferred?:AIProviderId):Promise<ProviderResult & {requestId:string;fallbackUsed:boolean;requested?:AIProviderId}>{
  const limits=gatewayLimits();
  if(!input.input?.trim()) throw new ProviderError('openai','Input is required',400,false,'invalid_input');
  if(input.input.length>limits.maxInputChars) throw new ProviderError('openai',`Input exceeds ${limits.maxInputChars} characters`,413,false,'input_too_large');
  const route=routeFor(input.feature); const requestId=`scen_${crypto.randomUUID()}`;
  const order:AIProviderId[]=[];
  if(preferred&&provider(preferred).isConfigured()) order.push(preferred);
  if(!order.includes(route.primary)) order.push(route.primary);
  if(route.fallback&&!order.includes(route.fallback)) order.push(route.fallback);

  let last:ProviderError|undefined;
  for(let i=0;i<order.length;i++){
    try{
      const result=await runOne(order[i],input);
      return {...result,requestId,fallbackUsed:i>0,requested:preferred};
    }catch(err:any){
      const e=err instanceof ProviderError?err:new ProviderError(order[i],String(err?.message||err),500,true);
      if(!e.retriable) throw e;
      last=e;
    }
  }
  throw last||new ProviderError(route.primary,'No AI provider answered',502,false);
}
