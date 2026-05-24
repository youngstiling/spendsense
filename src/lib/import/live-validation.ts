import { parseDate } from "@/lib/csv-shared";
import { buildSupplierLabel, resolveAmountFromRow } from "./amount-resolver";
import { sanitizeCell } from "./sanitize";
import type { ColumnMapping } from "./types";

export type SampleRowPreview = {
  rowNumber: number;
  date: string | null;
  amount: number | null;
  supplierLabel: string;
  ok: boolean;
  issues: string[];
};

/** Live preview for the first N mapped rows while the user adjusts columns. */
export function previewMappedSampleRows(
  rawRows: Record<string, string>[],
  mapping: ColumnMapping,
  startRowNumber: number,
  limit = 5
): SampleRowPreview[] {
  const sample = rawRows.slice(0, limit);

  return sample.map((raw, index) => {
    const rowNumber = startRowNumber + index;
    const issues: string[] = [];

    const dateCol = mapping.date;
    const dateRaw = dateCol ? sanitizeCell(raw[dateCol] ?? "") : "";
    if (!dateRaw) issues.push("Missing date");
    const date = dateRaw ? parseDate(dateRaw) : null;
    if (dateRaw && !date) issues.push("Invalid date");

    const { amount, rawValue: amountRaw } = resolveAmountFromRow(raw, mapping);
    if (!amountRaw) {
      issues.push(
        mapping.amountSource === "debit_credit" ? "Missing debit/credit" : "Missing amount"
      );
    } else if (amount === null || amount <= 0) {
      issues.push("Invalid amount");
    }

    return {
      rowNumber,
      date,
      amount,
      supplierLabel: buildSupplierLabel(raw, mapping),
      ok: issues.length === 0,
      issues,
    };
  });
}
