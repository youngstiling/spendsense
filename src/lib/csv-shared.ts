import { format, isValid, parse as parseDateFns } from "date-fns";
import currency from "currency.js";
import Fuse from "fuse.js";
import {
  enrichTransactions,
  logEnrichedCategorisation,
} from "@/lib/brand-category";

export type Row = {
  date: string;
  supplier: string;
  category: string;
  amount: number;
  /** Line item / transaction description from CSV */
  description?: string;
  /** Venue / site when CSV includes a pub column */
  pub?: string;
  /** YYYY-MM from enrichTransactions */
  month?: string;
  /** Original supplier label from CSV (trimmed) */
  supplierRaw?: string;
  /** Standardised supplier for analytics grouping */
  canonicalSupplier?: string;
};

export const MAX_ROWS = 10_000;

const DATE_FORMATS = [
  "yyyy-MM-dd",
  "dd/MM/yyyy",
  "MM/dd/yyyy",
  "d/M/yyyy",
  "d-M-yyyy",
  "dd-MM-yyyy",
  "d/M/yy",
];

const CANONICAL_SUPPLIERS = [
  "TESCO",
  "AMAZON",
  "BOOKER",
  "SHELL",
  "BT",
  "DIAGEO",
  "HEINEKEN",
  "JJ FOOD",
  "BRAKES",
  "COCA COLA",
  "BRITISH GAS",
  "SCOTTISH WATER",
  "EON",
  "SKY",
  "LOCAL BUTCHER",
  "LOCAL BAKERY",
  "CLEANCO",
  "GUINNESS",
  "SMIRNOFF",
  "CAPTAIN MORGAN",
  "JACK DANIELS",
];

const supplierFuse = new Fuse(CANONICAL_SUPPLIERS, {
  threshold: 0.35,
  ignoreLocation: true,
});

function cleanRawSupplierLabel(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

function cleanSupplierText(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\b(LTD|LIMITED|PLC|UK|BV)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeSupplier(raw: string): string {
  const s = cleanSupplierText(raw);
  if (!s) return "UNKNOWN";

  const fuzzy = supplierFuse.search(s);
  if (fuzzy.length > 0 && (fuzzy[0].score ?? 1) <= 0.35) {
    return fuzzy[0].item;
  }

  const words = s.split(" ").filter(Boolean);
  return words.length <= 2 ? words.join(" ") || "UNKNOWN" : words.slice(0, 2).join(" ");
}

export type SupplierMatchPreview = {
  raw: string;
  cleaned: string;
  normalized: string;
  canonicalMatch: string | null;
};

/** Preview how a supplier name will be normalised before import. */
export function previewSupplierMatch(raw: string): SupplierMatchPreview {
  const cleaned = cleanSupplierText(raw);
  if (!cleaned) {
    return { raw, cleaned: "", normalized: "UNKNOWN", canonicalMatch: null };
  }

  const fuzzy = supplierFuse.search(cleaned);
  if (fuzzy.length > 0 && (fuzzy[0].score ?? 1) <= 0.35) {
    return {
      raw,
      cleaned,
      normalized: fuzzy[0].item,
      canonicalMatch: fuzzy[0].item,
    };
  }

  const words = cleaned.split(" ").filter(Boolean);
  const normalized =
    words.length <= 2 ? words.join(" ") || "UNKNOWN" : words.slice(0, 2).join(" ");

  return { raw, cleaned, normalized, canonicalMatch: null };
}

function col(headers: string[], match: string) {
  const h = headers.find((x) => x.toLowerCase().includes(match));
  return h ?? null;
}

/** Leading-comma exports use an empty first header; detect date column from sample values. */
function resolveDateKey(
  headers: string[],
  data: Record<string, string>[]
): string | null {
  const named = col(headers, "date");
  if (named) return named;

  const sampleRow = data[0];
  if (!sampleRow) return null;

  for (const key of headers) {
    const sample = sampleRow[key];
    if (sample && parseDate(sample)) return key;
  }

  return null;
}

export function parseAmount(raw: string): number | null {
  if (!raw?.trim()) return null;

  let s = raw.trim().replace(/\s/g, "");

  if (/^-?£?\d+,\d{1,2}$/.test(s)) {
    s = s.replace(",", ".");
  } else {
    s = s.replace(/,/g, "");
  }

  s = s.replace(/^\((.+)\)$/, "-$1");

  try {
    const value = currency(s, { symbol: "£", errorOnInvalid: true }).value;
    if (!Number.isFinite(value)) return null;
    return Math.abs(value);
  } catch {
    const n = parseFloat(s.replace(/[£]/g, ""));
    return Number.isFinite(n) ? Math.abs(n) : null;
  }
}

export function parseDate(raw: string): string | null {
  const s = raw?.trim();
  if (!s) return null;

  for (const fmt of DATE_FORMATS) {
    const d = parseDateFns(s, fmt, new Date());
    if (isValid(d)) return format(d, "yyyy-MM-dd");
  }

  const fallback = new Date(s);
  if (!Number.isNaN(fallback.getTime())) {
    return format(fallback, "yyyy-MM-dd");
  }

  return null;
}

export function buildRowsFromParsed(
  data: Record<string, string>[],
  headers: string[]
) {
  if (data.length > MAX_ROWS) {
    return { rows: [] as Row[], skipped: 0, error: "File exceeds 10,000 row limit." };
  }

  const dateKey = resolveDateKey(headers, data);
  const amountKey =
    col(headers, "amount") ??
    col(headers, "total") ??
    col(headers, "value") ??
    col(headers, "debit") ??
    col(headers, "credit");
  const pubKey = col(headers, "pub");
  const hasDescriptionHeader = col(headers, "description") != null;
  const descCol = col(headers, "desc");
  const descriptionKey = col(headers, "description") ?? descCol;
  const supplierKey =
    col(headers, "supplier") ??
    col(headers, "vendor") ??
    col(headers, "merchant") ??
    col(headers, "payee") ??
    (!hasDescriptionHeader && descCol ? descCol : null);
  const categoryKey = col(headers, "category") ?? col(headers, "type");

  if (!dateKey || !amountKey) {
    return {
      rows: [] as Row[],
      skipped: data.length,
      error: "Missing date or amount columns.",
    };
  }

  const rows: Row[] = [];
  let skipped = 0;

  for (const r of data) {
    const amount = parseAmount(r[amountKey] ?? "");
    const date = parseDate(r[dateKey] ?? "");
    if (amount === null || !date) {
      skipped++;
      continue;
    }

    const supplierRaw = supplierKey ? r[supplierKey] : "";
    const pubRaw = pubKey ? r[pubKey] : "";
    const descriptionRaw = descriptionKey
      ? cleanRawSupplierLabel(r[descriptionKey] ?? "")
      : "";
    const label =
      supplierRaw || pubRaw || descriptionRaw || "UNKNOWN";

    const pub = pubRaw?.trim() || undefined;

    const rawLabel = cleanRawSupplierLabel(supplierRaw || label) || "UNKNOWN";
    const canonicalSupplier = normalizeSupplier(supplierRaw || label);
    const categoryFromCsv = categoryKey ? r[categoryKey]?.trim() : "";

    rows.push({
      date,
      supplier: rawLabel,
      category: categoryFromCsv,
      amount,
      description: descriptionRaw || undefined,
      pub,
      supplierRaw: rawLabel,
      canonicalSupplier,
    });
  }

  const enrichedData = enrichTransactions(rows);
  logEnrichedCategorisation(enrichedData);
  return { rows: enrichedData, skipped };
}
