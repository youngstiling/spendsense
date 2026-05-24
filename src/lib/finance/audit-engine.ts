import type { SpendTransaction } from "@/lib/supabase/schema";
import type { Transaction } from "./types";

export type AuditSource = "SQL" | "ENGINE";

export type AuditMetric = "TOTAL_SPEND";

export type AuditEntry = {
  metric: AuditMetric;
  source: AuditSource;
  value: number;
  rowCount: number;
  timestamp: string;
};

export type DriftStatus = "INCOMPLETE" | "DRIFT" | "OK";

export type DriftResult = {
  status: DriftStatus;
  diff?: number;
  percent?: number;
  sql?: number;
  engine?: number;
};

export type AuditReport = {
  entries: AuditEntry[];
  drift: DriftResult;
  trust: number;
};

function now(): string {
  return new Date().toISOString();
}

export function createAuditEntry(
  metric: AuditMetric,
  source: AuditSource,
  value: number,
  rowCount: number
): AuditEntry {
  return {
    metric,
    source,
    value,
    rowCount,
    timestamp: now(),
  };
}

/** Engine path: sum parsed transaction amounts. */
export function getEngineTotalSpend(
  data: SpendTransaction[] | Transaction[]
): number {
  return data.reduce((sum, row) => sum + Number(row.amount) || 0, 0);
}

export function buildAuditLog(
  sqlTotal: number,
  sqlRowCount: number,
  transactions: SpendTransaction[] | Transaction[]
): AuditEntry[] {
  const engineTotal = getEngineTotalSpend(transactions);

  return [
    createAuditEntry("TOTAL_SPEND", "SQL", sqlTotal, sqlRowCount),
    createAuditEntry(
      "TOTAL_SPEND",
      "ENGINE",
      engineTotal,
      transactions.length
    ),
  ];
}

export function checkDrift(
  log: AuditEntry[],
  metric: AuditMetric = "TOTAL_SPEND"
): DriftResult {
  const sql = log.find((a) => a.metric === metric && a.source === "SQL")?.value;
  const engine = log.find(
    (a) => a.metric === metric && a.source === "ENGINE"
  )?.value;

  if (sql === undefined || engine === undefined) {
    return { status: "INCOMPLETE" };
  }

  if (sql === 0 && engine === 0) {
    return { status: "OK", diff: 0, percent: 0, sql, engine };
  }

  const diff = Math.abs(sql - engine);
  const percent = sql > 0 ? (diff / sql) * 100 : engine > 0 ? 100 : 0;

  return {
    status: percent > 1 ? "DRIFT" : "OK",
    diff,
    percent,
    sql,
    engine,
  };
}

export function trustScore(drift: DriftResult): number {
  if (drift.status === "INCOMPLETE") return 0;
  if (drift.status === "OK") return 100;
  const percent = drift.percent ?? 100;
  if (percent < 2) return 90;
  if (percent < 5) return 70;
  return 40;
}

export function runAuditReport(
  sqlTotal: number,
  sqlRowCount: number,
  transactions: SpendTransaction[] | Transaction[]
): AuditReport {
  const entries = buildAuditLog(sqlTotal, sqlRowCount, transactions);
  const drift = checkDrift(entries);
  return {
    entries,
    drift,
    trust: trustScore(drift),
  };
}
