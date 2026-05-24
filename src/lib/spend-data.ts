import { clearDemoRows } from "@/lib/config";
import type { Row } from "@/lib/csv-shared";
import { usesSupabaseAsDataSource } from "@/lib/data-source";
import { rowsFromSpendTransactions } from "@/lib/spend-transaction-db";
import type { SpendTransactionDbRow } from "@/lib/supabase/schema";
import {
  schemaFixHint,
  SPEND_TRANSACTIONS_TABLE,
  SPEND_TRANSACTION_SELECT,
  SpendTxCol,
} from "@/lib/supabase/schema";
import { createClient } from "@/lib/supabase/client";

/** Load rows from spend_transactions (Supabase schema is source of truth). */
export async function fetchSpendTransactions(): Promise<{
  rows: Row[];
  error?: string;
  schemaHint?: string;
}> {
  if (!usesSupabaseAsDataSource()) {
    return { rows: [] };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { rows: [] };
  }

  const { data, error } = await supabase
    .from(SPEND_TRANSACTIONS_TABLE)
    .select(SPEND_TRANSACTION_SELECT)
    .eq(SpendTxCol.userId, user.id)
    .order(SpendTxCol.date, { ascending: true });

  if (error) {
    return {
      rows: [],
      error: error.message,
      schemaHint: schemaFixHint(error.message),
    };
  }

  return {
    rows: rowsFromSpendTransactions((data ?? []) as unknown as SpendTransactionDbRow[]),
  };
}

export async function deleteAllSpendData(): Promise<{
  error?: string;
  schemaHint?: string;
}> {
  if (!usesSupabaseAsDataSource()) {
    clearDemoRows();
    return {};
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not logged in." };
  }

  const { error } = await supabase
    .from(SPEND_TRANSACTIONS_TABLE)
    .delete()
    .eq(SpendTxCol.userId, user.id);

  if (error) {
    return { error: error.message, schemaHint: schemaFixHint(error.message) };
  }

  return {};
}
