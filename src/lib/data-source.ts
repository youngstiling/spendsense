import { isDemoMode, isDemoModeClient } from "@/lib/config";

/** Server: production data lives in Supabase spend_transactions. */
export function usesSupabaseAsDataSource(): boolean {
  return !isDemoMode() && Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

/** Client: browser demo uses localStorage only; hosted app uses Supabase. */
export function usesSupabaseAsDataSourceClient(): boolean {
  return !isDemoModeClient() && Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
}
