import type { Row } from "@/lib/csv";

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function downloadSpendCsv(rows: Row[], filename = "spend-export.csv") {
  const header = "date,pub,supplier,description,category,amount";
  const lines = rows.map((r) =>
    [
      escapeCsv(r.date),
      escapeCsv(r.pub ?? ""),
      escapeCsv(r.supplier),
      escapeCsv(r.description ?? ""),
      escapeCsv(r.category),
      String(r.amount),
    ].join(",")
  );
  const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
