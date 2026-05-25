"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { parseSpendCsv, parseSpendCsvText } from "@/lib/csv";
import { persistIngestedRows } from "@/lib/csv-ingest-persist";
import {
  isDemoModeClient,
  loadDemoRows,
  replaceDemoRows,
  saveDemoRows,
} from "@/lib/config";
import { validateMapping } from "@/lib/import/column-mapper";
import { filterDuplicateRows } from "@/lib/import/dedupe";
import { buildImportSummary } from "@/lib/import/summary";
import { saveDemoJob } from "@/lib/import/demo-jobs";
import { buildErrorPreviewRows } from "@/lib/import/error-preview";
import { errorsToCsv } from "@/lib/import/error-report";
import { validateUploadFile, validateCsvContent } from "@/lib/import/file-security";
import {
  fetchMappingTemplates,
  saveDemoMappingTemplate,
  type MappingTemplate,
} from "@/lib/import/mapping-templates";
import { MAX_IMPORT_ROWS } from "@/lib/import/constants";
import { buildParsePreview, dataStartRowNumber } from "@/lib/import/parse-rows";
import { validateMappedRows } from "@/lib/import/validator";
import {
  getUncategorisedPercent,
  logEnrichedCategorisation,
} from "@/lib/brand-category";
import { sumAmount } from "@/lib/sum-amount";
import type { ColumnMapping, ImportRowError } from "@/lib/import/types";
import type { Row } from "@/lib/csv-shared";
import { ColumnMapperUi } from "./column-mapper-ui";
import { LiveValidationPreview } from "./live-validation-preview";
import { PreviewTable, errorRowSet } from "./preview-table";
import { SupplierMatchPreview } from "./supplier-match-preview";

type Step = "upload" | "map" | "validate" | "done";
type ImportMode = "guided" | "quick";

const STEP_LABELS: Record<Step, string> = {
  upload: "Upload",
  map: "Map columns",
  validate: "Review",
  done: "Done",
};

