import type { SpendTransaction } from "@/lib/supabase/schema";
import { computeTotals } from "./compute-totals";
import type { Transaction } from "./types";

export type AuditSource = "SQL" | "ENGINE";

export type AuditMetric = "TOTAL_SPEND";

export type LoggedMetric = {
  name: string;
  value: number;
  source: string;
  time: number;
};

export const auditLog: LoggedMetric[] = [];

export function logMetric(name: string, value: number, source: string) {
  auditLog.push({
    name,
    value,
    source,
    time: Date.now(),
  });
}

export type AuditEntry = {
  metric: AuditMetric;
  source: AuditSource;
  value: number;
  rowCount: number;
  timestamp: string;
};

export type DriftStatus =
  | "INCOMPLETE"
  | "PERFECT"
  | "ACCEPTABLE"
  | "WARNING"
  | "CRITICAL";

export type DriftDetection = {
  drift: number;
  status: Exclude<DriftStatus, "INCOMPLETE">;
};

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
  logMetric(metric, value, source);

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
  if (data.length && "pub_name" in data[0]) {
    return computeTotals(data as SpendTransaction[]).total;
  }
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

  const diff = Math.abs(sql - engine);
  const { drift, status } = detectDrift(sql, engine);

  return {
    status,
    diff,
    percent: drift,
    sql,
    engine,
  };
}

export function detectDrift(sql: number, engine: number): DriftDetection {
  const diff = Math.abs(sql - engine);
  const percent = sql === 0 ? (engine === 0 ? 0 : 100) : (diff / sql) * 100;

  return {
    drift: percent,
    status:
      percent === 0
        ? "PERFECT"
        : percent < 1
          ? "ACCEPTABLE"
          : percent < 5
            ? "WARNING"
            : "CRITICAL",
  };
}

export function trustScore(drift: DriftResult): number {
  if (drift.status === "INCOMPLETE") return 0;
  if (drift.status === "PERFECT") return 100;
  if (drift.status === "ACCEPTABLE") return 98;
  if (drift.status === "WARNING") return 70;
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
