/**
 * Application mirror of the Postgres schema.
 * SOURCE OF TRUTH: supabase/migrations/* (CI: .github/workflows/supabase-schema-guard.yml).
 * Reference dump: supabase/full-setup.sql
 * Update this file whenever the database schema changes.
 */

export const SCHEMA_DOCS_PATH = "supabase/full-setup.sql";

export const SPEND_TRANSACTIONS_TABLE = "spend_transactions" as const;

/** DB column names on spend_transactions (snake_case). */
export const SpendTxCol = {
  id: "id",
  userId: "user_id",
  date: "date",
  supplier: "supplier",
  canonicalSupplier: "canonical_supplier",
  category: "category",
  amount: "amount",
  pub: "pub",
  description: "description",
  importBatchId: "import_batch_id",
  createdAt: "created_at",
} as const;

/** PostgREST select list — must match columns that exist in full-setup.sql. */
export const SPEND_TRANSACTION_SELECT = [
  SpendTxCol.date,
  SpendTxCol.supplier,
  SpendTxCol.canonicalSupplier,
  SpendTxCol.category,
  SpendTxCol.amount,
  SpendTxCol.pub,
  SpendTxCol.description,
  SpendTxCol.importBatchId,
].join(", ");

/** Row shape returned from spend_transactions (client-readable fields). */
export type SpendTransactionDbRow = {
  date: string;
  supplier: string;
  canonical_supplier: string;
  category: string;
  amount: number | string;
  pub?: string | null;
  description?: string | null;
  import_batch_id?: string | null;
};

/** Client insert payload (server sets id, created_at; auth sets user_id). */
export type SpendTransactionInsert = {
  user_id: string;
  date: string;
  supplier: string;
  canonical_supplier: string;
  category: string;
  amount: number;
  pub: string | null;
  description: string | null;
  import_batch_id?: string;
};

export function isSchemaMismatchError(message: string): boolean {
  return /column|does not exist|schema cache|canonical_supplier/i.test(message);
}

export function schemaFixHint(error?: string): string {
  if (error && isSchemaMismatchError(error)) {
    return `Database schema is out of date. Run supabase/fix-spend-transactions-schema.sql in the Supabase SQL Editor (see ${SCHEMA_DOCS_PATH}).`;
  }
  return "";
}
