import {
  computeAveragePubSpend,
  computePubPerformanceSummary,
  computePubsAboveAverageSpend,
  computeSpendByPub,
  computeTopPubBySpend,
  isPubSpendOutlier as computeIsPubSpendOutlier,
} from "@/lib/finance/engines/benchmark";
import type {
  BenchmarkSpendRow,
  PubPerformanceSummary,
  PubSpendEntry,
  PubSpendOutlier,
  TopPubSpend,
} from "@/lib/finance/engines/benchmark";

export type {
  PubPerformanceSummary,
  PubSpendEntry,
  PubSpendOutlier,
  TopPubSpend,
};

type PubScopedRow = BenchmarkSpendRow & { date: string };

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

export function spendByPub(
  rows: BenchmarkSpendRow[]
): PubSpendEntry[] {
  return computeSpendByPub(rows);
}

export function averagePubSpend(entries: PubSpendEntry[]): number {
  return computeAveragePubSpend(entries);
}

/** if (pubSpend > avg * 1.3) */
export function isPubSpendOutlier(
  pubSpend: number,
  avg: number,
  multiplier = 1.3
): boolean {
  return computeIsPubSpendOutlier(pubSpend, avg, multiplier);
}

export function pubsAboveAverageSpend(
  rows: BenchmarkSpendRow[],
  multiplier = 1.3
): PubSpendOutlier[] {
  return computePubsAboveAverageSpend(rows, multiplier);
}

/** topPub = pub with highest total spend */
export function topPubBySpend(
  rows: BenchmarkSpendRow[]
): TopPubSpend | null {
  return computeTopPubBySpend(rows);
}

/** Top + worst pub, portfolio % for leader, and a short insight line. */
export function computePubPerformance(
  rows: BenchmarkSpendRow[],
  portfolioTotal?: number
): PubPerformanceSummary | null {
  return computePubPerformanceSummary(rows, portfolioTotal);
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
