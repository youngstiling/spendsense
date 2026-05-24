import { isDemoMode } from "@/lib/demo";

/** Skip login middleware (demo mode or temporary open access). */
export function isAuthSkipped(): boolean {
  if (isDemoMode()) return true;
  if (process.env.NEXT_PUBLIC_AUTH_DISABLED === "true") return true;
  return false;
}
