import crypto from 'node:crypto';import {db} from '../data/db';
function safeEq(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&crypto.timingSafeEqual(x,y)}
export function verifyRazorpay(raw:string,signature:string|null){const secret=process.env.RAZORPAY_WEBHOOK_SECRET;if(!secret)throw new Error('RAZORPAY_WEBHOOK_SECRET is not configured');if(!signature)throw new Error('Missing X-Razorpay-Signature');const expected=crypto.createHmac('sha256',secret).update(raw).digest('hex');if(!safeEq(expected,signature))throw new Error('Invalid Razorpay webhook signature')}
export function verifyStripe(raw:string,header:string|null){const secret=process.env.STRIPE_WEBHOOK_SECRET;if(!secret)throw new Error('STRIPE_WEBHOOK_SECRET is not configured');if(!header)throw new Error('Missing Stripe-Signature');const parts=Object.fromEntries(header.split(',').map(x=>x.split('=',2)));const ts=Number(parts.t||0),sig=parts.v1||'';const tol=Math.max(60,Math.min(900,Number(process.env.SCEN_BILLING_WEBHOOK_TOLERANCE_SECONDS||300)));if(!ts||Math.abs(Date.now()/1000-ts)>tol)throw new Error('Stripe webhook timestamp outside tolerance');const expected=crypto.createHmac('sha256',secret).update(`${ts}.${raw}`).digest('hex');if(!safeEq(expected,sig))throw new Error('Invalid Stripe webhook signature')}
// Cashfree signs base64(HMAC-SHA256(timestamp + rawBody)) with the client secret
// and sends it in x-webhook-signature alongside x-webhook-timestamp.
export function verifyCashfree(raw:string,signature:string|null,timestamp:string|null){
  const secret=process.env.CASHFREE_WEBHOOK_SECRET||process.env.CASHFREE_SECRET_KEY;
  if(!secret)throw new Error('CASHFREE_SECRET_KEY is not configured');
  if(!signature)throw new Error('Missing x-webhook-signature');
  if(!timestamp)throw new Error('Missing x-webhook-timestamp');
  const ts=Number(timestamp);
  const tol=Math.max(60,Math.min(900,Number(process.env.SCEN_BILLING_WEBHOOK_TOLERANCE_SECONDS||300)));
  if(!ts||Math.abs(Date.now()/1000-ts)>tol)throw new Error('Cashfree webhook timestamp outside tolerance');
  const expected=crypto.createHmac('sha256',secret).update(timestamp+raw).digest('base64');
  if(!safeEq(expected,signature))throw new Error('Invalid Cashfree webhook signature');
}
export async function startWebhook(provider:string,eventId:string,eventType:string,raw:string){const sql=db(),hash=crypto.createHash('sha256').update(raw).digest('hex');const id='wh_'+crypto.createHash('sha256').update(provider+':'+eventId).digest('hex').slice(0,28);const r=await sql`insert into billing_webhook_events(id,provider,provider_event_id,event_type,payload_sha256) values(${id},${provider},${eventId},${eventType},${hash}) on conflict(provider,provider_event_id) do nothing returning id`;return {id,duplicate:!r[0]}}
export async function finishWebhook(provider:string,eventId:string,error?:string){const sql=db();await sql`update billing_webhook_events set status=${error?'failed':'processed'},error=${error||null},processed_at=now() where provider=${provider} and provider_event_id=${eventId}`}
