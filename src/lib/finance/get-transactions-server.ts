import "server-only";

import { cache } from "react";
import { usesSupabaseAsDataSource } from "@/lib/data-source";
import { rowsFromSpendTransactions } from "@/lib/spend-transaction-db";
import {
  SPEND_TRANSACTIONS_TABLE,
  SPEND_TRANSACTION_SELECT,
  SPEND_TRANSACTION_SELECT_LEGACY,
  SpendTxCol,
  isSchemaMismatchError,
  type SpendTransactionDbRow,
} from "@/lib/supabase/schema";
import { createClient } from "@/lib/supabase/server";
import { rowsToTransactions } from "./parse-transactions";
import type { Transaction } from "./types";

async function queryAllTransactionsServer(userId: string) {
  const supabase = await createClient();
  const full = await supabase
    .from(SPEND_TRANSACTIONS_TABLE)
    .select(SPEND_TRANSACTION_SELECT)
    .eq(SpendTxCol.userId, userId)
    .order(SpendTxCol.date, { ascending: true });

  if (!full.error && full.data) {
    return rowsFromSpendTransactions(
      full.data as unknown as SpendTransactionDbRow[]
    );
  }

  if (full.error && isSchemaMismatchError(full.error.message)) {
    const legacy = await supabase
      .from(SPEND_TRANSACTIONS_TABLE)
      .select(SPEND_TRANSACTION_SELECT_LEGACY)
      .eq(SpendTxCol.userId, userId)
      .order(SpendTxCol.date, { ascending: true });
    if (!legacy.error && legacy.data) {
      return rowsFromSpendTransactions(
        legacy.data as unknown as SpendTransactionDbRow[]
      );
    }
  }

  return [];
}

/** Server: fetch spend_transactions for authenticated user. */
export async function getTransactions(): Promise<Transaction[]> {
  if (!usesSupabaseAsDataSource()) {
    return [];
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const rows = await queryAllTransactionsServer(user.id);
  return rowsToTransactions(rows);
}

export const getCachedTransactions = cache(getTransactions);
