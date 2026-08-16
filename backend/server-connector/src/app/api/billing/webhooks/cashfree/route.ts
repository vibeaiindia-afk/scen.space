import {NextRequest,NextResponse} from 'next/server';import crypto from 'node:crypto';import {verifyCashfree,startWebhook,finishWebhook} from '@/lib/billing/webhooks';import {handleCashfreeEvent} from '@/lib/billing/events';
export const dynamic='force-dynamic';
export async function POST(req:NextRequest){
  const raw=await req.text();
  try{
    verifyCashfree(raw,req.headers.get('x-webhook-signature'),req.headers.get('x-webhook-timestamp'));
    const event=JSON.parse(raw);
    const d=event?.data||{};
    const entityId=String(d?.payment?.cf_payment_id||d?.order?.order_id||d?.link_id||d?.subscription_details?.subscription_id||d?.subscription?.subscription_id||'');
    const id=String(event.event_id||`${event.type||'event'}:${entityId}:${event.event_time||crypto.createHash('sha256').update(raw).digest('hex').slice(0,12)}`);
    const dup=await startWebhook('cashfree',id,String(event.type||'unknown'),raw);
    if(dup.duplicate)return NextResponse.json({received:true,duplicate:true});
    try{await handleCashfreeEvent(event);await finishWebhook('cashfree',id);return NextResponse.json({received:true})}
    catch(e:any){await finishWebhook('cashfree',id,String(e?.message||e));throw e}
  }catch(e:any){
    return NextResponse.json({error:e?.message||'Cashfree webhook failed'},{status:400});
  }
}
