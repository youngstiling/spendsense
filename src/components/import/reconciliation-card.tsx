import type { ReconciliationResult } from "@/lib/import/reconciliation";

const statusStyles = {
  verified: {
    wrap: "border-emerald-200 bg-emerald-50 text-emerald-950",
    badge: "bg-emerald-600 text-white",
    icon: "✓",
  },
  warning: {
    wrap: "border-amber-200 bg-amber-50 text-amber-950",
    badge: "bg-amber-500 text-white",
    icon: "⚠",
  },
  failed: {
    wrap: "border-red-200 bg-red-50 text-red-950",
    badge: "bg-red-600 text-white",
    icon: "✕",
  },
  pending_verification: {
    wrap: "border-slate-200 bg-slate-50 text-slate-900",
    badge: "bg-slate-700 text-white",
    icon: "…",
  },
} as const;

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start && !end) return "Unknown";
  if (start === end) return start ?? "Unknown";
  return `${start ?? "Unknown"} to ${end ?? "Unknown"}`;
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold tabular-nums text-slate-950">
        {value}
      </p>
    </div>
  );
}

export function ReconciliationCard({
  reconciliation,
}: {
  reconciliation: ReconciliationResult;
}) {
  const styles = statusStyles[reconciliation.status];

  return (
    <section className={`rounded-2xl border p-5 shadow-sm ${styles.wrap}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold tracking-wide ${styles.badge}`}
          >
            <span>{styles.icon}</span>
            <span>{reconciliation.statusLabel}</span>
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight">
            ProcureLayer Verification Certificate
          </h2>
          <p className="mt-1 text-sm">{reconciliation.message}</p>
          <div className="mt-4 space-y-2 rounded-xl border border-white/70 bg-white/70 px-4 py-3 text-sm text-slate-800 shadow-sm">
            <p className="font-semibold text-slate-950">What happened</p>
            <p>{reconciliation.whatHappened}</p>
            <p className="font-semibold text-slate-950">
              {reconciliation.trustVerdict}
            </p>
          </div>
          <p className="mt-3 text-lg font-semibold">
            {formatMoney(reconciliation.imported.totalSpend)} reconciled
          </p>
          <p className="text-sm">
            {reconciliation.imported.rowCount.toLocaleString("en-GB")} rows imported ·{" "}
            {reconciliation.imported.supplierCount.toLocaleString("en-GB")} suppliers detected
          </p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-white/80 px-5 py-4 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Confidence Score
          </p>
          <p className="mt-1 text-4xl font-black tabular-nums text-slate-950">
            {reconciliation.confidenceScore}%
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Source Rows" value={reconciliation.source.rowCount.toLocaleString("en-GB")} />
        <Metric label="Imported Rows" value={reconciliation.imported.rowCount.toLocaleString("en-GB")} />
        <Metric label="Source Total" value={formatMoney(reconciliation.source.totalSpend)} />
        <Metric label="Imported Total" value={formatMoney(reconciliation.imported.totalSpend)} />
        <Metric label="Suppliers Detected" value={reconciliation.imported.supplierCount.toLocaleString("en-GB")} />
        <Metric
          label="Date Range"
          value={formatDateRange(
            reconciliation.imported.dateRangeStart,
            reconciliation.imported.dateRangeEnd
          )}
        />
        <Metric label="Variance" value={formatMoney(reconciliation.variance)} />
        <Metric
          label="Processing Time"
          value={`${(reconciliation.processingDurationMs / 1000).toFixed(1)}s`}
        />
      </div>

      <p className="mt-4 text-xs text-slate-600">
        Verified at {formatTimestamp(reconciliation.verifiedAt)} · Import ID{" "}
        <span className="font-mono">{reconciliation.certificate.importId}</span>
      </p>
    </section>
  );
}
