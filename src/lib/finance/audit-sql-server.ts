import "server-only";

import {
  SPEND_TRANSACTIONS_TABLE,
  SpendTxCol,
} from "@/lib/supabase/schema";
import { createClient } from "@/lib/supabase/server";
import { usesSupabaseAsDataSource } from "@/lib/data-source";

export type SqlSpendTruth = {
  total: number;
  rowCount: number;
  authenticated: boolean;
};

/** Raw SQL truth: sum(amount) from spend_transactions for the signed-in user. */
export async function getSqlTotalSpend(): Promise<SqlSpendTruth> {
  if (!usesSupabaseAsDataSource()) {
    return { total: 0, rowCount: 0, authenticated: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { total: 0, rowCount: 0, authenticated: false };
  }

  const { data, error } = await supabase
    .from(SPEND_TRANSACTIONS_TABLE)
    .select(SpendTxCol.amount)
    .eq(SpendTxCol.userId, user.id);

  if (error || !data?.length) {
    return { total: 0, rowCount: 0, authenticated: true };
  }

  const total = data.reduce(
    (sum, row) => sum + (Number(row.amount) || 0),
    0
  );

  return {
    total,
    rowCount: data.length,
    authenticated: true,
  };
}
