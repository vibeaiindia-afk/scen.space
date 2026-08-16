import { ProviderAdapter, ProviderError, type GenerateInput, type ProviderResult } from '../types';

function textFromResponse(body: any): string {
  if (typeof body?.output_text === 'string') return body.output_text;
  const parts: string[] = [];
  for (const item of body?.output || []) {
    for (const content of item?.content || []) {
      if (typeof content?.text === 'string') parts.push(content.text);
    }
  }
  return parts.join('\n').trim();
}

export const openAIAdapter: ProviderAdapter = {
  id: 'openai',
  envKey: 'OPENAI_API_KEY',
  defaultModel: process.env.SCEN_OPENAI_MODEL || 'gpt-5.6',
  isConfigured: () => Boolean(process.env.OPENAI_API_KEY),
  async generate(input: GenerateInput, signal: AbortSignal, modelOverride?: string): Promise<ProviderResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new ProviderError('openai','OPENAI_API_KEY is not configured',503,false,'missing_key');
    const model = modelOverride || process.env.SCEN_OPENAI_MODEL || 'gpt-5.6';
    const payload: any = {
      model,
      input: input.system ? [
        { role: 'developer', content: input.system },
        { role: 'user', content: input.input },
      ] : input.input,
      store: false,
    };
    if (input.maxOutputTokens) payload.max_output_tokens = input.maxOutputTokens;
    const res = await fetch('https://api.openai.com/v1/responses', {
      method:'POST', signal,
      headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},
      body:JSON.stringify(payload),
    });
    const raw = await res.text();
    let body: any = {};
    try { body = raw ? JSON.parse(raw) : {}; } catch { body = { raw }; }
    if (!res.ok) {
      const message = body?.error?.message || `OpenAI request failed (${res.status})`;
      throw new ProviderError('openai',message,res.status,res.status===429 || res.status>=500,body?.error?.code);
    }
    const text = textFromResponse(body);
    if (!text) throw new ProviderError('openai','OpenAI returned no text',502,true,'empty_output');
    return {
      text, provider:'openai', model,
      usage:{inputTokens:Number(body?.usage?.input_tokens||0),outputTokens:Number(body?.usage?.output_tokens||0)},
      providerRequestId:body?.id,
    };
  }
};
