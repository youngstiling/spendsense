import type { Row } from "@/lib/csv-shared";
import {
  spendTransactionFromDbRow,
  type SpendTransaction,
  type SpendTransactionDbRow,
} from "@/lib/supabase/schema";
import { parseTransactionDate } from "./month-utils";
import type { Transaction } from "./types";
import { validateRow, type ValidatableSpendRow } from "./validate-row";

type RawRow = Record<string, unknown>;

/** Raw/API/CSV row → canonical SpendTransaction (skips invalid rows). */
export function rowToSpendTransaction(raw: RawRow): SpendTransaction | null {
  try {
    return rowToSpendTransactionStrict(raw);
  } catch {
    return null;
  }
}

/** Throws if pub_name, date, or amount are invalid. */
export function rowToSpendTransactionStrict(
  raw: RawRow
): SpendTransaction {
  const v = validateRow({
    ...(raw as ValidatableSpendRow),
    date: String(raw.date ?? raw.transaction_date ?? "").slice(0, 10),
  });

  return spendTransactionFromDbRow({
    id: String(raw.id ?? ""),
    date: v.date,
    supplier: String(raw.supplier ?? "Unknown"),
    canonical_supplier: String(
      raw.canonical_supplier ?? raw.canonicalSupplier ?? raw.supplier ?? "Unknown"
    ),
    category: String(raw.category ?? "uncategorised"),
    amount: v.amount,
    pub_name: v.pub_name,
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
