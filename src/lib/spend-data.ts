import { clearDemoRows } from "@/lib/config";
import { SPEND_TRANSACTIONS_TABLE } from "@/lib/spend-transaction-db";
import { isDemoMode } from "@/lib/demo";
import { createClient } from "@/lib/supabase/client";

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
