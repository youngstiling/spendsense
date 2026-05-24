import { loadStoredRows } from "@/lib/config";
import type { Row } from "@/lib/csv-shared";
import { usesSupabaseAsDataSourceClient } from "@/lib/data-source";
import { fetchSpendTransactions } from "@/lib/spend-data";
import {
  rowsToSpendTransactions,
  spendTransactionsToEngineRows,
} from "./parse-transactions";
import type { SpendTransaction } from "@/lib/supabase/schema";
import type { Transaction } from "./types";

/** Primary client fetch — canonical SpendTransaction[]. */
export async function getSpendTransactionsClient(): Promise<SpendTransaction[]> {
  if (typeof window === "undefined") return [];

  if (usesSupabaseAsDataSourceClient()) {
    const { rows } = await fetchSpendTransactions();
    const raw = rows.length > 0 ? rows : loadStoredRows();
    return rowsToSpendTransactions(raw);
  }

  return rowsToSpendTransactions(loadStoredRows());
}

/** Engine pipeline (Date + pubName). */
export async function getTransactionsClient(): Promise<Transaction[]> {
  return spendTransactionsToEngineRows(await getSpendTransactionsClient());
}
