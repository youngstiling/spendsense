"use client";

import { useMemo } from "react";
import { previewMappedSampleRows } from "@/lib/import/live-validation";
import { validateMapping } from "@/lib/import/column-mapper";
import type { ColumnMapping } from "@/lib/import/types";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 2,
  }).format(n);
}

export function LiveValidationPreview({
  rows,
  mapping,
  headers,
  startRowNumber,
}: {
  rows: Record<string, string>[];
  mapping: ColumnMapping;
  headers: string[];
  startRowNumber: number;
}) {
  const mapError = validateMapping(mapping, headers);
  const samples = useMemo(
    () =>
      mapError ? [] : previewMappedSampleRows(rows, mapping, startRowNumber, 5),
    [rows, mapping, startRowNumber, mapError]
  );

  if (mapError) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Complete required column mappings to see live validation.
      </div>
    );
  }

  if (!samples.length) {
    return null;
  }

  const passCount = samples.filter((s) => s.ok).length;

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-800">Live validation (first 5 rows)</p>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            passCount === samples.length
              ? "bg-emerald-100 text-emerald-800"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {passCount}/{samples.length} pass
        </span>
      </div>
      <div className="overflow-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-slate-500">Row</th>
              <th className="px-3 py-2 text-left font-medium text-slate-500">Date</th>
              <th className="px-3 py-2 text-left font-medium text-slate-500">Amount</th>
              <th className="px-3 py-2 text-left font-medium text-slate-500">Supplier</th>
              <th className="px-3 py-2 text-left font-medium text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {samples.map((s) => (
              <tr
                key={s.rowNumber}
                className={`border-t border-slate-100 ${s.ok ? "" : "bg-red-50/60"}`}
              >
                <td className="px-3 py-2 text-slate-500">{s.rowNumber}</td>
                <td className="px-3 py-2 text-slate-700">{s.date ?? "\u2014"}</td>
                <td className="px-3 py-2 text-slate-700">
                  {s.amount != null ? formatMoney(s.amount) : "\u2014"}
                </td>
                <td className="px-3 py-2 text-slate-700 max-w-[140px] truncate" title={s.supplierLabel}>
                  {s.supplierLabel}
                </td>
                <td className="px-3 py-2">
                  {s.ok ? (
                    <span className="text-emerald-700 font-medium">OK</span>
                  ) : (
                    <span className="text-red-700" title={s.issues.join(", ")}>
                      {s.issues.join(", ")}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
