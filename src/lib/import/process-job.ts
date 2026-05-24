import type { SupabaseClient } from "@supabase/supabase-js";
import { BATCH_SIZE } from "./constants";
import type { ImportRowError, Row } from "./types";
import {
  SPEND_TRANSACTIONS_TABLE,
  toSpendTransactionInsert,
} from "@/lib/spend-transaction-db";

export async function insertRowsInBatches(
  supabase: SupabaseClient,
  userId: string,
  importId: string,
  rows: Row[],
  replaceExisting: boolean
): Promise<{ successRows: number; error?: string }> {
  if (replaceExisting) {
    await supabase
      .from(SPEND_TRANSACTIONS_TABLE)
      .delete()
      .eq("user_id", userId);
  }

  let successRows = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE).map((r) =>
      toSpendTransactionInsert(r, userId, { import_batch_id: importId })
    );

    const { error } = await supabase.from(SPEND_TRANSACTIONS_TABLE).insert(chunk);
    if (error) {
      return {
        successRows,
        error: `Batch insert failed at row ${i + 1}: ${error.message}`,
      };
    }
    successRows += chunk.length;
  }

  return { successRows };
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
