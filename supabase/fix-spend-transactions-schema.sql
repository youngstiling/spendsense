-- Run once in Supabase SQL Editor — repairs spend_transactions for SpendSense app
-- Safe to re-run (uses IF NOT EXISTS)
-- Matches: src/lib/supabase/schema.ts + supabase/migrations/

-- Supplier consolidation
alter table spend_transactions
  add column if not exists canonical_supplier text;

update spend_transactions
set canonical_supplier = supplier
where canonical_supplier is null;

alter table spend_transactions
  alter column canonical_supplier set not null;

create index if not exists spend_transactions_canonical_supplier_idx
  on spend_transactions(canonical_supplier);

-- Venue / line detail
alter table spend_transactions
  add column if not exists pub text,
  add column if not exists description text;

-- Import batch link (no FK if csv_import_jobs not created yet)
alter table spend_transactions
  add column if not exists import_batch_id uuid;

create index if not exists spend_transactions_import_batch_id_idx
  on spend_transactions(import_batch_id);
