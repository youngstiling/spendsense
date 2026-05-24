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