export function CsvUploadWizard({
  onImportComplete,
}: {
  onImportComplete?: () => void;
}) {
  const router = useRouter();
  const demo = isDemoModeClient();
  const [importMode, setImportMode] = useState<ImportMode>("guided");
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [allRows, setAllRows] = useState<Record<string, string>[]>([]);
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [errors, setErrors] = useState<ImportRowError[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [validTotal, setValidTotal] = useState(0);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [truncated, setTruncated] = useState(false);
  const [sourceLabel, setSourceLabel] = useState("import.csv");
  const [rawCsvText, setRawCsvText] = useState("");
  const [autoMapping, setAutoMapping] = useState<ColumnMapping>({});
  const [detectedHeaderRow, setDetectedHeaderRow] = useState(0);
  const [savedTemplates, setSavedTemplates] = useState<MappingTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  const headerRowsToSkip = mapping.headerRowsToSkip ?? 0;
  const startRowNumber = dataStartRowNumber(headerRowsToSkip);

  const errorPreview = useMemo(
    () => buildErrorPreviewRows(allRows, errors, startRowNumber, 50),
    [allRows, errors, startRowNumber]
  );

  const errorRows = useMemo(() => errorRowSet(errors), [errors]);

  useEffect(() => {
    fetchMappingTemplates(demo).then(({ templates }) => setSavedTemplates(templates));
  }, [demo, step]);

  const loadSavedTemplate = (templateId: string) => {
    if (!templateId) {
      setSelectedTemplateId("");
      return;
    }
    const template = savedTemplates.find((t) => t.id === templateId);
    if (!template) return;
    setMapping((m) => ({ ...m, ...template.mapping }));
    setSelectedTemplateId(templateId);
    setIsError(false);
    setStatus(`Loaded template "${template.name}".`);
  };

  const reset = () => {
    setStep("upload");
    setFile(null);
    setPasteText("");
    setHeaders([]);
    setAllRows([]);
    setPreviewRows([]);
    setMapping({});
    setErrors([]);
    setValidCount(0);
    setValidTotal(0);
    setStatus("");
    setIsError(false);
    setProgress(0);
    setSourceLabel("import.csv");
    setRawCsvText("");
    setAutoMapping({});
    setDetectedHeaderRow(0);
    setSelectedTemplateId("");
  };

  const goToDashboard = () => {
    router.push("/dashboard");
    router.refresh();
  };

  const applyParsedCsv = useCallback(
    (text: string, label: string, skipRows?: number) => {
      const parsed = buildParsePreview(text, skipRows);
      const suggested = parsed.suggestedMapping;

      setRawCsvText(text);
      setHeaders(parsed.headers);
      setAllRows(parsed.allRows);
      setPreviewRows(parsed.previewRows);
      setMapping(suggested);
      setAutoMapping(suggested);
      setDetectedHeaderRow(parsed.detectedHeaderRow);
      setTruncated(parsed.truncated);
      setSourceLabel(label);
      setIsError(false);
      setStatus(
        `Found ${parsed.totalRowEstimate.toLocaleString()} rows. Map columns, then validate.`
      );
      setStep("map");
      return true;
    },
    []
  );

  const processGuidedCsv = useCallback(
    (text: string, label: string) => {
      const contentErr = validateCsvContent(text);
      if (contentErr) {
        setIsError(true);
        setStatus(contentErr);
        return false;
      }

      return applyParsedCsv(text, label);
    },
    [applyParsedCsv]
  );

  const reparseWithHeaderSkip = useCallback(
    (skip: number) => {
      if (!rawCsvText) return;
      const parsed = buildParsePreview(rawCsvText, skip);
      const suggested = parsed.suggestedMapping;
      const newHeaders = parsed.headers;
      const keep = (col?: string) =>
        col && newHeaders.includes(col) ? col : undefined;

      setHeaders(newHeaders);
      setAllRows(parsed.allRows);
      setPreviewRows(parsed.previewRows);
      setMapping((prev) => ({
        ...suggested,
        headerRowsToSkip: skip,
        date: keep(prev.date) ?? suggested.date,
        amount: keep(prev.amount) ?? suggested.amount,
        supplier: keep(prev.supplier) ?? suggested.supplier,
        description: keep(prev.description) ?? suggested.description,
        category: keep(prev.category) ?? suggested.category,
        pub: keep(prev.pub) ?? suggested.pub,
        debitColumn: keep(prev.debitColumn) ?? suggested.debitColumn,
        creditColumn: keep(prev.creditColumn) ?? suggested.creditColumn,
        amountSource: prev.amountSource ?? suggested.amountSource,
      }));
      setAutoMapping(suggested);
      setTruncated(parsed.truncated);
      setStatus(
        `Re-parsed from row ${skip + 1} — ${parsed.totalRowEstimate.toLocaleString()} data rows found.`
      );
    },
    [rawCsvText]
  );

  const handleFile = useCallback(
    async (f: File) => {
      const fileErr = validateUploadFile(f);
      if (fileErr) {
        setIsError(true);
        setStatus(fileErr);
        return;
      }

      setBusy(true);
      setProgress(10);
      setStatus("Reading file…");
      setFile(f);
      setIsError(false);

      try {
        const text = await f.text();

        if (importMode === "quick") {
          setPasteText(text);
          setProgress(100);
          setStatus(`Loaded ${f.name}. Click “Quick import” below.`);
          return;
        }

        setProgress(40);
        if (processGuidedCsv(text, f.name)) {
          setProgress(100);
        }
      } catch {
        setIsError(true);
        setStatus("Could not read file.");
      } finally {
        setBusy(false);
      }
    },
    [importMode, processGuidedCsv]
  );

  const handleGuidedPaste = () => {
    const text = pasteText.trim();
    if (!text) {
      setIsError(true);
      setStatus("Paste CSV text first.");
      return;
    }

    setBusy(true);
    setIsError(false);
    setStatus("Reading pasted CSV…");
    setFile(null);
    setSourceLabel("Pasted CSV");

    try {
      processGuidedCsv(text, "Pasted CSV");
    } finally {
      setBusy(false);
    }
  };

  async function saveQuickRows(rows: Row[], label: string, skippedCount: number) {
    if (demo) {
      try {
        const existingRows = replaceExisting ? [] : loadDemoRows();
        const previousRows = replaceExisting ? loadDemoRows() : undefined;
        const { uniqueRows, duplicateCount } = filterDuplicateRows(rows, existingRows);
        if (replaceExisting) {
          replaceDemoRows(uniqueRows);
        } else if (uniqueRows.length) {
          saveDemoRows(uniqueRows);
        }

        saveDemoJob({
          id: crypto.randomUUID(),
          filename: label,
          status: "completed",
          totalRows: rows.length + skippedCount,
          successRows: uniqueRows.length,
          errorRows: 0,
          skippedRows: skippedCount + duplicateCount,
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          mapping: {},
          errors: [],
          importedRows: uniqueRows,
          previousRows,
        });

        setIsError(false);
        setStatus(
          buildImportSummary({
            importedRows: uniqueRows,
            skippedRows: skippedCount,
            duplicateRows: duplicateCount,
            replaceExisting,
          })
        );
        setStep("done");
        onImportComplete?.();
        return true;
      } catch (err: unknown) {
        setIsError(true);
        setStatus(err instanceof Error ? err.message : "Could not save data.");
        return false;
      }
    }

    const result = await persistIngestedRows(rows, {
      filename: label,
      replaceExisting,
      skippedCount,
    });

    if (!result.ok) {
      setIsError(true);
      setStatus(result.error ?? "Import failed.");
      return false;
    }

    setIsError(false);
    setStatus(
      buildImportSummary({
        importedRows: result.importedRows,
        skippedRows: skippedCount,
        duplicateRows: result.duplicateRows,
        replaceExisting,
      })
    );
    setStep("done");
    onImportComplete?.();
    return true;
  }

  async function runQuickImport(text: string, label: string) {
    setBusy(true);
    setIsError(false);
    setProgress(20);
    setStatus("Parsing CSV…");

    try {
      const { rows, skipped, error } = parseSpendCsvText(text);

      if (error || !rows.length) {
        setIsError(true);
        setStatus(
          error
            ? `${error}${skipped ? ` (${skipped} rows skipped)` : ""}`
            : `No valid rows${skipped ? ` (${skipped} skipped)` : ""}.`
        );
        return;
      }

      setProgress(70);
      setSourceLabel(label);
      const ok = await saveQuickRows(rows, label, skipped);
      if (ok) setProgress(100);
    } catch (err: unknown) {
      setIsError(true);
      setStatus(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  async function runQuickFileImport(f: File) {
    setBusy(true);
    setIsError(false);
    setProgress(20);
    setStatus(`Parsing ${f.name}…`);

    try {
      const { rows, skipped, error } = await parseSpendCsv(f);

      if (error || !rows.length) {
        setIsError(true);
        setStatus(
          error
            ? `${error}${skipped ? ` (${skipped} rows skipped)` : ""}`
            : `No valid rows${skipped ? ` (${skipped} skipped)` : ""}.`
        );
        return;
      }

      setProgress(70);
      setSourceLabel(f.name);
      const ok = await saveQuickRows(rows, f.name, skipped);
      if (ok) setProgress(100);
    } catch (err: unknown) {
      setIsError(true);
      setStatus(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  async function loadSampleCsv() {
    setBusy(true);
    setIsError(false);
    setStatus("Loading sample file…");

    try {
      const res = await fetch("/pub_sample_20.csv");
      if (!res.ok) {
        setIsError(true);
        setStatus(`Could not load sample file (${res.status}).`);
        return;
      }
      const text = await res.text();
      setPasteText(text);
      setFile(null);
      setSourceLabel("pub_sample_20.csv");

      if (importMode === "quick") {
        await runQuickImport(text, "pub_sample_20.csv");
      } else if (processGuidedCsv(text, "pub_sample_20.csv")) {
        setStatus("Sample loaded — review column mapping.");
      }
    } catch (err: unknown) {
      setIsError(true);
      setStatus(err instanceof Error ? err.message : "Could not load sample.");
    } finally {
      setBusy(false);
    }
  }

  const runValidation = () => {
    const mapErr = validateMapping(mapping, headers);
    if (mapErr) {
      setIsError(true);
      setStatus(mapErr);
      return;
    }

    const result = validateMappedRows(allRows, mapping, startRowNumber);
    const enrichedData = result.validRows;
    logEnrichedCategorisation(enrichedData);

    setErrors(result.errors);
    setValidCount(enrichedData.length);
    setValidTotal(sumAmount(enrichedData));
    setIsError(false);
    const uncatPct = getUncategorisedPercent(enrichedData);
    setStatus(
      result.errors.length
        ? `${enrichedData.length} valid, ${result.errors.length} errors. ${uncatPct}% uncategorised.`
        : `All ${enrichedData.length} rows valid. ${uncatPct}% uncategorised.`
    );
    setStep("validate");
  };

  const downloadErrorReport = () => {
    const blob = new Blob([errorsToCsv(errors)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `import-errors-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const confirmImport = async () => {
    const mapErr = validateMapping(mapping, headers);
    if (mapErr) {
      setIsError(true);
      setStatus(mapErr);
      return;
    }

    const { validRows, errors: validationErrors } = validateMappedRows(
      allRows,
      mapping,
      startRowNumber
    );

    if (!validRows.length) {
      setIsError(true);
      setStatus("No valid rows to import. Fix errors first.");
      setErrors(validationErrors);
      return;
    }

    setBusy(true);
    setProgress(0);
    setStatus("Importing…");
    setIsError(false);

    try {
      if (demo) {
        for (let i = 0; i <= 100; i += 20) {
          setProgress(i);
          await new Promise((r) => setTimeout(r, 80));
        }
        const existingRows = replaceExisting ? [] : loadDemoRows();
        const previousRows = replaceExisting ? loadDemoRows() : undefined;
        const { uniqueRows, duplicateCount } = filterDuplicateRows(validRows, existingRows);
        if (replaceExisting) {
          replaceDemoRows(uniqueRows);
        } else if (uniqueRows.length) {
          saveDemoRows(uniqueRows);
        }
        saveDemoJob({
          id: crypto.randomUUID(),
          filename: sourceLabel,
          status: validationErrors.length ? "partial" : "completed",
          totalRows: allRows.length,
          successRows: uniqueRows.length,
          errorRows: validationErrors.length,
          skippedRows: duplicateCount,
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          mapping,
          errors: validationErrors,
          importedRows: uniqueRows,
          previousRows,
        });
        setStep("done");
        setStatus(
          buildImportSummary({
            importedRows: uniqueRows,
            duplicateRows: duplicateCount,
            errorRows: validationErrors.length,
            replaceExisting,
          })
        );
        setProgress(100);
        onImportComplete?.();
      } else {
        setProgress(30);
        const res = await fetch("/api/imports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: sourceLabel,
            mapping,
            replaceExisting,
            rows: validRows,
            errors: validationErrors,
            totalRows: allRows.length,
          }),
        });
        setProgress(80);
        const data = await res.json();
        if (!res.ok) {
          setIsError(true);
          setStatus(data.error ?? "Import failed.");
          setBusy(false);
          return;
        }
        setStep("done");
        setStatus(data.summary ?? `Imported ${data.successRows} rows.`);
        setProgress(100);
        onImportComplete?.();
      }
    } catch {
      setIsError(true);
      setStatus("Import failed. Check connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const saveTemplate = async () => {
    if (!templateName.trim()) {
      setIsError(true);
      setStatus("Enter a template name.");
      return;
    }
    if (demo) {
      saveDemoMappingTemplate(templateName.trim(), mapping);
      setIsError(false);
      setStatus(`Template "${templateName}" saved.`);
      fetchMappingTemplates(true).then(({ templates }) => setSavedTemplates(templates));
      return;
    }
    const res = await fetch("/api/mapping-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: templateName, mapping }),
    });
    const data = await res.json();
    setIsError(!res.ok);
    setStatus(res.ok ? "Template saved." : data.error ?? "Could not save template.");
    if (res.ok) {
      fetchMappingTemplates(false).then(({ templates }) => setSavedTemplates(templates));
    }
  };

  const statusIsError =
    isError ||
    status.includes("fail") ||
    status.includes("Invalid") ||
    status.includes("Missing") ||
    status.includes("Could not") ||
    status.includes("No valid");

  return (
    <div className="space-y-6">
      {importMode === "guided" && step !== "upload" && (
        <div className="flex gap-2 text-xs font-medium">
          {(["upload", "map", "validate", "done"] as Step[]).map((s, i) => (
            <span
              key={s}
              className={
                step === s
                  ? "text-turquoise-700"
                  : i < ["upload", "map", "validate", "done"].indexOf(step)
                    ? "text-slate-500"
                    : "text-slate-300"
              }
            >
              {i + 1}. {STEP_LABELS[s]}
            </span>
          ))}
        </div>
      )}

      {step === "upload" && (
        <div className="flex rounded-lg border border-slate-200 p-1 bg-slate-50">
          <button
            type="button"
            onClick={() => setImportMode("guided")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              importMode === "guided"
                ? "bg-white text-turquoise-800 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Guided import
          </button>
          <button
            type="button"
            onClick={() => setImportMode("quick")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              importMode === "quick"
                ? "bg-white text-turquoise-800 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Quick import
          </button>
        </div>
      )}

      {status && step !== "done" && (
        <div
          className={`whitespace-pre-line rounded-lg border px-4 py-3 text-sm ${
            statusIsError
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-slate-200 bg-white text-slate-700"
          }`}
        >
          {status}
          {truncated && (
            <p className="mt-1 text-xs text-amber-700">
              File truncated at {MAX_IMPORT_ROWS.toLocaleString("en-GB")} rows. Split large files for full import.
            </p>
          )}
        </div>
      )}

      {busy && (
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className="bg-turquoise-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {step === "upload" && (
        <div className="space-y-6">
          <p className="text-sm text-slate-600">
            {importMode === "guided"
              ? "Upload or paste CSV, map columns, validate, then confirm. Best for messy or unfamiliar files."
              : "For standard CSVs with date and amount columns. Imports immediately — no mapping step."}
          </p>

          {demo && (
            <button
              type="button"
              disabled={busy}
              onClick={loadSampleCsv}
              className="w-full rounded-xl border border-turquoise-200 bg-turquoise-50 px-4 py-3 text-sm font-semibold text-turquoise-900 hover:bg-turquoise-100 disabled:opacity-50"
            >
              {busy ? "Loading…" : "Load sample data (pub_sample_20.csv)"}
            </button>
          )}

          <label className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={replaceExisting}
              onChange={(e) => setReplaceExisting(e.target.checked)}
              disabled={busy}
              className="mt-0.5 rounded border-slate-300 text-turquoise-600 focus:ring-turquoise-500"
            />
            <span>Replace existing data (recommended)</span>
          </label>

          <div
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-all ${
              isDragging
                ? "border-turquoise-500 bg-turquoise-50"
                : "border-slate-200 hover:border-turquoise-400"
            } ${busy ? "opacity-60 pointer-events-none" : ""}`}
            onDragEnter={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setIsDragging(false);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const f = e.dataTransfer.files[0];
              if (f) handleFile(f);
            }}
          >
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              id="csv-upload"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
            <label htmlFor="csv-upload" className="cursor-pointer block">
              <p className="font-medium text-slate-800">Drop CSV here or click to browse</p>
              <p className="text-sm text-slate-500 mt-1">Max 50MB · .csv only</p>
            </label>
          </div>

          {importMode === "quick" && file && (
            <button
              type="button"
              disabled={busy}
              onClick={() => runQuickFileImport(file)}
              className="w-full rounded-lg bg-turquoise-600 py-3 text-sm font-semibold text-white hover:bg-turquoise-700 disabled:opacity-50"
            >
              {busy ? "Importing…" : `Quick import: ${file.name}`}
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              or paste
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="space-y-3">
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              disabled={busy}
              rows={5}
              placeholder="date,pub,supplier,description,amount"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-turquoise-500/30 focus:border-turquoise-500 disabled:opacity-60 resize-y"
            />
            <button
              type="button"
              disabled={busy || !pasteText.trim()}
              onClick={() =>
                importMode === "quick"
                  ? runQuickImport(pasteText.trim(), "Pasted CSV")
                  : handleGuidedPaste()
              }
              className="w-full rounded-lg py-2.5 text-sm font-medium bg-turquoise-600 text-white hover:bg-turquoise-700 disabled:bg-slate-200 disabled:text-slate-500"
            >
              {busy
                ? "Working…"
                : importMode === "quick"
                  ? "Quick import pasted CSV"
                  : "Continue with pasted CSV"}
            </button>
          </div>

          <div className="flex justify-center gap-3 text-sm">
            <a href="/spend_template.csv" download className="text-turquoise-700 hover:underline">
              Download template
            </a>
            <a href="/pub_sample_20.csv" download className="text-slate-600 hover:underline">
              Example file
            </a>
          </div>
        </div>
      )}

      {step === "map" && (
        <>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 flex flex-wrap items-center gap-3">
            <label className="text-sm text-slate-700 flex items-center gap-2">
              Skip rows before header:
              <input
                type="number"
                min={0}
                max={20}
                value={headerRowsToSkip}
                onChange={(e) => {
                  const skip = Math.max(0, Math.min(20, Number(e.target.value) || 0));
                  setMapping((m) => ({ ...m, headerRowsToSkip: skip }));
                  reparseWithHeaderSkip(skip);
                }}
                className="w-16 rounded border border-slate-200 px-2 py-1 text-sm"
              />
            </label>
            {detectedHeaderRow > 0 && detectedHeaderRow !== headerRowsToSkip && (
              <button
                type="button"
                onClick={() => {
                  setMapping((m) => ({ ...m, headerRowsToSkip: detectedHeaderRow }));
                  reparseWithHeaderSkip(detectedHeaderRow);
                }}
                className="text-sm text-turquoise-700 hover:underline"
              >
                Use detected header (row {detectedHeaderRow + 1})
              </button>
            )}
            <span className="text-xs text-slate-500">
              Data starts at CSV row {startRowNumber}
            </span>
          </div>
          <PreviewTable headers={headers} rows={previewRows} rowNumbers={previewRows.map((_, i) => startRowNumber + i)} />
          <p className="text-xs text-slate-500">
            Showing first {previewRows.length} of {allRows.length.toLocaleString()} rows
          </p>
          <ColumnMapperUi
            headers={headers}
            mapping={mapping}
            autoMapping={autoMapping}
            onChange={setMapping}
          />
          <LiveValidationPreview
            rows={allRows}
            mapping={mapping}
            headers={headers}
            startRowNumber={startRowNumber}
          />
          <SupplierMatchPreview rows={allRows} mapping={mapping} />
          {savedTemplates.length > 0 && (
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-sm text-slate-700 flex-1 min-w-[200px]">
                <span className="block text-xs text-slate-500 mb-1">Saved mapping template</span>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => loadSavedTemplate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Load a saved template...</option>
                  {savedTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
          <div className="flex flex-wrap gap-2 items-end">
            <input
              type="text"
              placeholder="Template name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={saveTemplate}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
            >
              Save mapping template
            </button>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep("upload")}
              className="rounded-lg border px-4 py-2 text-sm"
            >
              Back
            </button>
            <button
              type="button"
              onClick={runValidation}
              className="rounded-lg bg-turquoise-600 text-white px-4 py-2 text-sm font-medium hover:bg-turquoise-700"
            >
              Validate data
            </button>
          </div>
        </>
      )}

      {step === "validate" && (
        <>
          {errorPreview.length > 0 && (
            <>
              <p className="text-sm font-medium text-slate-800">
                Error rows (showing {errorPreview.length}
                {errors.length > errorPreview.length ? ` of ${errors.length} unique errors` : ""})
              </p>
              <PreviewTable
                headers={headers}
                rows={errorPreview.map((e) => e.data)}
                rowNumbers={errorPreview.map((e) => e.rowNumber)}
                errorRowNumbers={errorRows}
              />
            </>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg border bg-white p-4">
              <p className="text-xs text-slate-500 uppercase">Valid rows</p>
              <p className="text-2xl font-semibold text-emerald-700">{validCount}</p>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <p className="text-xs text-slate-500 uppercase">Total spend</p>
              <p className="text-2xl font-semibold text-slate-900">
                {new Intl.NumberFormat("en-GB", {
                  style: "currency",
                  currency: "GBP",
                  maximumFractionDigits: 2,
                }).format(validTotal)}
              </p>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <p className="text-xs text-slate-500 uppercase">Errors</p>
              <p className="text-2xl font-semibold text-red-700">{errors.length}</p>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <p className="text-xs text-slate-500 uppercase">Total rows</p>
              <p className="text-2xl font-semibold">{allRows.length}</p>
            </div>
          </div>
          {errors.length > 0 && (
            <div className="max-h-48 overflow-auto rounded-lg border border-red-100 bg-red-50/50 p-3 text-sm space-y-1">
              {errors.slice(0, 20).map((e, i) => (
                <p key={i} className="text-red-900">
                  Row {e.rowNumber}: {e.message}
                  {e.columnName ? ` (${e.columnName})` : ""}
                </p>
              ))}
              {errors.length > 20 && (
                <p className="text-red-700 text-xs">+ {errors.length - 20} more…</p>
              )}
            </div>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={replaceExisting}
              onChange={(e) => setReplaceExisting(e.target.checked)}
            />
            Replace existing data (recommended)
          </label>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setStep("map")} className="rounded-lg border px-4 py-2 text-sm">
              Back
            </button>
            {errors.length > 0 && (
              <button
                type="button"
                onClick={downloadErrorReport}
                className="rounded-lg border border-red-200 text-red-800 px-4 py-2 text-sm"
              >
                Download error report
              </button>
            )}
            <button
              type="button"
              disabled={busy || validCount === 0}
              onClick={confirmImport}
              className="rounded-lg bg-turquoise-600 text-white px-4 py-2 text-sm font-medium hover:bg-turquoise-700 disabled:opacity-50"
            >
              {validCount > 0 && errors.length > 0
                ? `Import ${validCount} valid rows (partial)`
                : `Import ${validCount} rows`}
            </button>
          </div>
        </>
      )}

      {step === "done" && (
        <div className="rounded-xl border bg-white p-8 text-center space-y-4">
          <p className="text-lg font-semibold text-slate-900">Import complete</p>
          <p className="whitespace-pre-line text-sm text-slate-600">{status}</p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={goToDashboard}
              className="rounded-lg bg-turquoise-600 text-white px-5 py-2.5 text-sm font-medium hover:bg-turquoise-700"
            >
              View dashboard
            </button>
            <button type="button" onClick={reset} className="rounded-lg border px-5 py-2.5 text-sm">
              Import another file
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
