-- Run in Supabase SQL Editor (safe to re-run)
-- Adds canonical_supplier for supplier consolidation / analytics

alter table spend_transactions
  add column if not exists canonical_supplier text;

update spend_transactions
set canonical_supplier = supplier
where canonical_supplier is null;

alter table spend_transactions
  alter column canonical_supplier set not null;

create index if not exists spend_transactions_canonical_supplier_idx
  on spend_transactions(canonical_supplier);
