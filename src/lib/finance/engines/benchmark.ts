import {
  averageOf,
  buildPubMonthTotals,
  sortedMonthKeys,
} from "../month-utils";
import type { BenchmarkSummary, PubBenchmark, Transaction } from "../types";

export function computePubBenchmarks(txs: Transaction[]): {
  benchmarks: PubBenchmark[];
  summary: BenchmarkSummary | null;
} {
  const months = sortedMonthKeys(txs);
  if (!months.length) return { benchmarks: [], summary: null };

  const currentMonth = months[months.length - 1];
  const trailingMonths = months.slice(-6);
  const pubMonths = buildPubMonthTotals(txs);
  const currentRows = [...pubMonths.entries()]
    .map(([pubName, monthMap]) => ({
      pubName,
      currentSpend: monthMap.get(currentMonth) ?? 0,
      monthMap,
    }))
    .filter((row) => row.currentSpend > 0);

  if (!currentRows.length) return { benchmarks: [], summary: null };

  const portfolioTotal = currentRows.reduce(
    (sum, row) => sum + row.currentSpend,
    0
  );
  const averageSpendPerPub = portfolioTotal / currentRows.length;

  const benchmarks = currentRows
    .map(({ pubName, currentSpend, monthMap }) => {
      const history = trailingMonths
        .map((m) => monthMap.get(m) ?? 0)
        .filter((value) => value > 0);
      const variancePercent =
        averageSpendPerPub > 0
          ? ((currentSpend - averageSpendPerPub) / averageSpendPerPub) * 100
          : 0;
      const status =
        variancePercent > 10
          ? "ABOVE_AVERAGE"
          : variancePercent < -10
            ? "BELOW_AVERAGE"
            : "IN_LINE";

      return {
        pubName,
        currentMonth,
        rank: 0,
        currentSpend,
        portfolioAverage: averageSpendPerPub,
        variancePercent,
        sixMonthAverage: averageOf(history),
        totalSpend: history.reduce((sum, value) => sum + value, 0),
        monthsActive: history.length,
        status,
        flagged: variancePercent > 20,
      } satisfies PubBenchmark;
    })
    .sort((a, b) => b.currentSpend - a.currentSpend)
    .map((row, index) => ({ ...row, rank: index + 1 }));

  const summary: BenchmarkSummary = {
    currentMonth,
    pubCount: benchmarks.length,
    portfolioTotal,
    averageSpendPerPub,
    highestSpender: benchmarks[0]?.pubName ?? null,
    lowestSpender: benchmarks[benchmarks.length - 1]?.pubName ?? null,
    highestVariancePercent: benchmarks[0]?.variancePercent ?? 0,
  };

  return { benchmarks, summary };
}
