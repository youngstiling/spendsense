import type { Row } from "@/lib/csv-shared";
import { consolidateSupplier } from "@/lib/supplier-consolidation";

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
    ...extra,
  };
}
