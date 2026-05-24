/** total = sum(amount) */
export function sumAmount(rows: { amount?: number }[]): number {
  const total = rows.reduce((sum, t) => sum + (t.amount || 0), 0);
  const safeTotal = total || 0;
  return safeTotal;
}
