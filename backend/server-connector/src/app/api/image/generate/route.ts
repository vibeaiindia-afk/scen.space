import {sendGenerationReadyForWorkspace} from '@/lib/email/events';import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/user-auth';
import { generateImageWithRouting } from '@/lib/image/router';
import { persistGeneratedImages } from '@/lib/image/storage';
import { reserveCredits,commitCredits,releaseCredits } from '@/lib/billing/credits';
import type { ImageAspectRatio, ImageFormat, ImageGenerateInput, ImageMode, ImageQuality, ImageReference, ImageSizePreset } from '@/lib/image/types';

export const dynamic='force-dynamic';
export const maxDuration=180;
const modes:ImageMode[]=['generate','edit'];const aspects:ImageAspectRatio[]=['1:1','4:3','3:4','16:9','9:16','3:2','2:3'];const sizes:ImageSizePreset[]=['1K','2K','4K','auto'];const qualities:ImageQuality[]=['low','medium','high','auto'];const formats:ImageFormat[]=['png','jpeg','webp'];
export async function POST(req:NextRequest){
  let creditReservation:any;let creditWorkspace='';
  try{
    const user=await requireUser(req);const body=await req.json();const mode=modes.includes(body?.mode)?body.mode:'generate';const aspectRatio=aspects.includes(body?.aspectRatio)?body.aspectRatio:'1:1';const size=sizes.includes(body?.size)?body.size:'1K';const quality=qualities.includes(body?.quality)?body.quality:'medium';const format=formats.includes(body?.format)?body.format:'png';const references=Array.isArray(body?.references)?body.references.map((x:any)=>({mimeType:String(x?.mimeType||''),dataBase64:String(x?.dataBase64||'')})) as ImageReference[]:[];
    const input:ImageGenerateInput={mode,prompt:String(body?.prompt||''),aspectRatio,size,quality,format,count:Number(body?.count||1),references};creditWorkspace=user.workspaceId;creditReservation=await reserveCredits({session:user,units:Math.max(1,input.count)*25,reason:`Image generation ${input.count} output(s)`,reservationKey:`image:${user.workspaceId}:${req.headers.get('idempotency-key')||`${user.sub}:${Date.now()}:${Math.random()}`}`,metadata:{count:input.count,size:input.size,quality:input.quality}});const result=await generateImageWithRouting(input);await commitCredits(user.workspaceId,creditReservation.id,{provider:result.provider,model:result.model});const images=await persistGeneratedImages(result.images,{workspaceId:user.workspaceId,userId:user.sub,provider:result.provider,model:result.model,requestId:result.requestId});
    return NextResponse.json({...result,images,workspaceId:user.workspaceId},{headers:{'Cache-Control':'no-store','X-Scen-Image-Provider':result.provider,'X-Scen-Image-Request-Id':result.requestId}});
  }catch(e:any){if(creditReservation&&creditWorkspace)await releaseCredits(creditWorkspace,creditReservation.id,String(e?.message||e)).catch(()=>{});return NextResponse.json({error:e?.message||'Image gateway failed',code:e?.code||'image_gateway_error',provider:e?.provider},{status:e?.status||500,headers:{'Cache-Control':'no-store'}})}
}
