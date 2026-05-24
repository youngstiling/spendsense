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
  "Diageo Ltd", "DIAGEO", "Diageo PLC",
  "Heineken UK", "HEINEKEN", "Heineken UK Ltd",
  "Booker Wholesale", "BOOKER", "Booker Ltd",
  "Brakes Catering", "Brakes", "BRAKES UK",
  "Coca Cola Europacific", "Coca Cola",
  "Amazon", "Amazon Business",
  "British Gas", "Scottish Water", "BT PLC",
  "EON Energy", "E.ON",
  "JJ Food Service", "JJ Foods",
  "Bidfood", "Makro", "Costco UK",
  "Local Butcher", "Local Bakery", "Local Fishmonger",
];

const categories = [
  "Alcohol", "Food", "Utilities", "Supplies", "Soft Drinks", "Cleaning", "Maintenance",
];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

const randAmount = (cat) => {
  const base = Math.random();
  if (cat === "Alcohol") return (base * 2500 + 400).toFixed(2);
  if (cat === "Food") return (base * 1200 + 150).toFixed(2);
  if (cat === "Utilities") return (base * 500 + 100).toFixed(2);
  return (base * 400 + 30).toFixed(2);
};

const randDate = () => {
  const d = new Date(2026, 0, 1 + Math.floor(Math.random() * 120));
  const formats = [
    d.toISOString().split("T")[0],
    d.toLocaleDateString("en-GB"),
    d.toLocaleDateString("en-US"),
  ];
  return rand(formats);
};

const rows = ["date,pub,supplier,amount,category"];

for (let i = 0; i < 5000; i++) {
  const pub = rand(pubs);
  const category = rand(categories);

  let amount = randAmount(category);

  if (Math.random() < 0.25) amount = "£" + amount;
  if (Math.random() < 0.05) amount = "-" + amount;
  if (Math.random() < 0.05) amount = amount + " ";

  let supplier = rand(suppliers);

  if (Math.random() < 0.1) supplier = supplier.toLowerCase();
  if (Math.random() < 0.05) supplier = supplier.replace(" ", "");

  rows.push([randDate(), pub, supplier, amount, category].join(","));
}

const outPath = path.join(__dirname, "..", "public", "pub_spend_5000_multi_pub.csv");
fs.writeFileSync(outPath, rows.join("\n"), "utf8");
console.log(`Generated: ${outPath}`);
console.log(`Lines: ${rows.length} (${rows.length - 1} data rows + header)`);
