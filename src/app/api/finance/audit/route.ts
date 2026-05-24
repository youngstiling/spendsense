import { NextResponse } from "next/server";
import { getSqlTotalSpend } from "@/lib/finance/audit-sql-server";
import { getTransactions } from "@/lib/finance/get-transactions-server";
import { runAuditReport } from "@/lib/finance/audit-engine";

export async function GET() {
  const sql = await getSqlTotalSpend();
  const transactions = await getTransactions();
  const report = runAuditReport(sql.total, sql.rowCount, transactions);

  return NextResponse.json({
    sql,
    report,
  });
}
