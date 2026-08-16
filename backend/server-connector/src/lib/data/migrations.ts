import { db } from './db';
export type Migration={version:number;name:string;sql:string};
export const MIGRATIONS:Migration[]=[
{version:1,name:'core_tenants_projects',sql:`
create table if not exists scen_schema_migrations(version integer primary key,name text not null,applied_at timestamptz not null default now());
create table if not exists workspaces(id text primary key,name text,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists users(id text primary key,email text,display_name text,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists memberships(workspace_id text not null references workspaces(id) on delete cascade,user_id text not null references users(id) on delete cascade,role text not null default 'member',created_at timestamptz not null default now(),primary key(workspace_id,user_id));
create table if not exists projects(id uuid primary key,workspace_id text not null references workspaces(id) on delete cascade,created_by text not null references users(id),name text not null,slug text,status text not null default 'draft',settings jsonb not null default '{}'::jsonb,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),deleted_at timestamptz);
create index if not exists projects_workspace_updated_idx on projects(workspace_id,updated_at desc) where deleted_at is null;
create unique index if not exists projects_workspace_slug_uq on projects(workspace_id,slug) where deleted_at is null;
`},
{version:2,name:'versions_scenes_assets',sql:`
create table if not exists project_versions(id uuid primary key,workspace_id text not null references workspaces(id) on delete cascade,project_id uuid not null references projects(id) on delete cascade,created_by text not null references users(id),version_no integer not null,label text,snapshot jsonb not null,created_at timestamptz not null default now(),unique(project_id,version_no));
create index if not exists project_versions_scope_idx on project_versions(workspace_id,project_id,version_no desc);
create table if not exists scenes(id uuid primary key,workspace_id text not null references workspaces(id) on delete cascade,project_id uuid not null references projects(id) on delete cascade,name text not null,sort_order integer not null default 0,scene_json jsonb not null default '{}'::jsonb,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),deleted_at timestamptz);
create index if not exists scenes_scope_idx on scenes(workspace_id,project_id,sort_order) where deleted_at is null;
create table if not exists assets(id uuid primary key,workspace_id text not null references workspaces(id) on delete cascade,project_id uuid references projects(id) on delete set null,created_by text not null references users(id),kind text not null,object_key text not null,mime_type text not null,bytes bigint not null default 0,original_name text,provider text,model text,metadata jsonb not null default '{}'::jsonb,created_at timestamptz not null default now(),deleted_at timestamptz);
create unique index if not exists assets_object_key_uq on assets(object_key);
create index if not exists assets_scope_idx on assets(workspace_id,created_at desc) where deleted_at is null;
`},
{version:3,name:'jobs_comments_audit_indexes',sql:`
create table if not exists generated_jobs(id uuid primary key,workspace_id text not null references workspaces(id) on delete cascade,project_id uuid references projects(id) on delete set null,user_id text not null references users(id),kind text not null,provider text,model text,status text not null,request_json jsonb not null default '{}'::jsonb,result_asset_ids uuid[] not null default '{}',cost_units numeric,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create index if not exists generated_jobs_scope_idx on generated_jobs(workspace_id,created_at desc);
create table if not exists review_comments(id uuid primary key,workspace_id text not null references workspaces(id) on delete cascade,project_id uuid not null references projects(id) on delete cascade,scene_id uuid references scenes(id) on delete set null,object_ref text,author_id text not null references users(id),body text not null,status text not null default 'open',created_at timestamptz not null default now(),resolved_at timestamptz);
create index if not exists review_comments_scope_idx on review_comments(workspace_id,project_id,status,created_at desc);
create table if not exists audit_events(id bigserial primary key,workspace_id text,actor_id text,event_type text not null,entity_type text,entity_id text,metadata jsonb not null default '{}'::jsonb,created_at timestamptz not null default now());
create index if not exists audit_events_scope_idx on audit_events(workspace_id,created_at desc);
`},
{version:4,name:'billing_credits',sql:`
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
`},
{version:5,name:'auth_email',sql:`
-- Scen migration v5 — Authentication + Transactional Email
alter table users add column if not exists email_verified boolean not null default false;
alter table users add column if not exists avatar_url text;
create unique index if not exists users_email_lower_uq on users(lower(email)) where email is not null;
create table if not exists auth_credentials(user_id text primary key references users(id) on delete cascade,password_hash text not null,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists auth_sessions(id text primary key,token_hash text not null unique,user_id text not null references users(id) on delete cascade,workspace_id text not null references workspaces(id) on delete cascade,user_agent text,ip_hint text,created_at timestamptz not null default now(),last_seen_at timestamptz not null default now(),expires_at timestamptz not null,revoked_at timestamptz);
create index if not exists auth_sessions_user_active_idx on auth_sessions(user_id,last_seen_at desc) where revoked_at is null;
create table if not exists auth_one_time_tokens(id text primary key,token_type text not null,token_hash text not null unique,user_id text references users(id) on delete cascade,email text,workspace_id text references workspaces(id) on delete cascade,metadata jsonb not null default '{}'::jsonb,created_at timestamptz not null default now(),expires_at timestamptz not null,consumed_at timestamptz);
create index if not exists auth_one_time_tokens_lookup_idx on auth_one_time_tokens(token_type,token_hash) where consumed_at is null;
create table if not exists auth_oauth_states(id text primary key,state_hash text not null unique,code_verifier text not null,return_to text not null default '/',created_at timestamptz not null default now(),expires_at timestamptz not null);
create table if not exists oauth_identities(provider text not null,provider_subject text not null,user_id text not null references users(id) on delete cascade,email text,created_at timestamptz not null default now(),primary key(provider,provider_subject));
create index if not exists oauth_identities_user_idx on oauth_identities(user_id);
create table if not exists email_deliveries(id text primary key,workspace_id text references workspaces(id) on delete set null,user_id text references users(id) on delete set null,provider text not null,provider_message_id text,recipient text not null,template_key text not null,status text not null,error text,idempotency_key text not null unique,created_at timestamptz not null default now());
create index if not exists email_deliveries_scope_idx on email_deliveries(workspace_id,created_at desc);
`},
{version:6,name:'storefront_products_orders',sql:`
create table if not exists store_products(
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  name text not null,
  sku text,
  price_minor integer not null check(price_minor >= 0),
  currency text not null default 'INR',
  stock integer not null default 0,
  status text not null default 'active',
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_store_products_ws on store_products(workspace_id) where status='active';

create table if not exists store_settings(
  workspace_id text primary key references workspaces(id) on delete cascade,
  currency text not null default 'INR',
  tax_rate_bp integer not null default 1800,
  shipping_minor integer not null default 9900,
  free_shipping_at_minor integer not null default 250000,
  updated_at timestamptz not null default now()
);

create table if not exists store_orders(
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  order_number text not null,
  customer_name text,
  customer_email text,
  customer_phone text,
  address_line text,
  city text,
  postal_code text,
  note text,
  subtotal_minor integer not null,
  tax_minor integer not null default 0,
  shipping_minor integer not null default 0,
  total_minor integer not null,
  currency text not null default 'INR',
  status text not null default 'pending',
  payment_provider text,
  provider_reference text,
  provider_payment_id text,
  fulfillment text not null default 'unfulfilled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id,order_number)
);
create index if not exists idx_store_orders_ws on store_orders(workspace_id,created_at desc);
create unique index if not exists idx_store_orders_ref on store_orders(provider_reference) where provider_reference is not null;

create table if not exists store_order_items(
  id text primary key,
  order_id text not null references store_orders(id) on delete cascade,
  product_id text references store_products(id) on delete set null,
  name_snapshot text not null,
  unit_price_minor integer not null,
  qty integer not null check(qty > 0),
  line_total_minor integer not null
);
create index if not exists idx_store_order_items_order on store_order_items(order_id);
`},
{version:7,name:'published_sites',sql:`
create table if not exists published_sites(
  slug text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  project_name text not null,
  site jsonb not null,
  published_by text references users(id) on delete set null,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists published_sites_workspace_idx on published_sites(workspace_id);
`},
{version:8,name:'custom_domains',sql:`
create table if not exists custom_domains(
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  host text not null,
  slug text references published_sites(slug) on delete set null,
  status text not null default 'pending',
  verification_token text not null,
  last_checked_at timestamptz,
  last_error text,
  created_by text references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists custom_domains_host_idx on custom_domains(lower(host));
create index if not exists custom_domains_workspace_idx on custom_domains(workspace_id,created_at desc);
`},
];
export async function migrationStatus(){const sql=db();try{const rows=await sql`select version,name,applied_at from scen_schema_migrations order by version`;const current=rows.length?Number(rows[rows.length-1].version):0;return {current,target:MIGRATIONS.at(-1)?.version||0,applied:rows}}catch(e:any){if(String(e?.code)==='42P01')return {current:0,target:MIGRATIONS.at(-1)?.version||0,applied:[]};throw e}}
export async function applyMigrations(){const sql=db();return await sql.begin(async(tx:any)=>{await tx.unsafe('create table if not exists scen_schema_migrations(version integer primary key,name text not null,applied_at timestamptz not null default now())');const rows=await tx`select version from scen_schema_migrations`;const applied=new Set(rows.map((r:any)=>Number(r.version)));const ran:any[]=[];for(const m of MIGRATIONS){if(applied.has(m.version))continue;await tx.unsafe(m.sql);await tx`insert into scen_schema_migrations(version,name) values(${m.version},${m.name})`;ran.push({version:m.version,name:m.name})}return {schemaVersion:MIGRATIONS.at(-1)?.version||0,applied:ran}})}
