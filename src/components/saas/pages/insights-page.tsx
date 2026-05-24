"use client";

import { useEffect } from "react";
import { useFinance } from "../finance-provider";
import { fmtPct } from "../format";
import {
  EmptyState,
  InsightCard,
  LoadingState,
  PageHeader,
  useEngineReady,
} from "../ui";

export function InsightsPage() {
  const { aiInsights, aiLoading, fetchAiInsights } = useFinance();
  const { loading, engine, hasData } = useEngineReady();

  useEffect(() => {
    if (hasData) void fetchAiInsights();
  }, [hasData, fetchAiInsights]);

  if (loading) return <LoadingState />;
  if (!hasData || !engine) return <EmptyState />;

  const { highlights } = engine;

  return (
    <>
      <PageHeader
        title="Insights"
        subtitle="AI-generated narratives from financial engine output"
      />
      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        <InsightCard title="Biggest risk" highlight>
          {highlights.biggestRisk ? (
            <>
              <p className="text-lg font-semibold text-slate-900">
                {highlights.biggestRisk.pubName}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {highlights.biggestRisk.keyIssue}
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500">No elevated risks</p>
          )}
        </InsightCard>
        <InsightCard title="Biggest increase">
          {highlights.biggestIncrease ? (
            <>
              <p className="text-lg font-semibold text-slate-900">
                {highlights.biggestIncrease.pubName}
              </p>
              <p className="mt-1 text-sm font-medium text-turquoise-700">
                {fmtPct(highlights.biggestIncrease.percentIncrease)} MoM
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500">Stable MoM</p>
          )}
        </InsightCard>
        <InsightCard title="Worst supplier">
          {highlights.worstSupplier ? (
            <>
              <p className="text-lg font-semibold text-slate-900">
                {highlights.worstSupplier.supplier}
              </p>
              <p className="mt-1 text-sm font-medium text-red-600">
                {fmtPct(highlights.worstSupplier.inflationPercent)} inflation
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500">No supplier inflation</p>
          )}
        </InsightCard>
      </div>
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">AI narratives</h2>
        {aiLoading ? (
          <LoadingState />
        ) : (
          aiInsights.map((line, i) => (
            <InsightCard key={i} title={`Insight ${i + 1}`}>
              <p className="text-sm leading-relaxed text-slate-700">{line}</p>
            </InsightCard>
          ))
        )}
      </div>
      <p className="mt-4 text-xs text-slate-500">
        Add OPENAI_API_KEY in Vercel for GPT narratives; rule-based insights used
        otherwise.
      </p>
    </>
  );
}
