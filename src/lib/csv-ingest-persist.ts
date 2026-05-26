import {
  isDemoModeClient,
  loadDemoRows,
  replaceDemoRows,
  saveDemoRows,
} from "@/lib/config";
import { BATCH_SIZE } from "@/lib/import/constants";
import { filterDuplicateRows } from "@/lib/import/dedupe";
import { saveDemoJob } from "@/lib/import/demo-jobs";
import { persistReconciliationArtifacts } from "@/lib/import/process-job";
import {
  buildReconciliationResult,
  type ReconciliationResult,
} from "@/lib/import/reconciliation";
import { deleteAllSpendData, fetchSpendTransactions } from "@/lib/spend-data";
import { createClient } from "@/lib/supabase/client";
import type { Row } from "@/lib/csv-shared";
import {
  SPEND_TRANSACTIONS_TABLE,
  toSpendTransactionInsert,
} from "@/lib/spend-transaction-db";
import { isSchemaMismatchError, schemaFixHint } from "@/lib/supabase/schema";

export type PersistIngestOptions = {
  filename: string;
  replaceExisting?: boolean;
  skippedCount?: number;
};

export type PersistIngestResult = {
  ok: boolean;
  inserted: number;
  duplicateRows: number;
  importedRows: Row[];
  reconciliation?: ReconciliationResult;
  error?: string;
};

/**
 * Insert cleaned rows into spend_transactions (demo localStorage or Supabase).
 * Non-demo imports write to spend_transactions (see src/lib/supabase/schema.ts).
 */
