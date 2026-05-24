import { createClient } from "@/lib/supabase/client";

/** Browser Supabase client (use in client components). */
export const supabase = createClient();

/** @deprecated Use SPEND_TRANSACTIONS_TABLE from @/lib/supabase/schema */
export { SPEND_TRANSACTIONS_TABLE as TRANSACTIONS_TABLE } from "@/lib/supabase/schema";