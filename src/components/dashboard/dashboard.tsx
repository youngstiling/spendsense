"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppNav } from "@/components/app-nav";
import { SpendDashboard } from "@/components/dashboard/spend-dashboard";
import {
  clearStoredRows,
  loadQuickDemoRows,
  loadStoredRows,
  replaceDemoRows,
} from "@/lib/config";
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

  const refreshFromStorage = useCallback(() => {
    setRows(loadStoredRows());
  }, []);

  useEffect(() => {
    refreshFromStorage();
    setReady(true);
  }, [refreshFromStorage]);

  const loadDemoData = () => {
    const demo = loadQuickDemoRows();
    replaceDemoRows(demo);
    setRows(demo);
  };

  const clearData = () => {
    clearStoredRows();
    setRows([]);
  };

  const enrichedData = useMemo(() => enrichLoaded(rows), [rows]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AppNav
          active="dashboard"
          action={
            <Link
              href="/import"
              className="rounded-xl bg-turquoise-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-turquoise-700 hover:shadow"
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
            <h1 className="text-2xl font-semibold text-slate-900">
              Spend intelligence
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-slate-600">
              No data yet. Start with demo data or upload a CSV.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={loadDemoData}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                Load demo data
              </button>
              <Link
                href="/import"
                className="inline-flex rounded-xl border border-turquoise-200 bg-turquoise-50 px-5 py-2.5 text-sm font-semibold text-turquoise-900 transition hover:bg-turquoise-100"
              >
                Import CSV
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={clearData}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Clear data
              </button>
            </div>
            <SpendDashboard enrichedData={enrichedData} />
          </>
        )}
      </div>
    </div>
  );
}
