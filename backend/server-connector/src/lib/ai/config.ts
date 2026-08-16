import type { AIFeature, AIProviderId } from './types';

const ids:AIProviderId[]=['openai','anthropic','gemini','grok'];
function asProvider(value:string|undefined,fallback:AIProviderId):AIProviderId{return ids.includes(value as AIProviderId)?value as AIProviderId:fallback}
export function routeFor(feature:AIFeature):{primary:AIProviderId;fallback?:AIProviderId}{
  const defaults:Record<AIFeature,[AIProviderId,AIProviderId|undefined]>={chat:['openai','anthropic'],code:['openai','anthropic'],planning:['anthropic','openai'],analysis:['gemini','anthropic']};
  const [dp,df]=defaults[feature];
  const upper=feature.toUpperCase();
  const primary=asProvider(process.env[`SCEN_AI_${upper}_PRIMARY`],dp);
  const rawFallback=process.env[`SCEN_AI_${upper}_FALLBACK`];
  const fallback=rawFallback==='none'?undefined:asProvider(rawFallback,df||dp);
  return {primary,fallback};
}
export function gatewayLimits(){return {timeoutMs:Math.max(5000,Number(process.env.SCEN_AI_TIMEOUT_MS||45000)),maxInputChars:Math.max(1000,Number(process.env.SCEN_AI_MAX_INPUT_CHARS||120000)),maxOutputTokens:Math.max(64,Number(process.env.SCEN_AI_MAX_OUTPUT_TOKENS||4096))}}
