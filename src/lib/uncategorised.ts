import { sumAmount } from "./sum-amount";

export function isUncategorised(category: string | undefined): boolean {
  return !category?.trim() || category === "Uncategorised";
}

/** uncategorised / total (0–1) */
export function uncategorisedRatio(
  uncategorisedAmount: number,
  total: number
): number {
  return total > 0 ? uncategorisedAmount / total : 0;
}

/** uncatPercent = (uncategorised / total) × 100 */
export function uncategorisedPercent(
  uncategorisedAmount: number,
  total: number
): number {
  return uncategorisedRatio(uncategorisedAmount, total) * 100;
}

export type UncategorisedStats = {
  amount: number;
  count: number;
  ratio: number;
  percent: number;
};

export function measureUncategorised(
  rows: Array<{ category: string; amount: number }>,
  total = sumAmount(rows)
): UncategorisedStats {
  let amount = 0;
  let count = 0;

  for (const row of rows) {
    if (isUncategorised(row.category)) {
      amount += row.amount;
      count += 1;
    }
  }

  return {
    amount,
    count,
    ratio: uncategorisedRatio(amount, total),
    percent: uncategorisedPercent(amount, total),
  };
}
