import { parse } from "csv-parse/sync";
import { buildRowsFromParsed } from "@/lib/csv-shared";

function parseCsvRecords(text: string): {
  data: Record<string, string>[];
  headers: string[];
  error?: string;
} {
  try {
    const records = parse(text.trim(), {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true,
      bom: true,
    }) as Record<string, string>[];

    const headers =
      records.length > 0
        ? Object.keys(records[0])
        : (parse(text.trim(), { to: 1 })[0] as string[] | undefined) ?? [];

    return { data: records, headers };
  } catch (err) {
    return {
      data: [],
      headers: [],
      error: err instanceof Error ? err.message : "Parse error.",
    };
  }
}

export function parseSpendCsvText(text: string) {
  const { data, headers, error } = parseCsvRecords(text);
  if (error) return { rows: [], skipped: 0, error };
  return buildRowsFromParsed(data, headers);
}
