-- Run in Supabase SQL Editor

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

alter table spend_transactions enable row level security;

create policy "Users read own transactions"
  on spend_transactions for select
  using (auth.uid() = user_id);

create policy "Users insert own transactions"
  on spend_transactions for insert
  with check (auth.uid() = user_id);

create policy "Users delete own transactions"
  on spend_transactions for delete
  using (auth.uid() = user_id);
