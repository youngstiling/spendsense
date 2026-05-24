const fs = require("fs");
const path = require("path");

const pubs = [
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

const suppliers = [
  "Diageo Ltd", "DIAGEO", "Booker Wholesale", "BOOKER",
  "Heineken UK", "Brakes Catering", "Coca Cola", "Amazon Business",
  "British Gas", "Scottish Water", "BT PLC", "EON Energy",
  "JJ Food Service", "Bidfood", "Local Butcher",
];

const categories = [
  "Alcohol", "Food", "Utilities", "Supplies", "Soft Drinks",
];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

const randAmount = () => (Math.random() * 1200 + 50).toFixed(2);

const randDate = () => {
  const d = new Date(2026, 0, 1 + Math.floor(Math.random() * 120));
  return rand([
    d.toISOString().split("T")[0],
    d.toLocaleDateString("en-GB"),
    d.toLocaleDateString("en-US"),
  ]);
};

const rows = ["date,pub,supplier,amount,category"];
let uncategorised = 0;

for (let i = 0; i < 5000; i++) {
  const pub = rand(pubs);
  let supplier = rand(suppliers);
  let amount = randAmount();

  if (Math.random() < 0.2) amount = "£" + amount;

  // ~38% missing/blank category → triggers uncategorised insight (>10%)
  let category = rand(categories);
  if (Math.random() < 0.38) {
    category = Math.random() < 0.5 ? "" : "   ";
    uncategorised++;
  }

  rows.push([randDate(), pub, supplier, amount, category].join(","));
}

const outPath = path.join(
  __dirname,
  "..",
  "public",
  "pub_spend_5000_uncategorised.csv"
);
fs.writeFileSync(outPath, rows.join("\n"), "utf8");
console.log(`Generated: ${outPath}`);
console.log(`Rows: ${rows.length - 1} (~${uncategorised} uncategorised)`);
