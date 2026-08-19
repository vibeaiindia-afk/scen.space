import type { NextRequest } from 'next/server';import { requireUser } from '../../../../../lib/user-auth';import { getAsset } from '../../../../../lib/data/assets';import { getObjectBody } from '../../../../../lib/storage/s3';
/* A 307 to a presigned URL used to be returned here, but the client only ever
   sees this route through the scen-space -> scen-backend cross-project rewrite,
   and that redirect-through-a-rewrite combination made Vercel's own routing
   report INFINITE_LOOP_DETECTED (508) before this function ever ran — confirmed
   by zero invocations of this route in the runtime logs while the loop fired.
   Streaming the object's bytes back directly, in this one response, sidesteps
   the redirect entirely. */
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){try{const {id}=await params,a=await getAsset(await requireUser(req),id);if(!a)return Response.json({error:'Asset not found'},{status:404});const o=await getObjectBody(a.object_key);return new Response(o.stream,{headers:{'Content-Type':o.contentType,...(o.contentLength!=null?{'Content-Length':String(o.contentLength)}:{}),'Cache-Control':'private, max-age=31536000, immutable',...(a.original_name?{'Content-Disposition':`inline; filename="${a.original_name.replace(/["\\]/g,'')}"`}:{})}})}catch(e:any){return Response.json({error:String(e?.message||e)},{status:e?.status||500})}}
