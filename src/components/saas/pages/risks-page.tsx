"use client";

import {
  DataTable,
  EmptyState,
  InsightCard,
  LoadingState,
  PageHeader,
  useEngineReady,
} from "../ui";

export function RisksPage() {
  const { loading, engine, hasData } = useEngineReady();
  if (loading) return <LoadingState />;
  if (!hasData || !engine) return <EmptyState />;

  const rows = engine.topRisks.map((r) => [
    r.pubName,
    String(r.riskScore),
    r.keyIssue,
  ]);

  return (
    <>
      <PageHeader
        title="Financial Risks"
        subtitle="Top 5 pubs by composite risk score"
      />
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        {engine.topRisks.slice(0, 3).map((r, i) => (
          <InsightCard key={r.pubName} title={`#${i + 1} ${r.pubName}`} highlight={i === 0}>
            <p className="text-2xl font-semibold text-turquoise-700">
              {r.riskScore}
            </p>
            <p className="mt-2 text-sm text-slate-600">{r.keyIssue}</p>
          </InsightCard>
        ))}
      </div>
      <DataTable headers={["Pub", "Score", "Key issue"]} rows={rows} />
    </>
  );
}
