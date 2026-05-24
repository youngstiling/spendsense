import type { ImportRowError } from "./types";

export function errorsToCsv(errors: ImportRowError[]): string {
  const header = "row_number,column_name,field,message,raw_value";
  const lines = errors.map((e) =>
    [
      e.rowNumber,
      e.columnName ?? "",
      e.fieldKey,
      escapeCsvCell(e.message),
      escapeCsvCell(e.rawValue ?? ""),
    ].join(",")
  );
  return [header, ...lines].join("\n");
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
