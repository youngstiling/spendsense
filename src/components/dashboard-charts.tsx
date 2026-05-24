"use client";

import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CHART_COLORS = ["#0d9488", "#0891b2", "#6366f1", "#8b5cf6", "#f59e0b", "#ec4899"];

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 2,
  }).format(n);
}

function moneyTooltip(value: number | string) {
  const n = typeof value === "number" ? value : Number(value);
  return [formatMoney(n), "Spend"];
}

export function DashboardCharts({
  catData,
  supData,
  monthData,
}: {
  catData: { name: string; value: number }[];
  supData: { name: string; value: number }[];
  monthData: { month: string; value: number }[];
}) {
  const hasCharts =
    catData.length > 0 || supData.length > 0 || monthData.length > 0;

  if (!hasCharts) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Not enough data to draw charts yet.
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm h-72 min-h-[288px]">
        <p className="text-sm font-medium text-slate-700 mb-3">By category</p>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={catData.length ? catData : [{ name: "—", value: 1 }]}
              dataKey="value"
              nameKey="name"
              innerRadius={45}
              outerRadius={75}
              paddingAngle={2}
            >
              {catData.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={moneyTooltip} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm h-72 min-h-[288px]">
        <p className="text-sm font-medium text-slate-700 mb-3">Top suppliers</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={supData} layout="vertical" margin={{ left: 8 }}>
            <XAxis type="number" tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 11 }} />
            <Tooltip formatter={moneyTooltip} />
            <Bar dataKey="value" fill="#0d9488" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm h-72 min-h-[288px] lg:col-span-2">
        <p className="text-sm font-medium text-slate-700 mb-3">Monthly spend</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={monthData}>
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={moneyTooltip} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#0d9488"
              strokeWidth={2}
              dot={{ fill: "#0d9488", r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
