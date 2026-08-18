import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/user-auth';
import { generateWithRouting } from '@/lib/ai/router';
import type { AIFeature, AIProviderId } from '@/lib/ai/types';

export const dynamic='force-dynamic';
const features:AIFeature[]=['chat','code','planning','analysis'];
/* The caller may ask for one; the router decides whether it can be honoured. */
const providers:AIProviderId[]=['openai','anthropic','gemini','grok'];
export async function POST(req:NextRequest){
  try{
    const user=await requireUser(req); const body=await req.json(); const feature=body?.feature as AIFeature;
    if(!features.includes(feature)) return NextResponse.json({error:'Unsupported AI feature'},{status:400});
    const preferred=providers.includes(body?.provider as AIProviderId)?body.provider as AIProviderId:undefined;
    const result=await generateWithRouting({feature,input:String(body?.input||''),system:typeof body?.system==='string'?body.system:undefined,maxOutputTokens:Number(body?.maxOutputTokens||0)||undefined,temperature:typeof body?.temperature==='number'?body.temperature:undefined},preferred);
    return NextResponse.json({...result,workspaceId:user.workspaceId},{headers:{'Cache-Control':'no-store','X-Scen-AI-Provider':result.provider,'X-Scen-AI-Request-Id':result.requestId}});
  }catch(e:any){return NextResponse.json({error:e?.message||'AI gateway failed',code:e?.code||'gateway_error',provider:e?.provider},{status:e?.status||500,headers:{'Cache-Control':'no-store'}})}
}
