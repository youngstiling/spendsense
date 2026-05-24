import { NextRequest, NextResponse } from "next/server";
import { answerFinanceQuestion } from "@/lib/finance/chat-query";
import { getTransactions } from "@/lib/finance/get-transactions-server";
import { runFinancialEngine } from "@/lib/finance/run-financial-engine";
import type { FinancialEngineResult } from "@/lib/finance/types";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    question?: string;
    engine?: FinancialEngineResult;
  };
  const question = String(body.question ?? "").trim();

  if (!question) {
    return NextResponse.json({ error: "Question required" }, { status: 400 });
  }

  let engine = body.engine;
  if (!engine) {
    const txs = await getTransactions();
    engine = runFinancialEngine(txs);
  }

  const { answer, matched } = answerFinanceQuestion(question, engine);

  return NextResponse.json({ answer, matched });
}
