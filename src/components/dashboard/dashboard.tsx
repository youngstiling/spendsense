"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AppNav } from "@/components/app-nav";
import { SpendDashboard } from "@/components/dashboard/spend-dashboard";
import { enrichTransactions } from "@/lib/brand-category";
import type { Row } from "@/lib/csv";

/** Always-available demo portfolio — used if anything else fails. */
const FALLBACK_DEMO_ROWS: Row[] = [
  {
    date: "2026-01-15",
    pub: "Red Lion - Glasgow",
    supplier: "Diageo Ltd",
    description: "Premium lager and wine delivery",
    category: "Drinks",
    amount: 1245.5,
  },
  {
    date: "2026-01-16",
    pub: "Kings Arms - Edinburgh",
    supplier: "BOOKER",
    description: "Weekly food and meat order",
    category: "Food",
    amount: 842.1,
  },
  {
    date: "2026-01-17",
    pub: "The Crown - Stirling",
    supplier: "Heineken UK Ltd",
    description: "Beer kegs restock",
    category: "Drinks",
    amount: 978.33,
  },
  {
    date: "2026-01-18",
    pub: "Black Bull - Dundee",
    supplier: "CleanCo",
    description: "Pub cleaning supplies",
    category: "Cleaning",
    amount: 156.0,
  },
  {
    date: "2026-01-19",
    pub: "Queens Head - Aberdeen",
    supplier: "E.ON",
    description: "Business energy bill",
    category: "Utilities",
    amount: 412.8,
  },
  {
    date: "2026-01-20",
    pub: "Red Lion - Glasgow",
    supplier: "Coca-Cola Europacific",
    description: "Soft drinks delivery",
    category: "Drinks",
    amount: 389.2,
  },
  {
    date: "2026-01-21",
    pub: "Kings Arms - Edinburgh",
    supplier: "Brakes",
    description: "Fresh produce and dairy",
    category: "Food",
    amount: 1105.75,
  },
  {
    date: "2026-01-22",
    pub: "The Crown - Stirling",
    supplier: "Molson Coors",
    description: "Keg beer order",
    category: "Drinks",
    amount: 756.4,
  },
  {
    date: "2026-01-23",
    pub: "Black Bull - Dundee",
    supplier: "Sysco",
    description: "Kitchen consumables",
    category: "Food",
    amount: 623.9,
  },
  {
    date: "2026-01-24",
    pub: "Queens Head - Aberdeen",
    supplier: "Scottish Power",
    description: "Electricity",
    category: "Utilities",
    amount: 298.5,
  },
  {
    date: "2026-01-25",
    pub: "Red Lion - Glasgow",
    supplier: "Biffa",
    description: "Waste collection",
    category: "Cleaning",
    amount: 187.0,
  },
  {
    date: "2026-01-26",
    pub: "Kings Arms - Edinburgh",
    supplier: "Matthew Clark",
    description: "Wine and spirits",
    category: "Drinks",
    amount: 1432.6,
  },
  {
    date: "2026-01-27",
    pub: "The Crown - Stirling",
    supplier: "Bidfood",
    description: "Frozen food delivery",
    category: "Food",
    amount: 891.25,
  },
  {
    date: "2026-01-28",
    pub: "Black Bull - Dundee",
    supplier: "Unknown Supplier Ltd",
    description: "Miscellaneous supplies",
    category: "",
    amount: 245.0,
  },
  {
    date: "2026-01-29",
    pub: "Queens Head - Aberdeen",
    supplier: "Heineken UK Ltd",
    description: "Draught beer",
    category: "Drinks",
    amount: 534.8,
  },
];

function safeEnrich(rows: Row[]): Row[] {
  const source = rows.length ? rows : FALLBACK_DEMO_ROWS;
  try {
    const enriched = enrichTransactions(source);
    return enriched.length ? enriched : enrichTransactions(FALLBACK_DEMO_ROWS);
  } catch {
    try {
      return enrichTransactions(FALLBACK_DEMO_ROWS);
    } catch {
      return FALLBACK_DEMO_ROWS.map((r) => ({
        ...r,
        month: r.date.slice(0, 7),
        pub: r.pub ?? "Unknown",
        canonicalSupplier: r.supplier,
      }));
    }
  }
}

export default function Dashboard() {
  const enrichedData = useMemo(() => safeEnrich(FALLBACK_DEMO_ROWS), []);

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
        <div className="mb-6 rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-2.5 text-sm text-amber-950">
          Demo data — no login required. Charts and KPIs always load from sample
          spend.
        </div>
        <SpendDashboard enrichedData={enrichedData} />
      </div>
    </div>
  );
}
