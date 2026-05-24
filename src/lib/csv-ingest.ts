import Papa from "papaparse";
import { parseSpendCsvText } from "@/lib/csv";
import type { Row } from "@/lib/csv-shared";

export type IngestResult = {
  rows: Row[];
  skipped: number;
  error?: string;
  /** Original CSV rows keyed by header (for logging / skipped-row review). Not stored in DB. */
  rawRows: Record<string, string>[];
};

/**
 * Parse and clean a CSV string for ingest into spend_transactions.
 * Reuses existing column auto-mapping, supplier normalisation, amount/date parsing.
 */
export function ingestCsvText(text: string): IngestResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { rows: [], skipped: 0, error: "File is empty.", rawRows: [] };
  }

  const preview = Papa.parse<Record<string, string>>(trimmed, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });

  const rawRows = (preview.data ?? []).filter(
    (row) => row && Object.values(row).some((v) => v != null && String(v).trim() !== "")
  );

  const { rows, skipped, error } = parseSpendCsvText(trimmed);

  return {
    rows,
    skipped,
    error,
    rawRows,
  };
}

export async function ingestCsvFile(file: File): Promise<IngestResult> {
  if (!file.name.toLowerCase().endsWith(".csv")) {
    return { rows: [], skipped: 0, error: "Only .csv files are accepted.", rawRows: [] };
  }
  return ingestCsvText(await file.text());
}
