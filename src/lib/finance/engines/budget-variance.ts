import { averageOf, buildPubMonthTotals, sortedMonthKeys } from "../month-utils";
import type { BudgetVariance, Transaction } from "../types";

export function computeBudgetVariance(txs: Transaction[]): BudgetVariance[] {
  const months = sortedMonthKeys(txs);
  if (months.length < 2) return [];

  const currentMonth = months[months.length - 1];
  const budgetMonths = months.filter((m) => m < currentMonth).slice(-3);
  const pubMonths = buildPubMonthTotals(txs);
  const results: BudgetVariance[] = [];

  for (const [pubName, monthMap] of pubMonths) {
    const budgetValues = budgetMonths.map((m) => monthMap.get(m) ?? 0);
    const budget = averageOf(budgetValues);
    const actual = monthMap.get(currentMonth) ?? 0;
    const variancePercent =
      budget > 0 ? ((actual - budget) / budget) * 100 : actual > 0 ? 100 : 0;

    results.push({
      pubName,
      budget,
      actual,
      variancePercent,
      flagged: budget > 0 && variancePercent > 20,
    });
  }

  return results.sort((a, b) => b.variancePercent - a.variancePercent);
}
