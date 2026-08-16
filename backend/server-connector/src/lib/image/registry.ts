import type { ImageProviderAdapter, ImageProviderId } from './types';
import { openAIImageAdapter } from './providers/openai';
import { geminiImageAdapter } from './providers/gemini';
import { replicateImageAdapter } from './providers/replicate';
const adapters:Record<ImageProviderId,ImageProviderAdapter>={openai:openAIImageAdapter,gemini:geminiImageAdapter,replicate:replicateImageAdapter};
export function imageProvider(id:ImageProviderId){return adapters[id]}
export function imageProviders(){return Object.values(adapters)}
