import { clearDemoRows } from "@/lib/config";
import type { Row } from "@/lib/csv-shared";
import { isDemoMode } from "@/lib/demo";
import {
  rowsFromSpendTransactions,
  SPEND_TRANSACTIONS_TABLE,
  type SpendTransactionRecord,
} from "@/lib/spend-transaction-db";
import { createClient } from "@/lib/supabase/client";

const SPEND_TX_SELECT_FULL =
  "date, supplier, canonical_supplier, category, amount, pub, description";

/** Older DBs may only have core columns until fix-spend-transactions-schema.sql is run. */
const SPEND_TX_SELECT_LEGACY = "date, supplier, category, amount";

function isMissingColumnError(message: string): boolean {
  return /column|does not exist|schema cache/i.test(message);
}

/** Load the signed-in user's rows from spend_transactions. */
export async function fetchSpendTransactions(): Promise<{
  rows: Row[];
  error?: string;
}> {
  if (isDemoMode()) {
    return { rows: [] };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { rows: [] };
  }

  const full = await supabase
    .from(SPEND_TRANSACTIONS_TABLE)
    .select(SPEND_TX_SELECT_FULL)
    .eq("user_id", user.id)
    .order("date", { ascending: true });

  let records: SpendTransactionRecord[] =
    (full.data as SpendTransactionRecord[] | null) ?? [];
  let fetchError = full.error;

  if (fetchError && isMissingColumnError(fetchError.message)) {
    const legacy = await supabase
      .from(SPEND_TRANSACTIONS_TABLE)
      .select(SPEND_TX_SELECT_LEGACY)
      .eq("user_id", user.id)
      .order("date", { ascending: true });
    records = (legacy.data as SpendTransactionRecord[] | null) ?? [];
    fetchError = legacy.error;
  }

  if (fetchError) {
    return { rows: [], error: fetchError.message };
  }

  return {
    rows: rowsFromSpendTransactions(records),
  };
}

export async function deleteAllSpendData(): Promise<{ error?: string }> {
  if (isDemoMode()) {
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
    .eq("user_id", user.id);

  return error ? { error: error.message } : {};
}
