import { ProviderAdapter, ProviderError, type GenerateInput, type ProviderResult } from '../types';
import { modelFrom } from '../safe';

// xAI (Grok) speaks the OpenAI chat/completions shape, not the Responses API,
// so this adapter builds a messages array rather than reusing the OpenAI one.
// Base URL and model are env-configurable so API revisions need no code change.
const BASE = () => process.env.SCEN_GROK_BASE_URL || 'https://api.x.ai/v1';
const MODEL = () => modelFrom(process.env.SCEN_GROK_MODEL, 'grok-4.6');

export const grokAdapter: ProviderAdapter = {
  id: 'grok',
  envKey: 'XAI_API_KEY',
  defaultModel: MODEL(),
  isConfigured: () => Boolean(process.env.XAI_API_KEY),
  async generate(input: GenerateInput, signal: AbortSignal, modelOverride?: string): Promise<ProviderResult> {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) throw new ProviderError('grok','XAI_API_KEY is not configured',503,false,'missing_key');
    const model = modelOverride || MODEL();
    const messages: Array<{role:string;content:string}> = [];
    if (input.system) messages.push({ role: 'system', content: input.system });
    messages.push({ role: 'user', content: input.input });
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
