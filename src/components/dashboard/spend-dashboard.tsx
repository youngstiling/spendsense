"use client";

import dynamic from "next/dynamic";
import { format, parseISO } from "date-fns";
import { useMemo, useState } from "react";
import { generateInsights } from "@/lib/brand-category";
import type { Row } from "@/lib/csv";
import {
  computeBeerVsFood,
  computeDashboardKpis,
  computeSpendByCategory,
  computeSpendByMonth,
  computeSpendByPub,
  computeSpendTrendByDate,
  computeWeeklySpendTrend,
  computeSpendBySupplier,
  filterRowsByPub,
  listPubNames,
} from "@/lib/dashboard-analytics";
import { computePubPerformance, pubsAboveAverageSpend } from "@/lib/pub-summary";
import { calculateSavingsOpportunity } from "@/lib/savings-opportunity";
import { downloadSpendCsv } from "./export-csv";
import { formatMoney, formatMoneyPrecise } from "./format";
import {
  HighSpendPubsPanel,
  MonthlySpendChart,
  SavingsPanel,
  TopSuppliersTable,
} from "./dashboard-extras";
import { InsightsPanel } from "./insights-panel";
import { KPICard } from "./kpi-card";
import { BeerVsFoodPanel } from "./beer-vs-food-panel";
import { PubPerformancePanel } from "./pub-performance-panel";
import { SpendTrendPanel } from "./spend-trend-panel";

const SpendCharts = dynamic(
  () => import("./spend-charts").then((m) => m.SpendCharts),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="h-96 animate-pulse rounded-2xl bg-slate-100 lg:col-span-3" />
        <div className="h-96 animate-pulse rounded-2xl bg-slate-100 lg:col-span-2" />
      </div>
    ),
  }
);

export function SpendDashboard({ enrichedData }: { enrichedData: Row[] }) {
  const [pubFilter, setPubFilter] = useState("all");

  const pubNames = useMemo(() => listPubNames(enrichedData), [enrichedData]);

  const scoped = useMemo(
    () => filterRowsByPub(enrichedData, pubFilter),
    [enrichedData, pubFilter]
  );

  const kpis = useMemo(() => computeDashboardKpis(scoped), [scoped]);
  const pubData = useMemo(() => computeSpendByPub(scoped), [scoped]);
  const categoryData = useMemo(() => computeSpendByCategory(scoped), [scoped]);
  const monthData = useMemo(() => computeSpendByMonth(scoped), [scoped]);
  const supplierData = useMemo(() => computeSpendBySupplier(scoped), [scoped]);
  const highSpendPubs = useMemo(() => pubsAboveAverageSpend(scoped), [scoped]);
  const insights = useMemo(() => generateInsights(scoped), [scoped]);
  const savings = useMemo(
    () =>
      calculateSavingsOpportunity(
        scoped.map((r) => ({
          supplier: r.supplier,
          amount: r.amount,
          pub: r.pub,
        })),
        pubFilter !== "all" ? { pub: pubFilter } : undefined
      ),
    [scoped, pubFilter]
  );

  const pubPerformance = useMemo(
    () => computePubPerformance(scoped, kpis.totalSpend),
    [scoped, kpis.totalSpend]
  );

  const beerVsFood = useMemo(
    () => computeBeerVsFood(scoped, kpis.totalSpend),
    [scoped, kpis.totalSpend]
  );

  const spendTrend = useMemo(() => computeSpendTrendByDate(scoped), [scoped]);
  const weeklyTrend = useMemo(() => computeWeeklySpendTrend(scoped), [scoped]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-turquoise-700">Portfolio overview</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Spend intelligence
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {kpis.transactionCount.toLocaleString()} transactions · {kpis.pubCount}{" "}
            pub{kpis.pubCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {pubNames.length > 1 && (
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <span className="font-medium">Pub</span>
              <select
                value={pubFilter}
                onChange={(e) => setPubFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm"
              >
                <option value="all">All pubs</option>
                {pubNames.map((pub) => (
                  <option key={pub} value={pub}>
                    {pub}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            type="button"
            onClick={() => downloadSpendCsv(scoped)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Export CSV
          </button>
        </div>
      </header>

      <section className="space-y-4">
        <KPICard
          label="Total spend"
          value={formatMoney(kpis.totalSpend)}
          sublabel={pubFilter === "all" ? "All pubs" : pubFilter}
          accent="turquoise"
          featured
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        <KPICard
          label="Uncategorised"
          value={`${kpis.uncategorisedPercent.toFixed(1)}%`}
          sublabel="% of spend in £"
          accent={kpis.uncategorisedPercent > 10 ? "amber" : "turquoise"}
        />
        <KPICard
          label="Top pub"
          value={kpis.topPubName}
          sublabel={
            kpis.topPubSpend > 0 ? formatMoneyPrecise(kpis.topPubSpend) : undefined
          }
          accent="indigo"
        />
        <KPICard
          label="Top supplier"
          value={kpis.topSupplierName}
          sublabel={
            kpis.topSupplierSpend > 0
              ? formatMoneyPrecise(kpis.topSupplierSpend)
              : undefined
          }
          accent="indigo"
        />
        <KPICard
          label="Avg transaction"
          value={formatMoney(kpis.avgTransaction)}
          sublabel={`${kpis.transactionCount} rows`}
          accent="turquoise"
        />
        <KPICard
          label="Savings signal"
          value={formatMoney(kpis.potentialSavings)}
          sublabel="Price inconsistency estimate"
          accent={kpis.potentialSavings > 0 ? "amber" : "turquoise"}
        />
        </div>
      </section>

      <PubPerformancePanel performance={pubPerformance} />

      <BeerVsFoodPanel comparison={beerVsFood} />

      <SpendTrendPanel summary={spendTrend} />

      <SpendTrendPanel
        summary={weeklyTrend}
        title="Weekly spend"
        subtitle="Monday-start weeks — first vs last week in view"
        formatLabel={(week) => {
          try {
            return `w/c ${format(parseISO(week), "d MMM")}`;
          } catch {
            return week;
          }
        }}
      />

      <SpendCharts
        pubData={pubData}
        categoryData={categoryData}
        topPubName={kpis.topPubName}
      />

      <MonthlySpendChart data={monthData} />

      <div className="grid gap-6 lg:grid-cols-2">
        <TopSuppliersTable data={supplierData} />
        <div className="space-y-6">
          <HighSpendPubsPanel pubs={highSpendPubs} />
          <SavingsPanel rows={savings.bySupplier} />
        </div>
      </div>

      <InsightsPanel insights={insights} />

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Recent transactions</h2>
          <span className="text-xs text-slate-500">
            Latest {Math.min(50, scoped.length)}
          </span>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Pub</th>
                  <th className="px-5 py-3.5">Supplier</th>
                  <th className="px-5 py-3.5">Description</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {scoped.slice(0, 50).map((row, i) => (
                  <tr
                    key={`${row.date}-${row.supplier}-${i}`}
                    className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/80"
                  >
                    <td className="px-5 py-3.5 text-slate-600">{row.date}</td>
                    <td className="max-w-[120px] truncate px-5 py-3.5 text-slate-700">
                      {row.pub ?? "—"}
                    </td>
                    <td className="max-w-[140px] truncate px-5 py-3.5 font-medium text-slate-900">
                      {row.supplier}
                    </td>
                    <td className="max-w-[160px] truncate px-5 py-3.5 text-slate-600">
                      {row.description ?? "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                        {row.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-slate-900">
                      {formatMoneyPrecise(row.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
