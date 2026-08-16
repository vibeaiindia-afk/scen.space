import crypto from 'node:crypto';
// Cashfree PG. Endpoints and payload versions are pinned through env so the
// adapter can track API revisions without a code change.
// NOTE: Cashfree takes amounts in RUPEES (decimal), not minor units. The rest of
// this codebase carries amountMinor, so every amount is divided by 100 here.
function creds(){const id=process.env.CASHFREE_APP_ID,secret=process.env.CASHFREE_SECRET_KEY;if(!id||!secret)throw new Error('Cashfree credentials are not configured');return {id,secret}}
function base(){return process.env.CASHFREE_ENV==='production'?'https://api.cashfree.com':'https://sandbox.cashfree.com'}
function major(amountMinor:number){return Number((amountMinor/100).toFixed(2))}
// Cashfree rejects return URLs carrying a query string, so strip it down to
// origin + path. Success is confirmed by the webhook, never by this redirect.
function returnUrl(){
  const raw=process.env.CASHFREE_RETURN_URL||process.env.SCEN_BILLING_SUCCESS_URL||'http://localhost:3000/billing';
  try{const u=new URL(raw);return `${u.origin}${u.pathname}`.replace(/\/$/,'')||u.origin}catch{return raw}
}
function notifyUrl(){return process.env.CASHFREE_WEBHOOK_URL||''}
async function cf(path:string,body:unknown,apiVersion:string){
  const {id,secret}=creds();
  const r=await fetch(base()+path,{method:'POST',headers:{'x-client-id':id,'x-client-secret':secret,'x-api-version':apiVersion,'Content-Type':'application/json'},body:JSON.stringify(body)});
  const x=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(x?.message||x?.error_description||`Cashfree HTTP ${r.status}`);
  return x;
}
// Our own identifiers travel in *_tags, so webhook handling never depends on
// Cashfree's payload nesting for tenant attribution.
function tags(extra:Record<string,string>){return extra}

// Cashfree rejects a link without a customer phone, so fail early with a clear
// message instead of surfacing the provider's validation error to the caller.
function requirePhone(phone?:string){
  const p=String(phone||'').trim();
  if(!p) throw Object.assign(new Error('A customer phone number is required for Cashfree checkout'),{status:400,code:'missing_phone'});
  return p;
}

export async function cashfreeTopupCheckout(input:{workspaceId:string;userId:string;credits:number;amountMinor:number;topupKey:string;email?:string;phone?:string;name?:string}){
  const phone=requirePhone(input.phone);
  const linkId=`scen_${input.topupKey}_${crypto.randomUUID().replace(/-/g,'').slice(0,16)}`.slice(0,50);
  const x=await cf('/pg/links',{
    link_id:linkId,
    link_amount:major(input.amountMinor),
    link_currency:'INR',
    link_purpose:`${input.credits.toLocaleString()} Scen credits`,
    customer_details:{customer_email:input.email||undefined,customer_phone:phone,customer_name:input.name||undefined},
    link_notify:{send_email:Boolean(input.email),send_sms:false},
    link_auto_reminders:false,
    link_meta:{return_url:returnUrl(),notify_url:notifyUrl()||undefined},
    link_notes:tags({workspace_id:input.workspaceId,user_id:input.userId,topup_key:input.topupKey,credits:String(input.credits),kind:'topup'}),
  },process.env.CASHFREE_API_VERSION||'2023-08-01');
  return {id:String(x.link_id||linkId),url:x.link_url||null,raw:x};
}

// Storefront order payment. The amount always comes from a server-priced order
// row; this function never accepts a client-supplied total.
export async function cashfreeStoreCheckout(input:{workspaceId:string;orderId:string;orderNumber:string;amountMinor:number;email?:string;phone?:string;name?:string;returnUrl?:string}){
  const phone=requirePhone(input.phone);
  const linkId=`scen_ord_${input.orderId.replace(/[^a-zA-Z0-9]/g,'').slice(-20)}`.slice(0,50);
  const x=await cf('/pg/links',{
    link_id:linkId,
    link_amount:major(input.amountMinor),
    link_currency:'INR',
    link_purpose:`Order ${input.orderNumber}`,
    customer_details:{customer_email:input.email||undefined,customer_phone:phone,customer_name:input.name||undefined},
    link_notify:{send_email:Boolean(input.email),send_sms:false},
    link_auto_reminders:false,
    link_meta:{return_url:input.returnUrl||returnUrl(),notify_url:notifyUrl()||undefined},
    link_notes:tags({workspace_id:input.workspaceId,order_id:input.orderId,kind:'store_order'}),
  },process.env.CASHFREE_API_VERSION||'2023-08-01');
  return {id:String(x.link_id||linkId),url:x.link_url||null,raw:x};
}

