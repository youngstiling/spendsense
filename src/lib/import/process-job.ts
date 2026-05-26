import type { SupabaseClient } from "@supabase/supabase-js";
import { BATCH_SIZE } from "./constants";
import { filterDuplicateRows } from "./dedupe";
import type { ImportRowError, Row } from "./types";
import type {
  ReconciliationException,
  ReconciliationResult,
} from "./reconciliation";
import {
  SPEND_TRANSACTIONS_TABLE,
  rowsFromSpendTransactions,
  type SpendTransactionRecord,
  toSpendTransactionInsert,
} from "@/lib/spend-transaction-db";
import { SPEND_TRANSACTION_SELECT } from "@/lib/supabase/schema";

export async function insertRowsInBatches(
  supabase: SupabaseClient,
  userId: string,
  importId: string,
  rows: Row[],
  replaceExisting: boolean
): Promise<{ successRows: number; skippedDuplicates: number; importedRows: Row[]; error?: string }> {
  let existingRows: Row[] = [];

  if (replaceExisting) {
    await supabase
      .from(SPEND_TRANSACTIONS_TABLE)
      .delete()
      .eq("user_id", userId);
  } else {
    const { data, error } = await supabase
      .from(SPEND_TRANSACTIONS_TABLE)
      .select(SPEND_TRANSACTION_SELECT)
      .eq("user_id", userId);

    if (error) {
      return {
        successRows: 0,
        skippedDuplicates: 0,
        importedRows: [],
        error: `Could not check existing rows for duplicates: ${error.message}`,
      };
    }

    existingRows = rowsFromSpendTransactions((data ?? []) as unknown as SpendTransactionRecord[]);
  }

  const { uniqueRows, duplicateCount } = filterDuplicateRows(rows, existingRows);
  let successRows = 0;

  for (let i = 0; i < uniqueRows.length; i += BATCH_SIZE) {
    const chunk = uniqueRows.slice(i, i + BATCH_SIZE).map((r) =>
      toSpendTransactionInsert(r, userId, { import_batch_id: importId })
    );

    const { error } = await supabase.from(SPEND_TRANSACTIONS_TABLE).insert(chunk);
    if (error) {
      return {
        successRows,
        skippedDuplicates: duplicateCount,
        importedRows: uniqueRows.slice(0, successRows),
        error: `Batch insert failed at row ${i + 1}: ${error.message}`,
      };
    }
    successRows += chunk.length;
  }

  return { successRows, skippedDuplicates: duplicateCount, importedRows: uniqueRows };
}

export async function persistReconciliationArtifacts(
  supabase: SupabaseClient,
  reconciliation: ReconciliationResult
): Promise<void> {
  const { certificate } = reconciliation;

  // Best effort: deployments may run before the reconciliation migration is applied.
  await supabase.from("import_verification_certificates").insert({
    import_id: certificate.importId,
    organisation_id: certificate.organisationId,
    filename: certificate.filename,
    uploaded_by: certificate.uploadedBy,
    uploaded_at: certificate.uploadedAt,
    verified_at: certificate.verifiedAt,
    source_row_count: certificate.sourceRowCount,
    imported_row_count: certificate.importedRowCount,
    source_total: certificate.sourceTotal,
    imported_total: certificate.importedTotal,
    variance: certificate.variance,
    confidence_score: certificate.confidenceScore,
    status: certificate.status,
    processing_duration_ms: certificate.processingDurationMs,
  });

  await persistStructuredExceptions(
    supabase,
    certificate.importId,
    reconciliation.exceptions
  );

  await supabase
    .from("csv_import_jobs")
    .update({
      verification_status: reconciliation.status,
      confidence_score: reconciliation.confidenceScore,
      verified_at: reconciliation.verifiedAt,
      source_total: reconciliation.source.totalSpend,
      imported_total: reconciliation.imported.totalSpend,
      reconciliation_variance: reconciliation.variance,
    })
    .eq("id", certificate.importId);
}

async function persistStructuredExceptions(
  supabase: SupabaseClient,
  importId: string,
  exceptions: ReconciliationException[]
): Promise<void> {
  if (!exceptions.length) return;

  const chunkSize = 500;
  for (let i = 0; i < exceptions.length; i += chunkSize) {
    const slice = exceptions.slice(i, i + chunkSize).map((e) => ({
      import_id: importId,
      row_number: e.rowNumber,
      error_type: e.errorType,
      column_name: e.columnName,
      original_value: e.originalValue,
      reason: e.reason,
    }));
    await supabase.from("csv_import_exceptions").insert(slice);
  }
}

export async function persistImportErrors(
  supabase: SupabaseClient,
  importId: string,
  errors: ImportRowError[]
): Promise<void> {
  if (!errors.length) return;

  const chunkSize = 500;
  for (let i = 0; i < errors.length; i += chunkSize) {
    const slice = errors.slice(i, i + chunkSize).map((e) => ({
      import_id: importId,
      row_number: e.rowNumber,
      column_name: e.columnName,
      field_key: e.fieldKey,
      message: e.message,
      raw_value: e.rawValue ?? null,
    }));
    await supabase.from("csv_import_errors").insert(slice);
  }
}
