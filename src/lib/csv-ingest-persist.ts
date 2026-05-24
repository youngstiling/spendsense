import {
  isDemoModeClient,
  loadDemoRows,
  replaceDemoRows,
  saveDemoRows,
} from "@/lib/config";
import { BATCH_SIZE } from "@/lib/import/constants";
import { saveDemoJob } from "@/lib/import/demo-jobs";
import { deleteAllSpendData } from "@/lib/spend-data";
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
    return { ok: false, inserted: 0, error: "No valid rows to import." };
  }

  if (isDemoModeClient()) {
    try {
      const previousRows = replaceExisting ? loadDemoRows() : undefined;
      if (replaceExisting) {
        replaceDemoRows(rows);
      } else {
        saveDemoRows(rows);
      }

      saveDemoJob({
        id: crypto.randomUUID(),
        filename,
        status: "completed",
        totalRows: rows.length + skippedCount,
        successRows: rows.length,
        errorRows: 0,
        skippedRows: skippedCount,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        mapping: {},
        errors: [],
        importedRows: rows,
        previousRows,
      });

      return { ok: true, inserted: rows.length };
    } catch (err: unknown) {
      return {
        ok: false,
        inserted: 0,
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
      if (replaceExisting) {
        replaceDemoRows(rows);
      } else {
        saveDemoRows(rows);
      }
      return { ok: true, inserted: rows.length };
    } catch (err: unknown) {
      return {
        ok: false,
        inserted: 0,
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
      return { ok: false, inserted: 0, error: deleteError };
    }
  }

  let inserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE).map((r) =>
      toSpendTransactionInsert(r, user.id)
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
        error: hint
          ? `${hint} Original: ${error.message}`
          : `Insert failed at row ${i + 1}: ${error.message}`,
      };
    }
    inserted += chunk.length;
  }

  return { ok: true, inserted };
}
