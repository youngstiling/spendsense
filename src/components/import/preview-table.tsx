import type { ImportRowError } from "@/lib/import/types";

export function PreviewTable({
  headers,
  rows,
  rowNumbers,
  errorRowNumbers,
}: {
  headers: string[];
  rows: Record<string, string>[];
  /** Explicit CSV row numbers (for error previews beyond the first 100 rows) */
  rowNumbers?: number[];
  errorRowNumbers?: Set<number>;
}) {
  if (!headers.length) {
    return <p className="text-sm text-slate-500">No columns detected.</p>;
  }

  return (
    <div className="overflow-auto rounded-lg border border-slate-200 max-h-80">
      <table className="w-full text-xs">
        <thead className="bg-slate-50 sticky top-0">
          <tr>
            <th className="px-2 py-2 text-left font-medium text-slate-500">#</th>
            {headers.map((h) => (
              <th key={h || "__empty"} className="px-2 py-2 text-left font-medium text-slate-600">
                {h || "(date col)"}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const rowNum = rowNumbers?.[i] ?? i + 2;
            const hasError = errorRowNumbers?.has(rowNum);
            return (
              <tr
                key={i}
                className={hasError ? "bg-red-50" : "border-t border-slate-100"}
              >
                <td className="px-2 py-1.5 text-slate-400">{rowNum}</td>
                {headers.map((h) => (
                  <td
                    key={h || "__empty"}
                    className={`px-2 py-1.5 max-w-[140px] truncate ${
                      hasError ? "text-red-800" : "text-slate-700"
                    }`}
                    title={row[h] ?? ""}
                  >
                    {row[h] ?? ""}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function errorRowSet(errors: ImportRowError[]): Set<number> {
  return new Set(errors.map((e) => e.rowNumber));
}
