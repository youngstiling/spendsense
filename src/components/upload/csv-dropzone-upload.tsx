"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { ingestCsvFile } from "@/lib/csv-ingest";
import { persistIngestedRows } from "@/lib/csv-ingest-persist";
import { validateCsvContent, validateUploadFile } from "@/lib/import/file-security";

export function CsvDropzoneUpload() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);

  const processFile = useCallback(
    async (file: File) => {
      const fileCheck = validateUploadFile(file);
      if (fileCheck) {
        setIsError(true);
        setStatus(fileCheck);
        return;
      }

      setBusy(true);
      setIsError(false);
      setStatus(`Reading ${file.name}...`);

      try {
        const text = await file.text();
        const contentCheck = validateCsvContent(text);
        if (contentCheck) {
          setIsError(true);
          setStatus(contentCheck);
          return;
        }

        setStatus("Parsing and cleaning rows...");
        const { rows, skipped, error } = await ingestCsvFile(file);

        if (error && !rows.length) {
          setIsError(true);
          setStatus(
            error + (skipped ? ` (${skipped} row${skipped === 1 ? "" : "s"} skipped)` : "")
          );
          return;
        }

        if (!rows.length) {
          setIsError(true);
          setStatus(
            `No valid rows found${skipped ? ` (${skipped} skipped)` : ""}. Check date and amount columns.`
          );
          return;
        }

        setStatus(`Saving ${rows.length} rows...`);
        const result = await persistIngestedRows(rows, {
          filename: file.name,
          replaceExisting,
          skippedCount: skipped,
        });

        if (!result.ok) {
          setIsError(true);
          setStatus(result.error ?? "Upload failed.");
          return;
        }

        const skippedNote =
          skipped > 0 ? ` ${skipped} row${skipped === 1 ? "" : "s"} skipped.` : "";
        setStatus(`Imported ${result.inserted} rows.${skippedNote} Redirecting...`);
        router.push("/dashboard");
      } catch (err: unknown) {
        setIsError(true);
        setStatus(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setBusy(false);
      }
    },
    [replaceExisting, router]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) void processFile(file);
    },
    [processFile]
  );

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-teal-500 bg-teal-50"
            : "border-slate-200 bg-slate-50 hover:border-teal-400 hover:bg-teal-50/50"
        } ${busy ? "pointer-events-none opacity-60" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void processFile(file);
            e.target.value = "";
          }}
        />
        <p className="text-sm font-medium text-slate-800">
          {busy ? "Processing..." : "Drag and drop a CSV file here"}
        </p>
        <p className="text-xs text-slate-500 mt-2">or click to browse - .csv only</p>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={replaceExisting}
          onChange={(e) => setReplaceExisting(e.target.checked)}
          disabled={busy}
          className="rounded border-slate-300"
        />
        Replace existing data (otherwise append)
      </label>

      {status && (
        <p
          className={`text-sm rounded-lg px-3 py-2 ${
            isError
              ? "bg-red-50 text-red-800 border border-red-200"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {status}
        </p>
      )}

      <p className="text-xs text-slate-500">
        Columns are auto-mapped (date, supplier, amount, category). Bad rows are skipped
        without stopping the import. Need column mapping or Sage exports?{" "}
        <a href="/import" className="text-teal-700 hover:underline">
          Use advanced import
        </a>
        .
      </p>
    </div>
  );
}
