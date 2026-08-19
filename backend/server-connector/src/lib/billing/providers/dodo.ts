// Dodo Payments. Checkout Sessions (POST /checkouts) is the one endpoint used
// for both one-off payments and subscriptions — subscription_data present
// means recurring, absent means one-time. Direct POST /payments and
// POST /subscriptions are both deprecated in Dodo's own docs in favour of
// this endpoint.
function creds(){const k=process.env.DODO_API_KEY;if(!k)throw new Error('Dodo Payments credentials are not configured');return k}
function base(){return process.env.DODO_ENV==='live'?'https://live.dodopayments.com':'https://test.dodopayments.com'}
function returnUrl(){return process.env.DODO_RETURN_URL||process.env.SCEN_BILLING_SUCCESS_URL||'http://localhost:3000/billing'}
async function dc(path:string,body:unknown){
  const r=await fetch(base()+path,{method:'POST',headers:{Authorization:`Bearer ${creds()}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
  const x=await r.json().catch(()=>({}));
  if(!r.ok){
    console.error('Dodo API call failed',{path,base:base(),status:r.status,body:x});
    throw new Error(x?.message||x?.error||`Dodo Payments HTTP ${r.status}`);
  }
  return x;
}
// Dodo requires E.164 (leading +country code); the UI only collects a bare
// 10-digit Indian mobile number, so assume +91 when no + is already present.
function normalizePhone(phone?:string){
  const p=String(phone||'').trim();
  if(!p)return undefined;
  return p.startsWith('+')?p:`+91${p.replace(/\D/g,'')}`;
}
// Recurring products can't use Pay What You Want, so each plan's price lives
// on a product created once in the Dodo dashboard. Set DODO_PRODUCT_<PLANKEY>
// to that product's id.
function planProductId(planKey:string){
  const v=process.env[`DODO_PRODUCT_${planKey.toUpperCase()}`];
  if(!v)throw new Error(`Dodo product id for plan ${planKey} is not configured (set DODO_PRODUCT_${planKey.toUpperCase()})`);
  return v;
}

export async function dodoSubscriptionCheckout(input:{workspaceId:string;userId:string;planKey:string;email?:string;phone?:string;name?:string}){
  const productId=planProductId(input.planKey);
  const x=await dc('/checkouts',{
    product_cart:[{product_id:productId,quantity:1}],
    customer:{email:input.email||undefined,name:input.name||undefined,phone_number:normalizePhone(input.phone)},
    return_url:returnUrl(),
    subscription_data:{},
    metadata:{workspace_id:input.workspaceId,user_id:input.userId,plan_key:input.planKey,kind:'subscription'},
  });
  return {id:String(x.session_id||''),url:x.checkout_url||null,raw:x};
}

// One-time products created as "Pay What You Want" in the Dodo dashboard, so
// the exact amount is always the one passed here from our own plans/topups
// config — never the product's own dashboard price — which is what keeps the
// pricing page and the charge from drifting apart.
export async function dodoTopupCheckout(input:{workspaceId:string;userId:string;credits:number;amountMinor:number;topupKey:string;email?:string;phone?:string;name?:string}){
  const productId=process.env.DODO_PRODUCT_TOPUP;
  if(!productId)throw new Error('DODO_PRODUCT_TOPUP is not configured');
  const x=await dc('/checkouts',{
    product_cart:[{product_id:productId,quantity:1,amount:input.amountMinor}],
    customer:{email:input.email||undefined,name:input.name||undefined,phone_number:normalizePhone(input.phone)},
    return_url:returnUrl(),
    metadata:{workspace_id:input.workspaceId,user_id:input.userId,topup_key:input.topupKey,credits:String(input.credits),kind:'topup'},
  });
  return {id:String(x.session_id||''),url:x.checkout_url||null,raw:x};
}

// Storefront order payment. The amount always comes from a server-priced
// order row; this function never accepts a client-supplied total.
export async function dodoStoreCheckout(input:{workspaceId:string;orderId:string;orderNumber:string;amountMinor:number;email?:string;phone?:string;name?:string;returnUrl?:string}){
  const productId=process.env.DODO_PRODUCT_STORE;
  if(!productId)throw new Error('DODO_PRODUCT_STORE is not configured');
  const x=await dc('/checkouts',{
    product_cart:[{product_id:productId,quantity:1,amount:input.amountMinor}],
    customer:{email:input.email||undefined,name:input.name||undefined,phone_number:normalizePhone(input.phone)},
    return_url:input.returnUrl||returnUrl(),
    metadata:{workspace_id:input.workspaceId,order_id:input.orderId,kind:'store_order'},
  });
  return {id:String(x.session_id||''),url:x.checkout_url||null,raw:x};
}
