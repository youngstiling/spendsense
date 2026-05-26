import { MAX_IMPORT_ROWS, PREVIEW_ROW_LIMIT } from "./constants";
import { suggestColumnMapping } from "./column-mapper";
import type { ParsePreviewResult } from "./types";

const HEADER_KEYWORDS = [
  "date",
  "amount",
  "total",
  "net",
  "gross",
  "value",
  "debit",
  "credit",
  "supplier",
  "vendor",
  "payee",
  "counterparty",
  "account",
  "ref",
  "details",
  "description",
  "desc",
  "category",
  "nominal",
  "type",
  "pub",
  "venue",
  "site",
  "outlet",
  "location",
  "project",
  "cost",
  "merchant",
];

function scoreHeaderLine(cells: string[]): number {
  let score = 0;
  const normalized = cells.map((c) => c.trim().toLowerCase());

  for (const cell of normalized) {
    if (!cell) continue;
    if (HEADER_KEYWORDS.some((k) => cell.includes(k))) score += 2;
  }

  if (normalized.filter(Boolean).length >= 3) score += 1;
  if (normalized.length <= 1 && normalized[0]?.length > 40) score -= 4;
  if (/^report|^statement|^export|^generated/i.test(normalized[0] ?? "")) score -= 3;

  return score;
}

/** Detect preamble rows before the real CSV header (bank/ERP exports). */
export function detectHeaderRowIndex(text: string, maxScan = 15): number {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  let bestIndex = 0;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < Math.min(lines.length, maxScan); i++) {
    const cells = parseCsvLine(lines[i]);
    const score = scoreHeaderLine(cells);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return bestIndex;
}

export function parseCsvToRecords(
  text: string,
  headerRowsToSkip = 0
): {
  headers: string[];
  rows: Record<string, string>[];
  truncated: boolean;
} {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (!lines.length || headerRowsToSkip >= lines.length) {
    return { headers: [], rows: [], truncated: false };
  }

  const headerLine = lines[headerRowsToSkip];
  const headers = parseCsvLine(headerLine).map((h) => h.trim());
  const rows: Record<string, string>[] = [];
  let truncated = false;

  for (let i = headerRowsToSkip + 1; i < lines.length; i++) {
    if (rows.length >= MAX_IMPORT_ROWS) {
      truncated = true;
      break;
    }
    const cells = parseCsvLine(lines[i]);
    const record: Record<string, string> = {};
    headers.forEach((h, idx) => {
      record[h] = cells[idx] ?? "";
    });
    if (Object.values(record).some((v) => v.trim() !== "")) {
      rows.push(record);
    }
  }

  return { headers, rows, truncated };
}

/** Lightweight CSV line parser (handles quoted fields) */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

export function buildParsePreview(
  text: string,
  headerRowsToSkip?: number
): ParsePreviewResult & {
  truncated: boolean;
  allRows: Record<string, string>[];
  detectedHeaderRow: number;
} {
  const detectedHeaderRow = detectHeaderRowIndex(text);
  const skip = headerRowsToSkip ?? detectedHeaderRow;
  const { headers, rows, truncated } = parseCsvToRecords(text, skip);
  const suggestedMapping = suggestColumnMapping(headers);

  return {
    headers,
    previewRows: rows.slice(0, PREVIEW_ROW_LIMIT),
    totalRowEstimate: rows.length,
    suggestedMapping: {
      ...suggestedMapping,
      headerRowsToSkip: skip,
    },
    truncated,
    allRows: rows,
    detectedHeaderRow,
  };
}

export function dataStartRowNumber(headerRowsToSkip: number): number {
  return headerRowsToSkip + 2;
}
