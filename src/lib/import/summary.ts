import type { Row } from "@/lib/csv-shared";
import { getUncategorisedPercent } from "@/lib/brand-category";

function formatCount(value: number): string {
  return value.toLocaleString("en-GB");
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateRange(rows: Row[]): string {
  const dates = rows
    .map((row) => row.date)
    .filter(Boolean)
    .sort();

  if (!dates.length) return "Date range: unknown";
  const first = dates[0];
  const last = dates[dates.length - 1];
  return first === last ? "Date: " + first : "Date range: " + first + " to " + last;
}

function plural(count: number, singular: string, pluralLabel = singular + "s"): string {
  return formatCount(count) + " " + (count === 1 ? singular : pluralLabel);
}

export type ImportSummaryOptions = {
  importedRows: Row[];
  skippedRows?: number;
  duplicateRows?: number;
  errorRows?: number;
  replaceExisting?: boolean;
  nextAction?: string;
};

export function buildImportSummary({
  importedRows,
  skippedRows = 0,
  duplicateRows = 0,
  errorRows = 0,
  replaceExisting = false,
  nextAction,
}: ImportSummaryOptions): string {
  const totalSpend = importedRows.reduce(
    (sum, row) => sum + (Number(row.amount) || 0),
    0
  );
  const pubs = new Set(
    importedRows.map((row) => row.pub?.trim() || "Unknown")
  );
  const importedLabel = replaceExisting ? "Replaced with" : "Added";
  const lines = [
    importedLabel + ": " + plural(importedRows.length, "row") + " (" + formatMoney(totalSpend) + ")",
    "Pubs: " + formatCount(pubs.size) + " | " + formatDateRange(importedRows),
    "Uncategorised: " + getUncategorisedPercent(importedRows) + "% of imported spend",
  ];

  const notImported = [
    skippedRows > 0 ? plural(skippedRows, "invalid row") : "",
    duplicateRows > 0 ? plural(duplicateRows, "duplicate row") : "",
    errorRows > 0 ? plural(errorRows, "error") : "",
  ].filter(Boolean);

  if (notImported.length) {
    lines.push("Not imported: " + notImported.join(", "));
  }

  if (nextAction) lines.push(nextAction);
  return lines.join("\n");
}
