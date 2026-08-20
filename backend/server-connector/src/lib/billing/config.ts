export type BillingProvider='stripe'|'razorpay'|'dodo';
export const plans={basic:{credits:1500,stripe:process.env.STRIPE_PRICE_BASIC||'',razorpay:process.env.RAZORPAY_PLAN_BASIC||'',dodo:process.env.DODO_PRODUCT_BASIC||'',amountMinor:99900},plus:{credits:2500,stripe:process.env.STRIPE_PRICE_PLUS||'',razorpay:process.env.RAZORPAY_PLAN_PLUS||'',dodo:process.env.DODO_PRODUCT_PLUS||'',amountMinor:199900},pro:{credits:6000,stripe:process.env.STRIPE_PRICE_PRO||'',razorpay:process.env.RAZORPAY_PLAN_PRO||'',dodo:process.env.DODO_PRODUCT_PRO||'',amountMinor:399900},premium:{credits:25000,stripe:process.env.STRIPE_PRICE_PREMIUM||'',razorpay:process.env.RAZORPAY_PLAN_PREMIUM||'',dodo:process.env.DODO_PRODUCT_PREMIUM||'',amountMinor:1299900}} as const;
export const topups={topup_1k:{credits:1000,amountMinor:19900},topup_5k:{credits:5000,amountMinor:79900},topup_15k:{credits:15000,amountMinor:199900}} as Record<string,{credits:number;amountMinor:number}>;
// Flat cost for a first full build of a new project (planning + every page
// written). Follow-up edits to an existing project are not charged again —
// once a build is paid for, refining it stays free, the same way a
// generated photo already paid for is never re-shot for free (see build()
// in superaiagent.html).
export const BUILD_CREDIT_COST=50;
// Resolved per request, not at module load: Next.js can inline a module-level
// process.env read at build time, which made the flag impossible to turn off.
export function availableTopups():Record<string,{credits:number;amountMinor:number}>{
  const out:Record<string,{credits:number;amountMinor:number}>={...topups};
  if(process.env.SCEN_ENABLE_TEST_TOPUP==='true')out.topup_test={credits:10,amountMinor:100};
  return out;
}
export function isConfigured(p:BillingProvider){const s=billingStatus() as Record<string,{configured:boolean}>;return Boolean(s[p]?.configured)}
// Routing order per region. An explicit SCEN_BILLING_PRIMARY_* wins when it names
// a configured provider; otherwise the first configured provider for the region is
// used so checkout never dispatches to a provider with no credentials.
const IN_ORDER:BillingProvider[]=['dodo','razorpay','stripe'];
const GLOBAL_ORDER:BillingProvider[]=['stripe','razorpay','dodo'];
function pick(order:BillingProvider[],preferred?:string):BillingProvider{
  const want=String(preferred||'').toLowerCase() as BillingProvider;
  if(order.includes(want)&&isConfigured(want))return want;
  return order.find(isConfigured)||order[0];
}
export function providerFor(currency:string):BillingProvider{
  return currency.toUpperCase()==='INR'
    ?pick(IN_ORDER,process.env.SCEN_BILLING_PRIMARY_IN)
    :pick(GLOBAL_ORDER,process.env.SCEN_BILLING_PRIMARY_GLOBAL);
}
export function billingStatus(){return {stripe:{configured:Boolean(process.env.STRIPE_SECRET_KEY&&process.env.STRIPE_WEBHOOK_SECRET)},razorpay:{configured:Boolean(process.env.RAZORPAY_KEY_ID&&process.env.RAZORPAY_KEY_SECRET&&process.env.RAZORPAY_WEBHOOK_SECRET)},dodo:{configured:Boolean(process.env.DODO_API_KEY&&process.env.DODO_WEBHOOK_SECRET),environment:process.env.DODO_ENV==='live'?'live':'test'}}}
