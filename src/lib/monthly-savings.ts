import { calculateSavingsOpportunity } from "@/lib/savings-opportunity";

const SECONDS_PER_DAY = 86400;
const DAYS_PER_MONTH = 30.44;

type SavingsRow = {
  date: string;
  supplier: string;
  amount: number;
  pub?: string;
};

export type MonthlySavingsResult = {
  totalSavings: number;
  monthlySavings: number;
  /** days / 30.44, rounded to 1 decimal for display */
  monthSpan: number;
  startDate: string;
  endDate: string;
};

function filterByPub(rows: SavingsRow[], pub: string): SavingsRow[] {
  const needle = pub.trim().toLowerCase();
  return rows.filter((row) => (row.pub ?? "").toLowerCase() === needle);
}

/** EXTRACT(EPOCH FROM (end - start)) / 86400 */
export function totalDaysBetween(startDate: string, endDate: string): number {
  const startMs = new Date(`${startDate}T00:00:00`).getTime();
  const endMs = new Date(`${endDate}T00:00:00`).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return 0;
  return Math.max(0, (endMs - startMs) / 1000 / SECONDS_PER_DAY);
}

/** GREATEST((days / 30.44), 1) - divisor for monthly normalisation */
export function dayBasedMonthDivisor(startDate: string, endDate: string): number {
  const days = totalDaysBetween(startDate, endDate);
  return Math.max(days / DAYS_PER_MONTH, 1);
}

/** days / 30.44 rounded to 1 decimal (display only) */
export function dayBasedMonthSpan(startDate: string, endDate: string): number {
  const days = totalDaysBetween(startDate, endDate);
  return Math.round((days / DAYS_PER_MONTH) * 10) / 10;
}

/**
 * Normalised savings per month for a pub/site (day-based).
 * total_savings unchanged; monthly = total / GREATEST((days / 30.44), 1).
 */
export function calculateMonthlySavings(
  rows: SavingsRow[],
  pub: string
): MonthlySavingsResult | null {
  const scoped = filterByPub(rows, pub);
  if (!scoped.length) return null;

  const { totalSavings } = calculateSavingsOpportunity(rows, { pub });
  const dates = scoped.map((row) => row.date).sort();
  const startDate = dates[0]!;
  const endDate = dates[dates.length - 1]!;
  const divisor = dayBasedMonthDivisor(startDate, endDate);
  const monthSpan = dayBasedMonthSpan(startDate, endDate);
  const monthlySavings = totalSavings / divisor;

  return {
    totalSavings,
    monthlySavings,
    monthSpan,
    startDate,
    endDate,
  };
}
