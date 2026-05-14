-- Gaokao English essay diagnostic tool baseline schema.
-- Production target: managed PostgreSQL. Do not run the paid production DB on the 4C8G VPS.

create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  contact text,
  contact_type text check (contact_type in ('phone', 'email', 'wechat')),
  created_at timestamptz not null default now()
);

create table if not exists marketing_attributions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  referrer text,
  landing_path text not null,
  first_seen_at timestamptz not null default now()
);

create table if not exists essay_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  session_id text not null,
  attribution_id uuid references marketing_attributions(id),
  source_type text not null check (source_type in ('text', 'image')),
  draft_status text not null,
  raw_input_text text,
  confirmed_text text,
  confirmed_text_hash text,
  word_count integer,
  language text not null default 'en',
  ocr_result jsonb,
  original_image_object_id uuid,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_essay_drafts_confirmed_text_hash on essay_drafts(confirmed_text_hash);
create index if not exists idx_essay_drafts_session_id on essay_drafts(session_id);

create table if not exists upload_intents (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references essay_drafts(id) on delete cascade,
  bucket text not null,
  object_key text not null,
  mime_type text not null,
  size_bytes integer not null,
  expires_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists storage_objects (
  id uuid primary key default gen_random_uuid(),
  upload_intent_id uuid not null references upload_intents(id),
  draft_id uuid not null references essay_drafts(id) on delete cascade,
  bucket text not null,
  object_key text not null,
  mime_type text not null,
  size_bytes integer not null,
  sha256 text,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'essay_drafts_original_image_fk'
  ) then
    alter table essay_drafts
      add constraint essay_drafts_original_image_fk
      foreign key (original_image_object_id) references storage_objects(id) deferrable initially deferred;
  end if;
end $$;

create table if not exists diagnosis_reports (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references essay_drafts(id) on delete cascade,
  source_type text not null check (source_type in ('text', 'image')),
  status text not null check (status in ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'REFUNDED')),
  confirmed_text text not null,
  confirmed_text_hash text not null,
  word_count integer not null,
  free_summary jsonb,
  full_report jsonb,
  is_unlocked boolean not null default false,
  retry_count integer not null default 0,
  last_retry_at timestamptz,
  model_version text,
  prompt_version text,
  input_token_count integer,
  output_token_count integer,
  latency_ms integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_diagnosis_reports_draft_id on diagnosis_reports(draft_id);
create index if not exists idx_diagnosis_reports_hash on diagnosis_reports(confirmed_text_hash);

create table if not exists merchant_accounts (
  id uuid primary key default gen_random_uuid(),
  merchant_code text not null unique check (merchant_code ~ '^[a-z0-9_]+$'),
  provider text not null,
  enabled boolean not null default true,
  daily_quota_cents integer not null,
  daily_used_cents integer not null default 0,
  success_rate_1h numeric not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists group_buys (
  id uuid primary key default gen_random_uuid(),
  required_members integer not null default 3,
  paid_members integer not null default 0,
  group_price_cents integer not null,
  status text not null check (status in ('OPEN', 'SUCCESS', 'EXPIRED')),
  official_assist_used boolean not null default false,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references diagnosis_reports(id),
  attribution_id uuid references marketing_attributions(id),
  group_buy_id uuid references group_buys(id),
  merchant_account_id uuid not null references merchant_accounts(id),
  product_type text not null,
  amount_cents integer not null,
  payer_contact text,
  status text not null check (status in ('PENDING', 'PAID', 'GROUP_SUCCESS', 'EXPIRED', 'REFUNDED')),
  refund_status text not null default 'NONE' check (refund_status in ('NONE', 'REQUESTED', 'REFUNDED', 'REFUND_FAILED')),
  refund_reason text,
  refund_amount_cents integer,
  paid_at timestamptz,
  refunded_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_orders_report_id on orders(report_id);
create index if not exists idx_orders_group_buy_id on orders(group_buy_id);
create index if not exists idx_orders_merchant_account_id on orders(merchant_account_id);

create table if not exists user_credit_accounts (
  payer_contact_key text primary key,
  total_credits integer not null default 0,
  used_credits integer not null default 0,
  last_order_id uuid references orders(id),
  updated_at timestamptz not null default now()
);

create table if not exists credit_ledger (
  id uuid primary key default gen_random_uuid(),
  payer_contact_key text not null references user_credit_accounts(payer_contact_key),
  order_id uuid references orders(id),
  report_id uuid references diagnosis_reports(id),
  change integer not null,
  reason text not null,
  balance_after integer not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_credit_ledger_contact on credit_ledger(payer_contact_key);
create index if not exists idx_credit_ledger_order on credit_ledger(order_id);

create table if not exists group_members (
  id uuid primary key default gen_random_uuid(),
  group_buy_id uuid not null references group_buys(id) on delete cascade,
  report_id uuid references diagnosis_reports(id),
  order_id uuid references orders(id),
  member_type text not null check (member_type in ('REAL', 'PLATFORM_ASSIST')),
  payment_status text not null check (payment_status in ('PENDING', 'PAID', 'ASSISTED')),
  joined_at timestamptz not null default now()
);

create table if not exists support_actions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references diagnosis_reports(id),
  order_id uuid references orders(id),
  action text not null,
  message text,
  created_at timestamptz not null default now()
);

create table if not exists conversion_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  attribution_id uuid references marketing_attributions(id),
  event_name text not null check (event_name in ('Purchase', 'Refund')),
  amount_cents integer not null,
  currency text not null default 'CNY',
  ad_platform text,
  delivery_status text not null default 'PENDING' check (delivery_status in ('PENDING', 'SENT', 'FAILED', 'SKIPPED')),
  created_at timestamptz not null default now(),
  unique(order_id, event_name)
);
