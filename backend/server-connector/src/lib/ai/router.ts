import crypto from 'node:crypto';
import { gatewayLimits, routeFor } from './config';
import { provider } from './registry';
import { ProviderError, type GenerateInput, type ProviderResult, type AIProviderId } from './types';
import { redact } from './safe';

/* Which provider actually answered, in the function's own log.

   The loop below falls through to the next provider without saying so, so a
   primary that is misconfigured — a model id its API does not know — looks
   from the outside exactly like a primary that works: 200, an answer, nobody
   the wiser. One line per attempt makes that visible. Provider ids, model
   names and status codes only; the message is redacted on the way in, because
   a provider's own error can quote what it was sent. */
function note(line:string){try{console.log('[ai] '+line)}catch{}}

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
      note(`${input.feature} answered by ${result.provider} · ${result.model}`+(i>0?` (fallback, ${order[0]} failed)`:''));
      return {...result,requestId,fallbackUsed:i>0,requested:preferred};
    }catch(err:any){
      const e=err instanceof ProviderError?err:new ProviderError(order[i],String(err?.message||err),500,true);
      note(`${input.feature} · ${order[i]} failed (${e.status}${e.code?', '+e.code:''}): ${redact(e.message).slice(0,160)}`);
      if(!e.retriable) throw e;
      last=e;
    }
  }
  throw last||new ProviderError(route.primary,'No AI provider answered',502,false);
}
