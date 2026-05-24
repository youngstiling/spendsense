import type { BeerVsFoodSummary } from "@/lib/dashboard-analytics";
import { formatMoney } from "./format";

export function BeerVsFoodPanel({
  comparison,
}: {
  comparison: BeerVsFoodSummary | null;
}) {
  if (!comparison) return null;

  const { beerTotal, foodTotal, beerPercentage, foodPercentage, insight } =
    comparison;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-slate-900">Beer vs food</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 sm:p-5">
          <p className="text-sm font-medium text-amber-900/80">Beer</p>
          <p className="mt-1 text-xl font-bold text-slate-900">
            {formatMoney(beerTotal)}
          </p>
          <p className="mt-2 text-sm font-medium text-amber-800">
            {beerPercentage.toFixed(1)}% of total spend
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <p className="text-sm font-medium text-slate-600">Food</p>
          <p className="mt-1 text-xl font-bold text-slate-900">
            {formatMoney(foodTotal)}
          </p>
          <p className="mt-2 text-sm font-medium text-slate-600">
            {foodPercentage.toFixed(1)}% of total spend
          </p>
        </div>
      </div>
      <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700">
        {insight}
      </p>
    </div>
  );
}
