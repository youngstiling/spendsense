"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartDatum } from "@/lib/dashboard-analytics";
import type { PubSpendOutlier } from "@/lib/pub-summary";
import type { SupplierSavingsRow } from "@/lib/savings-opportunity";
import { formatMoney, formatMoneyPrecise } from "./format";

export function MonthlySpendChart({ data }: { data: ChartDatum[] }) {
  if (data.length < 2) return null;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">Spend over time</h3>
      <p className="mt-1 text-sm text-slate-500">Monthly total spend trend</p>
      <div className="mt-6 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
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
              dot={{ fill: "#0891b2", r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function TopSuppliersTable({ data }: { data: ChartDatum[] }) {
  if (!data.length) return null;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">Top suppliers</h3>
      <p className="mt-1 text-sm text-slate-500">By total spend</p>
      <ul className="mt-4 divide-y divide-slate-100">
        {data.slice(0, 10).map((item, i) => (
          <li key={item.name} className="flex items-center gap-3 py-3 text-sm">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">
              {i + 1}
            </span>
            <span className="min-w-0 flex-1 truncate font-medium text-slate-900">
              {item.name}
            </span>
            <span className="tabular-nums text-slate-600">{formatMoney(item.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HighSpendPubsPanel({ pubs }: { pubs: PubSpendOutlier[] }) {
  if (!pubs.length) return null;

  return (
    <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-6 shadow-sm">
      <h3 className="text-base font-semibold text-amber-950">High-spend pubs</h3>
      <p className="mt-1 text-sm text-amber-900/80">
        Sites spending more than 1.3× the average pub
      </p>
      <ul className="mt-4 space-y-2">
        {pubs.slice(0, 5).map((p) => (
          <li
            key={p.pub}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/80 px-3 py-2 text-sm"
          >
            <span className="font-medium text-slate-900">{p.pub}</span>
            <span className="text-slate-600">
              {formatMoney(p.total)}
              <span className="ml-2 text-amber-800">
                +{p.overAvgPct.toFixed(0)}% vs avg
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SavingsPanel({ rows }: { rows: SupplierSavingsRow[] }) {
  if (!rows.length) return null;

  return (
    <div className="rounded-2xl border border-turquoise-200/80 bg-turquoise-50/40 p-6 shadow-sm">
      <h3 className="text-base font-semibold text-turquoise-950">Price inconsistency savings</h3>
      <p className="mt-1 text-sm text-turquoise-900/80">
        Same supplier, different amounts — negotiation opportunities
      </p>
      <ul className="mt-4 space-y-2">
        {rows.slice(0, 5).map((r) => (
          <li
            key={r.supplier}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/80 px-3 py-2 text-sm"
          >
            <span className="font-medium text-slate-900">{r.supplier}</span>
            <span className="text-turquoise-800">
              {formatMoney(r.potentialSavings)} potential · {r.transactions} txns
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
