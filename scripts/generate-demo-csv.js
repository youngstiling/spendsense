/**
 * Generates SpendSense demo CSVs with deliberate story beats for the dashboard:
 * - 12 pubs, 4 months
 * - DIAGEO supplier dependency (>25%)
 * - ~12% uncategorised rows
 * - Monthly spend trend (latest month up vs previous)
 * - BOOKER price inconsistency (wide order spread)
 * - Messy dates/amounts/supplier spellings (parser stress-test)
 *
 * Usage:
 *   node scripts/generate-demo-csv.js           → public/pub_demo_portfolio.csv
 *   node scripts/generate-demo-csv.js --small   → public/pub_sample_50.csv
 */

const fs = require("fs");
const path = require("path");

const PUBS = [
  "Red Lion - Glasgow",
  "Kings Arms - Edinburgh",
  "The Crown - Stirling",
  "Black Bull - Dundee",
  "Queens Head - Aberdeen",
  "The Anchor - Perth",
  "White Hart - Inverness",
  "The Swan - Ayr",
  "The Plough - Falkirk",
  "Royal Oak - Paisley",
  "The Ship Inn - Oban",
  "Fox & Hound - Hamilton",
];

const SUPPLIER_VARIANTS = {
  diageo: ["Diageo Ltd", "DIAGEO", "Diageo PLC", "diageo ltd", "Diageo Limited"],
  heineken: ["Heineken UK Ltd", "HEINEKEN", "Heineken UK", "heinekenuk"],
  booker: ["Booker Wholesale", "BOOKER", "Booker Ltd", "Booker"],
  brakes: ["Brakes Catering", "BRAKES UK", "Brakes", "brakes"],
  jj: ["JJ Food Service", "JJ Foods", "J J Food"],
  coca: ["Coca Cola Europacific", "Coca Cola", "COCA-COLA EUROPACIFIC"],
  amazon: ["Amazon Business", "Amazon", "AmazonBusiness"],
  utilities: ["British Gas", "Scottish Water", "BT PLC", "E.ON", "EON Energy"],
  local: ["Local Butcher", "Local Bakery", "Local Fishmonger"],
  other: ["CleanCo", "Bidfood", "Costco UK", "Sky Business"],
};

const CATEGORIES = {
  diageo: "Alcohol",
  heineken: "Alcohol",
  booker: "Food",
  brakes: "Food",
  jj: "Food",
  coca: "Soft Drinks",
  amazon: "Supplies",
  utilities: "Utilities",
  local: "Food",
  other: "Supplies",
};

