import { loadStoredRows } from "@/lib/config";
import type { Row } from "@/lib/csv-shared";
import { usesSupabaseAsDataSourceClient } from "@/lib/data-source";
import {
  normaliseInsightRows,
  type InsightRow,
} from "@/lib/insight-engine";
import { fetchSpendTransactions } from "@/lib/spend-data";

/** Load spend rows for the insight engine (Supabase + browser fallback). */
export async function fetchSpendDataForInsights(): Promise<{
  rows: InsightRow[];
  error?: string;
}> {
  let raw: Row[] = [];

  if (usesSupabaseAsDataSourceClient()) {
    const { rows: fromDb, error } = await fetchSpendTransactions();
    raw = fromDb.length > 0 ? fromDb : loadStoredRows();
    return {
      rows: normaliseInsightRows(raw),
      error,
    };
  }

  raw = loadStoredRows();
  return { rows: normaliseInsightRows(raw) };
}
