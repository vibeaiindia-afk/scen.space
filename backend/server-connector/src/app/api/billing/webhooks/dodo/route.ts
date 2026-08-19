import {NextRequest,NextResponse} from 'next/server';import crypto from 'node:crypto';import {verifyDodo,startWebhook,finishWebhook} from '@/lib/billing/webhooks';import {handleDodoEvent} from '@/lib/billing/events';
export const dynamic='force-dynamic';
export async function POST(req:NextRequest){
  const raw=await req.text();
  try{
    const id=req.headers.get('webhook-id');
    verifyDodo(raw,id,req.headers.get('webhook-timestamp'),req.headers.get('webhook-signature'));
    const event=JSON.parse(raw);
    const eventId=String(id||`${event.type||'event'}:${crypto.createHash('sha256').update(raw).digest('hex').slice(0,12)}`);
    const dup=await startWebhook('dodo',eventId,String(event.type||'unknown'),raw);
    if(dup.duplicate)return NextResponse.json({received:true,duplicate:true});
    try{await handleDodoEvent(event);await finishWebhook('dodo',eventId);return NextResponse.json({received:true})}
    catch(e:any){await finishWebhook('dodo',eventId,String(e?.message||e));throw e}
  }catch(e:any){
    return NextResponse.json({error:e?.message||'Dodo webhook failed'},{status:400});
  }
}
