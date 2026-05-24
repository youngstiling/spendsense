/**
 * Demo-only browser cache. Production source of truth is Supabase
 * spend_transactions — see src/lib/supabase/schema.ts.
 */
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
/** Legacy key from early dashboard prototypes */
const LEGACY_TRANSACTIONS_KEY = "transactions";

type LegacyTransaction = {
  pub?: string;
  category?: string;
  amount?: number;
  date?: string;
  supplier?: string;
};

export const QUICK_DEMO_TRANSACTIONS: LegacyTransaction[] = [
  { pub: "Pub A", category: "Beer", amount: 120 },
  { pub: "Pub B", category: "Food", amount: 300 },
  { pub: "Pub C", category: "Wine", amount: 220 },
  { pub: "Pub D", category: "Spirits", amount: 180 },
  { pub: "Pub E", category: "Soft Drinks", amount: 90 },
];

function legacyToRows(items: LegacyTransaction[]): Row[] {
  return items.map((t, index) => {
    const category = String(t.category ?? "").trim() || "Uncategorised";
    const pub = String(t.pub ?? "Unknown").trim() || "Unknown";
    const amount = Number(t.amount) || 0;
    const date =
      String(t.date ?? "").trim() ||
      `2026-01-${String(12 + index).padStart(2, "0")}`;
    return {
      date,
      pub,
      category,
      supplier: String(t.supplier ?? category).trim() || category,
      amount,
      description: category,
    };
  });
}

/** Load rows from app storage, migrating legacy `transactions` if needed. */
export function loadStoredRows(): Row[] {
  const rows = loadDemoRows();
  if (rows.length) return rows;
  if (typeof window === "undefined") return [];

  const legacy = readJsonStorage<LegacyTransaction[]>(LEGACY_TRANSACTIONS_KEY, []);
  if (!legacy.length) return [];

  const migrated = legacyToRows(legacy);
  replaceDemoRows(migrated);
  localStorage.removeItem(LEGACY_TRANSACTIONS_KEY);
  return migrated;
}

export function loadQuickDemoRows(): Row[] {
  return legacyToRows(QUICK_DEMO_TRANSACTIONS);
}

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
  localStorage.removeItem(LEGACY_TRANSACTIONS_KEY);
}

/** Clear all client-side spend data (import + quick demo). */
export function clearStoredRows() {
  clearDemoRows();
}
