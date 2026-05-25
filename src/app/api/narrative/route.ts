import { NextRequest, NextResponse } from "next/server";
import { generateInsights } from "@/lib/finance/generate-ai-insights";
import { getTransactions } from "@/lib/finance/get-transactions-server";
import { runFinancialEngine } from "@/lib/finance/run-financial-engine";

type NarrativeRequest = {
  metric?: string;
  value?: number;
  context?: Record<string, unknown>;
};

export async function POST(request: NextRequest) {
  const metric = (await request.json().catch(() => ({}))) as NarrativeRequest;
  const transactions = await getTransactions();
  const engine = runFinancialEngine(transactions);
  const insights = await generateInsights(engine);

  const fallback =
    metric.metric && typeof metric.value === "number"
      ? `${metric.metric} is currently ${metric.value}, based on the latest spend engine output.`
      : "Spend intelligence is ready once transactions are loaded.";

  return NextResponse.json({
    narrative: insights[0] ?? fallback,
    source: process.env.OPENAI_API_KEY ? "OPENAI" : "ENGINE",
    total: engine.overview.totalSpendThisMonth,
    risks: engine.topRisks.length,
    metric,
  });
}
