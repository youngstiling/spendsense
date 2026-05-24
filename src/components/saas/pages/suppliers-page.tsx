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

export function SuppliersPage() {
  const { loading, engine, hasData } = useEngineReady();
  if (loading) return <LoadingState />;
  if (!hasData || !engine) return <EmptyState />;

  const rows = engine.supplierInflations.map((s) => [
    s.supplier,
    fmtPct(s.inflationPercent),
    fmtGbp(s.recentAvg),
    fmtGbp(s.priorAvg),
    String(s.affectedPubs),
    <FlagBadge key={s.supplier} flagged={s.flagged} />,
  ]);

  return (
    <>
      <PageHeader
        title="Suppliers"
        subtitle="Cost inflation: last 3 months vs prior 3 (>10% flagged)"
      />
      <DataTable
        headers={[
          "Supplier",
          "Inflation",
          "Recent avg/mo",
          "Prior avg/mo",
          "Pubs",
          "Flag",
        ]}
        rows={rows}
      />
    </>
  );
}
