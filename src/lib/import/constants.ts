/** Max upload size (50MB enterprise default) */
export const MAX_FILE_BYTES = 50 * 1024 * 1024;

/** Rows processed per DB batch insert */
export const BATCH_SIZE = 1000;

/** Preview rows shown in UI */
export const PREVIEW_ROW_LIMIT = 100;

/** Hard cap on import rows per file */
export const MAX_IMPORT_ROWS = 100_000;

/** Allowed MIME types for CSV upload */
export const ALLOWED_MIME_TYPES = new Set([
  "text/csv",
  "application/csv",
  "text/plain",
  "application/vnd.ms-excel", // some browsers send this for .csv
]);

export const ALLOWED_EXTENSIONS = [".csv"];
