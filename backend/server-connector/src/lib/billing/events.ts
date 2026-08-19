import {sendBillingReceiptForWorkspace} from '../email/events';import {db} from '../data/db';import {grantCredits} from './credits';import {plans,topups,availableTopups} from './config';import {markOrderPaid,markOrderFailed} from '../store/orders';
function meta(x:any){return x?.metadata||x?.notes||{}}
async function subContext(provider:string,providerId:string){if(!providerId)return null;const sql=db();const r=await sql`select workspace_id,plan_key from billing_subscriptions where provider=${provider} and provider_subscription_id=${providerId} limit 1`;return r[0]||null}
async function upsertCustomer(provider:string,workspaceId:string,providerCustomerId:string,email?:string){if(!providerCustomerId)return;const sql=db();await sql`insert into billing_customers(workspace_id,provider,provider_customer_id,email) values(${workspaceId},${provider},${providerCustomerId},${email||null}) on conflict(workspace_id) do update set provider=excluded.provider,provider_customer_id=excluded.provider_customer_id,email=coalesce(excluded.email,billing_customers.email),updated_at=now()`}
export async function handleStripeEvent(e:any){const t=String(e?.type||''),o=e?.data?.object||{},m=meta(o);let workspaceId=String(m.workspace_id||o.client_reference_id||'');if(t==='checkout.session.completed'&&o.mode==='payment'&&workspaceId){const key=String(m.topup_key||''),cfg=(availableTopups() as any)[key];if(cfg)await grantCredits({workspaceId,units:Number(m.credits||cfg.credits),reason:'Stripe credit top-up',referenceKey:`stripe:checkout:${o.id}`,metadata:{checkoutId:o.id}});await upsertCustomer('stripe',workspaceId,String(o.customer||''),o.customer_details?.email)}
if(t==='checkout.session.completed'&&o.mode==='subscription'&&workspaceId){await upsertSubscription('stripe',workspaceId,String(o.subscription||o.id),String(m.plan_key||'creator'),'active',o);await upsertCustomer('stripe',workspaceId,String(o.customer||''),o.customer_details?.email)}
if(t==='invoice.paid'){const subId=String(o.subscription||o?.parent?.subscription_details?.subscription||'');const ctx=await subContext('stripe',subId);workspaceId=workspaceId||String(ctx?.workspace_id||'');const planKey=String(m.plan_key||ctx?.plan_key||'');if(workspaceId){await upsertInvoice('stripe',workspaceId,String(o.id),Number(o.amount_paid||0),String(o.currency||'inr').toUpperCase(),'paid',o);void sendBillingReceiptForWorkspace(workspaceId,'Stripe invoice',`${String(o.currency||'inr').toUpperCase()} ${(Number(o.amount_paid||0)/100).toFixed(2)}`,o.hosted_invoice_url,`receipt:stripe:${o.id}`);const cfg=(plans as any)[planKey];if(cfg)await grantCredits({workspaceId,units:cfg.credits,reason:`Stripe ${planKey} renewal`,referenceKey:`stripe:invoice:${o.id}`,metadata:{invoiceId:o.id,planKey,subscriptionId:subId}})}}
if(['customer.subscription.updated','customer.subscription.deleted'].includes(t)){const ctx=await subContext('stripe',String(o.id));workspaceId=workspaceId||String(ctx?.workspace_id||'');if(workspaceId)await upsertSubscription('stripe',workspaceId,String(o.id),String(m.plan_key||ctx?.plan_key||'creator'),String(o.status||'unknown'),o)}}
export async function handleRazorpayEvent(e:any){const t=String(e?.event||''),sub=e?.payload?.subscription?.entity||{},pay=e?.payload?.payment?.entity||{},plink=e?.payload?.payment_link?.entity||{},inv=e?.payload?.invoice?.entity||{};const m=meta(sub?.notes&&Object.keys(sub.notes).length?sub:plink?.notes&&Object.keys(plink.notes).length?plink:pay);let workspaceId=String(m.workspace_id||'');if(!workspaceId&&sub.id){const ctx=await subContext('razorpay',String(sub.id));workspaceId=String(ctx?.workspace_id||'')}if(!workspaceId)return;if(t==='payment_link.paid'){const key=String(m.topup_key||''),cfg=(availableTopups() as any)[key];if(cfg)await grantCredits({workspaceId,units:Number(m.credits||cfg.credits),reason:'Razorpay credit top-up',referenceKey:`razorpay:payment_link:${plink.id}`,metadata:{paymentLinkId:plink.id,paymentId:pay.id}})}if(['subscription.authenticated','subscription.activated','subscription.charged','subscription.pending','subscription.halted','subscription.cancelled','subscription.paused','subscription.resumed'].includes(t)){const ctx=await subContext('razorpay',String(sub.id)),planKey=String(m.plan_key||ctx?.plan_key||'creator');await upsertSubscription('razorpay',workspaceId,String(sub.id),planKey,String(sub.status||t.split('.')[1]),sub);if(t==='subscription.charged'){const cfg=(plans as any)[planKey];if(cfg)await grantCredits({workspaceId,units:cfg.credits,reason:`Razorpay ${planKey} renewal`,referenceKey:`razorpay:subscription_charge:${pay.id||inv.id||e.created_at}`,metadata:{subscriptionId:sub.id,paymentId:pay.id}})}}}
// Dodo puts our own tags in `metadata` on every payment/subscription object,
// since we set it ourselves on every checkout call.
function dodoMeta(d:any){return d?.metadata||{}}
// Field names below (payment_id, subscription_id, status) match Dodo's REST
// resource shape from the Payments/Subscriptions API docs, but the exact
// webhook payload has not been checked against a live event yet — verify
// once real Dodo webhooks are flowing.
export async function handleDodoEvent(e:any){
  const t=String(e?.type||''),d=e?.data||{},m=dodoMeta(d);
  const subId=String(d?.subscription_id||'');
  let workspaceId=String(m.workspace_id||'');
  if(!workspaceId&&subId){const ctx=await subContext('dodo',subId);workspaceId=String(ctx?.workspace_id||'')}
  if(!workspaceId)return;
  // Storefront order — the only place an order may become 'paid'. A browser
  // redirect never marks payment; only this verified webhook does.
  if(String(m.kind||'')==='store_order'&&m.order_id){
    const ref=String(d?.payment_id||'');
    if(t==='payment.succeeded'){
      const r=await markOrderPaid(String(m.order_id),ref);
      if(r.updated)void sendBillingReceiptForWorkspace(workspaceId,'Order payment',String(r.totalMinor/100),undefined,`receipt:store:${m.order_id}`);
    }else if(t==='payment.failed'||t==='payment.cancelled'){
      await markOrderFailed(String(m.order_id),`Dodo reported ${t}`);
    }
    return;
  }
  // One-off credit top-up
  if(t==='payment.succeeded'&&String(m.kind||'topup')==='topup'){
    const key=String(m.topup_key||''),cfg=(availableTopups() as any)[key];
    if(cfg){
      const ref=String(d?.payment_id||e?.timestamp||'');
      await grantCredits({workspaceId,units:Number(m.credits||cfg.credits),reason:'Dodo credit top-up',referenceKey:`dodo:topup:${ref}`,metadata:{paymentId:d?.payment_id}});
    }
    return;
  }
  // Subscription lifecycle + renewals
  if(/^subscription\./.test(t)&&subId){
    const ctx=await subContext('dodo',subId),planKey=String(m.plan_key||ctx?.plan_key||'basic');
    const status=String(d?.status||t.split('.')[1]);
    await upsertSubscription('dodo',workspaceId,subId,planKey,status,d);
    if(t==='subscription.active'||t==='subscription.renewed'){
      const cfg=(plans as any)[planKey];
      const ref=String(d?.payment_id||`${t}:${e?.timestamp||Date.now()}`);
      if(cfg)await grantCredits({workspaceId,units:cfg.credits,reason:`Dodo ${planKey} ${t==='subscription.renewed'?'renewal':'activation'}`,referenceKey:`dodo:subscription_charge:${ref}`,metadata:{subscriptionId:subId,planKey}});
    }
  }
}
async function upsertSubscription(provider:string,workspaceId:string,providerId:string,planKey:string,status:string,raw:any){const sql=db(),id=`${provider}:${providerId}`;await sql`insert into billing_subscriptions(id,workspace_id,provider,provider_subscription_id,plan_key,status,raw) values(${id},${workspaceId},${provider},${providerId},${planKey},${status},${JSON.stringify(raw)}::jsonb) on conflict(provider,provider_subscription_id) do update set status=excluded.status,plan_key=excluded.plan_key,raw=excluded.raw,updated_at=now()`}
async function upsertInvoice(provider:string,workspaceId:string,providerId:string,amountMinor:number,currency:string,status:string,raw:any){const sql=db(),id=`${provider}:inv:${providerId}`;await sql`insert into billing_invoices(id,workspace_id,provider,provider_invoice_id,amount_minor,currency,status,hosted_url,pdf_url,issued_at,raw) values(${id},${workspaceId},${provider},${providerId},${amountMinor},${currency},${status},${raw.hosted_invoice_url||null},${raw.invoice_pdf||null},to_timestamp(${Number(raw.created||Date.now()/1000)}),${JSON.stringify(raw)}::jsonb) on conflict(provider,provider_invoice_id) do update set status=excluded.status,amount_minor=excluded.amount_minor,hosted_url=excluded.hosted_url,pdf_url=excluded.pdf_url,raw=excluded.raw`}
