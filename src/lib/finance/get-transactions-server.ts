import "server-only";

import { cache } from "react";
import { usesSupabaseAsDataSource } from "@/lib/data-source";
import { spendTransactionsFromDbRows } from "@/lib/spend-transaction-db";
import {
  SPEND_TRANSACTIONS_TABLE,
  SPEND_TRANSACTION_SELECT,
  SPEND_TRANSACTION_SELECT_FULL,
  SPEND_TRANSACTION_SELECT_LEGACY,
  SpendTxCol,
  isSchemaMismatchError,
  spendTransactionFromDbRow,
  type SpendTransaction,
  type SpendTransactionDbRow,
} from "@/lib/supabase/schema";
import { createClient } from "@/lib/supabase/server";
import { spendTransactionsToEngineRows } from "./parse-transactions";
import type { Transaction } from "./types";

async function queryDbRows(
  userId: string,
  select: string
): Promise<SpendTransactionDbRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(SPEND_TRANSACTIONS_TABLE)
    .select(select)
    .eq(SpendTxCol.userId, userId)
    .order(SpendTxCol.date, { ascending: true });

  if (error || !data?.length) return [];
  return data as unknown as SpendTransactionDbRow[];
}

async function querySpendTransactionsServer(
  userId: string
): Promise<SpendTransaction[]> {
  const full = await queryDbRows(userId, SPEND_TRANSACTION_SELECT_FULL);
  if (full.length) return spendTransactionsFromDbRows(full);

  const legacy = await queryDbRows(userId, SPEND_TRANSACTION_SELECT_LEGACY);
  if (legacy.length) {
    return legacy.map((r) =>
      spendTransactionFromDbRow({
        ...r,
        canonical_supplier: r.canonical_supplier ?? r.supplier,
      })
    );
  }

  const minimal = await queryDbRows(userId, SPEND_TRANSACTION_SELECT);
  if (minimal.length) return spendTransactionsFromDbRows(minimal);

  return [];
}

/** Primary server fetch — canonical SpendTransaction[]. */
export async function getSpendTransactions(): Promise<SpendTransaction[]> {
  if (!usesSupabaseAsDataSource()) return [];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  try {
    return await querySpendTransactionsServer(user.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!isSchemaMismatchError(message)) throw err;
    const legacy = await queryDbRows(user.id, SPEND_TRANSACTION_SELECT_LEGACY);
    return legacy.map((r) => spendTransactionFromDbRow(r));
  }
}

/** Engine pipeline (Date + pubName). */
export async function getTransactions(): Promise<Transaction[]> {
  return spendTransactionsToEngineRows(await getSpendTransactions());
}

export const getCachedSpendTransactions = cache(getSpendTransactions);
export const getCachedTransactions = cache(getTransactions);
