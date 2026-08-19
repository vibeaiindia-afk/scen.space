#!/usr/bin/env node
// One-time setup: creates the 6 Dodo Payments products this codebase expects
// (see lib/billing/providers/dodo.ts and .env.example). Run it yourself with
// your own Dodo API key — the key is read from your environment and never
// leaves your machine:
//
//   DODO_API_KEY=your_key DODO_ENV=test node scripts/create-dodo-products.mjs
//
// DODO_ENV=live switches to the live API (defaults to test). Re-running this
// creates NEW products each time — Dodo has no upsert-by-name — so only run
// it once per environment, then paste the printed ids into your env vars.

const apiKey = process.env.DODO_API_KEY;
if (!apiKey) {
  console.error('Set DODO_API_KEY in your shell before running this script.');
  process.exit(1);
}
const base = process.env.DODO_ENV === 'live' ? 'https://live.dodopayments.com' : 'https://test.dodopayments.com';

async function createProduct(name, price) {
  const r = await fetch(`${base}/products`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, tax_category: 'saas', price }),
  });
  const x = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(x?.message || x?.error || `HTTP ${r.status}`);
  return x.product_id;
}

// Mirrors Dodo's own "monthly recurring subscription" reference example:
// payment_frequency and subscription_period both set to 1 Month.
const recurring = (amountMinor) => ({
  type: 'recurring_price',
  currency: 'INR',
  price: amountMinor,
  discount: 0,
  purchasing_power_parity: false,
  payment_frequency_count: 1,
  payment_frequency_interval: 'Month',
  subscription_period_count: 1,
  subscription_period_interval: 'Month',
});

// Pay What You Want: `price` is the floor, `suggested_price` only affects
// the default shown at checkout. Every real checkout call in this codebase
// overrides `amount` explicitly, so these two numbers are cosmetic.
const pwyw = (floorMinor, suggestedMinor) => ({
  type: 'one_time_price',
  currency: 'INR',
  price: floorMinor,
  discount: 0,
  purchasing_power_parity: false,
  pay_what_you_want: true,
  suggested_price: suggestedMinor,
});

const plan = { basic: 99900, plus: 199900, pro: 399900, premium: 1299900 };

const jobs = [
  ['DODO_PRODUCT_BASIC', 'Scen Basic', recurring(plan.basic)],
  ['DODO_PRODUCT_PLUS', 'Scen Plus', recurring(plan.plus)],
  ['DODO_PRODUCT_PRO', 'Scen Pro', recurring(plan.pro)],
  ['DODO_PRODUCT_PREMIUM', 'Scen Premium', recurring(plan.premium)],
  ['DODO_PRODUCT_TOPUP', 'Scen Credits Top-up', pwyw(10000, 19900)],
  ['DODO_PRODUCT_STORE', 'Scen Store Order', pwyw(100, 100)],
];

const results = [];
for (const [envVar, name, price] of jobs) {
  try {
    const id = await createProduct(name, price);
    console.log(`✓ ${name} -> ${id}`);
    results.push([envVar, id]);
  } catch (e) {
    console.error(`✗ ${name} failed: ${e.message}`);
  }
}

if (results.length) {
  console.log('\nPaste into Vercel env (Production + Preview) or .env.local:\n');
  for (const [envVar, id] of results) console.log(`${envVar}=${id}`);
}
