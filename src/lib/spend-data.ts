import { clearDemoRows } from "@/lib/config";
import type { Row } from "@/lib/csv-shared";
import { isDemoMode } from "@/lib/demo";
import {
  rowsFromSpendTransactions,
  SPEND_TRANSACTIONS_TABLE,
  type SpendTransactionRecord,
} from "@/lib/spend-transaction-db";
import { createClient } from "@/lib/supabase/client";

const SPEND_TX_SELECT =
  "date, supplier, canonical_supplier, category, amount, pub, description";

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

  const { data, error } = await supabase
    .from(SPEND_TRANSACTIONS_TABLE)
    .select(SPEND_TX_SELECT)
    .eq("user_id", user.id)
    .order("date", { ascending: true });

  if (error) {
    return { rows: [], error: error.message };
  }

  return {
    rows: rowsFromSpendTransactions((data ?? []) as SpendTransactionRecord[]),
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
