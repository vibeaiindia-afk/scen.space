import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { provider } from '@/lib/ai/registry';
import type { AIProviderId } from '@/lib/ai/types';

export const dynamic='force-dynamic';
export async function POST(req:NextRequest){
  try{
    requireAdmin(req); const body=await req.json(); const id=body?.provider as AIProviderId;
    if(!['openai','anthropic','gemini'].includes(id)) return NextResponse.json({error:'Unsupported provider'},{status:400});
    const p=provider(id); if(!p.isConfigured()) return NextResponse.json({error:`${p.envKey} is not configured`,configured:false},{status:503});
    const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),15000); const start=Date.now();
    try{const result=await p.generate({feature:'chat',input:'Reply with exactly: OK',maxOutputTokens:16},controller.signal,body?.model||undefined);return NextResponse.json({ok:true,provider:id,model:result.model,latencyMs:Date.now()-start,usage:result.usage})}
    finally{clearTimeout(timer)}
  }catch(e:any){return NextResponse.json({error:e?.message||'Provider test failed'},{status:e?.status||500})}
}
