"use client";

import { SYSTEM_FIELDS } from "@/lib/import/fields";
import type { AmountSourceMode, ColumnMapping, SystemFieldKey } from "@/lib/import/types";

type MappingStatus = "auto" | "manual" | "missing" | "optional";

function mappingStatus(
  field: (typeof SYSTEM_FIELDS)[number],
  mapping: ColumnMapping,
  autoMapping: ColumnMapping
): MappingStatus {
  const value = mapping[field.key];
  if (!value) {
    return field.required ? "missing" : "optional";
  }
  if (autoMapping[field.key] === value) {
    return "auto";
  }
  return "manual";
}

const statusBadge: Record<MappingStatus, { label: string; className: string } | null> = {
  auto: { label: "Auto", className: "bg-emerald-100 text-emerald-800" },
  manual: { label: "Manual", className: "bg-sky-100 text-sky-800" },
  missing: { label: "Required", className: "bg-red-100 text-red-800" },
  optional: null,
};

function mappingReadiness(mapping: ColumnMapping, autoMapping: ColumnMapping) {
  const amountSource = mapping.amountSource ?? "column";
  const hasDate = Boolean(mapping.date);
  const hasAmount =
    amountSource === "debit_credit"
      ? Boolean(mapping.debitColumn || mapping.creditColumn)
      : Boolean(mapping.amount);
  const optionalMapped = SYSTEM_FIELDS.filter(
    (field) => !field.required && mapping[field.key]
  ).length;
  const autoMapped = SYSTEM_FIELDS.filter(
    (field) => mapping[field.key] && mapping[field.key] === autoMapping[field.key]
  ).length;

  if (!hasDate || !hasAmount) {
    return {
      label: "Needs review",
      className: "border-red-200 bg-red-50 text-red-900",
      detail: "Date and amount must be mapped before this file can be trusted.",
    };
  }

  if (optionalMapped >= 2 || autoMapped >= 3) {
    return {
      label: "High confidence",
      className: "border-emerald-200 bg-emerald-50 text-emerald-900",
      detail: "Required fields are mapped and key context columns were detected.",
    };
  }

  return {
    label: "Usable, add context",
    className: "border-amber-200 bg-amber-50 text-amber-900",
    detail: "Date and amount are mapped. Add supplier, pub/site or category where available for better analytics.",
  };
}

export function ColumnMapperUi({
  headers,
  mapping,
  autoMapping,
  onChange,
}: {
  headers: string[];
  mapping: ColumnMapping;
  autoMapping: ColumnMapping;
  onChange: (m: ColumnMapping) => void;
}) {
  const options = ["", ...headers];
  const amountSource = mapping.amountSource ?? "column";
  const readiness = mappingReadiness(mapping, autoMapping);

  function setAmountSource(mode: AmountSourceMode) {
    if (mode === "debit_credit") {
      onChange({
        ...mapping,
        amountSource: "debit_credit",
        amount: undefined,
      });
    } else {
      onChange({
        ...mapping,
        amountSource: "column",
        debitColumn: undefined,
        creditColumn: undefined,
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className={`rounded-lg border px-4 py-3 ${readiness.className}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">Mapping readiness: {readiness.label}</p>
          <p className="text-xs">
            {Object.values(mapping).filter(Boolean).length.toLocaleString("en-GB")} fields mapped
          </p>
        </div>
        <p className="mt-1 text-xs">{readiness.detail}</p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
        <p className="text-sm font-medium text-slate-800">Amount source</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAmountSource("column")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              amountSource === "column"
                ? "bg-turquoise-600 text-white"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
          >
            Single amount column
          </button>
          <button
            type="button"
            onClick={() => setAmountSource("debit_credit")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              amountSource === "debit_credit"
                ? "bg-turquoise-600 text-white"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
          >
            Debit / credit columns
          </button>
        </div>
        {amountSource === "debit_credit" && (
          <p className="text-xs text-slate-500">
            Uses debit first, then credit if debit is empty — typical for bank exports.
          </p>
        )}
      </div>

      <div className="space-y-3">
        {SYSTEM_FIELDS.map((field) => {
          if (field.key === "amount" && amountSource === "debit_credit") {
            return null;
          }

          const status = mappingStatus(field, mapping, autoMapping);
          const badge = statusBadge[status];

          return (
            <div
              key={field.key}
              className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
            >
              <div className="sm:w-44">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-800">
                    {field.label}
                    {field.required && amountSource === "column" && (
                      <span className="text-red-500 ml-0.5">*</span>
                    )}
                  </p>
                  {badge && (
                    <span
                      className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">{field.description}</p>
              </div>
              <select
                value={mapping[field.key] ?? ""}
                onChange={(e) =>
                  onChange({
                    ...mapping,
                    [field.key]: e.target.value || undefined,
                  })
                }
                className={`flex-1 rounded-lg border bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-turquoise-500/30 ${
                  status === "missing"
                    ? "border-red-300"
                    : status === "auto"
                      ? "border-emerald-200"
                      : "border-slate-200"
                }`}
              >
                {options.map((h) => (
                  <option key={h || "__skip"} value={h}>
                    {h || "— Not mapped —"}
                  </option>
                ))}
              </select>
            </div>
          );
        })}

        {amountSource === "debit_credit" && (
          <>
            {(["debitColumn", "creditColumn"] as const).map((key) => {
              const label = key === "debitColumn" ? "Debit" : "Credit";
              const autoVal = autoMapping[key];
              const value = mapping[key] ?? "";
              const siblingKey =
                key === "debitColumn" ? "creditColumn" : "debitColumn";
              const hasSibling = Boolean(mapping[siblingKey]);
              let status: MappingStatus;
              if (value) {
                status = autoVal === value ? "auto" : "manual";
              } else if (hasSibling) {
                status = "optional";
              } else {
                status = "missing";
              }
              const badge = statusBadge[status];

              return (
                <div
                  key={key}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
                >
                  <div className="sm:w-44">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-800">{label}</p>
                      {badge && (
                        <span
                          className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {key === "debitColumn" ? "Money out (spend)" : "Used if debit is empty"}
                    </p>
                  </div>
                  <select
                    value={value}
                    onChange={(e) =>
                      onChange({
                        ...mapping,
                        [key]: e.target.value || undefined,
                      })
                    }
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-turquoise-500/30"
                  >
                    {options.map((h) => (
                      <option key={h || "__skip"} value={h}>
                        {h || "— Not mapped —"}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

export function mappingConfidenceLabel(
  mapping: ColumnMapping,
  autoMapping: ColumnMapping = {}
): Record<SystemFieldKey, "auto" | "manual" | "missing"> {
  const out = {} as Record<SystemFieldKey, "auto" | "manual" | "missing">;
  for (const f of SYSTEM_FIELDS) {
    const status = mappingStatus(f, mapping, autoMapping);
    out[f.key] = status === "optional" ? "manual" : status;
  }
  return out;
}
