/** Row shape before validation (CSV, API, or DB). */
export type ValidatableSpendRow = {
  pub_name?: string | null;
  /** DB / legacy CSV column — normalized to pub_name */
  pub?: string | null;
  date?: string | null;
  amount?: unknown;
  [key: string]: unknown;
};

export type ValidatedSpendRow = ValidatableSpendRow & {
  pub_name: string;
  date: string;
  amount: number;
};

/**
 * Strict row validation for spend_transactions ingest.
 * Requires pub_name (or pub), date, and numeric amount.
 */
export function validateRow(r: ValidatableSpendRow): ValidatedSpendRow {
  const pub_name = String(r.pub_name ?? r.pub ?? "").trim();
  if (!pub_name) throw new Error("Missing pub_name");

  const date = String(r.date ?? "").trim();
  if (!date) throw new Error("Missing date");

  const amount = Number(r.amount);
  if (Number.isNaN(amount)) throw new Error("Invalid amount");

  return {
    ...r,
    pub_name,
    date,
    amount,
  };
}