/** @type {Record<string, { month: number, count: number, amount: (i: number) => number, category?: string | null }[]>} */
const MONTH_PLAN = {
  "2026-01": [
    { key: "diageo", count: 5, amount: () => pick([1180, 1245, 1290, 1320, 1380]) },
    { key: "heineken", count: 3, amount: () => pick([920, 965, 990]) },
    { key: "booker", count: 4, amount: (i) => [420, 510, 680, 720][i % 4] },
    { key: "brakes", count: 3, amount: () => pick([440, 498, 540]) },
    { key: "jj", count: 2, amount: () => pick([580, 640]) },
    { key: "coca", count: 2, amount: () => pick([690, 765]) },
    { key: "amazon", count: 2, amount: () => pick([88, 120]) },
    { key: "utilities", count: 4, amount: () => pick([98, 210, 285, 310]) },
    { key: "local", count: 2, amount: () => pick([145, 342]) },
    { key: "other", count: 2, amount: () => pick([95, 210]) },
    { key: "uncategorised", count: 3, amount: () => pick([180, 240, 310]), category: "" },
  ],
  "2026-02": [
    { key: "diageo", count: 6, amount: () => pick([1250, 1290, 1310, 1350, 1400, 1420]) },
    { key: "heineken", count: 4, amount: () => pick([890, 950, 970, 1020]) },
    { key: "booker", count: 5, amount: (i) => [450, 520, 710, 780, 890][i % 5] },
    { key: "brakes", count: 3, amount: () => pick([456, 500, 522]) },
    { key: "jj", count: 2, amount: () => pick([612, 640]) },
    { key: "coca", count: 2, amount: () => pick([690, 765]) },
    { key: "amazon", count: 2, amount: () => pick([95, 110]) },
    { key: "utilities", count: 3, amount: () => pick([220, 300, 310]) },
    { key: "local", count: 3, amount: () => pick([330, 360, 342]) },
    { key: "other", count: 2, amount: () => pick([205, 420]) },
    { key: "uncategorised", count: 4, amount: () => pick([150, 220, 275, 390]), category: "" },
  ],
  "2026-03": [
    { key: "diageo", count: 7, amount: () => pick([1280, 1320, 1360, 1380, 1400, 1450, 1480]) },
    { key: "heineken", count: 4, amount: () => pick([910, 980, 1010, 1050]) },
    { key: "booker", count: 5, amount: (i) => [480, 590, 740, 820, 910][i % 5] },
    { key: "brakes", count: 4, amount: () => pick([470, 510, 540, 580]) },
    { key: "jj", count: 3, amount: () => pick([620, 655, 700]) },
    { key: "coca", count: 3, amount: () => pick([710, 755, 800]) },
    { key: "amazon", count: 2, amount: () => pick([105, 130]) },
    { key: "utilities", count: 4, amount: () => pick([105, 220, 295, 320]) },
    { key: "local", count: 3, amount: () => pick([155, 340, 380]) },
    { key: "other", count: 3, amount: () => pick([210, 280, 450]) },
    { key: "uncategorised", count: 5, amount: () => pick([190, 260, 310, 350, 410]), category: "" },
  ],
  "2026-04": [
    { key: "diageo", count: 8, amount: () => pick([1300, 1340, 1380, 1400, 1420, 1460, 1500, 1520]) },
    { key: "heineken", count: 5, amount: () => pick([930, 990, 1040, 1080, 1120]) },
    { key: "booker", count: 6, amount: (i) => [460, 540, 720, 850, 920, 980][i % 6] },
    { key: "brakes", count: 4, amount: () => pick([490, 530, 560, 600]) },
    { key: "jj", count: 3, amount: () => pick([640, 680, 720]) },
    { key: "coca", count: 3, amount: () => pick([720, 780, 820]) },
    { key: "amazon", count: 3, amount: () => pick([100, 115, 145]) },
    { key: "utilities", count: 4, amount: () => pick([110, 225, 305, 330]) },
    { key: "local", count: 3, amount: () => pick([160, 350, 395]) },
    { key: "other", count: 3, amount: () => pick([215, 295, 480]) },
    { key: "uncategorised", count: 6, amount: () => pick([200, 250, 300, 340, 380, 420]), category: "" },
  ],
};

let seq = 0;
function pick(arr) {
  return arr[seq++ % arr.length];
}

function formatDate(ymd, styleIndex) {
  const [y, m, d] = ymd.split("-").map(Number);
  const styles = [
    () => ymd,
    () => `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`,
    () => `${m}/${d}/${y}`,
    () => `${d}-${m}-${y}`,
  ];
  return styles[styleIndex % styles.length]();
}

function formatAmount(n, styleIndex) {
  const base = n.toFixed(2);
  if (styleIndex % 5 === 0) return `£${base}`;
  if (styleIndex % 7 === 0) return base.replace(".", ",");
  return base;
}

