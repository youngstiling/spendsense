import { parseAmount } from "@/lib/csv-shared";
import { sanitizeCell } from "./sanitize";
import type { ColumnMapping } from "./types";

export type ResolvedAmount = {
  amount: number | null;
  rawValue: string;
  columnName: string | null;
};

/** Resolve spend amount from a single column or debit/credit bank columns. */
export function resolveAmountFromRow(
  raw: Record<string, string>,
  mapping: ColumnMapping
): ResolvedAmount {
  if (mapping.amountSource === "debit_credit") {
    const debitCol = mapping.debitColumn;
    const creditCol = mapping.creditColumn;
    const debitRaw = debitCol ? sanitizeCell(raw[debitCol] ?? "") : "";
    const creditRaw = creditCol ? sanitizeCell(raw[creditCol] ?? "") : "";

    if (debitRaw) {
      return {
        amount: parseAmount(debitRaw),
        rawValue: debitRaw,
        columnName: debitCol ?? null,
      };
    }
    if (creditRaw) {
      return {
        amount: parseAmount(creditRaw),
        rawValue: creditRaw,
        columnName: creditCol ?? null,
      };
    }

    return {
      amount: null,
      rawValue: "",
      columnName: debitCol ?? creditCol ?? null,
    };
  }

  const amountCol = mapping.amount ?? "";
  const amountRaw = amountCol ? sanitizeCell(raw[amountCol] ?? "") : "";
  return {
    amount: parseAmount(amountRaw),
    rawValue: amountRaw,
    columnName: amountCol || null,
  };
}

export function buildSupplierLabel(
  raw: Record<string, string>,
  mapping: ColumnMapping
): string {
  const supplierCol = mapping.supplier;
  const pubCol = mapping.pub;
  const supplierRaw = supplierCol ? sanitizeCell(raw[supplierCol] ?? "") : "";
  const pubRaw = pubCol ? sanitizeCell(raw[pubCol] ?? "") : "";

  if (supplierRaw && pubRaw) return `${pubRaw} - ${supplierRaw}`;
  return supplierRaw || pubRaw || "UNKNOWN";
}
