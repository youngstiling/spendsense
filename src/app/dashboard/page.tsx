"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AppNav } from "@/components/app-nav";
import { SpendDashboard } from "@/components/dashboard/spend-dashboard";
import { DeleteDataButton } from "@/components/delete-data-button";
import type { Row } from "@/lib/csv";
import {
  hasDemoRows,
  isDemoModeClient,
  loadDemoRows,
  normalizeRows,
  replaceDemoRows,
} from "@/lib/config";
import { parseSpendCsvText } from "@/lib/csv";
import { enrichTransactions, generateInsights } from "@/lib/brand-category";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const pathname = usePathname();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadingSample, setLoadingSample] = useState(false);
  const demo = isDemoModeClient();

  const refreshDemoRows = useCallback(() => {
    setRows(loadDemoRows());
    setError("");
  }, []);

  const loadSampleData = useCallback(async () => {
    setLoadingSample(true);
    setError("");
    try {
      const res = await fetch("/spend_template.csv");
      if (!res.ok) throw new Error("Could not load sample CSV.");
      const text = await res.text();
      const { rows: parsed, error: parseError } = parseSpendCsvText(text);
      if (parseError) throw new Error(parseError);
      if (!parsed.length) throw new Error("Sample file had no valid rows.");
      replaceDemoRows(parsed);
      refreshDemoRows();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not load sample.");
    } finally {
      setLoadingSample(false);
    }
  }, [refreshDemoRows]);

  useEffect(() => {
    if (demo) {
      refreshDemoRows();
      if (!hasDemoRows()) {
        setLoading(true);
        void loadSampleData().finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
      const onFocus = () => refreshDemoRows();
      window.addEventListener("focus", onFocus);
      return () => window.removeEventListener("focus", onFocus);
    }

    let cancelled = false;

    (async () => {
      try {
        const supabase = createClient();
        const { data, error: err } = await supabase
          .from("spend_transactions")
          .select("date, supplier, canonical_supplier, category, amount")
          .order("date", { ascending: false });

        if (cancelled) return;

        if (err) setError(err.message);
        else
          setRows(
            normalizeRows(
              (data ?? []).map((r) => ({
                date: r.date,
                supplier: r.supplier,
                supplierRaw: r.supplier,
                canonicalSupplier: r.canonical_supplier ?? undefined,
                category: r.category,
                amount: Number(r.amount),
              }))
            )
          );
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not load spend data."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [demo, pathname, refreshDemoRows, loadSampleData]);

  const analytics = useMemo(() => {
    if (!rows.length) {
      return { enrichedData: [] as Row[], insights: [] as string[] };
    }
    try {
      const enrichedData = enrichTransactions(rows);
      return {
        enrichedData,
        insights: generateInsights(enrichedData),
      };
    } catch (err: unknown) {
      console.error("Dashboard analytics error:", err);
      return { enrichedData: rows, insights: [] as string[] };
    }
  }, [rows]);

  const shell = (children: ReactNode) => (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AppNav
          active="dashboard"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <DeleteDataButton
                compact
                onDeleted={() => {
                  setRows([]);
                  setError("");
                }}
              />
              <Link
                href="/import"
                className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 hover:shadow"
              >
                + Import CSV
              </Link>
            </div>
          }
        />
        {children}
      </div>
    </div>
  );

  if (loading) {
    return shell(
      <>
        <p className="mb-6 text-sm text-slate-500">Loading dashboard…</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-2xl border border-slate-200/80 bg-white"
            />
          ))}
        </div>
        <div className="mt-6 h-96 animate-pulse rounded-2xl bg-slate-100" />
      </>
    );
  }

  if (error && !rows.length) {
    return shell(
      <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 shadow-sm">
        <p className="font-semibold">Dashboard could not load data</p>
        <p className="mt-1 text-sm">{error}</p>
        <Link
          href="/import"
          className="mt-4 inline-block rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
        >
          Go to Import
        </Link>
      </div>
    );
  }

  if (!rows.length) {
    return shell(
      <>
        {demo && (
          <div className="mb-6 rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Demo mode — no data in this browser yet. Load a sample or import a CSV.
          </div>
        )}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-10 text-center shadow-sm">
          <p className="text-xl font-semibold text-slate-900">No spend data yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Upload a CSV with date, pub, supplier, description, and amount to unlock
            KPIs, charts, and insights.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/import"
              className="rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
            >
              Import CSV
            </Link>
            {demo && (
              <button
                type="button"
                onClick={loadSampleData}
                disabled={loadingSample}
                className="rounded-xl border border-teal-600 px-6 py-2.5 text-sm font-semibold text-teal-700 hover:bg-teal-50 disabled:opacity-50"
              >
                {loadingSample ? "Loading…" : "Load sample data"}
              </button>
            )}
          </div>
        </div>
      </>
    );
  }

  return shell(
    <>
      {demo && (
        <div className="mb-6 rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-2.5 text-sm text-amber-950">
          Demo mode — data stored in this browser only.
        </div>
      )}
      {error && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          {error}
        </div>
      )}
      <SpendDashboard
        enrichedData={analytics.enrichedData}
        insights={analytics.insights}
      />
    </>
  );
}
