import type { ReactNode } from "react";

type Accent = "teal" | "amber" | "indigo";

const accents: Record<
  Accent,
  { ring: string; icon: string; value: string; glow: string }
> = {
  teal: {
    ring: "ring-teal-500/10",
    icon: "bg-teal-500/10 text-teal-700",
    value: "text-slate-900",
    glow: "from-teal-500/5 to-transparent",
  },
  amber: {
    ring: "ring-amber-500/15",
    icon: "bg-amber-500/15 text-amber-800",
    value: "text-slate-900",
    glow: "from-amber-500/8 to-transparent",
  },
  indigo: {
    ring: "ring-indigo-500/10",
    icon: "bg-indigo-500/10 text-indigo-700",
    value: "text-slate-900",
    glow: "from-indigo-500/8 to-transparent",
  },
};

export function KPICard({
  label,
  value,
  sublabel,
  accent = "teal",
  icon,
}: {
  label: string;
  value: string;
  sublabel?: string;
  accent?: Accent;
  icon?: ReactNode;
}) {
  const style = accents[accent];

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ${style.ring} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${style.glow} opacity-0 transition-opacity group-hover:opacity-100`}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p
            className={`mt-3 text-3xl font-bold tracking-tight tabular-nums sm:text-4xl ${style.value}`}
          >
            {value}
          </p>
          {sublabel && (
            <p className="mt-2 text-sm text-slate-500 leading-snug">{sublabel}</p>
          )}
        </div>
        {icon && (
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.icon}`}
          >
            {icon}
          </div>
        )}
      </div>
    </article>
  );
}
