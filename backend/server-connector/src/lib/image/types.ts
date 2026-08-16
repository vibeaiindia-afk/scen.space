export type ImageProviderId = 'openai' | 'gemini' | 'replicate';
export type ImageMode = 'generate' | 'edit';
export type ImageQuality = 'low' | 'medium' | 'high' | 'auto';
export type ImageFormat = 'png' | 'jpeg' | 'webp';
export type ImageSizePreset = '1K' | '2K' | '4K' | 'auto';
export type ImageAspectRatio = '1:1' | '4:3' | '3:4' | '16:9' | '9:16' | '3:2' | '2:3';

export type ImageReference = {
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  dataBase64: string;
};

export type ImageGenerateInput = {
  mode: ImageMode;
  prompt: string;
  aspectRatio: ImageAspectRatio;
  size: ImageSizePreset;
  quality: ImageQuality;
  format: ImageFormat;
  count: number;
  references?: ImageReference[];
};

export type GeneratedImage = {
  mimeType: string;
  dataBase64?: string;
  url?: string;
  assetId?: string;
  storageError?: string;
};

export type ImageProviderUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  providerSeconds?: number;
};

export type ImageProviderResult = {
  images: GeneratedImage[];
  provider: ImageProviderId;
  model: string;
  usage: ImageProviderUsage;
  providerRequestId?: string;
};

export class ImageProviderError extends Error {
  provider: ImageProviderId;
  status: number;
  retriable: boolean;
  code?: string;
  constructor(provider: ImageProviderId, message: string, status = 500, retriable = false, code?: string) {
    super(message); this.provider=provider; this.status=status; this.retriable=retriable; this.code=code;
  }
}

export type ImageProviderAdapter = {
  id: ImageProviderId;
  envKey: string;
  defaultModel: string;
  isConfigured(): boolean;
  test(modelOverride?: string): Promise<{ok:boolean;model:string;detail?:string}>;
  generate(input: ImageGenerateInput, signal: AbortSignal, modelOverride?: string): Promise<ImageProviderResult>;
};
