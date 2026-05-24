import { loadStoredRows } from "@/lib/config";
import { usesSupabaseAsDataSourceClient } from "@/lib/data-source";
import { fetchSpendTransactions } from "@/lib/spend-data";
import { rowsToTransactions } from "./parse-transactions";
import type { Transaction } from "./types";

/** Client: Supabase + localStorage fallback. */
export async function getTransactionsClient(): Promise<Transaction[]> {
  if (typeof window === "undefined") return [];

  if (usesSupabaseAsDataSourceClient()) {
    const { rows } = await fetchSpendTransactions();
    const raw = rows.length > 0 ? rows : loadStoredRows();
    return rowsToTransactions(raw);
  }

  return rowsToTransactions(loadStoredRows());
}
