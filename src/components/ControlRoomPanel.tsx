"use client";

import { useCallback, useState } from "react";
import KPIGrid, { type KPI } from "@/components/KPIGrid";
import { useFinance } from "@/components/saas/finance-provider";
import { useLiveMetrics } from "@/hooks/use-live-metrics";

type ControlRoomData = {
  total: number;
  risks: number;
  narrative: string;
  source: string;
};

type ProofData = {
  value: number;
  engineValue: number;
  rowCount: number;
  drift: number;
  status: string;
  trust: number;
};

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export default function ControlRoomPanel() {
  const { engine } = useFinance();
  const [proof, setProof] = useState<ProofData | null>(null);

  const loadKPIs = useCallback(async () => {
    const metric = {
      metric: "SPEND_INCREASE",
      value: engine?.highlights.biggestIncrease?.percentIncrease ?? 0,
      context: { pub: engine?.highlights.biggestIncrease?.pubName ?? "Portfolio" },
    };

    const narrativeRes = await fetch("/api/narrative", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(metric),
    });

    if (!narrativeRes.ok) {
      throw new Error("Could not load control room narrative");
    }

    const narrative = (await narrativeRes.json()) as ControlRoomData;
    return {
      total: engine?.overview.totalSpendThisMonth ?? narrative.total,
      risks: engine?.topRisks.length ?? narrative.risks,
      narrative: narrative.narrative,
      source: narrative.source,
    };
  }, [engine]);

  const {
    data,
    lastUpdated,
    error,
  } = useLiveMetrics(loadKPIs, 3000);

  async function handleProof() {
    const res = await fetch("/api/proof", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metric: "TOTAL_SPEND" }),
    });

    if (!res.ok) {
      console.error("Could not load proof");
      return;
    }

    const result = (await res.json()) as ProofData;
    setProof(result);
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
        {error instanceof Error ? error.message : "Could not load panel"}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 text-sm text-slate-500 shadow-sm">
        Loading control room...
      </div>
    );
  }

  const topOverspend = engine?.pubOverspends.find((p) => p.flagged);
  const worstSupplier = engine?.highlights.worstSupplier;
  const topBudgetVariance = engine?.budgetVariances.find((b) => b.flagged);
  const topRisk = engine?.highlights.biggestRisk;

  const kpiData: KPI[] = [
    {
      title: "Total Spend",
      value: formatMoney(data.total),
      delta: engine ? formatPercent(engine.overview.percentVsLastMonth) : undefined,
      status:
        engine && engine.overview.percentVsLastMonth > 0
          ? "bad"
          : engine && engine.overview.percentVsLastMonth < 0
            ? "good"
            : "neutral",
      insight: "Spend increased significantly vs last period",
    },
    {
      title: "Overspend Detected",
      value: formatMoney(engine?.portfolioOverspend?.excessSpend ?? 0),
      delta: engine?.portfolioOverspend
        ? formatPercent(engine.portfolioOverspend.variancePercent)
        : undefined,
      status:
        engine?.portfolioOverspend &&
        engine.portfolioOverspend.excessSpend > 0
          ? "bad"
          : "neutral",
      insight:
        topOverspend?.pubName
          ? `${topOverspend.pubName} is above expected spend`
          : "Multiple pubs exceeding expected spend",
    },
    {
      title: "Consistent Overspend",
      value: `${engine?.overview.overspendingPubsCount ?? data.risks} Locations`,
      status:
        (engine?.overview.overspendingPubsCount ?? data.risks) > 0
          ? "bad"
          : "good",
      insight: "Recurring overspend across portfolio",
    },
    {
      title: "Supplier Inflation",
      value: worstSupplier
        ? formatPercent(worstSupplier.inflationPercent)
        : "+0.0%",
      status: worstSupplier?.flagged ? "bad" : "neutral",
      insight: worstSupplier
        ? `${worstSupplier.supplier} impacting ${worstSupplier.affectedPubs} pubs`
        : "Key suppliers increasing prices",
    },
    {
      title: "Budget Variance",
      value: formatMoney(
        topBudgetVariance
          ? Math.max(0, topBudgetVariance.actual - topBudgetVariance.budget)
          : 0
      ),
      status: topBudgetVariance?.flagged ? "bad" : "neutral",
      insight: topBudgetVariance
        ? `${topBudgetVariance.pubName} is above mock budget`
        : "Deviation from expected budget",
    },
    {
      title: "Top Financial Risk",
      value: topRisk?.pubName ?? "None",
      status: topRisk ? "bad" : "good",
      insight: topRisk?.keyIssue ?? "Largest contributor to overspend",
    },
  ];

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Control Room
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            Verified Finance Command Centre
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Live spend metrics with proof, drift, and narrative context.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
            <span className="text-emerald-600">LIVE</span>
            <span>
              Last updated: {lastUpdated?.toLocaleTimeString("en-GB") ?? "—"}
            </span>
          </div>
        </div>
        <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
          Verified
        </div>
      </div>

      <KPIGrid data={kpiData} />

      <article className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Narrative
              </p>
              <h2 className="mt-1 text-sm font-semibold text-slate-900">
                AI / Engine explanation
              </h2>
            </div>
            <span className="rounded-full bg-turquoise-50 px-3 py-1 text-xs font-semibold text-turquoise-800 ring-1 ring-turquoise-200">
              {data.source}
            </span>
          </div>

          <blockquote className="mt-5 rounded-xl border border-turquoise-100 bg-turquoise-50/60 p-4 text-sm italic leading-relaxed text-slate-700">
            {data.narrative}
          </blockquote>

          <button
            type="button"
            onClick={handleProof}
            className="mt-5 rounded-xl bg-turquoise-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-turquoise-700"
          >
            Proof
          </button>

          {proof && (
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <h4 className="font-semibold text-slate-900">Proof</h4>
              <div className="mt-2 grid gap-1">
                <div>
                  SQL value: £{Math.round(proof.value).toLocaleString("en-GB")}
                </div>
                <div>
                  Engine value: £
                  {Math.round(proof.engineValue).toLocaleString("en-GB")}
                </div>
                <div>Rows: {proof.rowCount}</div>
                <div>Drift: {proof.drift.toFixed(4)}%</div>
                <div>Status: {proof.status}</div>
                <div>Trust: {proof.trust}%</div>
              </div>
            </div>
          )}
      </article>
    </section>
  );
}
