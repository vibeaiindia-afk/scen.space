begin;

create table if not exists billing_checkout_intents (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  idempotency_key text not null,
  kind text not null,
  product_key text not null,
  provider text,
  status text not null default 'creating',
  response_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id,idempotency_key)
);
create index if not exists billing_checkout_intents_scope_idx on billing_checkout_intents(workspace_id,created_at desc);

create table if not exists billing_customers (
  workspace_id text primary key references workspaces(id) on delete cascade,
  provider text not null,
  provider_customer_id text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider,provider_customer_id)
);
create table if not exists billing_subscriptions (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  provider text not null,
  provider_subscription_id text not null,
  plan_key text not null,
  status text not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider,provider_subscription_id)
);
create index if not exists billing_subscriptions_workspace_idx on billing_subscriptions(workspace_id,status);
create table if not exists billing_payments (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  provider text not null,
  provider_payment_id text,
  provider_checkout_id text,
  kind text not null,
  reference_key text,
  amount_minor bigint not null default 0,
  currency text not null default 'INR',
  status text not null,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider,provider_payment_id)
);
create index if not exists billing_payments_workspace_idx on billing_payments(workspace_id,created_at desc);
create table if not exists credit_wallets (
  workspace_id text primary key references workspaces(id) on delete cascade,
  available bigint not null default 0 check(available>=0),
  reserved bigint not null default 0 check(reserved>=0),
  lifetime_granted bigint not null default 0 check(lifetime_granted>=0),
  lifetime_used bigint not null default 0 check(lifetime_used>=0),
  updated_at timestamptz not null default now()
);
create table if not exists credit_ledger (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  user_id text references users(id) on delete set null,
  entry_type text not null,
  units bigint not null,
  status text not null,
  reservation_key text,
  reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  committed_at timestamptz,
  released_at timestamptz,
  unique(workspace_id,reservation_key)
);
create index if not exists credit_ledger_workspace_idx on credit_ledger(workspace_id,created_at desc);
create table if not exists billing_invoices (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  provider text not null,
  provider_invoice_id text not null,
  amount_minor bigint not null default 0,
  currency text not null default 'INR',
  status text not null,
  hosted_url text,
  pdf_url text,
  issued_at timestamptz,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(provider,provider_invoice_id)
);
create index if not exists billing_invoices_workspace_idx on billing_invoices(workspace_id,issued_at desc);
create table if not exists billing_webhook_events (
  id text primary key,
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  payload_sha256 text not null,
  status text not null default 'received',
  error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  unique(provider,provider_event_id)
);
create index if not exists billing_webhook_events_status_idx on billing_webhook_events(status,created_at);
commit;
