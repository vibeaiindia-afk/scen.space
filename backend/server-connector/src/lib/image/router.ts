import crypto from 'node:crypto';
import { imageLimits, imageRoute } from './config';
import { moderateImagePrompt } from './moderation';
import { imageProvider } from './registry';
import { ImageProviderError, type ImageGenerateInput, type ImageProviderId, type ImageProviderResult } from './types';

function timeoutSignal(ms:number){const controller=new AbortController();const id=setTimeout(()=>controller.abort(new Error('Image provider timeout')),ms);return {signal:controller.signal,clear:()=>clearTimeout(id)}}
function approxBytes(b64:string){return Math.floor((b64.length*3)/4)}
function validate(input:ImageGenerateInput){
  const lim=imageLimits();if(!input.prompt?.trim())throw new ImageProviderError('openai','Prompt is required',400,false,'invalid_prompt');if(input.prompt.length>lim.maxPromptChars)throw new ImageProviderError('openai',`Prompt exceeds ${lim.maxPromptChars} characters`,413,false,'prompt_too_large');
  input.count=Math.min(lim.maxCount,Math.max(1,Number(input.count||1)));const refs=input.references||[];if(refs.length>lim.maxReferences)throw new ImageProviderError('openai',`Too many reference images; max ${lim.maxReferences}`,413,false,'too_many_references');
  for(const ref of refs){if(!['image/png','image/jpeg','image/webp'].includes(ref.mimeType))throw new ImageProviderError('openai','Unsupported reference image type',415,false,'unsupported_reference_type');if(!ref.dataBase64||approxBytes(ref.dataBase64)>lim.maxReferenceBytes)throw new ImageProviderError('openai','Reference image exceeds byte limit',413,false,'reference_too_large')}
  if(input.mode==='edit'&&!refs.length)throw new ImageProviderError('openai','Edit mode requires a reference image',400,false,'missing_reference');return lim;
}
async function runOne(id:ImageProviderId,input:ImageGenerateInput,signal:AbortSignal):Promise<ImageProviderResult>{const p=imageProvider(id);if(!p.isConfigured())throw new ImageProviderError(id,`${p.envKey} is not configured`,503,true,'missing_key');return p.generate(input,signal)}
export async function generateImageWithRouting(input:ImageGenerateInput):Promise<ImageProviderResult & {requestId:string;fallbackUsed:boolean;routeTried:ImageProviderId[]}> {
  const lim=validate(input),route=imageRoute(),requestId=`scen_img_${crypto.randomUUID()}`,t=timeoutSignal(lim.timeoutMs);const order:ImageProviderId[]=[route.primary];if(route.fallbacks)order.push(route.fallback);if(route.fallbacks&&route.rescueEnabled)order.push(route.rescue);const unique=[...new Set(order)];const tried:ImageProviderId[]=[];
  try{await moderateImagePrompt(input.prompt,t.signal);let last:ImageProviderError|undefined;for(const id of unique){tried.push(id);try{const result=await runOne(id,input,t.signal);return {...result,requestId,fallbackUsed:id!==route.primary,routeTried:tried}}catch(e:any){const err=e instanceof ImageProviderError?e:new ImageProviderError(id,String(e?.message||e),500,true);last=err;if(!err.retriable)throw err}}throw last||new ImageProviderError(route.primary,'No image provider available',503,true,'no_provider')}
  catch(e:any){if(e?.name==='AbortError')throw new ImageProviderError(tried.at(-1)||route.primary,'Image provider request timed out',504,true,'timeout');throw e}finally{t.clear()}
}
