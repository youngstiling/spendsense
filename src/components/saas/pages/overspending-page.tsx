"use client";

import { fmtGbp, fmtPct } from "../format";
import {
  DataTable,
  EmptyState,
  FlagBadge,
  KpiCard,
  LoadingState,
  PageHeader,
  useEngineReady,
} from "../ui";

export function OverspendingPage() {
  const { loading, engine, hasData } = useEngineReady();
  if (loading) return <LoadingState />;
  if (!hasData || !engine) return <EmptyState />;

  const rows = engine.pubOverspends.map((p) => [
    p.pubName,
    fmtGbp(p.expectedSpend),
    fmtGbp(p.actualSpend),
    fmtPct(p.variancePercent),
    <FlagBadge key={p.pubName} flagged={p.flagged} />,
  ]);

  return (
    <>
      <PageHeader
        title="Overspending"
        subtitle="Current month vs 6-month average (>20% flagged)"
      />
      {engine.portfolioOverspend && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <KpiCard
            label="Portfolio excess"
            value={fmtGbp(engine.portfolioOverspend.excessSpend)}
          />
          <KpiCard
            label="Portfolio variance"
            value={fmtPct(engine.portfolioOverspend.variancePercent)}
          />
          <KpiCard
            label="Pubs flagged"
            value={String(engine.portfolioOverspend.pubsOverspending)}
          />
        </div>
      )}
      <DataTable
        headers={["Pub", "Expected", "Actual", "Variance", "Flag"]}
        rows={rows}
      />
    </>
  );
}
