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
import { validateRow, type ValidatableSpendRow } from "./validate-row";

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

async function queryAnalyticsEligibleImportIds(
  userId: string
): Promise<Set<string> | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("csv_import_jobs")
    .select("id, verification_status")
    .eq("user_id", userId)
    .in("verification_status", ["verified", "warning"]);

  if (error) {
    return /verification_status|schema cache|column|relation/i.test(error.message)
      ? null
      : new Set();
  }

  return new Set((data ?? []).map((row) => String(row.id)));
}

function filterVerifiedDbRows(
  rows: SpendTransactionDbRow[],
  verifiedIds: Set<string> | null
): SpendTransactionDbRow[] {
  if (verifiedIds === null) return rows;
  return rows.filter((row) => row.import_batch_id && verifiedIds.has(row.import_batch_id));
}

async function querySpendTransactionsServer(
  userId: string
): Promise<SpendTransaction[]> {
  const verifiedImportIds = await queryAnalyticsEligibleImportIds(userId);
  if (verifiedImportIds && verifiedImportIds.size === 0) return [];

  const strict = await queryValidatedSpendTransactions(userId, verifiedImportIds);
  if (strict.length) return strict;

  const full = filterVerifiedDbRows(
    await queryDbRows(userId, SPEND_TRANSACTION_SELECT_FULL),
    verifiedImportIds
  );
  if (full.length) return spendTransactionsFromDbRows(full);

  const legacy = filterVerifiedDbRows(
    await queryDbRows(userId, SPEND_TRANSACTION_SELECT_LEGACY),
    verifiedImportIds
  );
  if (legacy.length) {
    return legacy.map((r) =>
      spendTransactionFromDbRow({
        ...r,
        canonical_supplier: r.canonical_supplier ?? r.supplier,
      })
    );
  }

  const minimal = filterVerifiedDbRows(
    await queryDbRows(userId, SPEND_TRANSACTION_SELECT),
    verifiedImportIds
  );
  if (minimal.length) return spendTransactionsFromDbRows(minimal);

  return [];
}

async function queryValidatedSpendTransactions(
  userId: string,
  verifiedImportIds: Set<string> | null
): Promise<SpendTransaction[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(SPEND_TRANSACTIONS_TABLE)
    .select("*")
    .eq(SpendTxCol.userId, userId)
    .order(SpendTxCol.date, { ascending: true });

  if (error) throw error;
  if (!data?.length) return [];

  return filterVerifiedDbRows(data as unknown as SpendTransactionDbRow[], verifiedImportIds).map(
    (row) =>
      spendTransactionFromDbRow(
        validateRow(row as ValidatableSpendRow) as SpendTransactionDbRow
      )
  );
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
    const verifiedImportIds = await queryAnalyticsEligibleImportIds(user.id);
    return filterVerifiedDbRows(legacy, verifiedImportIds).map((r) =>
      spendTransactionFromDbRow(r)
    );
  }
}

/** Engine pipeline (Date + pubName). */
export async function getTransactions(): Promise<Transaction[]> {
  return spendTransactionsToEngineRows(await getSpendTransactions());
}

export const getCachedSpendTransactions = cache(getSpendTransactions);
export const getCachedTransactions = cache(getTransactions);
