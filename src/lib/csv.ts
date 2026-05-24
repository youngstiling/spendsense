import Papa from "papaparse";
import { buildRowsFromParsed, type Row } from "@/lib/csv-shared";

export type { Row } from "@/lib/csv-shared";
export { normalizeSupplier } from "@/lib/csv-shared";

function parseCsvRecords(text: string): {
  data: Record<string, string>[];
  headers: string[];
  error?: string;
} {
  const results = Papa.parse<Record<string, string>>(text.trim(), {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });

  const data = (results.data ?? []).filter(
    (row) => row && Object.values(row).some((v) => v != null && String(v).trim() !== "")
  );

  if (!data.length) {
    return {
      data: [],
      headers: [],
      error: results.errors[0]?.message ?? "No valid rows found.",
    };
  }

  const headers = results.meta.fields ?? Object.keys(data[0] ?? {});

  return { data, headers };
}

export function parseSpendCsvText(text: string): {
  rows: Row[];
  skipped: number;
  error?: string;
} {
  const { data, headers, error } = parseCsvRecords(text);
  if (error) return { rows: [], skipped: 0, error };
  return buildRowsFromParsed(data, headers);
}

export async function parseSpendCsv(file: File): Promise<{
  rows: Row[];
  skipped: number;
  error?: string;
}> {
  return parseSpendCsvText(await file.text());
}
