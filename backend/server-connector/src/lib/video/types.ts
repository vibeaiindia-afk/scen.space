export type VideoProviderId='openai'|'gemini'|'replicate'|'grok';
export type VideoMode='text'|'image'|'frames';
export type VideoAspectRatio='16:9'|'9:16';
export type VideoResolution='720p'|'1080p'|'4K';
export type VideoReference={mimeType:'image/png'|'image/jpeg'|'image/webp'|string;dataBase64:string};
export type VideoCreateInput={mode:VideoMode;prompt:string;aspectRatio:VideoAspectRatio;seconds:4|8|12;resolution:VideoResolution;references:VideoReference[]};
export type VideoStatus='queued'|'in_progress'|'completed'|'failed'|'canceled';
export type NativeVideoJob={nativeId:string;provider:VideoProviderId;model:string;status:VideoStatus;progress:number;seconds:number;detail?:string;providerRequestId?:string};
export type VideoDownload={bytes:Uint8Array<ArrayBuffer>;contentType:string;filename:string};
export type VideoProviderAdapter={
 id:VideoProviderId;envKey:string;defaultModel:string;isConfigured():boolean;
 test(modelOverride?:string):Promise<{ok:true;model:string;detail?:string}>;
 supports(input:VideoCreateInput,modelOverride?:string):{ok:boolean;reason?:string};
 create(input:VideoCreateInput,signal:AbortSignal,modelOverride?:string):Promise<NativeVideoJob>;
 status(nativeId:string,signal:AbortSignal,modelHint?:string):Promise<NativeVideoJob>;
 cancel?(nativeId:string,signal:AbortSignal):Promise<NativeVideoJob>;
 download(nativeId:string,signal:AbortSignal):Promise<VideoDownload>;
};
export class VideoProviderError extends Error{constructor(public provider:VideoProviderId,message:string,public status=500,public retriable=true,public code='video_provider_error'){super(message)}}
