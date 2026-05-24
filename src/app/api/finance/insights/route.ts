import { NextResponse } from "next/server";
import { getTransactions } from "@/lib/finance/get-transactions-server";
import { generateInsights } from "@/lib/finance/generate-ai-insights";
import { runFinancialEngine } from "@/lib/finance/run-financial-engine";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    engine?: ReturnType<typeof runFinancialEngine>;
  };

  let engine = body.engine;
  if (!engine) {
    const txs = await getTransactions();
    engine = runFinancialEngine(txs);
  }

  const insights = await generateInsights(engine);

  return NextResponse.json({ insights, engine });
}
