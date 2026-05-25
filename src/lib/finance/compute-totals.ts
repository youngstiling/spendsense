import type { SpendTransaction } from "@/lib/supabase/schema";

export type SpendTotals = {
  total: number;
  byPub: Record<string, number>;
};

export function computeTotals(data: SpendTransaction[]): SpendTotals {
  return data.reduce(
    (acc, r) => {
      acc.total += r.amount;
      acc.byPub[r.pub_name] = (acc.byPub[r.pub_name] || 0) + r.amount;
      return acc;
    },
    {
      total: 0,
      byPub: {} as Record<string, number>,
    }
  );
}
