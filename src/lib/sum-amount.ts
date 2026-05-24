/** total = sum(amount) */
export function sumAmount(rows: { amount: number }[]): number {
  return rows.reduce((total, row) => total + row.amount, 0);
}
