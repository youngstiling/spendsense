/** Demo flag only — safe to import from middleware (no heavy deps). */
export function isDemoMode() {
  if (process.env.DEMO_MODE === "true") return true;
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return true;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return !key || key === "your-anon-key" || key.length < 40;
}
