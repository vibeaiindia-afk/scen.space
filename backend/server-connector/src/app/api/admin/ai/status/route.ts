import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { providerStatus } from '@/lib/ai/registry';
import { gatewayLimits, routeFor } from '@/lib/ai/config';

export const dynamic='force-dynamic';
export async function GET(req:NextRequest){
  try{requireAdmin(req);return NextResponse.json({ok:true,providers:providerStatus(),routes:{chat:routeFor('chat'),code:routeFor('code'),planning:routeFor('planning'),analysis:routeFor('analysis')},limits:gatewayLimits(),deployEnabled:false},{headers:{'Cache-Control':'no-store'}})}
  catch(e:any){return NextResponse.json({error:e?.message||'Unauthorized'},{status:e?.status||401})}
}
