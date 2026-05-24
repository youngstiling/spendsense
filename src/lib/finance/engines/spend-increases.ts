import { buildPubMonthTotals, sortedMonthKeys } from "../month-utils";
import type { SpendIncrease, Transaction } from "../types";

export function computeSpendIncreases(txs: Transaction[]): SpendIncrease[] {
  const months = sortedMonthKeys(txs);
  if (months.length < 2) return [];

  const currentMonth = months[months.length - 1];
  const previousMonth = months[months.length - 2];
  const pubMonths = buildPubMonthTotals(txs);
  const results: SpendIncrease[] = [];

  for (const [pubName, monthMap] of pubMonths) {
    const currentTotal = monthMap.get(currentMonth) ?? 0;
    const previousTotal = monthMap.get(previousMonth) ?? 0;
    const absoluteIncrease = currentTotal - previousTotal;
    const percentIncrease =
      previousTotal > 0
        ? (absoluteIncrease / previousTotal) * 100
        : currentTotal > 0
          ? 100
          : 0;

    results.push({
      pubName,
      currentMonth,
      previousMonth,
      currentTotal,
      previousTotal,
      percentIncrease,
      absoluteIncrease,
      flagged: percentIncrease > 15,
    });
  }

  return results.sort((a, b) => b.percentIncrease - a.percentIncrease);
}
