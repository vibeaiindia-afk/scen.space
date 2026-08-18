import { ProviderAdapter, ProviderError, type GenerateInput, type ProviderResult } from '../types';
import { modelFrom } from '../safe';

// xAI (Grok) speaks the OpenAI chat/completions shape, not the Responses API,
// so this adapter builds a messages array rather than reusing the OpenAI one.
// Base URL and model are env-configurable so API revisions need no code change.
const BASE = () => process.env.SCEN_GROK_BASE_URL || 'https://api.x.ai/v1';
const MODEL = () => modelFrom(process.env.SCEN_GROK_MODEL, 'grok-4.6');

/* A model id nobody can check.

   SCEN_GROK_MODEL had a key pasted into it, so it was deleted, and the
   fallback above is a guess about what xAI currently serves. When the guess is
   wrong every call 404s, the router moves to the next provider, and the build
   quietly stops using the provider this account is configured for — which is
   what happened, twice, before anything on the server said so.

   xAI will say which models the key can use. Ask it once, keep the answer for
   the life of the function, and prefer the highest grok version offered. An
   explicit SCEN_GROK_MODEL still wins; a failure to ask changes nothing, since
   the guess is what would have been used anyway. */
let discovered:{id:string;at:number}|null=null;
const DISCOVERY_TTL=10*60*1000;

function bestGrok(ids:string[]):string{
  const grok=ids.filter(id=>/^grok/i.test(id)&&!/image|vision-beta/i.test(id));
  if(!grok.length)return '';
  const version=(id:string)=>{const m=id.match(/grok-(\d+(?:\.\d+)?)/i);return m?parseFloat(m[1]):0};
  /* highest version, and among equals the plain one — "grok-4" over
     "grok-4-fast-non-reasoning" */
  return grok.sort((a,b)=>version(b)-version(a)||a.length-b.length)[0];
}

async function discoverModel(apiKey:string):Promise<string>{
  const now=Date.now();
  if(discovered&&now-discovered.at<DISCOVERY_TTL)return discovered.id;
  try{
    const res=await fetch(`${BASE()}/models`,{headers:{Authorization:`Bearer ${apiKey}`}});
    if(!res.ok)return '';
    const body:any=await res.json().catch(()=>({}));
    const ids:string[]=(Array.isArray(body?.data)?body.data:[]).map((m:any)=>String(m?.id||'')).filter(Boolean);
    const best=bestGrok(ids);
    if(best){discovered={id:best,at:now};console.log(`[ai] grok models available: ${ids.join(', ')} — using ${best}`)}
    return best;
  }catch{return ''}
}

/* Wrong-model errors read differently at every provider; these are xAI's. */
function isModelError(status:number,message:string):boolean{
  if(status===404)return true;
  return /model/i.test(message)&&/(not found|does not exist|no access|not have access|invalid)/i.test(message);
}

export const grokAdapter: ProviderAdapter = {
  id: 'grok',
  envKey: 'XAI_API_KEY',
  defaultModel: MODEL(),
  isConfigured: () => Boolean(process.env.XAI_API_KEY),
  async generate(input: GenerateInput, signal: AbortSignal, modelOverride?: string): Promise<ProviderResult> {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) throw new ProviderError('grok','XAI_API_KEY is not configured',503,false,'missing_key');
    const configured = modelOverride || (process.env.SCEN_GROK_MODEL ? MODEL() : '');
    const messages: Array<{role:string;content:string}> = [];
    if (input.system) messages.push({ role: 'system', content: input.system });
    messages.push({ role: 'user', content: input.input });

    const attempt = async (model:string) => {
      const payload: any = { model, messages };
      if (input.maxOutputTokens) payload.max_tokens = input.maxOutputTokens;
      if (typeof input.temperature === 'number') payload.temperature = input.temperature;
      const res = await fetch(`${BASE()}/chat/completions`, {
        method:'POST', signal,
        headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},
        body:JSON.stringify(payload),
      });
      const raw = await res.text();
      let body: any = {};
      try { body = raw ? JSON.parse(raw) : {}; } catch { body = { raw }; }
      return { res, body, model };
    };

    /* An explicit model is taken at its word; otherwise ask xAI what this key
       can run before guessing. */
    let model = configured || (await discoverModel(apiKey)) || MODEL();
    let { res, body } = await attempt(model);

    /* Guessed wrong: find out what exists and run it once more, rather than
       handing the whole build to another provider over a name. */
    if (!res.ok) {
      const first = String(body?.error?.message || body?.error || '');
      if (isModelError(res.status, first)) {
        discovered = null;
        const found = await discoverModel(apiKey);
        if (found && found !== model) {
          console.log(`[ai] grok model ${model} rejected (${res.status}) — retrying with ${found}`);
          model = found;
          ({ res, body } = await attempt(model));
        }
      }
    }

    if (!res.ok) {
      const message = body?.error?.message || body?.error || `xAI request failed (${res.status})`;
      throw new ProviderError('grok',String(message),res.status,res.status===429 || res.status>=500,body?.error?.code);
    }
    const text = String(body?.choices?.[0]?.message?.content || '').trim();
    if (!text) throw new ProviderError('grok','xAI returned no text',502,true,'empty_output');
    return {
      text, provider:'grok', model,
      usage:{inputTokens:Number(body?.usage?.prompt_tokens||0),outputTokens:Number(body?.usage?.completion_tokens||0)},
      providerRequestId:body?.id,
    };
  }
};
