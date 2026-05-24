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
  /** Venue/site — stored as `pub` in Postgres; exposed as `pub_name` on SpendTransaction */
  pub: "pub",
  description: "description",
  importBatchId: "import_batch_id",
  createdAt: "created_at",
} as const;

/** PostgREST select list — must match columns that exist in full-setup.sql. */
/** Full schema (after fix-spend-transactions-schema.sql). */
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

/** Legacy table (supplier only — your original SQL Editor script). */
export const SPEND_TRANSACTION_SELECT_LEGACY = [
  SpendTxCol.date,
  SpendTxCol.supplier,
  SpendTxCol.category,
  SpendTxCol.amount,
].join(", ");

/** Canonical app/domain row. DB column for venue is `pub` (mapped to pub_name). */
export type SpendTransaction = {
  id: string;
  pub_name: string;
  date: string;
  supplier: string;
  canonical_supplier: string;
  category: string;
  amount: number;
};

/** Row shape returned from spend_transactions (PostgREST, snake_case). */
export type SpendTransactionDbRow = {
  id?: string;
  date: string;
  supplier: string;
  canonical_supplier: string;
  category: string;
  amount: number | string;
  /** Postgres column name */
  pub?: string | null;
  /** Optional alias if present in API payloads */
  pub_name?: string | null;
  description?: string | null;
  import_batch_id?: string | null;
};

/** Select including id (audit, reconciliation). */
export const SPEND_TRANSACTION_SELECT_FULL = [
  SpendTxCol.id,
  SpendTxCol.date,
  SpendTxCol.supplier,
  SpendTxCol.canonicalSupplier,
  SpendTxCol.category,
  SpendTxCol.amount,
  SpendTxCol.pub,
  SpendTxCol.description,
  SpendTxCol.importBatchId,
].join(", ");

/** Map DB row → SpendTransaction (pub → pub_name). */
export function spendTransactionFromDbRow(
  row: SpendTransactionDbRow
): SpendTransaction {
  const supplier = String(row.supplier ?? "");
  return {
    id: String(row.id ?? ""),
    pub_name:
      String(row.pub_name ?? row.pub ?? "Unknown").trim() || "Unknown",
    date: String(row.date ?? ""),
    supplier,
    canonical_supplier:
      String(row.canonical_supplier ?? supplier).trim() || supplier,
    category: String(row.category ?? "uncategorised").trim() || "uncategorised",
    amount: Number(row.amount) || 0,
  };
}

/** Map SpendTransaction → insert payload (pub_name → pub). */
export function spendTransactionToInsert(
  tx: SpendTransaction,
  userId: string,
  extra?: { import_batch_id?: string; description?: string | null }
): SpendTransactionInsert {
  return {
    user_id: userId,
    date: tx.date,
    supplier: tx.supplier,
    canonical_supplier: tx.canonical_supplier,
    category: tx.category,
    amount: tx.amount,
    pub: tx.pub_name?.trim() || null,
    description: extra?.description ?? null,
    import_batch_id: extra?.import_batch_id,
  };
}

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
