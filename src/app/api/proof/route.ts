import { NextRequest, NextResponse } from "next/server";
import { getSqlTotalSpend } from "@/lib/finance/audit-sql-server";
import { runAuditReport } from "@/lib/finance/audit-engine";
import { getSpendTransactions } from "@/lib/finance/get-transactions-server";

type ProofRequest = {
  metric?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as ProofRequest;
  const sql = await getSqlTotalSpend();
  const transactions = await getSpendTransactions();
  const report = runAuditReport(sql.total, sql.rowCount, transactions);
  const engineEntry = report.entries.find((e) => e.source === "ENGINE");
  const sqlEntry = report.entries.find((e) => e.source === "SQL");

  return NextResponse.json({
    metric: body.metric ?? "TOTAL_SPEND",
    value: sqlEntry?.value ?? engineEntry?.value ?? 0,
    engineValue: engineEntry?.value ?? 0,
    rowCount: sqlEntry?.rowCount ?? engineEntry?.rowCount ?? 0,
    drift: report.drift.percent ?? 0,
    status: report.drift.status,
    trust: report.trust,
  });
}
