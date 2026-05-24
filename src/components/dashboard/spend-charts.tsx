"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartDatum } from "@/lib/dashboard-analytics";
import { formatMoney, formatMoneyPrecise } from "./format";

const CATEGORY_COLORS = [
  "#0d9488",
  "#0891b2",
  "#6366f1",
  "#8b5cf6",
  "#f59e0b",
  "#ec4899",
  "#14b8a6",
  "#64748b",
];

const PUB_BAR_DEFAULT = "#94a3b8";
const PUB_BAR_HIGHLIGHT = "#0d9488";

function moneyTooltip(value: number | string) {
  const n = typeof value === "number" ? value : Number(value);
  return [formatMoneyPrecise(n), "Spend"];
}

function truncateLabel(name: string, max = 18) {
  return name.length > max ? `${name.slice(0, max)}…` : name;
}

export function SpendCharts({
  pubData,
  categoryData,
  topPubName,
}: {
  pubData: ChartDatum[];
  categoryData: ChartDatum[];
  /** Matches KPI “top pub” — that bar is highlighted in teal. */
  topPubName?: string;
}) {
  const pubChart = pubData;

  const highlightName = topPubName && topPubName !== "—" ? topPubName : pubChart[0]?.name;

  if (!pubChart.length && !categoryData.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
        Import transactions to see spend charts.
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm lg:col-span-3">
        <div className="mb-6">
          <h3 className="text-base font-semibold text-slate-900">Spend by pub</h3>
          <p className="mt-1 text-sm text-slate-500">
            Total spend per site — highest bar highlighted
          </p>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={pubChart.slice(0, 12)}
              margin={{ top: 8, right: 8, left: 0, bottom: 48 }}
            >
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickFormatter={(v) => truncateLabel(String(v), 14)}
                interval={0}
                angle={-32}
                textAnchor="end"
                height={64}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickFormatter={(v) => `£${(Number(v) / 1000).toFixed(0)}k`}
                width={52}
              />
              <Tooltip
                formatter={moneyTooltip}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
                {pubChart.slice(0, 12).map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={
                      entry.name === highlightName
                        ? PUB_BAR_HIGHLIGHT
                        : PUB_BAR_DEFAULT
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm lg:col-span-2">
        <div className="mb-6">
          <h3 className="text-base font-semibold text-slate-900">Spend by category</h3>
          <p className="mt-1 text-sm text-slate-500">Share of total spend</p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                innerRadius="58%"
                outerRadius="88%"
                paddingAngle={2}
                stroke="none"
              >
                {categoryData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={moneyTooltip}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2">
          {categoryData.slice(0, 8).map((item, i) => (
            <li key={item.name} className="flex items-center gap-2 text-xs">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                }}
              />
              <span className="truncate text-slate-600">{item.name}</span>
              <span className="ml-auto tabular-nums text-slate-400">
                {formatMoney(item.value)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
