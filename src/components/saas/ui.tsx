"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useFinance } from "./finance-provider";
import { fmtGbp } from "./format";

export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        {title}
      </h1>
      {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  sub,
  accent = "default",
  featured = false,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "default" | "danger" | "success" | "turquoise";
  featured?: boolean;
}) {
  if (featured) {
    return (
      <div className="rounded-2xl border border-turquoise-700 bg-gradient-to-br from-turquoise-600 to-turquoise-700 p-6 shadow-lg shadow-turquoise-900/20">
        <p className="text-xs font-bold uppercase tracking-widest text-turquoise-100">
          {label}
        </p>
        <p className="mt-2 text-3xl font-bold tabular-nums text-white sm:text-4xl">
          {value}
        </p>
        {sub && (
          <p className="mt-2 text-sm text-turquoise-100/80">{sub}</p>
        )}
      </div>
    );
  }

  const valueColor =
    accent === "danger"
      ? "text-red-600"
      : accent === "success"
        ? "text-emerald-600"
        : accent === "turquoise"
          ? "text-turquoise-700"
          : "text-slate-900";

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className={`mt-2 text-3xl font-semibold tabular-nums ${valueColor}`}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export function InsightCard({
  title,
  children,
  highlight,
}: {
  title: string;
  children: ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${
        highlight
          ? "border-turquoise-200 bg-gradient-to-br from-turquoise-50 to-white ring-1 ring-turquoise-500/10"
          : "border-slate-200/80 bg-white ring-1 ring-slate-900/5"
      }`}
    >
      <h3
        className={`text-sm font-semibold ${
          highlight ? "text-turquoise-800" : "text-slate-700"
        }`}
      >
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | ReactNode)[][];
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500">
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-slate-100 last:border-0 hover:bg-turquoise-50/30"
            >
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-slate-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-turquoise-700">
          First step
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">
          Upload spend data to unlock the engines
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          SpendSense needs a CSV with date, supplier, amount, category, and pub
          columns. Once uploaded, the dashboard will calculate benchmarks,
          overspend, supplier inflation, budget variance, and financial risks.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/upload"
            className="rounded-xl bg-turquoise-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-turquoise-700"
          >
            Upload CSV
          </Link>
          <Link
            href="/import"
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Advanced import
          </Link>
        </div>
        <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
          {[
            ["1", "Upload", "Drop in supplier spend rows."],
            ["2", "Map", "We clean dates, amounts, and suppliers."],
            ["3", "Act", "See the pubs and costs to review first."],
          ].map(([step, title, copy]) => (
            <div key={step} className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold text-turquoise-700">Step {step}</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{copy}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="flex min-h-[200px] items-center justify-center text-sm text-slate-500">
      Computing insights…
    </div>
  );
}

export function FlagBadge({ flagged }: { flagged: boolean }) {
  if (!flagged) {
    return <span className="text-slate-400">—</span>;
  }
  return (
    <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-200">
      Flagged
    </span>
  );
}

export function useEngineReady() {
  const { ready, loading, engine, transactionCount } = useFinance();
  const hasData = transactionCount > 0 && engine !== null;
  return { ready, loading, engine, hasData };
}

export { fmtGbp };