export async function persistIngestedRows(
  rows: Row[],
  options: PersistIngestOptions
): Promise<PersistIngestResult> {
  const { filename, replaceExisting = false, skippedCount = 0 } = options;

  if (!rows.length) {
    return { ok: false, inserted: 0, duplicateRows: 0, importedRows: [], error: "No valid rows to import." };
  }

  if (isDemoModeClient()) {
    try {
      const startedAt = Date.now();
      const importId = crypto.randomUUID();
      const uploadedAt = new Date().toISOString();
      const existingRows = replaceExisting ? [] : loadDemoRows();
      const previousRows = replaceExisting ? loadDemoRows() : undefined;
      const { uniqueRows, duplicateCount } = filterDuplicateRows(rows, existingRows);
      if (replaceExisting) {
        replaceDemoRows(uniqueRows);
      } else if (uniqueRows.length) {
        saveDemoRows(uniqueRows);
      }
      const reconciliation = buildReconciliationResult({
        importId,
        organisationId: "demo",
        filename,
        uploadedBy: "demo",
        uploadedAt,
        startedAt,
        sourceRows: rows,
        importedRows: uniqueRows,
        duplicateRows: duplicateCount,
        skippedRows: skippedCount,
      });

      saveDemoJob({
        id: importId,
        filename,
        status: reconciliation.status === "verified" ? "completed" : "partial",
        totalRows: rows.length + skippedCount,
        successRows: uniqueRows.length,
        errorRows: reconciliation.exceptions.length,
        skippedRows: skippedCount + duplicateCount,
        createdAt: uploadedAt,
        completedAt: reconciliation.verifiedAt,
        mapping: {},
        errors: [],
        importedRows: uniqueRows,
        previousRows,
        reconciliation,
      });

      return { ok: true, inserted: uniqueRows.length, duplicateRows: duplicateCount, importedRows: uniqueRows, reconciliation };
    } catch (err: unknown) {
      return {
        ok: false,
        inserted: 0,
        duplicateRows: 0,
        importedRows: [],
        error: err instanceof Error ? err.message : "Could not save data.",
      };
    }
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    try {
      const existingRows = replaceExisting ? [] : loadDemoRows();
      const { uniqueRows, duplicateCount } = filterDuplicateRows(rows, existingRows);
      if (replaceExisting) {
        replaceDemoRows(uniqueRows);
      } else if (uniqueRows.length) {
        saveDemoRows(uniqueRows);
      }
      const reconciliation = buildReconciliationResult({
        importId: crypto.randomUUID(),
        organisationId: "browser",
        filename,
        uploadedBy: "browser",
        uploadedAt: new Date().toISOString(),
        sourceRows: rows,
        importedRows: uniqueRows,
        duplicateRows: duplicateCount,
        skippedRows: skippedCount,
      });
      return { ok: true, inserted: uniqueRows.length, duplicateRows: duplicateCount, importedRows: uniqueRows, reconciliation };
    } catch (err: unknown) {
      return {
        ok: false,
        inserted: 0,
        duplicateRows: 0,
        importedRows: [],
        error:
          err instanceof Error
            ? err.message
            : "Could not save data in this browser.",
      };
    }
  }

  if (replaceExisting) {
    const { error: deleteError } = await deleteAllSpendData();
    if (deleteError) {
      return { ok: false, inserted: 0, duplicateRows: 0, importedRows: [], error: deleteError };
    }
  }

  const startedAt = Date.now();
  const uploadedAt = new Date().toISOString();
  const { data: job } = await supabase
    .from("csv_import_jobs")
    .insert({
      user_id: user.id,
      filename,
      file_size_bytes: 0,
      status: "processing",
      replace_existing: replaceExisting,
      column_mapping: {},
      csv_headers: [],
      total_rows: rows.length + skippedCount,
    })
    .select("id")
    .single();
  const importId = (job?.id as string | undefined) ?? crypto.randomUUID();
  const batchExtra = job?.id ? { import_batch_id: importId } : undefined;
  const existingRows = replaceExisting ? [] : (await fetchSpendTransactions()).rows;
  const { uniqueRows, duplicateCount } = filterDuplicateRows(rows, existingRows);
  let inserted = 0;

  for (let i = 0; i < uniqueRows.length; i += BATCH_SIZE) {
    const chunk = uniqueRows.slice(i, i + BATCH_SIZE).map((r) =>
      toSpendTransactionInsert(r, user.id, batchExtra)
    );

    let { error } = await supabase.from(SPEND_TRANSACTIONS_TABLE).insert(chunk);

    if (error && isSchemaMismatchError(error.message)) {
      const legacyChunk = chunk.map(
        ({
          canonical_supplier: _c,
          pub: _p,
          description: _d,
          import_batch_id: _b,
          ...rest
        }) => rest
      );
      ({ error } = await supabase.from(SPEND_TRANSACTIONS_TABLE).insert(legacyChunk));
    }

    if (error) {
      const hint = schemaFixHint(error.message);
      return {
        ok: false,
        inserted,
        duplicateRows: duplicateCount,
        importedRows: [],
        error: hint
          ? `${hint} Original: ${error.message}`
          : `Insert failed at row ${i + 1}: ${error.message}`,
      };
    }
    inserted += chunk.length;
  }

  const importedRows = uniqueRows.slice(0, inserted);
  const reconciliation = buildReconciliationResult({
    importId,
    organisationId: user.id,
    filename,
    uploadedBy: user.id,
    uploadedAt,
    startedAt,
    sourceRows: rows,
    importedRows,
    duplicateRows: duplicateCount,
    skippedRows: skippedCount,
  });

  await persistReconciliationArtifacts(supabase, reconciliation);
  await supabase
    .from("csv_import_jobs")
    .update({
      status: reconciliation.status === "verified" ? "completed" : "partial",
      success_rows: inserted,
      error_rows: reconciliation.exceptions.length,
      skipped_rows: skippedCount + duplicateCount,
      completed_at: reconciliation.verifiedAt,
      error_summary:
        reconciliation.status === "verified" ? null : reconciliation.message,
    })
    .eq("id", importId);

  return { ok: true, inserted, duplicateRows: duplicateCount, importedRows, reconciliation };
}
