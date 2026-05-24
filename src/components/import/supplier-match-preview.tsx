"use client";

import { useMemo } from "react";
import { previewSupplierMatch } from "@/lib/csv-shared";
import { buildSupplierLabel } from "@/lib/import/amount-resolver";
import type { ColumnMapping } from "@/lib/import/types";

export function SupplierMatchPreview({
  rows,
  mapping,
}: {
  rows: Record<string, string>[];
  mapping: ColumnMapping;
}) {
  const previews = useMemo(() => {
    const seen = new Set<string>();
    const out: ReturnType<typeof previewSupplierMatch>[] = [];

    for (const row of rows.slice(0, 20)) {
      const label = buildSupplierLabel(row, mapping);
      if (label === "UNKNOWN" || seen.has(label)) continue;
      seen.add(label);
      out.push(previewSupplierMatch(label));
      if (out.length >= 6) break;
    }

    return out;
  }, [rows, mapping]);

  if (!previews.length) {
    return null;
  }

  const fuzzyCount = previews.filter((p) => p.canonicalMatch).length;

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <p className="text-sm font-medium text-slate-800">Supplier normalisation preview</p>
        <p className="text-xs text-slate-500 mt-0.5">
          {fuzzyCount > 0
            ? `${fuzzyCount} name${fuzzyCount === 1 ? "" : "s"} matched to known suppliers`
            : "Names will be cleaned and shortened - no fuzzy matches yet"}
        </p>
      </div>
      <ul className="divide-y divide-slate-100 text-sm">
        {previews.map((p) => (
          <li key={p.raw} className="px-4 py-2.5 flex flex-wrap items-center gap-2">
            <span className="text-slate-600 truncate max-w-[200px]" title={p.raw}>
              {p.raw}
            </span>
            <span className="text-slate-400">&rarr;</span>
            <span className="font-medium text-slate-900">{p.normalized}</span>
            {p.canonicalMatch && (
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Matched
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
