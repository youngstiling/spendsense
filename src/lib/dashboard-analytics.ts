import { pubsAboveAverageSpend, topPubBySpend } from "@/lib/pub-summary";
import { calculateSavingsOpportunity } from "@/lib/savings-opportunity";
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
  month?: string;
  supplier?: string;
};

export type DashboardKpis = {
  totalSpend: number;
  uncategorisedPercent: number;
  topPubName: string;
  topPubSpend: number;
  transactionCount: number;
  avgTransaction: number;
  pubCount: number;
  potentialSavings: number;
  topSupplierName: string;
  topSupplierSpend: number;
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

export function computeSpendByMonth(rows: InsightRow[]): ChartDatum[] {
  const byMonth: Record<string, number> = {};
  for (const row of rows) {
    const month =
      row.month?.trim() ||
      (row.date && /^\d{4}-\d{2}/.test(row.date) ? row.date.slice(0, 7) : "Unknown");
    byMonth[month] = (byMonth[month] || 0) + row.amount;
  }
  return Object.entries(byMonth)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function computeSpendBySupplier(rows: InsightRow[]): ChartDatum[] {
  const bySupplier: Record<string, number> = {};
  for (const row of rows) {
    const name = row.supplier?.trim() || "Unknown";
    bySupplier[name] = (bySupplier[name] || 0) + row.amount;
  }
  return Object.entries(bySupplier)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function listPubNames(rows: InsightRow[]): string[] {
  const pubs = new Set<string>();
  for (const row of rows) {
    pubs.add(row.pub?.trim() || "Unknown");
  }
  return [...pubs].sort((a, b) => a.localeCompare(b));
}

export function filterRowsByPub<T extends InsightRow>(rows: T[], pub: string): T[] {
  if (!pub || pub === "all") return rows;
  const needle = pub.toLowerCase();
  return rows.filter((r) => (r.pub?.trim() || "Unknown").toLowerCase() === needle);
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
  const suppliers = computeSpendBySupplier(rows);
  const savings = calculateSavingsOpportunity(
    rows.map((r) => ({
      supplier: r.supplier ?? "Unknown",
      amount: r.amount,
      pub: r.pub,
    }))
  );
  const pubCount = new Set(rows.map((r) => r.pub?.trim() || "Unknown")).size;

  return {
    totalSpend,
    uncategorisedPercent: percent,
    topPubName: topPub?.pub ?? "—",
    topPubSpend: topPub?.total ?? 0,
    transactionCount: rows.length,
    avgTransaction: rows.length ? totalSpend / rows.length : 0,
    pubCount,
    potentialSavings: savings.totalSavings,
    topSupplierName: suppliers[0]?.name ?? "—",
    topSupplierSpend: suppliers[0]?.value ?? 0,
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

  const kpisFull = computeDashboardKpis(rows);
  if (kpisFull.potentialSavings > 0) {
    lines.push(
      `⚠️ Potential savings from price inconsistencies: ${formatGbp(kpisFull.potentialSavings)}`
    );
  }

  if (kpisFull.topSupplierName !== "—") {
    lines.push(
      `Top supplier: ${kpisFull.topSupplierName} (${formatGbp(kpisFull.topSupplierSpend)})`
    );
  }

  if (kpisFull.transactionCount > 0) {
    lines.push(
      `Average transaction: ${formatGbp(kpisFull.avgTransaction)} across ${kpisFull.pubCount} pub(s)`
    );
  }

  return lines;
}
