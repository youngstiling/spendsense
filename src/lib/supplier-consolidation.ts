import { normalizeSupplier } from "@/lib/csv-shared";

export type ConsolidatedSupplier = {
  /** Original label from CSV (trimmed, whitespace collapsed) */
  supplierRaw: string;
  /** Standardised name for analytics grouping */
  canonicalSupplier: string;
};

/** Trim and collapse internal whitespace; preserve original casing. */
export function cleanRawSupplier(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

/**
 * Consolidate a supplier label into raw + canonical forms.
 * Raw is preserved; canonical uses fuzzy matching against known suppliers.
 */
export function consolidateSupplier(raw: string): ConsolidatedSupplier {
  const supplierRaw = cleanRawSupplier(raw) || "UNKNOWN";
  const canonicalSupplier = normalizeSupplier(supplierRaw);
  return { supplierRaw, canonicalSupplier };
}

/** Supplier key for dashboard spend grouping (not used by savings logic). */
export function analyticsSupplier(row: {
  supplier: string;
  supplierRaw?: string;
  canonicalSupplier?: string;
}): string {
  if (row.canonicalSupplier) return row.canonicalSupplier;
  if (row.supplierRaw) return consolidateSupplier(row.supplierRaw).canonicalSupplier;
  return consolidateSupplier(row.supplier).canonicalSupplier;
}

/** Rows with supplier replaced by canonical name for grouping (savings libs unchanged). */
export function rowsGroupedByCanonicalSupplier<
  T extends { supplier: string; supplierRaw?: string; canonicalSupplier?: string },
>(rows: T[]): T[] {
  return rows.map((row) => ({
    ...row,
    supplier: analyticsSupplier(row),
  }));
}
