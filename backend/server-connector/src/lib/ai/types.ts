export type AIProviderId = 'openai' | 'anthropic' | 'gemini' | 'grok';
export type AIFeature = 'chat' | 'code' | 'planning' | 'analysis';

export type GenerateInput = {
  feature: AIFeature;
  input: string;
  system?: string;
  maxOutputTokens?: number;
  temperature?: number;
};

export type ProviderUsage = {
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd?: number;
};

export type ProviderResult = {
  text: string;
  provider: AIProviderId;
  model: string;
  usage: ProviderUsage;
  providerRequestId?: string;
};

export class ProviderError extends Error {
  provider: AIProviderId;
  status: number;
  retriable: boolean;
  code?: string;
  constructor(provider: AIProviderId, message: string, status = 500, retriable = false, code?: string) {
    super(message);
    this.provider = provider;
    this.status = status;
    this.retriable = retriable;
    this.code = code;
  }
}

export type ProviderAdapter = {
  id: AIProviderId;
  envKey: string;
  defaultModel: string;
  isConfigured(): boolean;
  generate(input: GenerateInput, signal: AbortSignal, modelOverride?: string): Promise<ProviderResult>;
};