// Cashfree has no "list plans" endpoint and plan_id is merchant-supplied, so a
// stable id per tier is derived here and the plan is created on first use. The
// amount therefore comes from our own config, which stops the pricing page and
// the mandate Cashfree actually charges from drifting apart.
const verifiedPlans=new Set<string>();
function planIdFor(planKey:string){
  const override=process.env[`CASHFREE_PLAN_${planKey.toUpperCase()}`];
  return String(override||`scen_${planKey}`).trim();
}
async function cfGet(path:string,apiVersion:string){
  const {id,secret}=creds();
  const r=await fetch(base()+path,{headers:{'x-client-id':id,'x-client-secret':secret,'x-api-version':apiVersion}});
  const body=await r.json().catch(()=>({}));
  return {ok:r.ok,status:r.status,body} as {ok:boolean;status:number;body:any};
}
export async function ensureCashfreePlan(planKey:string,amountMinor:number,apiVersion:string){
  const planId=planIdFor(planKey);
  if(verifiedPlans.has(planId))return planId;
  const found=await cfGet(`/pg/plans/${encodeURIComponent(planId)}`,apiVersion);
  // A 200 does not by itself mean the plan is there — confirm the id came back.
  if(found.ok&&String(found.body?.plan_id||'')===planId){verifiedPlans.add(planId);return planId}
  try{
    await cf('/pg/plans',{
      plan_id:planId,
      plan_name:`Scen ${planKey}`,
      plan_type:'PERIODIC',
      plan_currency:'INR',
      plan_recurring_amount:major(amountMinor),
      plan_max_amount:major(amountMinor),
      plan_interval_type:'MONTH',
      plan_intervals:1,
      plan_note:`Scen ${planKey} monthly plan`,
    },apiVersion);
  }catch(error){
    // Creating a plan that already exists is a success for our purposes.
    const message=error instanceof Error?error.message:String(error);
    if(!/exist|duplicate/i.test(message)){
      // "Profile is inactive" means Subscriptions is not enabled on the Cashfree
      // account — nothing in this codebase can fix that, so say so plainly.
      const hint=/profile is inactive/i.test(message)
        ?' Subscriptions does not appear to be enabled on this Cashfree account; the Payment Gateway being live does not enable it.'
        :'';
      throw new Error(`Cashfree refused to create plan ${planId}: ${message}${hint}`);
    }
  }
  verifiedPlans.add(planId);
  return planId;
}

export async function cashfreeSubscriptionCheckout(input:{workspaceId:string;userId:string;planId:string;planKey:string;amountMinor:number;email?:string;phone?:string;name?:string}){
  const apiVersion=process.env.CASHFREE_SUBSCRIPTION_API_VERSION||'2025-01-01';
  const planId=input.planId?.trim()||await ensureCashfreePlan(input.planKey,input.amountMinor,apiVersion);
  const phone=requirePhone(input.phone);
  const subId=`scen_sub_${crypto.randomUUID().replace(/-/g,'').slice(0,18)}`.slice(0,50);
  const x=await cf('/pg/subscriptions',{
    subscription_id:subId,
    customer_details:{customer_email:input.email||undefined,customer_phone:phone,customer_name:input.name||undefined},
    plan_details:{plan_id:planId},
    authorization_details:{authorization_amount:1,payment_methods:['upi','enach','pnach','card']},
    subscription_meta:{return_url:returnUrl(),notify_url:notifyUrl()||undefined},
    subscription_note:`Scen ${input.planKey} plan`,
    subscription_tags:tags({workspace_id:input.workspaceId,user_id:input.userId,plan_key:input.planKey,kind:'subscription'}),
  },apiVersion);
  return {id:String(x.subscription_id||subId),url:x.subscription_session_id?null:(x.authorization_link||x.subscription_link||null),sessionId:x.subscription_session_id||null,raw:x};
}
