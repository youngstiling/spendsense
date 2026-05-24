"use client";

import { fmtGbp, fmtPct } from "../format";
import {
  DataTable,
  EmptyState,
  FlagBadge,
  LoadingState,
  PageHeader,
  useEngineReady,
} from "../ui";

export function BudgetPage() {
  const { loading, engine, hasData } = useEngineReady();
  if (loading) return <LoadingState />;
  if (!hasData || !engine) return <EmptyState />;

  const rows = engine.budgetVariances.map((b) => [
    b.pubName,
    fmtGbp(b.budget),
    fmtGbp(b.actual),
    fmtGbp(b.actual - b.budget),
    fmtPct(b.variancePercent),
    <FlagBadge key={b.pubName} flagged={b.flagged} />,
  ]);

  return (
    <>
      <PageHeader
        title="Budget"
        subtitle="Mock budget = trailing 3-month average per pub"
      />
      <DataTable
        headers={["Pub", "Budget", "Actual", "Delta", "Variance", "Flag"]}
        rows={rows}
      />
    </>
  );
}
