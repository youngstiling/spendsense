import type { Row } from "@/lib/csv-shared";
import { parseTransactionDate } from "./month-utils";
import type { Transaction } from "./types";

type RawRow = Record<string, unknown>;

function rowToTransaction(raw: RawRow): Transaction | null {
  const date = parseTransactionDate(
    String(raw.date ?? raw.transaction_date ?? "")
  );
  if (!date) return null;

  const pubName =
    String(raw.pub_name ?? raw.pub ?? "Unknown").trim() || "Unknown";
  const supplier = String(raw.supplier ?? "Unknown").trim() || "Unknown";
  const canonicalSupplier =
    String(
      raw.canonical_supplier ?? raw.canonicalSupplier ?? supplier
    ).trim() || supplier;

  return {
    pubName,
    date,
    supplier,
    canonicalSupplier,
    category: String(raw.category ?? "uncategorised").trim() || "uncategorised",
    amount: Number(raw.amount) || 0,
  };
}

export function parseTransactions(rows: RawRow[]): Transaction[] {
  return rows.map(rowToTransaction).filter((t): t is Transaction => t !== null);
}

export function rowsToTransactions(rows: Row[]): Transaction[] {
  return parseTransactions(
    rows.map((r) => ({
      pub: r.pub,
      pub_name: (r as Row & { pub_name?: string }).pub_name,
      date: r.date,
      supplier: r.supplier,
      canonical_supplier: r.canonicalSupplier,
      category: r.category,
      amount: r.amount,
    }))
  );
}
