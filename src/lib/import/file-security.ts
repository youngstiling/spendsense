import {
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  MAX_FILE_BYTES,
} from "./constants";

export function validateUploadFile(file: File): string | null {
  if (file.size > MAX_FILE_BYTES) {
    return `File exceeds ${Math.round(MAX_FILE_BYTES / 1024 / 1024)}MB limit.`;
  }

  const name = file.name.toLowerCase();
  const extOk = ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
  if (!extOk) {
    return "Only .csv files are allowed.";
  }

  if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
    return `Unsupported file type: ${file.type}. Upload a CSV file.`;
  }

  return null;
}

/** Reject obvious non-text uploads */
export function validateCsvContent(text: string): string | null {
  if (!text.trim()) return "File is empty.";
  const sample = text.slice(0, 512);
  if (sample.includes("\0")) return "File appears to be binary, not CSV text.";
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return "CSV must include a header row and at least one data row.";
  return null;
}
