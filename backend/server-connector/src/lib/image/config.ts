import type { ImageAspectRatio, ImageFormat, ImageProviderId, ImageQuality, ImageSizePreset } from './types';

const providerIds:ImageProviderId[]=['openai','gemini','replicate'];
export function asImageProvider(value:string|undefined,fallback:ImageProviderId):ImageProviderId{return providerIds.includes(value as ImageProviderId)?value as ImageProviderId:fallback}
export function imageRoute(){
  const primary=asImageProvider(process.env.SCEN_IMAGE_PRIMARY,'openai');
  const fallback=asImageProvider(process.env.SCEN_IMAGE_FALLBACK,'gemini');
  const rescue=asImageProvider(process.env.SCEN_IMAGE_RESCUE,'replicate');
  const fallbacks=process.env.SCEN_IMAGE_FALLBACKS!=='false';
  const rescueEnabled=process.env.SCEN_IMAGE_ENABLE_RESCUE==='true';
  return {primary,fallback,rescue,fallbacks,rescueEnabled};
}
export function imageLimits(){return {
  timeoutMs:Math.max(30000,Number(process.env.SCEN_IMAGE_TIMEOUT_MS||150000)),
  maxPromptChars:Math.max(1000,Number(process.env.SCEN_IMAGE_MAX_PROMPT_CHARS||12000)),
  maxCount:Math.min(4,Math.max(1,Number(process.env.SCEN_IMAGE_MAX_COUNT||4))),
  maxReferences:Math.min(10,Math.max(1,Number(process.env.SCEN_IMAGE_MAX_REFERENCES||6))),
  maxReferenceBytes:Math.max(1024*1024,Number(process.env.SCEN_IMAGE_MAX_REFERENCE_BYTES||8*1024*1024)),
}}
export function openAISize(aspect:ImageAspectRatio,size:ImageSizePreset):string{
  if(size==='auto') return 'auto';
  const tables:Record<'1K'|'2K'|'4K',Record<ImageAspectRatio,string>>={
    '1K':{'1:1':'1024x1024','4:3':'1280x960','3:4':'960x1280','16:9':'1536x864','9:16':'864x1536','3:2':'1344x896','2:3':'896x1344'},
    '2K':{'1:1':'2048x2048','4:3':'2048x1536','3:4':'1536x2048','16:9':'2048x1152','9:16':'1152x2048','3:2':'1920x1280','2:3':'1280x1920'},
    '4K':{'1:1':'2880x2880','4:3':'3072x2304','3:4':'2304x3072','16:9':'3840x2160','9:16':'2160x3840','3:2':'3328x2208','2:3':'2208x3328'},
  };
  return tables[size][aspect];
}
export function mimeFor(format:ImageFormat){return format==='jpeg'?'image/jpeg':format==='webp'?'image/webp':'image/png'}
export function normalizeQuality(q:ImageQuality){return ['low','medium','high','auto'].includes(q)?q:'auto'}
