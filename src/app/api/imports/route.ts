import { NextResponse } from "next/server";
import { getApiUserId } from "@/lib/import/api-auth";
import { checkRateLimit } from "@/lib/import/rate-limit";
import { insertRowsInBatches, persistImportErrors } from "@/lib/import/process-job";
import { buildImportSummary } from "@/lib/import/summary";
import type { ColumnMapping, ImportRowError, Row } from "@/lib/import/types";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/** GET /api/imports — upload history */
export async function GET() {
  const auth = await getApiUserId();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("csv_import_jobs")
    .select(
      "id, filename, status, total_rows, success_rows, error_rows, skipped_rows, created_at, completed_at"
    )
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    imports: (data ?? []).map((j) => ({
      id: j.id,
      filename: j.filename,
      status: j.status,
      totalRows: j.total_rows,
      successRows: j.success_rows,
      errorRows: j.error_rows,
      skippedRows: j.skipped_rows,
      createdAt: j.created_at,
      completedAt: j.completed_at,
    })),
  });
}

type ConfirmBody = {
  filename: string;
  mapping: ColumnMapping;
  replaceExisting?: boolean;
  rows: Row[];
  errors?: ImportRowError[];
  totalRows: number;
};

/** POST /api/imports — confirm import (validated rows from client wizard) */
export async function POST(request: Request) {
  const auth = await getApiUserId();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const limit = checkRateLimit(`imports:${auth.userId}`, 10, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Retry in ${limit.retryAfterSec}s.` },
      { status: 429 }
    );
  }

  let body: ConfirmBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { filename, mapping, replaceExisting = false, rows, errors = [], totalRows } =
    body;

  if (!filename || !mapping?.date || !mapping?.amount || !Array.isArray(rows)) {
    return NextResponse.json(
      { error: "filename, mapping (date+amount), and rows are required." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const status =
    errors.length > 0 && rows.length > 0
      ? "partial"
      : errors.length > 0
        ? "failed"
        : "completed";

  const { data: job, error: jobError } = await supabase
    .from("csv_import_jobs")
    .insert({
      user_id: auth.userId,
      filename,
      file_size_bytes: 0,
      status: "processing",
      replace_existing: replaceExisting,
      column_mapping: mapping,
      csv_headers: Object.values(mapping).filter(Boolean),
      total_rows: totalRows,
    })
    .select("id")
    .single();

  if (jobError || !job) {
    return NextResponse.json(
      { error: jobError?.message ?? "Could not create import job." },
      { status: 500 }
    );
  }

  const importId = job.id as string;
  const {
    successRows,
    skippedDuplicates,
    importedRows,
    error: insertError,
  } = await insertRowsInBatches(
    supabase,
    auth.userId,
    importId,
    rows,
    replaceExisting
  );

  if (errors.length) {
    await persistImportErrors(supabase, importId, errors);
  }

  const finalStatus = insertError ? "failed" : status;
  const summary = buildImportSummary({
    importedRows,
    duplicateRows: skippedDuplicates,
    errorRows: errors.length,
    replaceExisting,
  });

  await supabase
    .from("csv_import_jobs")
    .update({
      status: finalStatus,
      success_rows: successRows,
      error_rows: errors.length,
      skipped_rows: Math.max(0, totalRows - successRows - errors.length),
      error_summary: insertError ?? null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", importId);

  if (insertError) {
    return NextResponse.json(
      {
        importId,
        status: "failed",
        error: insertError,
        successRows,
        errorRows: errors.length,
        duplicateRows: skippedDuplicates,
        summary,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    importId,
    status: finalStatus,
    totalRows,
    successRows,
    errorRows: errors.length,
    duplicateRows: skippedDuplicates,
    summary,
    skippedRows: Math.max(0, totalRows - successRows - errors.length),
    errors: errors.slice(0, 100),
  });
}
