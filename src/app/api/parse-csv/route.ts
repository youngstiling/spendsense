import { NextResponse } from "next/server";
import { parseCSV } from "@/lib/parser";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    let content: string;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");
      if (!file || typeof file === "string") {
        return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
      }
      content = await file.text();
    } else if (contentType.includes("application/json")) {
      const body = await req.json();
      content = (body.content ?? body.text ?? "") as string;
    } else {
      content = await req.text();
    }

    if (!content.trim()) {
      return NextResponse.json({ error: "Empty CSV content." }, { status: 400 });
    }

    const result = parseCSV(content);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Parse failed." },
      { status: 500 }
    );
  }
}
