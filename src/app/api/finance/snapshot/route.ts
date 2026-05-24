import { NextResponse } from "next/server";
import { getTransactions } from "@/lib/finance/get-transactions-server";
import { runFinancialEngine } from "@/lib/finance/run-financial-engine";

export async function GET() {
  const txs = await getTransactions();
  const engine = runFinancialEngine(txs);

  return NextResponse.json({
    transactionCount: txs.length,
    engine,
  });
}
