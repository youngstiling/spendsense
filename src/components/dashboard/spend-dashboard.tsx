"use client";

import dynamic from "next/dynamic";
import type { Row } from "@/lib/csv";
import {
  computeDashboardKpis,
  computeSpendByCategory,
  computeSpendByPub,
} from "@/lib/dashboard-analytics";
import { formatMoney, formatMoneyPrecise } from "./format";
import { InsightsPanel } from "./insights-panel";
import { KPICard } from "./kpi-card";

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

export function SpendDashboard({
  enrichedData,
  insights,
}: {
  enrichedData: Row[];
  insights: string[];
}) {
  const kpis = computeDashboardKpis(enrichedData);
  const pubData = computeSpendByPub(enrichedData);
  const categoryData = computeSpendByCategory(enrichedData);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">Portfolio overview</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Spend intelligence
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {kpis.transactionCount.toLocaleString()} transactions analysed
          </p>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KPICard
          label="Total spend"
          value={formatMoney(kpis.totalSpend)}
          sublabel="Across all pubs and categories"
          accent="teal"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
        <KPICard
          label="Uncategorised"
          value={`${kpis.uncategorisedPercent.toFixed(1)}%`}
          sublabel={
            kpis.uncategorisedPercent > 10
              ? "Above 10% of spend — review rules or CSV categories"
              : "% of total spend in £"
          }
          accent={kpis.uncategorisedPercent > 10 ? "amber" : "teal"}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
          }
        />
        <KPICard
          label="Top spending pub"
          value={kpis.topPubName}
          sublabel={
            kpis.topPubSpend > 0
              ? `${formatMoneyPrecise(kpis.topPubSpend)} total spend`
              : "No pub data in import"
          }
          accent="indigo"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          }
        />
      </section>

      <SpendCharts
        pubData={pubData}
        categoryData={categoryData}
        topPubName={kpis.topPubName}
      />

      <InsightsPanel insights={insights} />

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Recent transactions</h2>
          <span className="text-xs text-slate-500">
            Latest {Math.min(50, enrichedData.length)}
          </span>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Pub</th>
                  <th className="px-5 py-3.5">Supplier</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {enrichedData.slice(0, 50).map((row, i) => (
                  <tr
                    key={`${row.date}-${row.supplier}-${i}`}
                    className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/80"
                  >
                    <td className="px-5 py-3.5 text-slate-600">{row.date}</td>
                    <td className="max-w-[140px] truncate px-5 py-3.5 text-slate-700">
                      {row.pub ?? "—"}
                    </td>
                    <td className="max-w-[160px] truncate px-5 py-3.5 font-medium text-slate-900">
                      {row.supplier}
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
