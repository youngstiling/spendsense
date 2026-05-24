import { createClient } from "@/lib/supabase/client";

/** Browser Supabase client (use in client components). */
export const supabase = createClient();

/** Transactions table in Postgres (`spend_transactions`). */
export const TRANSACTIONS_TABLE = "spend_transactions";