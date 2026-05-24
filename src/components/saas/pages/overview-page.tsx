"use client";

import { useFinance } from "../finance-provider";
import { AuditTrustPanel } from "../audit-trust-panel";
import { fmtGbp, fmtPct } from "../format";
import { useEngineReady } from "../ui";
import {
  EmptyState,
  KpiCard,
  LoadingState,
  PageHeader,
} from "../ui";

export function OverviewPage() {
  const { audit } = useFinance();
  const { loading, engine, hasData } = useEngineReady();

  if (loading) return <LoadingState />;
  if (!hasData || !engine) return <EmptyState />;

  const { overview } = engine;

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle={`Reference month: ${engine.referenceMonth}`}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total spend (this month)"
          value={fmtGbp(overview.totalSpendThisMonth)}
          featured
        />
        <KpiCard
          label="vs last month"
          value={fmtPct(overview.percentVsLastMonth)}
          accent={
            overview.percentVsLastMonth > 15
              ? "danger"
              : overview.percentVsLastMonth < 0
                ? "success"
                : "default"
          }
        />
        <KpiCard
          label="Overspending pubs"
          value={String(overview.overspendingPubsCount)}
          sub=">20% above 6-mo average"
          accent={overview.overspendingPubsCount > 0 ? "danger" : "default"}
        />
        <KpiCard
          label="Top risk pub"
          value={overview.topRiskPub ?? "—"}
          sub={engine.topRisks[0]?.keyIssue}
          accent="turquoise"
        />
      </div>
      <AuditTrustPanel report={audit} />

      {engine.portfolioOverspend && (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <KpiCard
            label="Portfolio variance"
            value={fmtPct(engine.portfolioOverspend.variancePercent)}
            sub={`Baseline ${fmtGbp(engine.portfolioOverspend.baselineAverage)}`}
          />
          <KpiCard
            label="Excess spend"
            value={fmtGbp(engine.portfolioOverspend.excessSpend)}
          />
          <KpiCard
            label="Pubs overspending"
            value={String(engine.portfolioOverspend.pubsOverspending)}
          />
        </div>
      )}
    </>
  );
}
