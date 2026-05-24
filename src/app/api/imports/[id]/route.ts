import { NextResponse } from "next/server";
import { getApiUserId } from "@/lib/import/api-auth";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

/** GET /api/imports/:id — job status */
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const auth = await getApiUserId();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("csv_import_jobs")
    .select("*")
    .eq("id", id)
    .eq("user_id", auth.userId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Import not found." }, { status: 404 });
  }

  return NextResponse.json({
    id: data.id,
    filename: data.filename,
    status: data.status,
    totalRows: data.total_rows,
    successRows: data.success_rows,
    errorRows: data.error_rows,
    skippedRows: data.skipped_rows,
    mapping: data.column_mapping,
    createdAt: data.created_at,
    completedAt: data.completed_at,
    errorSummary: data.error_summary,
  });
}

/** DELETE /api/imports/:id — rollback batch */
export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const auth = await getApiUserId();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = await createClient();

  const { error: txError } = await supabase
    .from("spend_transactions")
    .delete()
    .eq("import_batch_id", id)
    .eq("user_id", auth.userId);

  if (txError) {
    return NextResponse.json({ error: txError.message }, { status: 500 });
  }

  await supabase
    .from("csv_import_jobs")
    .update({ status: "rolled_back", completed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", auth.userId);

  return NextResponse.json({ ok: true, importId: id, status: "rolled_back" });
}
