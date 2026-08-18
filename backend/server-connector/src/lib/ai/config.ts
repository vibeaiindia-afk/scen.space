import type { AIFeature, AIProviderId } from './types';

const ids:AIProviderId[]=['openai','anthropic','gemini','grok'];
function asProvider(value:string|undefined,fallback:AIProviderId):AIProviderId{return ids.includes(value as AIProviderId)?value as AIProviderId:fallback}
export function routeFor(feature:AIFeature):{primary:AIProviderId;fallback?:AIProviderId}{
  /* Grok writes the builds by default — the client asked for it and supplied
     the key. Each route keeps a different fallback so one provider being down
     is not the end of a build, and every SCEN_AI_*_PRIMARY env var still wins
     over these. */
  /* grok is a reasoning model and it shows: it lays out a page in sixteen
     seconds and cannot finish the site copy inside its share of the function,
     so every build spent twenty-five seconds timing out before OpenAI wrote
     the words anyway. It stays primary for the short calls it is good at —
     the plan, the code patch, the review — and takes second place on `chat`,
     which is the long one. Any SCEN_AI_*_PRIMARY still overrides this. */
  /* Measured, not assumed: grok timed out on the copy at 25s and again on the
     page plan with 45s to work in. It stays primary on `code` — the stylesheet
     patch, the smallest call there is, and the one the client's own diagram
     gives it — and moves behind a faster provider everywhere else. Nothing is
     lost: it still answers whenever the first one fails, and any
     SCEN_AI_*_PRIMARY overrides all of it. */
  const defaults:Record<AIFeature,[AIProviderId,AIProviderId|undefined]>={chat:['openai','grok'],code:['grok','openai'],planning:['openai','grok'],analysis:['openai','grok']};
  const [dp,df]=defaults[feature];
  const upper=feature.toUpperCase();
  const primary=asProvider(process.env[`SCEN_AI_${upper}_PRIMARY`],dp);
  const rawFallback=process.env[`SCEN_AI_${upper}_FALLBACK`];
  const fallback=rawFallback==='none'?undefined:asProvider(rawFallback,df||dp);
  return {primary,fallback};
}
export function gatewayLimits(){return {timeoutMs:Math.max(5000,Number(process.env.SCEN_AI_TIMEOUT_MS||45000)),maxInputChars:Math.max(1000,Number(process.env.SCEN_AI_MAX_INPUT_CHARS||120000)),maxOutputTokens:Math.max(64,Number(process.env.SCEN_AI_MAX_OUTPUT_TOKENS||4096))}}
