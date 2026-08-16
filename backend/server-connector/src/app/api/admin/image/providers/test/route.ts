import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { imageProvider } from '@/lib/image/registry';
import type { ImageProviderId } from '@/lib/image/types';
export const dynamic='force-dynamic';
const ids:ImageProviderId[]=['openai','gemini','replicate'];
export async function POST(req:NextRequest){try{requireAdmin(req);const body=await req.json();const id=body?.provider as ImageProviderId;if(!ids.includes(id))return NextResponse.json({error:'Unsupported image provider'},{status:400});const p=imageProvider(id);const started=Date.now();const result=await p.test(typeof body?.model==='string'?body.model:undefined);return NextResponse.json({...result,provider:id,latencyMs:Date.now()-started,paidGeneration:false},{headers:{'Cache-Control':'no-store'}})}catch(e:any){return NextResponse.json({error:e?.message||'Provider test failed',code:e?.code||'provider_test_error',provider:e?.provider},{status:e?.status||500,headers:{'Cache-Control':'no-store'}})}}
