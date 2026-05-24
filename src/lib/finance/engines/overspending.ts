import {
  averageOf,
  buildPubMonthTotals,
  sortedMonthKeys,
} from "../month-utils";
import type { PubOverspend, Transaction } from "../types";

export function computePubOverspending(txs: Transaction[]): PubOverspend[] {
  const months = sortedMonthKeys(txs);
  if (!months.length) return [];

  const currentMonth = months[months.length - 1];
  const priorMonths = months.filter((m) => m < currentMonth).slice(-6);
  const pubMonths = buildPubMonthTotals(txs);
  const results: PubOverspend[] = [];

  for (const [pubName, monthMap] of pubMonths) {
    const actualSpend = monthMap.get(currentMonth) ?? 0;
    const historical = priorMonths.map((m) => monthMap.get(m) ?? 0);
    const expectedSpend = averageOf(historical);
    const variancePercent =
      expectedSpend > 0
        ? ((actualSpend - expectedSpend) / expectedSpend) * 100
        : actualSpend > 0
          ? 100
          : 0;

    results.push({
      pubName,
      expectedSpend,
      actualSpend,
      variancePercent,
      flagged: expectedSpend > 0 && variancePercent > 20,
    });
  }

  return results.sort((a, b) => b.variancePercent - a.variancePercent);
}
