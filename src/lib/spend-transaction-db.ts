import type { Row } from "@/lib/csv-shared";
import {
  SPEND_TRANSACTIONS_TABLE,
  type SpendTransactionDbRow,
  type SpendTransactionInsert,
} from "@/lib/supabase/schema";
import { consolidateSupplier } from "@/lib/supplier-consolidation";

export { SPEND_TRANSACTIONS_TABLE };
export type SpendTransactionRecord = SpendTransactionDbRow;

export function canonicalSupplierForRow(row: Row): string {
  if (row.canonicalSupplier) return row.canonicalSupplier;
  return consolidateSupplier(row.supplierRaw ?? row.supplier).canonicalSupplier;
}

/** Map app Row → spend_transactions insert (schema-aligned). */
export function toSpendTransactionInsert(
  row: Row,
  userId: string,
  extra?: { import_batch_id?: string }
): SpendTransactionInsert {
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
  records: SpendTransactionDbRow[]
): Row[] {
  return records.map((r) => {
    const supplier = String(r.supplier ?? "UNKNOWN");
    const canonical =
      r.canonical_supplier?.trim() ||
      consolidateSupplier(supplier).canonicalSupplier;

    return {
      date: String(r.date ?? ""),
      supplier: canonical,
      supplierRaw: r.supplier,
      canonicalSupplier: canonical,
      category: String(r.category ?? ""),
      amount: Number(r.amount) || 0,
      pub: r.pub ?? undefined,
      description: r.description ?? undefined,
    };
  });
}
