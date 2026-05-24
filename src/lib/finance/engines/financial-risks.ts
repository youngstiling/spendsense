import type {
  BudgetVariance,
  FinancialRisk,
  PubOverspend,
  SpendIncrease,
  SupplierInflation,
  Transaction,
} from "../types";

export function computeTopFinancialRisks(
  txs: Transaction[],
  spendIncreases: SpendIncrease[],
  pubOverspends: PubOverspend[],
  supplierInflations: SupplierInflation[],
  budgetVariances: BudgetVariance[]
): FinancialRisk[] {
  const inflatedSuppliers = new Set(
    supplierInflations.filter((s) => s.flagged).map((s) => s.supplier)
  );

  const pubSupplierExposure = new Map<string, number>();
  for (const t of txs) {
    if (!inflatedSuppliers.has(t.canonicalSupplier)) continue;
    pubSupplierExposure.set(
      t.pubName,
      (pubSupplierExposure.get(t.pubName) ?? 0) + 1
    );
  }

  const increaseByPub = new Map(
    spendIncreases.map((s) => [s.pubName, s])
  );
  const overspendByPub = new Map(pubOverspends.map((p) => [p.pubName, p]));
  const budgetByPub = new Map(budgetVariances.map((b) => [b.pubName, b]));

  const pubs = new Set([
    ...spendIncreases.map((s) => s.pubName),
    ...pubOverspends.map((p) => p.pubName),
    ...budgetVariances.map((b) => b.pubName),
  ]);

  const risks: FinancialRisk[] = [];

  for (const pubName of pubs) {
    let riskScore = 0;
    const issues: string[] = [];

    const overspend = overspendByPub.get(pubName);
    if (overspend?.flagged) {
      riskScore += 2;
      issues.push(`Overspending ${overspend.variancePercent.toFixed(0)}% vs 6-mo avg`);
    }

    if ((pubSupplierExposure.get(pubName) ?? 0) > 0) {
      riskScore += 2;
      issues.push("Exposure to inflating suppliers");
    }

    const increase = increaseByPub.get(pubName);
    if (increase?.flagged) {
      riskScore += 1;
      issues.push(`MoM spend up ${increase.percentIncrease.toFixed(0)}%`);
    }

    const budget = budgetByPub.get(pubName);
    if (budget?.flagged) {
      riskScore += 2;
      issues.push(`Budget variance ${budget.variancePercent.toFixed(0)}%`);
    }

    if (riskScore === 0) continue;

    risks.push({
      pubName,
      riskScore,
      keyIssue: issues[0] ?? "Elevated financial risk",
    });
  }

  return risks
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5);
}
