import { pubsAboveAverageSpend, topPubBySpend } from "@/lib/pub-summary";
import { sumAmount } from "@/lib/sum-amount";
import { measureUncategorised } from "@/lib/uncategorised";

function formatGbp(n: number, fractionDigits = 0) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: fractionDigits,
  }).format(n);
}

export type ChartDatum = { name: string; value: number };

export type InsightRow = {
  amount: number;
  category: string;
  pub?: string;
  date?: string;
};

export type DashboardKpis = {
  totalSpend: number;
  uncategorisedPercent: number;
  topPubName: string;
  topPubSpend: number;
  transactionCount: number;
};

export function computeSpendByPub(rows: InsightRow[]): ChartDatum[] {
  const byPub: Record<string, number> = {};
  for (const row of rows) {
    const pub = row.pub?.trim() || "Unknown";
    byPub[pub] = (byPub[pub] || 0) + row.amount;
  }
  return Object.entries(byPub)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function computeSpendByCategory(rows: InsightRow[]): ChartDatum[] {
  const byCat: Record<string, number> = {};
  for (const row of rows) {
    const cat = row.category?.trim() || "Uncategorised";
    byCat[cat] = (byCat[cat] || 0) + row.amount;
  }
  return Object.entries(byCat)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function computeDashboardKpis(rows: InsightRow[]): DashboardKpis {
  const totalSpend = sumAmount(rows);
  const { percent } = measureUncategorised(rows, totalSpend);
  const topPub = topPubBySpend(rows);

  return {
    totalSpend,
    uncategorisedPercent: percent,
    topPubName: topPub?.pub ?? "—",
    topPubSpend: topPub?.total ?? 0,
    transactionCount: rows.length,
  };
}

/** Same numbers as KPI cards — used by insights panel and console logs. */
export function buildInsightMessages(rows: InsightRow[]): string[] {
  if (!rows.length) return [];

  const kpis = computeDashboardKpis(rows);
  const lines: string[] = [
    `Total spend: ${formatGbp(kpis.totalSpend)}`,
  ];

  if (kpis.topPubName !== "—") {
    lines.push(
      `Top spending pub: ${kpis.topPubName} (${formatGbp(kpis.topPubSpend)})`
    );
  }

  lines.push(
    `Uncategorised spend: ${kpis.uncategorisedPercent.toFixed(1)}% of total (£)`
  );

  const outliers = pubsAboveAverageSpend(rows);
  const topOutlier = outliers[0];
  if (topOutlier) {
    lines.push(
      `⚠️ ${topOutlier.pub} is significantly above average spend`
    );
  }

  return lines;
}
