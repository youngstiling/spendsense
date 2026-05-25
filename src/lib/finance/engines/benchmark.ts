import {
  averageOf,
  buildPubMonthTotals,
  monthKey,
  sortedMonthKeys,
} from "../month-utils";
import type {
  BenchmarkConfidence,
  BenchmarkSummary,
  PubBenchmark,
  Transaction,
} from "../types";

export type BenchmarkSpendRow = {
  pub?: string | null;
  pub_name?: string | null;
  date?: string | Date | null;
  supplier?: string | null;
  canonical_supplier?: string | null;
  canonicalSupplier?: string | null;
  category?: string | null;
  amount?: number | string | null;
};

export type LegacyPubBenchmark = {
  pub: string;
  total: number;
  vsAvg: number;
};

export type PubSpendEntry = {
  pub: string;
  total: number;
  transactions: number;
};

export type PubSpendOutlier = PubSpendEntry & {
  avg: number;
  threshold: number;
  /** How far above average (e.g. 45 = 45% above avg). */
  overAvgPct: number;
};

export type TopPubSpend = {
  pub: string;
  total: number;
  transactions: number;
  /** Share of spend across rows that have a pub (0-100). */
  sharePct: number;
};

export type PubPerformanceSummary = {
  topPub: { pub: string; total: number };
  worstPub: { pub: string; total: number };
  /** Share of portfolio total spend (0-100). */
  topPercentage: number;
  insight: string;
};

export function computePubBenchmarks(txs: Transaction[]): {
  benchmarks: PubBenchmark[];
  summary: BenchmarkSummary | null;
  categories: string[];
  byCategory: Record<string, PubBenchmark[]>;
  summariesByCategory: Record<string, BenchmarkSummary>;
} {
  const months = sortedMonthKeys(txs);
  if (!months.length) {
    return {
      benchmarks: [],
      summary: null,
      categories: [],
      byCategory: {},
      summariesByCategory: {},
    };
  }

  const currentMonth = months[months.length - 1];
  const categories = [
    ...new Set(
      txs
        .filter((tx) => monthKey(tx.date) === currentMonth)
        .map((tx) => tx.category || "Uncategorised")
    ),
  ].sort();

  const all = computeBenchmarksForScope(txs, months, currentMonth);
  const byCategory: Record<string, PubBenchmark[]> = {};
  const summariesByCategory: Record<string, BenchmarkSummary> = {};

  for (const category of categories) {
    const scoped = txs.filter((tx) => tx.category === category);
    const result = computeBenchmarksForScope(scoped, months, currentMonth, category);
    byCategory[category] = result.benchmarks;
    if (result.summary) summariesByCategory[category] = result.summary;
  }

  return {
    benchmarks: all.benchmarks,
    summary: all.summary,
    categories,
    byCategory,
    summariesByCategory,
  };
}

export function computeLegacyPubBenchmarks(
  rows: BenchmarkSpendRow[]
): LegacyPubBenchmark[] {
  return computePubBenchmarks(rowsToBenchmarkTransactions(rows)).benchmarks.map(
    (row) => ({
      pub: row.pubName,
      total: row.currentSpend,
      vsAvg: row.variancePercent,
    })
  );
}

export function computeSpendByPub(rows: BenchmarkSpendRow[]): PubSpendEntry[] {
  return Object.entries(aggregateSpendByPub(rows))
    .map(([pub, stats]) => ({ pub, ...stats }))
    .sort((a, b) => b.total - a.total);
}

export function computeAveragePubSpend(entries: PubSpendEntry[]): number {
  if (!entries.length) return 0;
  return entries.reduce((sum, entry) => sum + entry.total, 0) / entries.length;
}

export function isPubSpendOutlier(
  pubSpend: number,
  avg: number,
  multiplier = 1.3
): boolean {
  return avg > 0 && pubSpend > avg * multiplier;
}

