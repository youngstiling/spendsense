/**
 * Insight engine — metrics, benchmarks, anomalies, and signals.
 * Uses spend_transactions shape: pub (not pub_name), amount, date, supplier, category.
 */

import { computeLegacyPubBenchmarks } from "@/lib/finance/engines/benchmark";
import type { LegacyPubBenchmark } from "@/lib/finance/engines/benchmark";

export type InsightRow = {
  pub: string;
  date: string;
  supplier: string;
  category: string;
  amount: number;
};

type RawSpendRow = {
  pub?: string | null;
  pub_name?: string | null;
  date?: string | null;
  supplier?: string | null;
  canonical_supplier?: string | null;
  canonicalSupplier?: string | null;
  category?: string | null;
  amount?: number | string | null;
};

export type InsightMetrics = {
  totalSpend: number;
  spendPerPub: number;
  categoryTotals: Record<string, number>;
  pubCount: number;
};

export type PubBenchmark = LegacyPubBenchmark;

export type SpendAnomaly = {
  pub: string;
  date: string;
  supplier: string;
  amount: number;
  issue: string;
};

/** Safe normalisation from DB rows, app Row, or legacy pub_name. */
export function normaliseInsightRows(rows: RawSpendRow[]): InsightRow[] {
  return rows.map((r) => ({
    pub:
      String(r.pub ?? r.pub_name ?? "Unknown").trim() || "Unknown",
    date: String(r.date ?? ""),
    supplier:
      String(
        r.canonical_supplier ?? r.canonicalSupplier ?? r.supplier ?? "Unknown"
      ).trim() || "Unknown",
    category:
      String(r.category ?? "uncategorised").trim() || "uncategorised",
    amount: Number(r.amount) || 0,
  }));
}

export function computeInsightMetrics(data: InsightRow[]): InsightMetrics {
  const totalSpend = data.reduce((sum, r) => sum + r.amount, 0);
  const pubs = [...new Set(data.map((r) => r.pub))];
  const spendPerPub = pubs.length ? totalSpend / pubs.length : 0;

  const categoryTotals: Record<string, number> = {};
  for (const r of data) {
    categoryTotals[r.category] = (categoryTotals[r.category] || 0) + r.amount;
  }

  return {
    totalSpend,
    spendPerPub,
    categoryTotals,
    pubCount: pubs.length,
  };
}

/** Legacy wrapper around the canonical Spend Pattern Benchmark engine. */
export function benchmarkPubs(data: InsightRow[]): PubBenchmark[] {
  return computeLegacyPubBenchmarks(data);
}

export function detectSpendAnomalies(
  data: InsightRow[],
  multiplier = 2.5
): SpendAnomaly[] {
  if (!data.length) return [];

  const avg = data.reduce((sum, r) => sum + r.amount, 0) / data.length;
  const threshold = avg * multiplier;

  return data
    .filter((r) => r.amount > threshold)
    .sort((a, b) => b.amount - a.amount)
    .map((r) => ({
      pub: r.pub,
      date: r.date,
      supplier: r.supplier,
      amount: r.amount,
      issue: "High spend anomaly",
    }));
}

export function generateInsightSignals(
  metrics: InsightMetrics,
  benchmark: PubBenchmark[]
): string[] {
  if (!benchmark.length) {
    return ["Import spend data or load demo data to generate insights."];
  }

  const top = benchmark[0];
  const bottom = benchmark[benchmark.length - 1];
  const signals: string[] = [
    `${top.pub} is the highest spender at £${Math.round(top.total).toLocaleString("en-GB")}.`,
    `${bottom.pub} is the lowest spender at £${Math.round(bottom.total).toLocaleString("en-GB")}.`,
    `Average spend per pub is £${Math.round(metrics.spendPerPub).toLocaleString("en-GB")} across ${metrics.pubCount} site${metrics.pubCount === 1 ? "" : "s"}.`,
  ];

  if (top.vsAvg > 20) {
    signals.push(
      `${top.pub} is ${top.vsAvg.toFixed(0)}% above the portfolio average — review supplier mix.`
    );
  }

  const topCategory = Object.entries(metrics.categoryTotals).sort(
    (a, b) => b[1] - a[1]
  )[0];
  if (topCategory) {
    signals.push(
      `${topCategory[0]} is the largest category at £${Math.round(topCategory[1]).toLocaleString("en-GB")}.`
    );
  }

  return signals;
}

/** Run full insight pipeline on normalised rows. */
export function runInsightEngine(data: InsightRow[]) {
  const metrics = computeInsightMetrics(data);
  const benchmark = benchmarkPubs(data);
  const anomalies = detectSpendAnomalies(data);
  const insights = generateInsightSignals(metrics, benchmark);

  return { metrics, benchmark, anomalies, insights };
}
