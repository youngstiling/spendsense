"use client";

import type { AuditReport } from "@/lib/finance/audit-engine";
import { fmtGbp } from "./format";

export function AuditTrustPanel({ report }: { report: AuditReport | null }) {
  if (!report) return null;

  const { drift, trust, entries } = report;
  const sqlEntry = entries.find((e) => e.source === "SQL");
  const engineEntry = entries.find((e) => e.source === "ENGINE");

  const statusStyles =
    drift.status === "OK"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : drift.status === "DRIFT"
        ? "border-amber-300 bg-amber-50 text-amber-950"
        : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <section className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Audit confidence
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            SQL truth vs engine calculation on{" "}
            <code className="rounded bg-slate-100 px-1">spend_transactions</code>
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold tabular-nums text-turquoise-700">
            {trust}%
          </p>
          <p className="text-xs text-slate-500">Trust score</p>
        </div>
      </div>

      <div
        className={`mt-4 rounded-xl border px-4 py-3 text-sm font-medium ${statusStyles}`}
      >
        {drift.status === "OK" && (
          <span>
            Reconciliation OK — engine matches SQL within 1% (
            {drift.percent?.toFixed(2)}% drift)
          </span>
        )}
        {drift.status === "DRIFT" && (
          <span>
            Drift detected — {drift.percent?.toFixed(2)}% difference (
            {fmtGbp(drift.diff ?? 0)} absolute)
          </span>
        )}
        {drift.status === "INCOMPLETE" && (
          <span>
            Incomplete audit — log in and load Supabase data for SQL comparison
          </span>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-4 py-3">
          <p className="text-xs font-semibold uppercase text-slate-500">SQL</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900">
            {sqlEntry ? fmtGbp(sqlEntry.value) : "—"}
          </p>
          <p className="text-xs text-slate-500">
            {sqlEntry?.rowCount ?? 0} rows
          </p>
        </div>
        <div className="rounded-lg border border-turquoise-100 bg-turquoise-50/50 px-4 py-3">
          <p className="text-xs font-semibold uppercase text-turquoise-800">
            Engine
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900">
            {engineEntry ? fmtGbp(engineEntry.value) : "—"}
          </p>
          <p className="text-xs text-slate-500">
            {engineEntry?.rowCount ?? 0} rows
          </p>
        </div>
      </div>
    </section>
  );
}
