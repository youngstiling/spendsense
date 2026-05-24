import { NextResponse } from "next/server";
import { getApiUserId } from "@/lib/import/api-auth";
import { errorsToCsv } from "@/lib/import/error-report";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

/** GET /api/imports/:id/errors — downloadable error report CSV */
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const auth = await getApiUserId();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: job } = await supabase
    .from("csv_import_jobs")
    .select("id, filename")
    .eq("id", id)
    .eq("user_id", auth.userId)
    .single();

  if (!job) {
    return NextResponse.json({ error: "Import not found." }, { status: 404 });
  }

  const { data: errors, error } = await supabase
    .from("csv_import_errors")
    .select("row_number, column_name, field_key, message, raw_value")
    .eq("import_id", id)
    .order("row_number", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const csv = errorsToCsv(
    (errors ?? []).map((e) => ({
      rowNumber: e.row_number,
      columnName: e.column_name,
      fieldKey: e.field_key as
        | "date"
        | "amount"
        | "supplier"
        | "description"
        | "category"
        | "pub"
        | "row",
      message: e.message,
      rawValue: e.raw_value ?? undefined,
    }))
  );

  const filename = `import-errors-${id.slice(0, 8)}.csv`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
