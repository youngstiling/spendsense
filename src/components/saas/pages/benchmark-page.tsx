"use client";

import { fmtGbp, fmtPct } from "../format";
import {
  DataTable,
  EmptyState,
  KpiCard,
  LoadingState,
  PageHeader,
  useEngineReady,
} from "../ui";

function statusLabel(status: string): string {
  if (status === "ABOVE_AVERAGE") return "Above average";
  if (status === "BELOW_AVERAGE") return "Below average";
  return "In line";
}

export function BenchmarkPage() {
  const { loading, engine, hasData } = useEngineReady();
  if (loading) return <LoadingState />;
  if (!hasData || !engine?.benchmarkSummary) return <EmptyState />;

  const { benchmarkSummary: summary, pubBenchmarks } = engine;
  const flaggedCount = pubBenchmarks.filter((p) => p.flagged).length;
  const rows = pubBenchmarks.map((p) => [
    String(p.rank),
    p.pubName,
    fmtGbp(p.currentSpend),
    fmtPct(p.variancePercent),
    fmtGbp(p.sixMonthAverage),
    statusLabel(p.status),
  ]);

  return (
    <>
      <PageHeader
        title="Benchmark"
        subtitle="Ranks each pub against the portfolio average for the latest month"
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Portfolio total"
          value={fmtGbp(summary.portfolioTotal)}
          featured
        />
        <KpiCard
          label="Average per pub"
          value={fmtGbp(summary.averageSpendPerPub)}
          sub={`${summary.pubCount} pubs benchmarked`}
        />
        <KpiCard
          label="Highest spender"
          value={summary.highestSpender ?? "-"}
          sub={`${fmtPct(summary.highestVariancePercent)} vs average`}
          accent={summary.highestVariancePercent > 20 ? "danger" : "turquoise"}
        />
        <KpiCard
          label="Flagged above benchmark"
          value={String(flaggedCount)}
          sub=">20% above peer average"
          accent={flaggedCount > 0 ? "danger" : "success"}
        />
      </div>
      <DataTable
        headers={[
          "Rank",
          "Pub",
          "Current Spend",
          "Vs Avg",
          "6-mo Avg",
          "Status",
        ]}
        rows={rows}
      />
    </>
  );
}
