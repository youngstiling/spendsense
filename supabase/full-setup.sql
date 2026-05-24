-- SpendSense full database setup (run once in Supabase SQL Editor)
-- Combines schema.sql + migrations/001_csv_import_system.sql

-- Core spend table
create table if not exists spend_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  supplier text not null,
  canonical_supplier text not null,
  category text not null default 'Uncategorised',
  amount numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

create index if not exists spend_transactions_user_id_idx on spend_transactions(user_id);
create index if not exists spend_transactions_date_idx on spend_transactions(date);
create index if not exists spend_transactions_canonical_supplier_idx
  on spend_transactions(canonical_supplier);

alter table spend_transactions
  add column if not exists canonical_supplier text;

update spend_transactions
set canonical_supplier = supplier
where canonical_supplier is null;

alter table spend_transactions
  alter column canonical_supplier set not null;

alter table spend_transactions enable row level security;

drop policy if exists "Users read own transactions" on spend_transactions;
create policy "Users read own transactions"
  on spend_transactions for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own transactions" on spend_transactions;
create policy "Users insert own transactions"
  on spend_transactions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own transactions" on spend_transactions;
create policy "Users delete own transactions"
  on spend_transactions for delete
  using (auth.uid() = user_id);

-- CSV import system
do $$ begin
  create type csv_import_status as enum (
    'pending',
    'validating',
    'processing',
    'completed',
    'partial',
    'failed',
    'rolled_back'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists csv_import_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  filename text not null,
  file_size_bytes bigint not null default 0,
  status csv_import_status not null default 'pending',
  replace_existing boolean not null default false,
  column_mapping jsonb not null default '{}',
  csv_headers jsonb not null default '[]',
  total_rows int not null default 0,
  success_rows int not null default 0,
  error_rows int not null default 0,
  skipped_rows int not null default 0,
  error_summary text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create index if not exists csv_import_jobs_user_id_idx on csv_import_jobs(user_id);
create index if not exists csv_import_jobs_created_at_idx on csv_import_jobs(created_at desc);

create table if not exists csv_import_errors (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references csv_import_jobs(id) on delete cascade,
  row_number int not null,
  column_name text,
  field_key text not null,
  message text not null,
  raw_value text,
  created_at timestamptz not null default now()
);

create index if not exists csv_import_errors_import_id_idx on csv_import_errors(import_id);

create table if not exists csv_column_mapping_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  mapping jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create index if not exists csv_mapping_templates_user_id_idx on csv_column_mapping_templates(user_id);

alter table spend_transactions
  add column if not exists import_batch_id uuid references csv_import_jobs(id) on delete set null;

create index if not exists spend_transactions_import_batch_id_idx
  on spend_transactions(import_batch_id);

alter table spend_transactions
  add column if not exists pub text,
  add column if not exists description text;

alter table csv_import_jobs enable row level security;
alter table csv_import_errors enable row level security;
alter table csv_column_mapping_templates enable row level security;

drop policy if exists "Users manage own import jobs" on csv_import_jobs;
create policy "Users manage own import jobs"
  on csv_import_jobs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users read own import errors" on csv_import_errors;
create policy "Users read own import errors"
  on csv_import_errors for select
  using (
    exists (
      select 1 from csv_import_jobs j
      where j.id = import_id and j.user_id = auth.uid()
    )
  );

drop policy if exists "Users insert own import errors" on csv_import_errors;
create policy "Users insert own import errors"
  on csv_import_errors for insert
  with check (
    exists (
      select 1 from csv_import_jobs j
      where j.id = import_id and j.user_id = auth.uid()
    )
  );

drop policy if exists "Users manage own mapping templates" on csv_column_mapping_templates;
create policy "Users manage own mapping templates"
  on csv_column_mapping_templates for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
