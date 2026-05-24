/**
 * Complete spend intelligence engine — supplier map, keywords, enrich, insights.
 */

import { buildInsightMessages } from "./dashboard-analytics";
import { measureUncategorised } from "./uncategorised";

// 1. Supplier → Category (high accuracy)
export const SUPPLIER_MAP: Record<string, string> = {
  heineken: "Drinks",
  diageo: "Drinks",
  "coca cola": "Drinks",
  pepsi: "Drinks",
  booker: "Food",
  bidfood: "Food",
  brakes: "Food",
  "scottish power": "Utilities",
  "british gas": "Utilities",
  edf: "Utilities",
  eon: "Utilities",
};

// 2. Keyword rules (fallback)
export const CATEGORY_RULES = [
  {
    name: "Drinks",
    keywords: [
      "beer",
      "lager",
      "wine",
      "vodka",
      "whisky",
      "whiskey",
      "gin",
      "cider",
    ],
  },
  {
    name: "Food",
    keywords: [
      "food",
      "meat",
      "veg",
      "vegetable",
      "bread",
      "chicken",
      "beef",
      "fish",
      "dairy",
    ],
  },
  {
    name: "Utilities",
    keywords: ["electric", "electricity", "energy", "gas", "water", "power"],
  },
  {
    name: "Cleaning",
    keywords: ["clean", "cleaning", "hygiene", "sanitation"],
  },
  {
    name: "Maintenance",
    keywords: ["repair", "maintenance", "fix", "equipment", "service"],
  },
  {
    name: "Staff Costs",
    keywords: ["wages", "salary", "payroll", "staff"],
  },
] as const;

export type SpendCategory =
  | (typeof CATEGORY_RULES)[number]["name"]
  | "Uncategorised";

export type CategorisableTransaction = {
  description?: string;
  supplier: string;
  category?: string;
};

export type EnrichedTransaction = CategorisableTransaction & {
  date: string;
  amount: number;
  pub: string;
  category: string;
  month: string;
};

function normalizeCategoryLabel(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

function monthKey(dateStr: string): string {
  const s = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 7);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "Unknown";
  return d.toISOString().slice(0, 7);
}

// 3. Categorisation
export function categoriseTransaction(tx: CategorisableTransaction): string {
  const supplier = String(tx.supplier ?? "").toLowerCase();
  const text = `${tx.description || ""} ${supplier}`.toLowerCase();

  for (const key in SUPPLIER_MAP) {
    if (supplier.includes(key)) return SUPPLIER_MAP[key]!;
  }

  for (const category of CATEGORY_RULES) {
    if (category.keywords.some((k) => text.includes(k))) {
      return category.name;
    }
  }

  return "Uncategorised";
}

// 4. Enrich dataset
export function enrichTransactions<
  T extends CategorisableTransaction & {
    date: string;
    amount: number;
    pub?: string;
  },
>(data: T[]): (T & { category: string; month: string; pub: string; amount: number })[] {
  return data.map((tx) => {
    const category = tx.category?.trim()
      ? normalizeCategoryLabel(tx.category)
      : categoriseTransaction({
          ...tx,
          supplier: String(tx.supplier ?? "UNKNOWN"),
        });

    return {
      ...tx,
      supplier: String(tx.supplier ?? "UNKNOWN"),
      amount: Number(tx.amount) || 0,
      pub: tx.pub?.trim() || "Unknown",
      category,
      month: monthKey(String(tx.date ?? "")),
    };
  });
}

// 5. Uncategorised % (by spend amount, not row count)
export function getUncategorisedPercent(
  data: Array<{ category: string; amount: number }>
): string {
  return measureUncategorised(data).percent.toFixed(1);
}

// 6. Insights generator (delegates to dashboard KPI engine)
export function generateInsights(
  data: Array<{ amount: number; pub?: string; category: string }>
): string[] {
  return buildInsightMessages(data);
}

/** DevTools after enrichTransactions — % , insights, uncategorised sample. */
export function logEnrichedCategorisation(
  enrichedData: Array<{
    category: string;
    amount: number;
    pub?: string;
  }>
) {
  console.log(getUncategorisedPercent(enrichedData));
  console.log(generateInsights(enrichedData));
  logUncategorisedSample(enrichedData);
}

/** First 20 uncategorised rows (tune SUPPLIER_MAP / CATEGORY_RULES). */
export function logUncategorisedSample(
  enrichedData: Array<{ category: string }>,
  limit = 20
) {
  console.log(
    enrichedData.filter((tx) => tx.category === "Uncategorised").slice(0, limit)
  );
}

/** Prefer explicit CSV category; otherwise run categorisation engine. */
export function resolveCategoryFromSupplier(
  supplier: string,
  categoryFromCsv: string,
  description = ""
): string {
  const fromCsv = normalizeCategoryLabel(categoryFromCsv);
  if (fromCsv) return fromCsv;
  return categoriseTransaction({ description, supplier });
}
