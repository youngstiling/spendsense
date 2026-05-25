import type { Row } from "@/lib/csv-shared";

function normalizedText(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function normalizedAmount(value: unknown): string {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
}

/** Exact row identity used to stop accidental CSV re-uploads double-counting spend. */
export function spendRowFingerprint(row: Row): string {
  return [
    normalizedText(row.date),
    normalizedText(row.pub || "Unknown"),
    normalizedText(row.supplierRaw || row.supplier || "UNKNOWN"),
    normalizedText(row.category || "Uncategorised"),
    normalizedAmount(row.amount),
    normalizedText(row.description || ""),
  ].join("|");
}

export function filterDuplicateRows(
  incomingRows: Row[],
  existingRows: Row[] = []
): { uniqueRows: Row[]; duplicateRows: Row[]; duplicateCount: number } {
  const seen = new Set(existingRows.map(spendRowFingerprint));
  const uniqueRows: Row[] = [];
  const duplicateRows: Row[] = [];

  for (const row of incomingRows) {
    const key = spendRowFingerprint(row);
    if (seen.has(key)) {
      duplicateRows.push(row);
      continue;
    }
    seen.add(key);
    uniqueRows.push(row);
  }

  return {
    uniqueRows,
    duplicateRows,
    duplicateCount: duplicateRows.length,
  };
}