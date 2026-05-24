"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AppNav } from "@/components/app-nav";
import { SpendDashboard } from "@/components/dashboard/spend-dashboard";
import { DeleteDataButton } from "@/components/delete-data-button";
import type { Row } from "@/lib/csv";
import {
  hasDemoRows,
  isDemoModeClient,
  loadDemoRows,
  replaceDemoRows,
} from "@/lib/config";
import { parseSpendCsvText } from "@/lib/csv";
import { enrichTransactions } from "@/lib/brand-category";
import {
  rowsFromSpendTransactions,
  SPEND_TRANSACTIONS_TABLE,
} from "@/lib/spend-transaction-db";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardPage() {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);
  const demo = isDemoModeClient();

  const loadSampleData = useCallback(async () => {
    setLoadingSample(true);
    try {
      const res = await fetch("/spend_template.csv");
      if (!res.ok) throw new Error("Could not load sample CSV.");
      const text = await res.text();
      const { rows: parsed, error: parseError } = parseSpendCsvText(text);
      if (parseError) throw new Error(parseError);
      if (!parsed.length) throw new Error("Sample file had no valid rows.");
      replaceDemoRows(parsed);
      setData(loadDemoRows());
      setError(false);
    } catch (err) {
      console.error("DATA ERROR:", err);
      setError(true);
    } finally {
      setLoadingSample(false);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(false);

      try {
        if (demo) {
          let rows = loadDemoRows();
          if (!rows.length && !hasDemoRows()) {
            const res = await fetch("/spend_template.csv");
            if (res.ok) {
              const text = await res.text();
              const { rows: parsed } = parseSpendCsvText(text);
              if (parsed.length) {
                replaceDemoRows(parsed);
                rows = loadDemoRows();
              }
            }
          }
          setData(rows);
          return;
        }

        const { data: rows, error: err } = await supabase
          .from(SPEND_TRANSACTIONS_TABLE)
          .select("*")
          .order("date", { ascending: false });

        if (err) throw err;

        setData(rowsFromSpendTransactions(rows ?? []));
      } catch (err) {
        console.error("DATA ERROR:", err);
        setError(true);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [demo]);

  const enrichedData = useMemo(() => {
    if (!data.length) return [] as Row[];
    try {
      return enrichTransactions(data);
    } catch (err) {
      console.error("Dashboard analytics error:", err);
      return data;
    }
  }, [data]);

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
                  setData([]);
                  setError(false);
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
      <div className="flex items-center gap-3 py-16">
        <div
          className="h-6 w-6 shrink-0 animate-spin rounded-full border-2 border-teal-600 border-t-transparent"
          aria-hidden
        />
        <p className="text-base font-medium text-slate-600">Loading dashboardΓÇª</p>
      </div>
    );
  }
  if (error) {
    return shell(
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        Something went wrong loading your data.{" "}
        {demo && (
          <button
            type="button"
            onClick={loadSampleData}
            className="ml-1 font-medium text-red-900 underline"
          >
            Try sample data
          </button>
        )}
      </div>
    );
  }
  if (!data.length) {
    return shell(
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
        <p className="text-lg font-medium text-slate-800">No spend data yet</p>
        <p className="mt-2 text-sm text-slate-500">
          Import a CSV to see KPIs, charts, and insights.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {demo && (
            <button
              type="button"
              onClick={loadSampleData}
              disabled={loadingSample}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {loadingSample ? "LoadingΓÇª" : "Load sample data"}
            </button>
          )}
          <Link
            href="/import"
            className="rounded-lg border border-teal-600 px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50"
          >
            Import CSV
          </Link>
        </div>
      </div>
    );
  }

  return shell(
    <>
      {demo && (
        <div className="mb-6 rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-2.5 text-sm text-amber-950">
          Demo mode ΓÇö data stored in this browser only.
        </div>
      )}
      <SpendDashboard enrichedData={enrichedData} />
    </>
  );
}
