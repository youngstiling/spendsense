import type { PubPerformanceSummary } from "@/lib/pub-summary";
import { formatMoney } from "./format";

export function PubPerformancePanel({
  performance,
}: {
  performance: PubPerformanceSummary | null;
}) {
  if (!performance) return null;

  const { topPub, worstPub, topPercentage, insight } = performance;
  const topPct = topPercentage.toFixed(1);
  const samePub = topPub.pub === worstPub.pub;

  return (
    <div className="mt-6 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-turquoise-200 bg-turquoise-50 p-4 sm:p-5">
          <h2 className="mb-1 text-lg font-semibold text-slate-900">
            Top performing pub
          </h2>
          <p className="text-xl font-bold text-slate-900">{topPub.pub}</p>
          <p className="text-slate-600">{formatMoney(topPub.total)}</p>
          <p className="mt-2 text-sm font-medium text-turquoise-800">
            {topPct}% of total spend
          </p>
        </div>

        {!samePub && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
            <h2 className="mb-1 text-lg font-semibold text-slate-900">
              Lowest spend pub
            </h2>
            <p className="text-xl font-bold text-slate-900">{worstPub.pub}</p>
            <p className="text-slate-600">{formatMoney(worstPub.total)}</p>
          </div>
        )}
      </div>

      <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700">
        {insight}
      </p>
    </div>
  );
}
