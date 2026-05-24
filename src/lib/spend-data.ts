import { clearDemoRows } from "@/lib/config";
import type { Row } from "@/lib/csv-shared";
import { usesSupabaseAsDataSource } from "@/lib/data-source";
import { rowsFromSpendTransactions } from "@/lib/spend-transaction-db";
import type { SpendTransactionDbRow } from "@/lib/supabase/schema";
import {
  isSchemaMismatchError,
  schemaFixHint,
  SPEND_TRANSACTIONS_TABLE,
  SPEND_TRANSACTION_SELECT,
  SPEND_TRANSACTION_SELECT_LEGACY,
  SpendTxCol,
} from "@/lib/supabase/schema";
import { createClient } from "@/lib/supabase/client";

async function queryTransactions(
  userId: string,
  select: string
): Promise<{ data: SpendTransactionDbRow[] | null; error: { message: string } | null }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from(SPEND_TRANSACTIONS_TABLE)
    .select(select)
    .eq(SpendTxCol.userId, userId)
    .order(SpendTxCol.date, { ascending: true });

  return {
    data: (data as SpendTransactionDbRow[] | null) ?? null,
    error: error ? { message: error.message } : null,
  };
}

/** Load rows from spend_transactions; falls back to legacy columns if needed. */
export async function fetchSpendTransactions(): Promise<{
  rows: Row[];
  error?: string;
  schemaHint?: string;
  usingLegacySchema?: boolean;
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

  const full = await queryTransactions(user.id, SPEND_TRANSACTION_SELECT);
  if (!full.error && full.data) {
    return { rows: rowsFromSpendTransactions(full.data) };
  }

  if (full.error && isSchemaMismatchError(full.error.message)) {
    const legacy = await queryTransactions(
      user.id,
      SPEND_TRANSACTION_SELECT_LEGACY
    );
    if (!legacy.error && legacy.data) {
      return {
        rows: rowsFromSpendTransactions(legacy.data),
        usingLegacySchema: true,
        schemaHint:
          "Using basic table columns. Run supabase/fix-spend-transactions-schema.sql in Supabase SQL Editor when you can.",
      };
    }
  }

  if (full.error) {
    return {
      rows: [],
      error: full.error.message,
      schemaHint: schemaFixHint(full.error.message),
    };
  }

  return { rows: [] };
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
