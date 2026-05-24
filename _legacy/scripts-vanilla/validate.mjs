import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseCsv,
  parseAmount,
  splitCsvLine,
  inferCategory,
  normalizeCategory,
  normalizeCsvText,
} from "../lib/csv.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`FAIL: ${message}`);
  }
}

// parseAmount
assert(parseAmount("$48.20") === 48.2, "parseAmount currency");
assert(parseAmount("(12.50)") === -12.5, "parseAmount parentheses");
assert(parseAmount("") === null, "parseAmount empty");

// splitCsvLine
assert(
  splitCsvLine('"Starbucks, Inc.",5.75,Food').join("|") ===
    "Starbucks, Inc.|5.75|Food",
  "splitCsvLine quoted commas"
);

// inferCategory
assert(inferCategory("Uber Ride downtown") === "Transport", "inferCategory uber");
assert(inferCategory("Netflix") === "Entertainment", "inferCategory netflix");

// normalizeCategory
assert(normalizeCategory("groceries") === "Food", "normalizeCategory alias");

// sample.csv
const sample = await readFile(join(root, "sample.csv"), "utf8");
const rows = parseCsv(sample);
assert(rows.length === 8, `sample.csv row count (got ${rows.length})`);
assert(rows[0].description === "Starbucks Coffee", "sample first row by date sort");
assert(rows[0].amount === 5.75, "sample amount");
assert(rows[0].category === "Food", "sample category");

const total = rows.reduce((s, r) => s + r.amount, 0);
const expectedCents = [575, 4820, 1599, 8734, 3250, 12400, 1840, 2215].reduce(
  (a, b) => a + b,
  0
);
assert(Math.abs(total - expectedCents / 100) < 0.01, `sample total (got ${total})`);

// alternate headers
const bankCsv = `Transaction Date,Memo,Debit
2026-05-01,Shell Gas,-42.00
2026-05-02,Payroll Deposit,2500.00`;
const bankRows = parseCsv(bankCsv);
assert(bankRows.length >= 1, "bank format parses debits");
assert(bankRows.some((r) => r.description.includes("Shell")), "bank shell row");

// negative amounts normalized
const negCsv = `Date,Description,Amount
2026-05-10,Test,-25.50`;
const negRows = parseCsv(negCsv);
assert(negRows[0]?.amount === 25.5, "negative amount normalized to positive");

// UTF-16 LE (Windows-exported CSV)
const utf16 = "D\u0000a\u0000t\u0000e\u0000,\u0000A\u0000m\u0000o\u0000u\u0000n\u0000t\u0000\n\u00002\u00000\u00002\u00006\u0000-\u00000\u00005\u0000-\u00001\u0000,\u00001\u00000\u0000.\u00000\u0000";
assert(normalizeCsvText(utf16).includes("Date"), "normalizeCsvText UTF-16");
assert(parseCsv(utf16).length === 1, "parseCsv UTF-16 row");

// empty / invalid
assert(parseCsv("").length === 0, "empty csv");
assert(parseCsv("Date,Amount\n").length === 0, "header only");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
