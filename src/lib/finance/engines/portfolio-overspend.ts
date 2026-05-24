import { averageOf, portfolioMonthTotals, sortedMonthKeys } from "../month-utils";
import type { PortfolioOverspend, PubOverspend, Transaction } from "../types";

export function computePortfolioOverspend(
  txs: Transaction[],
  pubOverspends: PubOverspend[]
): PortfolioOverspend | null {
  const months = sortedMonthKeys(txs);
  if (!months.length) return null;

  const currentMonth = months[months.length - 1];
  const portfolio = portfolioMonthTotals(txs);
  const priorMonths = months.filter((m) => m < currentMonth).slice(-6);
  const historicalTotals = priorMonths.map((m) => portfolio.get(m) ?? 0);
  const baselineAverage = averageOf(historicalTotals);
  const currentMonthTotal = portfolio.get(currentMonth) ?? 0;
  const variancePercent =
    baselineAverage > 0
      ? ((currentMonthTotal - baselineAverage) / baselineAverage) * 100
      : 0;
  const excessSpend = Math.max(0, currentMonthTotal - baselineAverage);

  return {
    currentMonth,
    currentMonthTotal,
    baselineAverage,
    variancePercent,
    pubsOverspending: pubOverspends.filter((p) => p.flagged).length,
    excessSpend,
  };
}
