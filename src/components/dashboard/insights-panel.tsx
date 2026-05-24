function insightTone(text: string): "warning" | "info" | "neutral" {
  if (text.includes("⚠️") || /above average|significantly/i.test(text)) {
    return "warning";
  }
  if (/uncategorised/i.test(text)) return "warning";
  if (/top spending|total spend/i.test(text)) return "info";
  return "neutral";
}

const toneStyles = {
  warning: {
    card: "border-amber-200/80 bg-gradient-to-r from-amber-50 to-white",
    icon: "bg-amber-100 text-amber-800",
    dot: "bg-amber-400",
  },
  info: {
    card: "border-teal-200/80 bg-gradient-to-r from-teal-50/80 to-white",
    icon: "bg-teal-100 text-teal-800",
    dot: "bg-teal-500",
  },
  neutral: {
    card: "border-slate-200 bg-white",
    icon: "bg-slate-100 text-slate-600",
    dot: "bg-slate-300",
  },
};

function InsightIcon({ tone }: { tone: keyof typeof toneStyles }) {
  if (tone === "warning") {
    return <span className="text-lg leading-none">⚠️</span>;
  }
  if (tone === "info") {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export function InsightsPanel({ insights }: { insights: string[] }) {
  if (!insights.length) return null;

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-slate-900 p-6 shadow-lg sm:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-300">
            Intelligence
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white sm:text-2xl">
            Actionable insights
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Generated from your enriched spend data
          </p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
          {insights.length} signal{insights.length === 1 ? "" : "s"}
        </span>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {insights.map((text) => {
          const tone = insightTone(text);
          const styles = toneStyles[tone];
          const display = text.replace(/^⚠️\s*/, "");

          return (
            <li
              key={text}
              className={`flex gap-3 rounded-xl border p-4 shadow-sm transition-transform hover:scale-[1.01] ${styles.card}`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${styles.icon}`}
              >
                <InsightIcon tone={tone} />
              </div>
              <div className="min-w-0 flex-1">
                <span
                  className={`mb-2 inline-block h-1.5 w-8 rounded-full ${styles.dot}`}
                />
                <p className="text-sm font-medium leading-relaxed text-slate-800">
                  {display}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
