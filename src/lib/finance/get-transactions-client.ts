import { clearStoredRows, loadStoredRows } from "@/lib/config";
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
    clearStoredRows();
    return rowsToSpendTransactions(rows);
  }

  return rowsToSpendTransactions(loadStoredRows());
}

/** Engine pipeline (Date + pubName). */
export async function getTransactionsClient(): Promise<Transaction[]> {
  return spendTransactionsToEngineRows(await getSpendTransactionsClient());
}
