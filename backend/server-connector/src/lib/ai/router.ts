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

async function runOne(id:AIProviderId,input:GenerateInput,budgetMs?:number):Promise<ProviderResult>{
  const adapter=provider(id); if(!adapter.isConfigured()) throw new ProviderError(id,`${adapter.envKey} is not configured`,503,false,'missing_key');
  const limits=gatewayLimits(); const t=timeoutSignal(Math.max(6000,budgetMs||limits.timeoutMs));
  try{return await adapter.generate({...input,maxOutputTokens:Math.min(input.maxOutputTokens||limits.maxOutputTokens,limits.maxOutputTokens)},t.signal)}
  catch(e:any){if(e?.name==='AbortError') throw new ProviderError(id,'Provider request timed out',504,true,'timeout'); throw e}
  finally{t.clear()}
}

/* A caller may name the provider it wants — the studio lets a client pick one
   in the composer. It is a preference, not a promise: an unconfigured or
   failing choice still falls through to the configured route rather than
   leaving the client with nothing. */
/* A failed attempt, in a shape a client can show. The studio was told only
   that something answered; when the primary had quietly fallen over, the pane
   read "Provider: openai, Last error: none" and the reason lived nowhere. */
export type Attempt={provider:AIProviderId;status:number;code?:string;message:string};

export async function generateWithRouting(input:GenerateInput,preferred?:AIProviderId):Promise<ProviderResult & {requestId:string;fallbackUsed:boolean;requested?:AIProviderId;attempts:Attempt[]}>{
  const limits=gatewayLimits();
  if(!input.input?.trim()) throw new ProviderError('openai','Input is required',400,false,'invalid_input');
  if(input.input.length>limits.maxInputChars) throw new ProviderError('openai',`Input exceeds ${limits.maxInputChars} characters`,413,false,'input_too_large');
  const route=routeFor(input.feature); const requestId=`scen_${crypto.randomUUID()}`;
  const order:AIProviderId[]=[];
  if(preferred&&provider(preferred).isConfigured()) order.push(preferred);
  if(!order.includes(route.primary)) order.push(route.primary);
  if(route.fallback&&!order.includes(route.fallback)) order.push(route.fallback);

  let last:ProviderError|undefined;
  const attempts:Attempt[]=[];
  /* The function has sixty seconds. Two providers at forty-five each cannot
     both run inside that, so a primary that hung took the whole budget with it
     and Vercel killed the request before either answer came back — which the
     studio reported as "the gateway did not answer in time" with nothing in
     the log to say which provider had done it. Each attempt now gets what is
     actually left, and the last one always leaves room to reply. */
  const started=Date.now();
  const BUDGET=50_000;
  for(let i=0;i<order.length;i++){
    const left=BUDGET-(Date.now()-started);
    if(left<6000){
      note(`${input.feature} · out of time before ${order[i]}`);
      break;
    }
    /* Split what is left between the providers still to try. Giving the first
       one the whole budget is what happened next: grok took all forty-five
       seconds writing the copy, timed out, and the fallback had three seconds
       to work in — so the client got the local writer and a generic headline.
       A primary that has to answer in twenty-five seconds is better than a
       fallback that never gets to run. */
    const share=Math.max(12_000,Math.floor((left-2000)/(order.length-i)));
    try{
      const result=await runOne(order[i],input,Math.min(limits.timeoutMs,share));
      note(`${input.feature} answered by ${result.provider} · ${result.model}`+(i>0?` (fallback, ${order[0]} failed)`:''));
      return {...result,requestId,fallbackUsed:i>0,requested:preferred,attempts};
    }catch(err:any){
      const e=err instanceof ProviderError?err:new ProviderError(order[i],String(err?.message||err),500,true);
      note(`${input.feature} · ${order[i]} failed (${e.status}${e.code?', '+e.code:''}): ${redact(e.message).slice(0,160)}`);
      attempts.push({provider:order[i],status:e.status,code:e.code,message:redact(e.message).slice(0,200)});
      /* A bad key, a missing key or a model the account cannot run is fatal to
         that provider — it is not a reason to fail the request while another
         provider sits configured and idle. Only a complaint about the input
         itself is fatal to all of them, since the next one would say the same
         thing about the same text. */
      const inputsFault=e.status===400||e.status===413||e.code==='invalid_input'||e.code==='input_too_large';
      if(inputsFault){(e as any).attempts=attempts;throw e}
      last=e;
    }
  }
  if(last)(last as any).attempts=attempts;
  throw last||new ProviderError(route.primary,'No AI provider answered',502,false);
}
