import crypto from 'node:crypto';import {db} from '../data/db';
function safeEq(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&crypto.timingSafeEqual(x,y)}
export function verifyRazorpay(raw:string,signature:string|null){const secret=process.env.RAZORPAY_WEBHOOK_SECRET;if(!secret)throw new Error('RAZORPAY_WEBHOOK_SECRET is not configured');if(!signature)throw new Error('Missing X-Razorpay-Signature');const expected=crypto.createHmac('sha256',secret).update(raw).digest('hex');if(!safeEq(expected,signature))throw new Error('Invalid Razorpay webhook signature')}
export function verifyStripe(raw:string,header:string|null){const secret=process.env.STRIPE_WEBHOOK_SECRET;if(!secret)throw new Error('STRIPE_WEBHOOK_SECRET is not configured');if(!header)throw new Error('Missing Stripe-Signature');const parts=Object.fromEntries(header.split(',').map(x=>x.split('=',2)));const ts=Number(parts.t||0),sig=parts.v1||'';const tol=Math.max(60,Math.min(900,Number(process.env.SCEN_BILLING_WEBHOOK_TOLERANCE_SECONDS||300)));if(!ts||Math.abs(Date.now()/1000-ts)>tol)throw new Error('Stripe webhook timestamp outside tolerance');const expected=crypto.createHmac('sha256',secret).update(`${ts}.${raw}`).digest('hex');if(!safeEq(expected,sig))throw new Error('Invalid Stripe webhook signature')}
// Dodo Payments follows the Standard Webhooks spec: the secret is
// "whsec_<base64>" — strip the prefix and base64-decode the rest to get the
// HMAC key. Sign "{webhook-id}.{webhook-timestamp}.{rawBody}" with
// HMAC-SHA256 and base64 the result. webhook-signature can carry several
// space-separated "v1,<sig>" pairs for key rotation; any match is valid.
export function verifyDodo(raw:string,id:string|null,timestamp:string|null,signature:string|null){
  const secret=process.env.DODO_WEBHOOK_SECRET;
  if(!secret)throw new Error('DODO_WEBHOOK_SECRET is not configured');
  if(!id)throw new Error('Missing webhook-id');
  if(!timestamp)throw new Error('Missing webhook-timestamp');
  if(!signature)throw new Error('Missing webhook-signature');
  const ts=Number(timestamp);
  const tol=Math.max(60,Math.min(900,Number(process.env.SCEN_BILLING_WEBHOOK_TOLERANCE_SECONDS||300)));
  if(!ts||Math.abs(Date.now()/1000-ts)>tol)throw new Error('Dodo webhook timestamp outside tolerance');
  const key=Buffer.from(secret.replace(/^whsec_/,''),'base64');
  const expected=crypto.createHmac('sha256',key).update(`${id}.${timestamp}.${raw}`).digest('base64');
  const candidates=signature.split(' ').map(part=>part.split(',')[1]).filter(Boolean) as string[];
  if(!candidates.some(sig=>safeEq(expected,sig)))throw new Error('Invalid Dodo webhook signature');
}
export async function startWebhook(provider:string,eventId:string,eventType:string,raw:string){const sql=db(),hash=crypto.createHash('sha256').update(raw).digest('hex');const id='wh_'+crypto.createHash('sha256').update(provider+':'+eventId).digest('hex').slice(0,28);const r=await sql`insert into billing_webhook_events(id,provider,provider_event_id,event_type,payload_sha256) values(${id},${provider},${eventId},${eventType},${hash}) on conflict(provider,provider_event_id) do nothing returning id`;return {id,duplicate:!r[0]}}
export async function finishWebhook(provider:string,eventId:string,error?:string){const sql=db();await sql`update billing_webhook_events set status=${error?'failed':'processed'},error=${error||null},processed_at=now() where provider=${provider} and provider_event_id=${eventId}`}
