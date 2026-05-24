-- Supplier consolidation: raw supplier + canonical_supplier for analytics/SQL

alter table spend_transactions
  add column if not exists canonical_supplier text;

-- Backfill existing rows (re-import CSVs for proper canonical names)
update spend_transactions
set canonical_supplier = supplier
where canonical_supplier is null;

alter table spend_transactions
  alter column canonical_supplier set not null;

create index if not exists spend_transactions_canonical_supplier_idx
  on spend_transactions(canonical_supplier);
