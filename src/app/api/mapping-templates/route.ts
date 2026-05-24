import { NextResponse } from "next/server";
import { getApiUserId } from "@/lib/import/api-auth";
import type { ColumnMapping } from "@/lib/import/types";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const auth = await getApiUserId();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("csv_column_mapping_templates")
    .select("id, name, mapping, created_at")
    .eq("user_id", auth.userId)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ templates: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await getApiUserId();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json()) as { name?: string; mapping?: ColumnMapping };
  if (!body.name?.trim() || !body.mapping) {
    return NextResponse.json({ error: "name and mapping required." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("csv_column_mapping_templates")
    .upsert(
      {
        user_id: auth.userId,
        name: body.name.trim(),
        mapping: body.mapping,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,name" }
    )
    .select("id, name, mapping")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ template: data });
}