export function computePubsAboveAverageSpend(
  rows: BenchmarkSpendRow[],
  multiplier = 1.3
): PubSpendOutlier[] {
  const entries = computeSpendByPub(rows);
  if (entries.length < 2) return [];

  const avg = computeAveragePubSpend(entries);
  const threshold = avg * multiplier;

  return entries
    .filter((entry) => isPubSpendOutlier(entry.total, avg, multiplier))
    .map((entry) => ({
      ...entry,
      avg,
      threshold,
      overAvgPct: avg > 0 ? (entry.total / avg - 1) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export function computeTopPubBySpend(
  rows: BenchmarkSpendRow[]
): TopPubSpend | null {
  const entries = computeSpendByPub(rows);
  if (!entries.length) return null;

  const leader = entries[0]!;
  const pubScopedTotal = entries.reduce((sum, entry) => sum + entry.total, 0);

  return {
    pub: leader.pub,
    total: leader.total,
    transactions: leader.transactions,
    sharePct: pubScopedTotal > 0 ? (leader.total / pubScopedTotal) * 100 : 0,
  };
}

export function computePubPerformanceSummary(
  rows: BenchmarkSpendRow[],
  portfolioTotal?: number
): PubPerformanceSummary | null {
  const pubTotals = aggregateSpendByPub(rows);
  const ranked = topAndWorstFromPubTotals(pubTotals);
  if (!ranked) return null;

  const { topPub, worstPub } = ranked;
  const total =
    portfolioTotal ??
    Object.values(pubTotals).reduce((sum, stats) => sum + stats.total, 0);
  const topPercentage = total > 0 ? (topPub.total / total) * 100 : 0;
  const pct = topPercentage.toFixed(1);
  const pubCount = Object.keys(pubTotals).length;

  let insight: string;
  if (pubCount === 1) {
    insight = `${topPub.pub} is the only pub in this view and represents ${pct}% of spend.`;
  } else if (topPub.pub === worstPub.pub) {
    insight = `${topPub.pub} accounts for ${pct}% of spend in this selection.`;
  } else {
    insight = `${topPub.pub} leads at ${pct}% of total spend. ${worstPub.pub} has the lowest spend - check whether that's site size or under-trading.`;
  }

  return { topPub, worstPub, topPercentage, insight };
}

function confidenceFor(monthsActive: number): BenchmarkConfidence {
  if (monthsActive >= 4) return "HIGH";
  if (monthsActive >= 2) return "MEDIUM";
  return "LOW";
}

function computeBenchmarksForScope(
  txs: Transaction[],
  months: string[],
  currentMonth: string,
  categoryFilter?: string
): {
  benchmarks: PubBenchmark[];
  summary: BenchmarkSummary | null;
} {
  const trailingMonths = months.slice(-6);
  const priorMonths = months.slice(0, -1).slice(-5);
  const pubMonths = buildPubMonthTotals(txs);
  const currentRows = [...pubMonths.entries()]
    .map(([pubName, monthMap]) => ({
      pubName,
      currentSpend: monthMap.get(currentMonth) ?? 0,
      monthMap,
    }))
    .filter((row) => row.currentSpend > 0);

  if (!currentRows.length) return { benchmarks: [], summary: null };

  const portfolioTotal = currentRows.reduce(
    (sum, row) => sum + row.currentSpend,
    0
  );
  const averageSpendPerPub = portfolioTotal / currentRows.length;
  const categoryAverages = buildCategoryAverages(txs, currentMonth, currentRows.length);
  const pubCategoryTotals = buildCurrentPubCategoryTotals(txs, currentMonth);

  const benchmarks = currentRows
    .map(({ pubName, currentSpend, monthMap }) => {
      const history = trailingMonths
        .map((m) => monthMap.get(m) ?? 0)
        .filter((value) => value > 0);
      const priorHistory = priorMonths
        .map((m) => monthMap.get(m) ?? 0)
        .filter((value) => value > 0);
      const ownTrendAverage = averageOf(priorHistory);
      const variancePercent =
        averageSpendPerPub > 0
          ? ((currentSpend - averageSpendPerPub) / averageSpendPerPub) * 100
          : 0;
      const selfTrendVariancePercent =
        ownTrendAverage > 0
          ? ((currentSpend - ownTrendAverage) / ownTrendAverage) * 100
          : 0;
      const driver = categoryFilter
        ? {
            category: categoryFilter,
            amount: currentSpend,
          }
        : strongestCategoryDriver(
            pubCategoryTotals.get(pubName) ?? new Map(),
            categoryAverages
          );
      const status =
        variancePercent > 10 || selfTrendVariancePercent > 10
          ? "ABOVE_AVERAGE"
          : variancePercent < -10 && selfTrendVariancePercent < -10
            ? "BELOW_AVERAGE"
            : "IN_LINE";

      return {
        pubName,
        currentMonth,
        rank: 0,
        currentSpend,
        portfolioAverage: averageSpendPerPub,
        variancePercent,
        sixMonthAverage: ownTrendAverage,
        selfTrendVariancePercent,
        amountVsPortfolioAverage: currentSpend - averageSpendPerPub,
        amountVsOwnTrend: ownTrendAverage > 0 ? currentSpend - ownTrendAverage : 0,
        mainDriverCategory: driver.category,
        mainDriverAmount: driver.amount,
        totalSpend: history.reduce((sum, value) => sum + value, 0),
        monthsActive: history.length,
        confidence: confidenceFor(history.length),
        status,
        flagged: variancePercent > 20 || selfTrendVariancePercent > 20,
      } satisfies PubBenchmark;
    })
    .sort((a, b) => b.currentSpend - a.currentSpend)
    .map((row, index) => ({ ...row, rank: index + 1 }));

  const summary: BenchmarkSummary = {
    currentMonth,
    pubCount: benchmarks.length,
    portfolioTotal,
    averageSpendPerPub,
    highestSpender: benchmarks[0]?.pubName ?? null,
    lowestSpender: benchmarks[benchmarks.length - 1]?.pubName ?? null,
    highestVariancePercent: benchmarks[0]?.variancePercent ?? 0,
  };

  return { benchmarks, summary };
}

function buildCurrentPubCategoryTotals(
  txs: Transaction[],
  currentMonth: string
): Map<string, Map<string, number>> {
  const map = new Map<string, Map<string, number>>();

  for (const tx of txs) {
    if (monthKey(tx.date) !== currentMonth) continue;
    const category = tx.category || "Uncategorised";
    if (!map.has(tx.pubName)) map.set(tx.pubName, new Map());
    const pubMap = map.get(tx.pubName)!;
    pubMap.set(category, (pubMap.get(category) ?? 0) + tx.amount);
  }

  return map;
}

function buildCategoryAverages(
  txs: Transaction[],
  currentMonth: string,
  pubCount: number
): Map<string, number> {
  const totals = new Map<string, number>();
  if (pubCount <= 0) return totals;

  for (const tx of txs) {
    if (monthKey(tx.date) !== currentMonth) continue;
    const category = tx.category || "Uncategorised";
    totals.set(category, (totals.get(category) ?? 0) + tx.amount);
  }

  for (const [category, total] of totals) {
    totals.set(category, total / pubCount);
  }

  return totals;
}

function strongestCategoryDriver(
  pubTotals: Map<string, number>,
  categoryAverages: Map<string, number>
): { category: string; amount: number } {
  let best = { category: "Mixed spend", amount: 0 };

  for (const [category, amount] of pubTotals) {
    const aboveAverage = amount - (categoryAverages.get(category) ?? 0);
    if (aboveAverage > best.amount) {
      best = { category, amount: aboveAverage };
    }
  }

  if (best.amount > 0) return best;

  for (const [category, amount] of pubTotals) {
    if (amount > best.amount) best = { category, amount };
  }

  return best;
}

function rowsToBenchmarkTransactions(rows: BenchmarkSpendRow[]): Transaction[] {
  return rows
    .map((row) => {
      const date = parseBenchmarkDate(row.date);
      if (!date) return null;

      const supplier = normalizeBenchmarkText(row.supplier, "Unknown");
      return {
        pubName: normalizeBenchmarkText(row.pub ?? row.pub_name, "Unknown"),
        date,
        supplier,
        canonicalSupplier: normalizeBenchmarkText(
          row.canonical_supplier ?? row.canonicalSupplier ?? row.supplier,
          supplier
        ),
        category: normalizeBenchmarkText(row.category, "Uncategorised"),
        amount: Number(row.amount) || 0,
      };
    })
    .filter((row): row is Transaction => row !== null);
}

function parseBenchmarkDate(value: BenchmarkSpendRow["date"]): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const text = String(value ?? "").slice(0, 10);
  if (!text) return null;

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeBenchmarkText(
  value: string | null | undefined,
  fallback: string
): string {
  return String(value ?? fallback).trim() || fallback;
}

function aggregateSpendByPub(
  rows: BenchmarkSpendRow[]
): Record<string, { total: number; transactions: number }> {
  const byPub: Record<string, { total: number; transactions: number }> = {};

  for (const row of rows) {
    const pub = normalizeBenchmarkText(row.pub ?? row.pub_name, "");
    if (!pub) continue;
    if (!byPub[pub]) byPub[pub] = { total: 0, transactions: 0 };
    byPub[pub].total += Number(row.amount) || 0;
    byPub[pub].transactions += 1;
  }

  return byPub;
}

function topAndWorstFromPubTotals(
  pubTotals: Record<string, { total: number }>
): {
  topPub: { pub: string; total: number };
  worstPub: { pub: string; total: number };
} | null {
  const entries = Object.entries(pubTotals);
  if (!entries.length) return null;

  const topPub = entries.reduce(
    (max, [pub, stats]) =>
      stats.total > max.total ? { pub, total: stats.total } : max,
    { pub: "", total: 0 }
  );

  const worstPub = entries.reduce(
    (min, [pub, stats]) =>
      stats.total < min.total ? { pub, total: stats.total } : min,
    { pub: "", total: Infinity }
  );

  if (!topPub.pub || worstPub.total === Infinity) return null;
  return { topPub, worstPub };
}
