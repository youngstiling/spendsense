import type { Row } from "./csv";
import { isDemoMode } from "./demo";
import { readJsonStorage } from "./safe-storage";

export { isDemoMode };

/** Client-safe demo check (respects env; localhost fallback only when unset). */
export function isDemoModeClient(): boolean {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return true;
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "false") return false;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return true;
    // Hosted app (Vercel, etc.): use Supabase unless demo explicitly enabled
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) return false;
  }
  return isDemoMode();
}

const STORAGE_KEY = "spendsense-demo-rows";

/** Normalise legacy localStorage rows so the dashboard never crashes on enrich. */
export function normalizeRows(rows: Row[]): Row[] {
  return rows.map((r) => ({
    ...r,
    date: String(r.date ?? ""),
    supplier: String(r.supplier ?? "UNKNOWN"),
    category: String(r.category ?? ""),
    amount: Number(r.amount) || 0,
  }));
}

export function loadDemoRows(): Row[] {
  return normalizeRows(readJsonStorage<Row[]>(STORAGE_KEY, []));
}

function persistDemoRows(rows: Row[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch {
    throw new Error(
      "Could not save data in this browser. Storage may be full or blocked."
    );
  }
}

export function saveDemoRows(rows: Row[]) {
  const existing = loadDemoRows();
  persistDemoRows([...rows, ...existing]);
}

export function replaceDemoRows(rows: Row[]) {
  persistDemoRows(rows);
}

export function hasDemoRows(): boolean {
  return loadDemoRows().length > 0;
}

export function clearDemoRows() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
