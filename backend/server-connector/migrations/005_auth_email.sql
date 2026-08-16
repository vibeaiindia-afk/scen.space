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
