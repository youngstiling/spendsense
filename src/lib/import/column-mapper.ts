import type { ColumnMapping, SystemFieldKey } from "./types";

/**
 * Rule-based auto-mapping: match CSV headers to system fields.
 * Order matters — first match wins per field.
 */
const MAPPING_RULES: { field: SystemFieldKey; patterns: RegExp[] }[] = [
  {
    field: "date",
    patterns: [
      /^date$/i,
      /transaction.?date/i,
      /txn.?date/i,
      /posting.?date/i,
      /invoice.?date/i,
      /document.?date/i,
      /doc.?date/i,
      /entry.?date/i,
      /payment.?date/i,
      /tax.?point/i,
      /^dt$/i,
    ],
  },
  {
    field: "amount",
    patterns: [
      /^net$/i,
      /^amount$/i,
      /amount.?gbp/i,
      /^total$/i,
      /^total.?amount$/i,
      /gross.?amount/i,
      /net.?value/i,
      /line.?value/i,
      /invoice.?total/i,
      /transaction.?amount/i,
      /^value$/i,
      /spend/i,
      /net.?amount/i,
      /gross/i,
      /^price$/i,
    ],
  },
  {
    field: "description",
    patterns: [
      /^description$/i,
      /^desc$/i,
      /^details$/i,
      /narrative/i,
      /transaction.?details/i,
      /reference/i,
      /memo/i,
      /line.?description/i,
    ],
  },
  {
    field: "supplier",
    patterns: [
      /^supplier$/i,
      /^vendor$/i,
      /vendor.?name/i,
      /^merchant$/i,
      /merchant.?name/i,
      /^payee$/i,
      /payee.?name/i,
      /supplier.?name/i,
      /vendor.?id/i,
      /trading.?name/i,
      /^name$/i,
      /account.?ref/i,
      /counterparty/i,
      /beneficiary/i,
      /paid.?to/i,
    ],
  },
  {
    field: "category",
    patterns: [
      /nominal.?name/i,
      /nominal.?code/i,
      /nominal.?ledger/i,
      /^nominal$/i,
      /^category$/i,
      /category.?name/i,
      /spend.?category/i,
      /^class$/i,
      /^department$/i,
      /^dept$/i,
      /account.?code/i,
      /ledger.?code/i,
      /^gl$/i,
      /gl.?code/i,
      /expense.?type/i,
    ],
  },
  {
    field: "pub",
    patterns: [
      /^pub$/i,
      /^venue$/i,
      /^site$/i,
      /site.?name/i,
      /^location$/i,
      /location.?name/i,
      /^store$/i,
      /^branch$/i,
      /branch.?name/i,
      /^outlet$/i,
      /outlet.?name/i,
      /^unit$/i,
      /business.?unit/i,
      /cost.?centre/i,
      /cost.?center/i,
      /project.?ref/i,
      /cost.?code/i,
    ],
  },
];

const DEBIT_PATTERNS = [
  /^debit$/i,
  /debit.?amount/i,
  /money.?out/i,
  /paid.?out/i,
  /withdrawal/i,
  /^payment$/i,
];
const CREDIT_PATTERNS = [
  /^credit$/i,
  /credit.?amount/i,
  /money.?in/i,
  /paid.?in/i,
  /receipt/i,
  /deposit/i,
];

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/[_\-./]+/g, " ")
    .replace(/\s+/g, " ");
}

function patternScore(header: string, patterns: RegExp[]): number {
  const norm = normalizeHeader(header);
  let best = 0;

  for (const pattern of patterns) {
    if (!pattern.test(norm) && !pattern.test(header)) continue;
    const exact = pattern.source.startsWith("^") && pattern.source.endsWith("$");
    best = Math.max(best, exact ? 100 : 70);
  }

  return best;
}

function findBestHeader(
  headers: string[],
  patterns: RegExp[],
  usedHeaders = new Set<string>()
): string | undefined {
  let best: { header: string; score: number } | null = null;

  for (const header of headers) {
    if (usedHeaders.has(header)) continue;
    const score = patternScore(header, patterns);
    if (score > (best?.score ?? 0)) best = { header, score };
  }

  return best?.score ? best.header : undefined;
}

export function suggestColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const usedHeaders = new Set<string>();

  for (const { field, patterns } of MAPPING_RULES) {
    const header = findBestHeader(headers, patterns, usedHeaders);
    if (header) {
      mapping[field] = header;
      usedHeaders.add(header);
    }
  }

  const debitHeader = findBestHeader(headers, DEBIT_PATTERNS);
  const creditHeader = findBestHeader(headers, CREDIT_PATTERNS);

  if (debitHeader || creditHeader) {
    mapping.amountSource = "debit_credit";
    mapping.debitColumn = debitHeader;
    mapping.creditColumn = creditHeader;
    if (mapping.amount === debitHeader || mapping.amount === creditHeader) {
      delete mapping.amount;
    }
  } else {
    mapping.amountSource = "column";
  }

  // Empty first header often holds dates (Excel export)
  if (!mapping.date && headers[0] !== undefined) {
    const first = headers[0];
    if (!first || first.trim() === "") {
      mapping.date = first;
    }
  }

  return mapping;
}

export function validateMapping(
  mapping: ColumnMapping,
  headers: string[]
): string | null {
  if (!mapping.date) {
    return "Map a column to Date (required).";
  }

  if (mapping.amountSource === "debit_credit") {
    if (!mapping.debitColumn && !mapping.creditColumn) {
      return "Map at least one of Debit or Credit columns.";
    }
  } else if (!mapping.amount) {
    return "Map a column to Amount (required).";
  }

  const headerSet = new Set(headers);
  const columnsToCheck: Array<[string, string | undefined]> = [
    ["date", mapping.date],
    ["amount", mapping.amount],
    ["supplier", mapping.supplier],
    ["description", mapping.description],
    ["category", mapping.category],
    ["pub", mapping.pub],
    ["debit", mapping.debitColumn],
    ["credit", mapping.creditColumn],
  ];

  for (const [field, col] of columnsToCheck) {
    if (!col) continue;
    if (!headerSet.has(col) && col !== "") {
      return `Mapped column "${col}" for ${field} was not found in the file.`;
    }
  }

  return null;
}
