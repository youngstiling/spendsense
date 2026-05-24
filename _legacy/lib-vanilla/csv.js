export const DEFAULT_CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Other",
];

export function normalizeCsvText(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  if (text.length > 2 && text.charCodeAt(1) === 0) {
    let out = "";
    for (let i = 0; i < text.length; i += 2) {
      const code = text.charCodeAt(i);
      if (code === 0) break;
      out += String.fromCharCode(code);
    }
    return out;
  }
  return text;
}

export function parseCsv(text, categories = DEFAULT_CATEGORIES) {
  const lines = normalizeCsvText(text).trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const idx = {
    date: findCol(headers, ["date", "transaction date", "posted date", "time"]),
    amount: findCol(headers, ["amount", "debit", "credit", "value", "sum"]),
    description: findCol(headers, [
      "description",
      "memo",
      "name",
      "merchant",
      "payee",
      "details",
    ]),
    category: findCol(headers, ["category", "type", "group"]),
  };

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    if (!cols.length) continue;

    const col = (i) => (i >= 0 ? cols[i] : "");
    let amount = parseAmount(col(idx.amount));
    if (amount === null) continue;

    if (amount < 0) amount = Math.abs(amount);
    if (amount === 0) continue;
    if (looksLikeIncome(col(idx.description), amount, headers)) continue;

    const date = parseDateToISO(col(idx.date));
    if (!date) continue;

    const description = col(idx.description).trim() || "Transaction";
    const rawCategory = col(idx.category);
    const category = normalizeCategory(
      rawCategory.trim() || inferCategory(description),
      categories
    );

    rows.push({
      id: crypto.randomUUID(),
      description,
      amount,
      category,
      date,
    });
  }

  return rows.sort((a, b) => b.date.localeCompare(a.date));
}

export function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (c === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  out.push(cur);
  return out.map((s) => s.replace(/^"|"$/g, "").trim());
}

export function findCol(headers, names) {
  for (const n of names) {
    const i = headers.indexOf(n);
    if (i >= 0) return i;
  }
  return -1;
}

export function parseAmount(raw) {
  if (raw == null || raw === "") return null;
  const cleaned = String(raw).replace(/[$,\s]/g, "").replace(/\((.+)\)/, "-$1");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function parseDateToISO(raw) {
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export function looksLikeIncome(description, amount, headers) {
  const hasDebitCol = headers.includes("debit");
  const hasCreditCol = headers.includes("credit");
  if (hasDebitCol || hasCreditCol) return false;
  const d = description.toLowerCase();
  return (
    /payroll|salary|deposit|refund|interest paid|direct dep/.test(d) && amount > 0
  );
}

export function inferCategory(desc) {
  const d = desc.toLowerCase();
  if (/grocery|market|whole foods|trader|safeway|kroger/.test(d)) return "Food";
  if (/uber|lyft|gas|shell|parking|transit|metro/.test(d)) return "Transport";
  if (/netflix|spotify|hulu|subscription/.test(d)) return "Entertainment";
  if (/restaurant|cafe|coffee|starbucks|doordash|grubhub|chipotle/.test(d))
    return "Food";
  if (/rent|mortgage|utilities|electric|internet|comcast/.test(d)) return "Bills";
  if (/amazon|target|walmart|shop/.test(d)) return "Shopping";
  if (/pharmacy|cvs|walgreens|doctor|health/.test(d)) return "Health";
  return "Other";
}

export function normalizeCategory(cat, categories = DEFAULT_CATEGORIES) {
  const c = cat.trim();
  if (!c) return "Other";
  if (categories.includes(c)) return c;

  const lower = c.toLowerCase();
  const aliases = [
    [["grocery", "groceries", "dining", "restaurant", "food"], "Food"],
    [["transport", "travel", "gas", "fuel"], "Transport"],
    [["shop", "retail", "clothing"], "Shopping"],
    [["bill", "utility", "housing", "rent"], "Bills"],
    [["entertain", "subscription", "streaming"], "Entertainment"],
    [["health", "medical", "pharmacy"], "Health"],
  ];

  for (const [keys, target] of aliases) {
    if (keys.some((k) => lower.includes(k))) return target;
  }
  return c.charAt(0).toUpperCase() + c.slice(1);
}
