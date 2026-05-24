-- Run in Supabase SQL Editor (after schema.sql)
alter table spend_transactions
  add column if not exists pub text,
  add column if not exists description text;
