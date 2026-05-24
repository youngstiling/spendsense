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

export function SpendIncreasesPage() {
  const { loading, engine, hasData } = useEngineReady();
  if (loading) return <LoadingState />;
  if (!hasData || !engine) return <EmptyState />;

  const rows = engine.spendIncreases.map((s) => [
    s.pubName,
    s.currentMonth,
    fmtGbp(s.currentTotal),
    fmtGbp(s.previousTotal),
    fmtPct(s.percentIncrease),
    fmtGbp(s.absoluteIncrease),
    <FlagBadge key={s.pubName} flagged={s.flagged} />,
  ]);

  return (
    <>
      <PageHeader
        title="Spend Increases"
        subtitle="Month-on-month change by pub (>15% flagged)"
      />
      <DataTable
        headers={[
          "Pub",
          "Month",
          "Current",
          "Previous",
          "% Change",
          "Absolute",
          "Flag",
        ]}
        rows={rows}
      />
    </>
  );
}
