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
      /^dt$/i,
    ],
  },
  {
    field: "amount",
    patterns: [
      /^net$/i,
      /^amount$/i,
      /^total$/i,
      /^value$/i,
      /spend/i,
      /net.?amount/i,
      /gross/i,
      /^price$/i,
    ],
  },
  {
    field: "description",
    patterns: [/^description$/i, /^desc$/i, /^details$/i, /narrative/i],
  },
  {
    field: "supplier",
    patterns: [
      /^supplier$/i,
      /^vendor$/i,
      /^merchant$/i,
      /^payee$/i,
      /account.?ref/i,
      /counterparty/i,
    ],
  },
  {
    field: "category",
    patterns: [
      /nominal.?name/i,
      /nominal.?code/i,
      /^nominal$/i,
      /^category$/i,
      /^class$/i,
      /expense.?type/i,
    ],
  },
  {
    field: "pub",
    patterns: [
      /^pub$/i,
      /^venue$/i,
      /^site$/i,
      /^location$/i,
      /^store$/i,
      /^branch$/i,
      /project.?ref/i,
      /cost.?code/i,
    ],
  },
];

const DEBIT_PATTERN = /^debit$/i;
const CREDIT_PATTERN = /^credit$/i;

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, " ");
}

function findHeader(headers: string[], pattern: RegExp): string | undefined {
  return headers.find((h) => pattern.test(normalizeHeader(h)) || pattern.test(h));
}

export function suggestColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const usedHeaders = new Set<string>();

  for (const { field, patterns } of MAPPING_RULES) {
    for (const header of headers) {
      if (usedHeaders.has(header)) continue;
      const norm = normalizeHeader(header);
      if (patterns.some((p) => p.test(norm) || p.test(header))) {
        mapping[field] = header;
        usedHeaders.add(header);
        break;
      }
    }
  }

  const debitHeader = findHeader(headers, DEBIT_PATTERN);
  const creditHeader = findHeader(headers, CREDIT_PATTERN);

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
