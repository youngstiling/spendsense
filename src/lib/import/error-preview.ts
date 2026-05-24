import type { ImportRowError } from "./types";

/** Build preview rows for all error row numbers (not limited to preview slice). */
export function buildErrorPreviewRows(
  allRows: Record<string, string>[],
  errors: ImportRowError[],
  startRowNumber = 2,
  limit = 50
): { rowNumber: number; data: Record<string, string> }[] {
  const errorNumbers = [...new Set(errors.map((e) => e.rowNumber))].sort(
    (a, b) => a - b
  );

  const out: { rowNumber: number; data: Record<string, string> }[] = [];
  for (const rowNumber of errorNumbers) {
    if (out.length >= limit) break;
    const index = rowNumber - startRowNumber;
    const data = allRows[index];
    if (data) {
      out.push({ rowNumber, data });
    }
  }
  return out;
}
