"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SpendTrendSummary } from "@/lib/dashboard-analytics";
import { formatMoneyPrecise } from "./format";

const insightStyles: Record<
  SpendTrendSummary["trendInsight"],
  string
> = {
  Stable: "bg-slate-100 text-slate-800 border-slate-200",
  Increasing: "bg-turquoise-50 text-turquoise-900 border-turquoise-200",
  Decreasing: "bg-amber-50 text-amber-900 border-amber-200",
};

export function SpendTrendPanel({
  summary,
}: {
  summary: SpendTrendSummary | null;
}) {
  if (!summary || summary.trendData.length < 2) return null;

  const chartData = summary.trendData.map((d) => ({
    name: d.date,
    value: d.total,
  }));

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Spend over time
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Daily total — first vs last date in view
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-sm font-semibold ${insightStyles[summary.trendInsight]}`}
        >
          {summary.trendLabel}
          {summary.trendInsight === "Increasing" && " ↑"}
          {summary.trendInsight === "Decreasing" && " ↓"}
        </span>
      </div>
      <div className="mt-6 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "#64748b" }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickFormatter={(v) => `£${(Number(v) / 1000).toFixed(0)}k`}
              width={52}
            />
            <Tooltip
              formatter={(v: number) => [formatMoneyPrecise(v), "Spend"]}
              contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#0891b2"
              strokeWidth={2.5}
              dot={{ fill: "#0891b2", r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
