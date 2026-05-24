-- Run once in Supabase SQL Editor — repairs spend_transactions for SpendSense app
-- Safe to re-run (uses IF NOT EXISTS)

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

-- Venue / line detail (dashboard + imports)
alter table spend_transactions
  add column if not exists pub text,
  add column if not exists description text;

-- Verify (should list supplier + canonical_supplier)
-- select table_schema, table_name, column_name
-- from information_schema.columns
-- where table_name = 'spend_transactions'
--   and column_name ilike '%supplier%';
