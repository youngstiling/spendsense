import type { SupabaseClient } from "@supabase/supabase-js";
import { BATCH_SIZE } from "./constants";
import { filterDuplicateRows } from "./dedupe";
import type { ImportRowError, Row } from "./types";
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
