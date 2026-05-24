export type SupplierSavingsRow = {
  supplier: string;
  minPrice: number;
  maxPrice: number;
  transactions: number;
  potentialSavings: number;
};

export type SavingsOpportunityResult = {
  totalSavings: number;
  bySupplier: SupplierSavingsRow[];
  biggestOpportunity: SupplierSavingsRow | null;
};

type SpendRow = { supplier: string; amount: number; pub?: string };

export type SavingsOpportunityOptions = {
  /** When set, only rows for this pub/site are included (matches WHERE pub_name = ?). */
  pub?: string;
};

/**
 * Potential savings from price inconsistencies per supplier:
 * (max_price - min_price) * transaction_count, summed across suppliers with 2+ transactions.
 *
 * Optional pub filter matches:
 *   SELECT supplier, (MAX(amount)-MIN(amount))*COUNT(*) ...
 *   FROM transactions WHERE pub_name = ? GROUP BY supplier
 */
export function calculateSavingsOpportunity(
  rows: SpendRow[],
  options?: SavingsOpportunityOptions
): SavingsOpportunityResult {
  const pubFilter = options?.pub?.trim();
  const scopedRows = pubFilter
    ? rows.filter((row) => (row.pub ?? "").toLowerCase() === pubFilter.toLowerCase())
    : rows;

  const amountsBySupplier: Record<string, number[]> = {};

  for (const row of scopedRows) {
    if (!amountsBySupplier[row.supplier]) {
      amountsBySupplier[row.supplier] = [];
    }
    amountsBySupplier[row.supplier].push(row.amount);
  }

  const bySupplier: SupplierSavingsRow[] = [];

  for (const [supplier, amounts] of Object.entries(amountsBySupplier)) {
    if (amounts.length <= 1) continue;

    const minPrice = Math.min(...amounts);
    const maxPrice = Math.max(...amounts);
    const transactions = amounts.length;
    const potentialSavings = (maxPrice - minPrice) * transactions;

    bySupplier.push({
      supplier,
      minPrice,
      maxPrice,
      transactions,
      potentialSavings,
    });
  }

  bySupplier.sort((a, b) => b.potentialSavings - a.potentialSavings);

  const totalSavings = bySupplier.reduce((sum, row) => sum + row.potentialSavings, 0);

  return {
    totalSavings,
    bySupplier,
    biggestOpportunity: bySupplier[0] ?? null,
  };
}
