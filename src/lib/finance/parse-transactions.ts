import type { Row } from "@/lib/csv-shared";
import {
  spendTransactionFromDbRow,
  type SpendTransaction,
  type SpendTransactionDbRow,
} from "@/lib/supabase/schema";
import { parseTransactionDate } from "./month-utils";
import type { Transaction } from "./types";

type RawRow = Record<string, unknown>;

/** Raw/API/CSV row → canonical SpendTransaction. */
export function rowToSpendTransaction(raw: RawRow): SpendTransaction | null {
  const dateStr = String(raw.date ?? raw.transaction_date ?? "").slice(0, 10);
  if (!dateStr) return null;

  return spendTransactionFromDbRow({
    id: String(raw.id ?? ""),
    date: dateStr,
    supplier: String(raw.supplier ?? "Unknown"),
    canonical_supplier: String(
      raw.canonical_supplier ?? raw.canonicalSupplier ?? raw.supplier ?? "Unknown"
    ),
    category: String(raw.category ?? "uncategorised"),
    amount: Number(raw.amount) || 0,
    pub: raw.pub as string | null | undefined,
    pub_name: raw.pub_name as string | null | undefined,
  });
}

export function parseSpendTransactions(rows: RawRow[]): SpendTransaction[] {
  return rows
    .map(rowToSpendTransaction)
    .filter((t): t is SpendTransaction => t !== null);
}

export function rowsToSpendTransactions(rows: Row[]): SpendTransaction[] {
  return parseSpendTransactions(
    rows.map((r) => ({
      id: (r as Row & { id?: string }).id,
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

/** Canonical rows → engine input (Date objects, pubName). */
export function spendTransactionsToEngineRows(
  txs: SpendTransaction[]
): Transaction[] {
  return txs
    .map((tx) => {
      const date = parseTransactionDate(tx.date);
      if (!date) return null;
      return {
        pubName: tx.pub_name,
        date,
        supplier: tx.supplier,
        canonicalSupplier: tx.canonical_supplier,
        category: tx.category,
        amount: tx.amount,
      };
    })
    .filter((t): t is Transaction => t !== null);
}

/** @deprecated Use parseSpendTransactions */
export function parseTransactions(rows: RawRow[]): Transaction[] {
  return spendTransactionsToEngineRows(parseSpendTransactions(rows));
}

/** @deprecated Use rowsToSpendTransactions */
export function rowsToTransactions(rows: Row[]): Transaction[] {
  return spendTransactionsToEngineRows(rowsToSpendTransactions(rows));
}

export function spendTransactionToEngineRow(tx: SpendTransaction): Transaction {
  const rows = spendTransactionsToEngineRows([tx]);
  return (
    rows[0] ?? {
      pubName: tx.pub_name,
      date: new Date(tx.date),
      supplier: tx.supplier,
      canonicalSupplier: tx.canonical_supplier,
      category: tx.category,
      amount: tx.amount,
    }
  );
}
