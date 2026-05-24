import type { Row } from "@/lib/csv-shared";
import { consolidateSupplier } from "@/lib/supplier-consolidation";

/** Supabase table name — not `transactions`. */
export const SPEND_TRANSACTIONS_TABLE = "spend_transactions";

export type SpendTransactionRecord = {
  date: string;
  supplier: string;
  canonical_supplier?: string | null;
  category: string;
  amount: number | string;
  pub?: string | null;
  description?: string | null;
};

export function canonicalSupplierForRow(row: Row): string {
  if (row.canonicalSupplier) return row.canonicalSupplier;
  return consolidateSupplier(row.supplierRaw ?? row.supplier).canonicalSupplier;
}

/** Map app Row to spend_transactions insert payload (snake_case). */
export function toSpendTransactionInsert(
  row: Row,
  userId: string,
  extra?: { import_batch_id?: string }
) {
  return {
    user_id: userId,
    date: row.date,
    supplier: row.supplier,
    canonical_supplier: canonicalSupplierForRow(row),
    category: row.category,
    amount: row.amount,
    pub: row.pub?.trim() || null,
    description: row.description?.trim() || null,
    ...extra,
  };
}

export function rowsFromSpendTransactions(
  records: SpendTransactionRecord[]
): Row[] {
  return records.map((r) => ({
    date: String(r.date ?? ""),
    supplier: String(r.supplier ?? "UNKNOWN"),
    supplierRaw: r.supplier,
    canonicalSupplier: r.canonical_supplier ?? undefined,
    category: String(r.category ?? ""),
    amount: Number(r.amount) || 0,
    pub: r.pub ?? undefined,
    description: r.description ?? undefined,
  }));
}
