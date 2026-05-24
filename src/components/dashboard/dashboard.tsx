"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppNav } from "@/components/app-nav";
import { SpendDashboard } from "@/components/dashboard/spend-dashboard";
import { loadDemoRows } from "@/lib/config";
import { enrichTransactions } from "@/lib/brand-category";
import type { Row } from "@/lib/csv";

function enrichLoaded(rows: Row[]): Row[] {
  if (!rows.length) return [];
  try {
    return enrichTransactions(rows);
  } catch {
    return rows.map((r) => ({
      ...r,
      month: r.date.slice(0, 7),
      pub: r.pub ?? "Unknown",
      canonicalSupplier: r.supplier,
    }));
  }
}

export default function Dashboard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setRows(loadDemoRows());
    setReady(true);
  }, []);

  const enrichedData = useMemo(() => enrichLoaded(rows), [rows]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AppNav
          active="dashboard"
          action={
            <Link
              href="/import"
              className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 hover:shadow"
            >
              + Import CSV
            </Link>
          }
        />

        {!ready ? (
          <div className="mt-8 flex min-h-[320px] items-center justify-center">
            <p className="text-sm text-slate-500">Loading…</p>
          </div>
        ) : enrichedData.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">No spend data yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              Import a CSV to see totals, charts, and savings insights. Nothing is
              pre-loaded — your numbers appear after you upload.
            </p>
            <Link
              href="/import"
              className="mt-6 inline-flex rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
            >
              Import CSV
            </Link>
          </div>
        ) : (
          <SpendDashboard enrichedData={enrichedData} />
        )}
      </div>
    </div>
  );
}
