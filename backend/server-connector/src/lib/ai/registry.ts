import type { AIProviderId, ProviderAdapter } from './types';
import { openAIAdapter } from './providers/openai';
import { anthropicAdapter } from './providers/anthropic';
import { geminiAdapter } from './providers/gemini';
import { grokAdapter } from './providers/grok';

const registry:Record<AIProviderId,ProviderAdapter>={openai:openAIAdapter,anthropic:anthropicAdapter,gemini:geminiAdapter,grok:grokAdapter};
export function provider(id:AIProviderId):ProviderAdapter{return registry[id]}
export function providerStatus(){return Object.values(registry).map(p=>({id:p.id,configured:p.isConfigured(),envKey:p.envKey,defaultModel:p.defaultModel}))}
