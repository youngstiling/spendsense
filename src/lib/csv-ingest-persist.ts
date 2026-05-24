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
 * Existing dashboard load paths pick up new rows automatically.
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
    return {
      ok: false,
      inserted: 0,
      error: "Not logged in. Open /login first.",
    };
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

    const { error } = await supabase.from(SPEND_TRANSACTIONS_TABLE).insert(chunk);
    if (error) {
      return {
        ok: false,
        inserted,
        error: `Insert failed at row ${i + 1}: ${error.message}`,
      };
    }
    inserted += chunk.length;
  }

  return { ok: true, inserted };
}
