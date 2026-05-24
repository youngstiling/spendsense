import type { ReactNode } from "react";

type Accent = "turquoise" | "amber" | "indigo";

const accents: Record<
  Accent,
  {
    ring: string;
    icon: string;
    value: string;
    glow: string;
    featuredValue?: string;
    featuredLabel?: string;
    featuredSublabel?: string;
    featuredBox?: string;
  }
> = {
  turquoise: {
    ring: "ring-turquoise-500/10",
    icon: "bg-turquoise-500/10 text-turquoise-700",
    value: "text-slate-900",
    featuredValue: "text-white",
    featuredLabel: "text-turquoise-100",
    featuredSublabel: "text-turquoise-100/80",
    featuredBox:
      "border-turquoise-700 bg-gradient-to-br from-turquoise-600 to-turquoise-700 shadow-lg shadow-turquoise-900/20 ring-turquoise-500/30",
    glow: "from-white/10 to-transparent",
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
  accent = "turquoise",
  featured = false,
  icon,
}: {
  label: string;
  value: string;
  sublabel?: string;
  accent?: Accent;
  /** Hero KPI — larger type, stronger turquoise */
  featured?: boolean;
  icon?: ReactNode;
}) {
  const style = accents[accent];
  const isFeaturedTurquoise =
    featured && accent === "turquoise" && style.featuredBox;
  const valueColor = featured && style.featuredValue ? style.featuredValue : style.value;

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border shadow-sm ring-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        isFeaturedTurquoise
          ? `${style.featuredBox} p-8 sm:p-10`
          : featured
            ? "border-slate-200/80 bg-white p-8 sm:p-10 ring-turquoise-500/20"
            : `border-slate-200/80 bg-white p-6 ${style.ring}`
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${style.glow} ${
          isFeaturedTurquoise ? "opacity-40" : featured ? "opacity-60" : "opacity-0"
        } transition-opacity group-hover:opacity-100`}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className={
              isFeaturedTurquoise
                ? `text-sm font-bold uppercase tracking-widest ${style.featuredLabel}`
                : featured
                  ? "text-sm font-bold uppercase tracking-widest text-turquoise-700"
                  : "text-xs font-semibold uppercase tracking-wider text-slate-500"
            }
          >
            {label}
          </p>
          <p
            className={`mt-3 font-bold tracking-tight tabular-nums ${valueColor} ${
              featured
                ? "text-5xl sm:text-6xl lg:text-7xl"
                : "text-3xl sm:text-4xl"
            }`}
          >
            {value}
          </p>
          {sublabel && (
            <p
              className={`leading-snug ${
                isFeaturedTurquoise
                  ? `mt-3 text-base ${style.featuredSublabel}`
                  : featured
                    ? "mt-3 text-base text-turquoise-800/70"
                    : "mt-2 text-sm text-slate-500"
              }`}
            >
              {sublabel}
            </p>
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
