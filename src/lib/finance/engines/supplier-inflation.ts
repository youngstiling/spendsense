import {
  averageOf,
  pubsForSupplier,
  sortedMonthKeys,
  supplierMonthTotals,
} from "../month-utils";
import type { SupplierInflation, Transaction } from "../types";

export function computeSupplierInflation(
  txs: Transaction[]
): SupplierInflation[] {
  const months = sortedMonthKeys(txs);
  if (months.length < 4) return [];

  const supplierMonths = supplierMonthTotals(txs);
  const recentMonths = months.slice(-3);
  const priorMonths = months.slice(-6, -3);
  const results: SupplierInflation[] = [];

  for (const [supplier, monthMap] of supplierMonths) {
    const recentValues = recentMonths.map((m) => monthMap.get(m) ?? 0);
    const priorValues = priorMonths.map((m) => monthMap.get(m) ?? 0);
    const recentAvg = averageOf(recentValues);
    const priorAvg = averageOf(priorValues);
    const inflationPercent =
      priorAvg > 0
        ? ((recentAvg - priorAvg) / priorAvg) * 100
        : recentAvg > 0
          ? 100
          : 0;

    results.push({
      supplier,
      inflationPercent,
      flagged: inflationPercent > 10,
      affectedPubs: pubsForSupplier(txs, supplier, recentMonths),
      recentAvg,
      priorAvg,
    });
  }

  return results.sort((a, b) => b.inflationPercent - a.inflationPercent);
}
