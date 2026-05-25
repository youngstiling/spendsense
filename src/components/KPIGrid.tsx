export type KPI = {
  title: string;
  value: string;
  delta?: string;
  status?: "good" | "bad" | "neutral";
  insight?: string;
};

export default function KPIGrid({ data }: { data: KPI[] }) {
  return (
    <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
      {data.map((kpi, i) => (
        <div
          key={`${kpi.title}-${i}`}
          className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm ring-1 ring-slate-900/5"
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {kpi.title}
            </span>
            {kpi.delta && (
              <span
                className={`text-xs font-semibold ${
                  kpi.status === "good"
                    ? "text-emerald-600"
                    : kpi.status === "bad"
                      ? "text-red-600"
                      : "text-slate-500"
                }`}
              >
                {kpi.delta}
              </span>
            )}
          </div>

          <div className="mb-2 text-3xl font-semibold tabular-nums text-slate-900">
            {kpi.value}
          </div>

          {kpi.insight && (
            <div className="text-xs leading-relaxed text-slate-500">
              {kpi.insight}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
