import { format, isValid, parseISO, subMonths } from "date-fns";
import type { Transaction } from "./types";

export function monthKey(date: Date): string {
  return format(date, "yyyy-MM");
}

export function parseTransactionDate(value: string | Date): Date | null {
  if (value instanceof Date) return isValid(value) ? value : null;
  const parsed = parseISO(String(value).slice(0, 10));
  return isValid(parsed) ? parsed : null;
}

export function sortedMonthKeys(txs: Transaction[]): string[] {
  const keys = new Set<string>();
  for (const t of txs) {
    if (isValid(t.date)) keys.add(monthKey(t.date));
  }
  return [...keys].sort();
}

export function buildPubMonthTotals(
  txs: Transaction[]
): Map<string, Map<string, number>> {
  const map = new Map<string, Map<string, number>>();
  for (const t of txs) {
    if (!isValid(t.date)) continue;
    const m = monthKey(t.date);
    if (!map.has(t.pubName)) map.set(t.pubName, new Map());
    const pubMap = map.get(t.pubName)!;
    pubMap.set(m, (pubMap.get(m) ?? 0) + t.amount);
  }
  return map;
}

export function portfolioMonthTotals(txs: Transaction[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const t of txs) {
    if (!isValid(t.date)) continue;
    const m = monthKey(t.date);
    totals.set(m, (totals.get(m) ?? 0) + t.amount);
  }
  return totals;
}

export function supplierMonthTotals(
  txs: Transaction[]
): Map<string, Map<string, number>> {
  const map = new Map<string, Map<string, number>>();
  for (const t of txs) {
    if (!isValid(t.date)) continue;
    const m = monthKey(t.date);
    const s = t.canonicalSupplier;
    if (!map.has(s)) map.set(s, new Map());
    const sm = map.get(s)!;
    sm.set(m, (sm.get(m) ?? 0) + t.amount);
  }
  return map;
}

export function pubsForSupplier(
  txs: Transaction[],
  supplier: string,
  months: string[]
): number {
  const pubs = new Set<string>();
  for (const t of txs) {
    if (t.canonicalSupplier !== supplier || !isValid(t.date)) continue;
    if (months.includes(monthKey(t.date))) pubs.add(t.pubName);
  }
  return pubs.size;
}

export function averageOf(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function monthsBefore(reference: string, count: number): string[] {
  const ref = parseISO(`${reference}-01`);
  if (!isValid(ref)) return [];
  return Array.from({ length: count }, (_, i) =>
    monthKey(subMonths(ref, i + 1))
  );
}
