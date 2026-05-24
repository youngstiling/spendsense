import { sumAmount } from "./sum-amount";

type PubScopedRow = { date: string; pub?: string; amount?: number };

export type PubSummary = {
  pub: string;
  startDate: string;
  endDate: string;
  transactions: number;
};

function filterByPub<T extends PubScopedRow>(rows: T[], pub: string): T[] {
  const needle = pub.trim().toLowerCase();
  return rows.filter((row) => (row.pub ?? "").toLowerCase() === needle);
}

/**
 * Date range and transaction count for one pub/site.
 * Matches:
 *   SELECT MIN(timestamp), MAX(timestamp), COUNT(*)
 *   FROM transactions WHERE pub_name = ?
 */
export type TopPubSpend = {
  pub: string;
  total: number;
  transactions: number;
  /** Share of spend across rows that have a pub (0–100). */
  sharePct: number;
};

export type PubSpendEntry = {
  pub: string;
  total: number;
  transactions: number;
};

function aggregateSpendByPub(
  rows: Array<{ pub?: string; amount: number }>
): Record<string, { total: number; transactions: number }> {
  const byPub: Record<string, { total: number; transactions: number }> = {};

  for (const row of rows) {
    const pub = row.pub?.trim();
    if (!pub) continue;
    if (!byPub[pub]) byPub[pub] = { total: 0, transactions: 0 };
    byPub[pub].total += row.amount;
    byPub[pub].transactions += 1;
  }

  return byPub;
}

export function spendByPub(
  rows: Array<{ pub?: string; amount: number }>
): PubSpendEntry[] {
  return Object.entries(aggregateSpendByPub(rows))
    .map(([pub, stats]) => ({ pub, ...stats }))
    .sort((a, b) => b.total - a.total);
}

export function averagePubSpend(entries: PubSpendEntry[]): number {
  if (!entries.length) return 0;
  return sumAmount(entries.map((e) => ({ amount: e.total }))) / entries.length;
}

/** if (pubSpend > avg * 1.3) */
export function isPubSpendOutlier(
  pubSpend: number,
  avg: number,
  multiplier = 1.3
): boolean {
  return avg > 0 && pubSpend > avg * multiplier;
}

export type PubSpendOutlier = PubSpendEntry & {
  avg: number;
  threshold: number;
  /** How far above average (e.g. 45 = 45% above avg). */
  overAvgPct: number;
};

export function pubsAboveAverageSpend(
  rows: Array<{ pub?: string; amount: number }>,
  multiplier = 1.3
): PubSpendOutlier[] {
  const entries = spendByPub(rows);
  if (entries.length < 2) return [];

  const avg = averagePubSpend(entries);
  const threshold = avg * multiplier;

  return entries
    .filter((e) => isPubSpendOutlier(e.total, avg, multiplier))
    .map((e) => ({
      ...e,
      avg,
      threshold,
      overAvgPct: avg > 0 ? ((e.total / avg) - 1) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

/** topPub = pub with highest total spend */
export function topPubBySpend(
  rows: Array<{ pub?: string; amount: number }>
): TopPubSpend | null {
  const entries = spendByPub(rows);
  if (!entries.length) return null;

  const leader = entries[0]!;
  const pubScopedTotal = sumAmount(entries.map((e) => ({ amount: e.total })));

  return {
    pub: leader.pub,
    total: leader.total,
    transactions: leader.transactions,
    sharePct: pubScopedTotal > 0 ? (leader.total / pubScopedTotal) * 100 : 0,
  };
}

export function calculatePubSummary(
  rows: PubScopedRow[],
  pub: string
): PubSummary | null {
  const scoped = filterByPub(rows, pub);
  if (!scoped.length) return null;

  const dates = scoped.map((row) => row.date).sort();
  return {
    pub: pub.trim(),
    startDate: dates[0]!,
    endDate: dates[dates.length - 1]!,
    transactions: scoped.length,
  };
}
