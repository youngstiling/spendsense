import type { Row } from "@/lib/csv-shared";
import { parseSpendCsvText } from "@/lib/csv-server";

export type ParseCSVResult = {
  rows: Row[];
  skipped: number;
  error?: string;
};

/** Server-side CSV parse (csv-parse). Use from API routes only. */
export function parseCSV(content: string): ParseCSVResult {
  return parseSpendCsvText(content);
}
