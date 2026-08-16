import { openAIVideoAdapter } from './providers/openai';import { geminiVideoAdapter } from './providers/gemini';import { replicateVideoAdapter } from './providers/replicate';import { grokVideoAdapter } from './providers/grok';import type { VideoProviderId } from './types';
const REGISTRY={openai:openAIVideoAdapter,gemini:geminiVideoAdapter,replicate:replicateVideoAdapter,grok:grokVideoAdapter} as const;
export function videoProvider(id:VideoProviderId){return REGISTRY[id]}
export function videoProviders(){return Object.values(REGISTRY)}
