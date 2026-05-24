"use client";

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
      <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  sub,
  accent = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "default" | "danger" | "success";
}) {
  const valueColor =
    accent === "danger"
      ? "text-red-400"
      : accent === "success"
        ? "text-emerald-400"
        : "text-white";

  return (
    <div className="rounded-xl border border-zinc-800 bg-[#111113] p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className={`mt-2 text-3xl font-semibold tabular-nums ${valueColor}`}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
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
      className={`rounded-xl border p-5 ${
        highlight
          ? "border-cyan-900/50 bg-cyan-950/20"
          : "border-zinc-800 bg-[#111113]"
      }`}
    >
      <h3 className="text-sm font-medium text-zinc-300">{title}</h3>
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
    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-[#111113]">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-zinc-800/80 last:border-0 hover:bg-zinc-900/50"
            >
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-zinc-300">
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
  const { loadDemo } = useFinance();
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-zinc-800 bg-[#111113] p-12 text-center">
      <p className="text-zinc-400">No spend data loaded.</p>
      <button
        type="button"
        onClick={loadDemo}
        className="mt-4 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-200"
      >
        Load demo data
      </button>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="flex min-h-[200px] items-center justify-center text-sm text-zinc-500">
      Computing insights…
    </div>
  );
}

export function FlagBadge({ flagged }: { flagged: boolean }) {
  if (!flagged) {
    return <span className="text-zinc-600">—</span>;
  }
  return (
    <span className="rounded bg-red-950/60 px-2 py-0.5 text-xs font-medium text-red-400">
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
