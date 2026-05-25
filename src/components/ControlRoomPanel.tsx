"use client";

import { useEffect, useState } from "react";
import { useFinance } from "@/components/saas/finance-provider";

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

export default function ControlRoomPanel() {
  const { engine } = useFinance();
  const [data, setData] = useState<ControlRoomData | null>(null);
  const [proof, setProof] = useState<ProofData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, [engine]);

  async function load() {
    setError(null);
    const metric = {
      metric: "SPEND_INCREASE",
      value: engine?.highlights.biggestIncrease?.percentIncrease ?? 0,
      context: { pub: engine?.highlights.biggestIncrease?.pubName ?? "Portfolio" },
    };

    try {
      const narrativeRes = await fetch("/api/narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metric),
      });

      if (!narrativeRes.ok) {
        throw new Error("Could not load control room narrative");
      }

      const narrative = (await narrativeRes.json()) as ControlRoomData;
      setData({
        total: engine?.overview.totalSpendThisMonth ?? narrative.total,
        risks: engine?.topRisks.length ?? narrative.risks,
        narrative: narrative.narrative,
        source: narrative.source,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load panel");
    }
  }

  async function handleProof() {
    const res = await fetch("/api/proof", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metric: "TOTAL_SPEND" }),
    });

    if (!res.ok) {
      setError("Could not load proof");
      return;
    }

    const result = (await res.json()) as ProofData;
    setProof(result);
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
        {error}
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

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Control Room
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            Total Spend
          </h2>
        </div>
        <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
          Verified
        </div>
      </div>

      <div className="mt-4 text-4xl font-bold tabular-nums text-turquoise-700">
        £{Math.round(data.total).toLocaleString("en-GB")}
      </div>

      <div className="mt-3 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
        {data.risks} risks detected
      </div>

      <blockquote className="mt-5 rounded-xl border border-turquoise-100 bg-turquoise-50/60 p-4 text-sm italic leading-relaxed text-slate-700">
        {data.narrative}
        <div className="mt-2 text-[11px] not-italic uppercase tracking-wider text-slate-500">
          Source: {data.source}
        </div>
      </blockquote>

      <button
        type="button"
        onClick={handleProof}
        className="mt-5 rounded-xl bg-turquoise-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-turquoise-700"
      >
        Prove
      </button>

      {proof && (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <h4 className="font-semibold text-slate-900">Proof</h4>
          <div className="mt-2 grid gap-1">
            <div>SQL value: £{Math.round(proof.value).toLocaleString("en-GB")}</div>
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
    </section>
  );
}
