alter table spend_transactions add column if not exists canonical_supplier text;
update spend_transactions set canonical_supplier = supplier where canonical_supplier is null;
alter table spend_transactions alter column canonical_supplier set not null;
alter table spend_transactions add column if not exists pub text;
alter table spend_transactions add column if not exists description text;