function escapeCsv(value) {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Compact plan: exactly 48 rows; all four dashboard insights still fire. */
const SMALL_PLAN = {
  "2026-01": [
    { key: "diageo", count: 2, amount: () => pick([1180, 1320]) },
    { key: "heineken", count: 1, amount: () => 990 },
    { key: "booker", count: 3, amount: (i) => [420, 510, 720][i] },
    { key: "brakes", count: 1, amount: () => 540 },
    { key: "coca", count: 1, amount: () => 765 },
    { key: "utilities", count: 2, amount: () => pick([210, 310]) },
    { key: "uncategorised", count: 2, amount: () => pick([180, 240]), category: "" },
  ],
  "2026-02": [
    { key: "diageo", count: 2, amount: () => pick([1290, 1400]) },
    { key: "heineken", count: 1, amount: () => 1020 },
    { key: "booker", count: 3, amount: (i) => [450, 780, 890][i] },
    { key: "brakes", count: 1, amount: () => 522 },
    { key: "amazon", count: 1, amount: () => 110 },
    { key: "local", count: 2, amount: () => pick([330, 342]) },
    { key: "uncategorised", count: 2, amount: () => pick([150, 275]), category: "" },
  ],
  "2026-03": [
    { key: "diageo", count: 2, amount: () => pick([1280, 1480]) },
    { key: "heineken", count: 1, amount: () => 1050 },
    { key: "booker", count: 3, amount: (i) => [590, 820, 910][i] },
    { key: "jj", count: 1, amount: () => 700 },
    { key: "coca", count: 1, amount: () => 755 },
    { key: "utilities", count: 2, amount: () => pick([220, 320]) },
    { key: "uncategorised", count: 2, amount: () => pick([260, 350]), category: "" },
  ],
  "2026-04": [
    { key: "diageo", count: 3, amount: () => pick([1340, 1460, 1520]) },
    { key: "heineken", count: 1, amount: () => 1120 },
    { key: "booker", count: 3, amount: (i) => [540, 850, 980][i] },
    { key: "brakes", count: 1, amount: () => 600 },
    { key: "amazon", count: 1, amount: () => 145 },
    { key: "other", count: 1, amount: () => 480 },
    { key: "uncategorised", count: 2, amount: () => pick([300, 420]), category: "" },
  ],
};

function buildRows(plan, maxRows) {
  const rows = [];
  let rowIndex = 0;
  let pubIndex = 0;

  for (const [month, monthPlan] of Object.entries(plan)) {
    for (const block of monthPlan) {
      const variants = SUPPLIER_VARIANTS[block.key === "uncategorised" ? "other" : block.key];
      const defaultCategory =
        block.category !== undefined
          ? block.category
          : CATEGORIES[block.key] ?? "";

      for (let i = 0; i < block.count; i++) {
        if (maxRows && rows.length >= maxRows) return rows;

        const day = 1 + ((rowIndex * 3 + i) % 28);
        const ymd = `${month}-${String(day).padStart(2, "0")}`;
        const supplier = variants[(rowIndex + i) % variants.length];
        const pub = PUBS[pubIndex % PUBS.length];
        pubIndex++;

        const amount = block.amount(i);
        const category =
          block.key === "uncategorised"
            ? ""
            : block.category === null
              ? ""
              : defaultCategory;

        rows.push({
          date: formatDate(ymd, rowIndex),
          pub,
          supplier,
          amount: formatAmount(amount, rowIndex),
          category,
        });
        rowIndex++;
      }
    }
  }

  return rows;
}

function toCsv(rows) {
  const header = "date,pub,supplier,amount,category";
  const lines = rows.map((r) =>
    [r.date, r.pub, r.supplier, r.amount, r.category].map(escapeCsv).join(",")
  );
  return [header, ...lines].join("\n") + "\n";
}

const small = process.argv.includes("--small");
const outName = small ? "pub_sample_50.csv" : "pub_demo_portfolio.csv";
const rows = buildRows(small ? SMALL_PLAN : MONTH_PLAN, small ? 48 : null);
const outPath = path.join(__dirname, "..", "public", outName);

fs.writeFileSync(outPath, toCsv(rows), "utf8");
console.log(`Wrote ${outPath}`);
console.log(`Rows: ${rows.length} (+ header)`);
console.log(`Pubs: ${new Set(rows.map((r) => r.pub)).size}`);
console.log(
  `Months: ${[...new Set(rows.map((r) => r.date.replace(/\//g, "-")))].length} date styles (parse normalises to yyyy-MM-dd)`
);
