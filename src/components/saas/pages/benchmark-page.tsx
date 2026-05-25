"use client";

import { useState } from "react";
import { fmtGbp, fmtPct } from "../format";
import {
  DataTable,
  EmptyState,
  KpiCard,
  LoadingState,
  PageHeader,
  useEngineReady,
} from "../ui";

const ALL_CATEGORIES = "__all__";

function statusLabel(status: string): string {
  if (status === "ABOVE_AVERAGE") return "High spend pattern";
  if (status === "BELOW_AVERAGE") return "Low spend pattern";
  return "In line";
}

function confidenceLabel(confidence: string): string {
  if (confidence === "HIGH") return "High confidence";
  if (confidence === "MEDIUM") return "Medium confidence";
  return "Low confidence";
}

export function BenchmarkPage() {
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const { loading, engine, hasData } = useEngineReady();
  if (loading) return <LoadingState />;
  if (!hasData || !engine?.benchmarkSummary) return <EmptyState />;

  const categories = engine.benchmarkCategories ?? [];
  const activeBenchmarks =
    category === ALL_CATEGORIES
      ? engine.pubBenchmarks
      : (engine.categoryBenchmarks[category] ?? []);
  const summary =
    category === ALL_CATEGORIES
      ? engine.benchmarkSummary
      : (engine.categoryBenchmarkSummaries[category] ?? engine.benchmarkSummary);
  const flaggedCount = activeBenchmarks.filter((p) => p.flagged).length;
  const driver = activeBenchmarks
    .filter((p) => p.mainDriverAmount > 0)
    .sort((a, b) => b.mainDriverAmount - a.mainDriverAmount)[0];
  const topDriver = driver
    ? `${driver.mainDriverCategory} (${fmtGbp(driver.mainDriverAmount)})`
    : "No clear driver";
  const rows = activeBenchmarks.map((p) => [
    String(p.rank),
    p.pubName,
    fmtGbp(p.currentSpend),
    fmtPct(p.variancePercent),
    fmtPct(p.selfTrendVariancePercent),
    p.mainDriverCategory,
    confidenceLabel(p.confidence),
    statusLabel(p.status),
  ]);

  return (
    <>
      <PageHeader
        title="Spend Pattern Benchmark"
        subtitle="Compares spend patterns only. Higher spend may simply mean a larger or busier pub."
      />
      <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Category filter
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory(ALL_CATEGORIES)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              category === ALL_CATEGORIES
                ? "bg-turquoise-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            All spend
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                category === c
                  ? "bg-turquoise-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={category === ALL_CATEGORIES ? "Portfolio total" : `${category} total`}
          value={fmtGbp(summary.portfolioTotal)}
          featured
        />
        <KpiCard
          label="Average per pub"
          value={fmtGbp(summary.averageSpendPerPub)}
          sub={`${summary.pubCount} pubs benchmarked`}
        />
        <KpiCard
          label="Highest spend pattern"
          value={summary.highestSpender ?? "-"}
          sub={`${fmtPct(summary.highestVariancePercent)} vs portfolio spend average`}
          accent={summary.highestVariancePercent > 20 ? "danger" : "turquoise"}
        />
        <KpiCard
          label="Main spend driver"
          value={topDriver}
          sub="Largest category signal above average"
          accent="turquoise"
        />
        <KpiCard
          label="Marked for review"
          value={String(flaggedCount)}
          sub=">20% above peer average or own trend"
          accent={flaggedCount > 0 ? "danger" : "success"}
        />
      </div>
      <DataTable
        headers={[
          "Rank",
          "Pub",
          "Current Spend",
          "Vs peer avg",
          "Vs own trend",
          "Main driver",
          "Confidence",
          "Review status",
        ]}
        rows={rows}
      />
    </>
  );
}
