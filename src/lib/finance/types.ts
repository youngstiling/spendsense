export type Transaction = {
  pubName: string;
  date: Date;
  supplier: string;
  canonicalSupplier: string;
  category: string;
  amount: number;
};

export type SpendIncrease = {
  pubName: string;
  currentMonth: string;
  previousMonth: string;
  currentTotal: number;
  previousTotal: number;
  percentIncrease: number;
  absoluteIncrease: number;
  flagged: boolean;
};

export type PubOverspend = {
  pubName: string;
  expectedSpend: number;
  actualSpend: number;
  variancePercent: number;
  flagged: boolean;
};

export type PortfolioOverspend = {
  currentMonthTotal: number;
  baselineAverage: number;
  variancePercent: number;
  pubsOverspending: number;
  excessSpend: number;
  currentMonth: string;
};

export type SupplierInflation = {
  supplier: string;
  inflationPercent: number;
  flagged: boolean;
  affectedPubs: number;
  recentAvg: number;
  priorAvg: number;
};

export type BudgetVariance = {
  pubName: string;
  budget: number;
  actual: number;
  variancePercent: number;
  flagged: boolean;
};

export type BenchmarkStatus = "ABOVE_AVERAGE" | "IN_LINE" | "BELOW_AVERAGE";

export type BenchmarkConfidence = "LOW" | "MEDIUM" | "HIGH";

export type PubBenchmark = {
  pubName: string;
  currentMonth: string;
  rank: number;
  currentSpend: number;
  portfolioAverage: number;
  variancePercent: number;
  sixMonthAverage: number;
  selfTrendVariancePercent: number;
  amountVsPortfolioAverage: number;
  amountVsOwnTrend: number;
  mainDriverCategory: string;
  mainDriverAmount: number;
  confidence: BenchmarkConfidence;
  totalSpend: number;
  monthsActive: number;
  status: BenchmarkStatus;
  flagged: boolean;
};

export type BenchmarkSummary = {
  currentMonth: string;
  pubCount: number;
  portfolioTotal: number;
  averageSpendPerPub: number;
  highestSpender: string | null;
  lowestSpender: string | null;
  highestVariancePercent: number;
};

export type FinancialRisk = {
  pubName: string;
  riskScore: number;
  keyIssue: string;
};

export type FinancialEngineResult = {
  referenceMonth: string;
  spendIncreases: SpendIncrease[];
  pubOverspends: PubOverspend[];
  portfolioOverspend: PortfolioOverspend | null;
  supplierInflations: SupplierInflation[];
  budgetVariances: BudgetVariance[];
  pubBenchmarks: PubBenchmark[];
  benchmarkSummary: BenchmarkSummary | null;
  benchmarkCategories: string[];
  categoryBenchmarks: Record<string, PubBenchmark[]>;
  categoryBenchmarkSummaries: Record<string, BenchmarkSummary>;
  topRisks: FinancialRisk[];
  overview: {
    totalSpendThisMonth: number;
    percentVsLastMonth: number;
    overspendingPubsCount: number;
    topRiskPub: string | null;
  };
  highlights: {
    biggestRisk: FinancialRisk | null;
    biggestIncrease: SpendIncrease | null;
    worstSupplier: SupplierInflation | null;
  };
};
