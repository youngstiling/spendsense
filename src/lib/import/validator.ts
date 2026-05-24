import { sanitizeCell } from "./sanitize";
import { buildSupplierLabel, resolveAmountFromRow } from "./amount-resolver";
import { parseDate } from "@/lib/csv-shared";
import {
  enrichTransactions,
  logEnrichedCategorisation,
} from "@/lib/brand-category";
import { consolidateSupplier } from "@/lib/supplier-consolidation";
import type { ColumnMapping, ImportRowError, ValidationResult } from "./types";

function rowFingerprint(row: {
  date: string;
  supplier: string;
  amount: number;
  category: string;
}): string {
  return `${row.date}|${row.supplier}|${row.amount}|${row.category}`;
}

export function validateMappedRows(
  rawRows: Record<string, string>[],
  mapping: ColumnMapping,
  startRowNumber = 2
): ValidationResult {
  const errors: ImportRowError[] = [];
  const validRows: ValidationResult["validRows"] = [];
  const seen = new Set<string>();
  let duplicateCount = 0;

  const dateCol = mapping.date!;
  const categoryCol = mapping.category;

  rawRows.forEach((raw, index) => {
    const rowNumber = startRowNumber + index;

    const dateRaw = sanitizeCell(raw[dateCol] ?? "");
    if (!dateRaw) {
      errors.push({
        rowNumber,
        columnName: dateCol,
        fieldKey: "date",
        message: "Missing required date.",
        rawValue: raw[dateCol],
      });
      return;
    }

    const date = parseDate(dateRaw);
    if (!date) {
      errors.push({
        rowNumber,
        columnName: dateCol,
        fieldKey: "date",
        message: "Invalid date format. Expected YYYY-MM-DD, DD/MM/YYYY, or similar.",
        rawValue: dateRaw,
      });
      return;
    }

    const { amount, rawValue: amountRaw, columnName: amountColumn } =
      resolveAmountFromRow(raw, mapping);

    if (!amountRaw) {
      errors.push({
        rowNumber,
        columnName: amountColumn,
        fieldKey: "amount",
        message:
          mapping.amountSource === "debit_credit"
            ? "Missing debit and credit values."
            : "Missing required amount.",
        rawValue: amountRaw,
      });
      return;
    }

    if (amount === null || amount <= 0) {
      errors.push({
        rowNumber,
        columnName: amountColumn,
        fieldKey: "amount",
        message: "Invalid amount. Expected a positive number (e.g. 42.50 or £42.50).",
        rawValue: amountRaw,
      });
      return;
    }

    const pubCol = mapping.pub;
    const supplierCol = mapping.supplier;
    const descriptionCol = mapping.description;
    const pubRaw = pubCol ? sanitizeCell(raw[pubCol] ?? "") : "";
    const supplierRaw = supplierCol ? sanitizeCell(raw[supplierCol] ?? "") : "";
    const descriptionRaw = descriptionCol
      ? sanitizeCell(raw[descriptionCol] ?? "")
      : "";
    const label = buildSupplierLabel(raw, mapping);
    const categoryFromCsv = categoryCol
      ? sanitizeCell(raw[categoryCol] ?? "")
      : "";

    const consolidated = consolidateSupplier(supplierRaw || label);

    const [enriched] = enrichTransactions([
      {
        date,
        supplier: consolidated.supplierRaw,
        category: categoryFromCsv,
        amount,
        description: descriptionRaw || undefined,
        pub: pubRaw || undefined,
        supplierRaw: consolidated.supplierRaw,
        canonicalSupplier: consolidated.canonicalSupplier,
      },
    ]);

    const fp = rowFingerprint(enriched);
    if (seen.has(fp)) {
      duplicateCount++;
      errors.push({
        rowNumber,
        columnName: null,
        fieldKey: "row",
        message: "Duplicate row (same date, supplier, amount, and category).",
      });
      return;
    }
    seen.add(fp);
    validRows.push(enriched);
  });

  logEnrichedCategorisation(validRows);

  return { validRows, errors, duplicateCount };
}
