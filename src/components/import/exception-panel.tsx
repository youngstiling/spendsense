import type {
  ReconciliationException,
  ReconciliationExceptionType,
} from "@/lib/import/reconciliation";

const ORDER: ReconciliationExceptionType[] = [
  "RejectedRow",
  "MissingAmount",
  "InvalidDate",
  "InvalidSupplier",
  "DuplicateTransaction",
  "BlankTransaction",
  "NegativeValue",
  "FormatError",
];

function groupExceptions(exceptions: ReconciliationException[]) {
  return ORDER.map((type) => ({
    type,
    rows: exceptions.filter((exception) => exception.errorType === type),
  })).filter((group) => group.rows.length > 0);
}

export function ExceptionPanel({
  exceptions,
}: {
  exceptions: ReconciliationException[];
}) {
  if (!exceptions.length) return null;

  const groups = groupExceptions(exceptions);

  return (
    <section className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            Exception Review
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Structured import exceptions captured for audit and remediation.
          </p>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-900">
          {exceptions.length.toLocaleString("en-GB")} exception
          {exceptions.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {groups.map((group) => (
          <details
            key={group.type}
            className="rounded-xl border border-slate-200 bg-slate-50"
          >
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-800">
              {group.type} · {group.rows.length.toLocaleString("en-GB")}
            </summary>
            <div className="max-h-64 overflow-auto border-t border-slate-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Row</th>
                    <th className="px-3 py-2 font-semibold">Column</th>
                    <th className="px-3 py-2 font-semibold">Original value</th>
                    <th className="px-3 py-2 font-semibold">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {group.rows.slice(0, 100).map((exception, index) => (
                    <tr key={`${group.type}-${exception.rowNumber}-${index}`}>
                      <td className="px-3 py-2 tabular-nums">
                        {exception.rowNumber || "Batch"}
                      </td>
                      <td className="px-3 py-2">
                        {exception.columnName ?? "Row"}
                      </td>
                      <td className="px-3 py-2">
                        {exception.originalValue ?? "-"}
                      </td>
                      <td className="px-3 py-2">{exception.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {group.rows.length > 100 && (
                <p className="px-3 py-2 text-xs text-slate-500">
                  Showing first 100 exceptions in this category.
                </p>
              )}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
