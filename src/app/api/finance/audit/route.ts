import { NextResponse } from "next/server";
import { getSqlTotalSpend } from "@/lib/finance/audit-sql-server";
import { getSpendTransactions } from "@/lib/finance/get-transactions-server";
import { runAuditReport } from "@/lib/finance/audit-engine";

export async function GET() {
  const sql = await getSqlTotalSpend();
  const transactions = await getSpendTransactions();
  const report = runAuditReport(sql.total, sql.rowCount, transactions);

  return NextResponse.json({
    sql,
    report,
  });
}
