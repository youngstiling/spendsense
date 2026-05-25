import { cache } from "react";
import { computePubBenchmarks } from "./engines/benchmark";
import { computeBudgetVariance } from "./engines/budget-variance";
import { computeTopFinancialRisks } from "./engines/financial-risks";
import { computePortfolioOverspend } from "./engines/portfolio-overspend";
import { computePubOverspending } from "./engines/overspending";
import { computeSpendIncreases } from "./engines/spend-increases";
import { computeSupplierInflation } from "./engines/supplier-inflation";
import { portfolioMonthTotals, sortedMonthKeys } from "./month-utils";
import type { FinancialEngineResult, Transaction } from "./types";

export function runFinancialEngine(txs: Transaction[]): FinancialEngineResult {
  const months = sortedMonthKeys(txs);
  const referenceMonth = months[months.length - 1] ?? "";
  const portfolio = portfolioMonthTotals(txs);

  const spendIncreases = computeSpendIncreases(txs);
  const pubOverspends = computePubOverspending(txs);
  const portfolioOverspend = computePortfolioOverspend(txs, pubOverspends);
  const supplierInflations = computeSupplierInflation(txs);
  const budgetVariances = computeBudgetVariance(txs);
  const benchmark = computePubBenchmarks(txs);
  const topRisks = computeTopFinancialRisks(
    txs,
    spendIncreases,
    pubOverspends,
    supplierInflations,
    budgetVariances
  );

  const totalSpendThisMonth = referenceMonth
    ? (portfolio.get(referenceMonth) ?? 0)
    : 0;
  const prevMonth = months.length >= 2 ? months[months.length - 2] : null;
  const prevTotal = prevMonth ? (portfolio.get(prevMonth) ?? 0) : 0;
  const percentVsLastMonth =
    prevTotal > 0
      ? ((totalSpendThisMonth - prevTotal) / prevTotal) * 100
      : 0;

  const flaggedIncreases = spendIncreases.filter((s) => s.flagged);
  const flaggedInflation = supplierInflations.filter((s) => s.flagged);

  return {
    referenceMonth,
    spendIncreases,
    pubOverspends,
    portfolioOverspend,
    supplierInflations,
    budgetVariances,
    pubBenchmarks: benchmark.benchmarks,
    benchmarkSummary: benchmark.summary,
    benchmarkCategories: benchmark.categories,
    categoryBenchmarks: benchmark.byCategory,
    categoryBenchmarkSummaries: benchmark.summariesByCategory,
    topRisks,
    overview: {
      totalSpendThisMonth,
      percentVsLastMonth,
      overspendingPubsCount: pubOverspends.filter((p) => p.flagged).length,
      topRiskPub: topRisks[0]?.pubName ?? null,
    },
    highlights: {
      biggestRisk: topRisks[0] ?? null,
      biggestIncrease:
        flaggedIncreases[0] ?? spendIncreases[0] ?? null,
      worstSupplier:
        flaggedInflation[0] ?? supplierInflations[0] ?? null,
    },
  };
}

export const runCachedFinancialEngine = cache(
  (txs: Transaction[]) => runFinancialEngine(txs)
);
