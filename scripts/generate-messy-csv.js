const fs = require("fs");
const path = require("path");

const suppliers = [
  "Diageo Ltd", "DIAGEO LIMITED", "Diageo",
  "Heineken UK", "HEINEKEN", "Heineken UK Ltd",
  "JJ Food Service", "JJ FOOD SERVICE", "J J Food",
  "Booker Wholesale", "BOOKER", "Booker Ltd",
  "Brakes Catering", "Brakes", "BRAKES UK",
  "Coca Cola Europacific", "Coca Cola", "COCA-COLA EUROPACIFIC",
  "Amazon", "AMAZON UK", "Amazon Business",
  "British Gas", "BRITISH GAS", "BritishGas",
  "Scottish Water", "SCOTTISH WATER",
  "BT Business", "BT", "BT PLC",
  "EON Energy", "E.ON", "EON",
  "Local Butcher", "The Local Butcher",
  "Local Bakery", "Bakery Co",
  "Cleaning Supplies Co", "CleanCo",
  "Sky Business", "Sky",
];

const categories = [
  "Alcohol", "Food", "Utilities", "Supplies", "Soft Drinks", "", null,
];

const headers = [
  ["date", "supplier", "amount", "category"],
  ["Date", "Vendor", "Total", "Type"],
  ["txn_date", "merchant", "value", "category"],
  ["DATE", "SUPPLIER", "AMOUNT", ""],
];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randAmount = () => (Math.random() * 1500 + 50).toFixed(2);

const randDate = () => {
  const d = new Date(2026, 0, 1 + Math.floor(Math.random() * 120));
  const formats = [
    d.toISOString().split("T")[0],
    d.toLocaleDateString("en-GB"),
    d.toLocaleDateString("en-US"),
    `${d.getDate()}-${d.getMonth() + 1}-2026`,
  ];
  return rand(formats);
};

const rows = [];
rows.push(rand(headers).join(","));

for (let i = 0; i < 2000; i++) {
  let supplier = rand(suppliers);

  if (Math.random() < 0.1) supplier = supplier.toUpperCase();
  if (Math.random() < 0.1) supplier = supplier.toLowerCase();

  let amount = randAmount();

  if (Math.random() < 0.2) amount = "£" + amount;
  if (Math.random() < 0.1) amount = amount.replace(".", ",");

  if (Math.random() < 0.05) amount = "-" + amount;

  let category = rand(categories);

  if (Math.random() < 0.1) category = "";

  const row = [randDate(), supplier, amount, category];

  if (Math.random() < 0.05) row.pop();

  rows.push(row.join(","));
}

rows.push(",,,,");
rows.push("INVALID ROW");
rows.push("123,ABC");

const outPath = path.join(__dirname, "..", "public", "pub_spend_messy_2000.csv");
fs.writeFileSync(outPath, rows.join("\n"), "utf8");
console.log(`Messy CSV generated: ${outPath}`);
console.log(`Lines: ${rows.length} (${rows.length - 1} data rows + header)`);
