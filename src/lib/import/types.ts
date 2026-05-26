import type { Row } from "@/lib/csv-shared";
import type { ReconciliationResult, VerificationStatus } from "./reconciliation";

/** SpendSense canonical import fields */
export type SystemFieldKey =
  | "date"
  | "amount"
  | "supplier"
  | "description"
  | "category"
  | "pub";

export type AmountSourceMode = "column" | "debit_credit";

export type ColumnMapping = Partial<Record<SystemFieldKey, string>> & {
  /** How to derive spend amount from the row */
  amountSource?: AmountSourceMode;
  /** Bank-style debit column (money out) */
  debitColumn?: string;
  /** Bank-style credit column (money in — used if debit empty) */
  creditColumn?: string;
  /** Preamble lines before the header row */
  headerRowsToSkip?: number;
};

export type ImportRowError = {
  rowNumber: number;
  columnName: string | null;
  fieldKey: SystemFieldKey | "row";
  message: string;
  rawValue?: string;
};

export type ValidationResult = {
  validRows: Row[];
  errors: ImportRowError[];
  duplicateCount: number;
};

export type ImportJobStatus =
  | "pending"
  | "validating"
  | "processing"
  | "completed"
  | "partial"
  | "failed"
  | "rolled_back";

export type ImportJobSummary = {
  id: string;
  filename: string;
  status: ImportJobStatus;
  totalRows: number;
  successRows: number;
  errorRows: number;
  skippedRows: number;
  createdAt: string;
  completedAt?: string;
  verificationStatus?: VerificationStatus;
  confidenceScore?: number;
};

export type ParsePreviewResult = {
  headers: string[];
  previewRows: Record<string, string>[];
  totalRowEstimate: number;
  suggestedMapping: ColumnMapping;
};

export type ImportApiError = {
  error: string;
  code?: string;
  details?: ImportRowError[];
};

export type ProcessImportResult = {
  importId: string;
  status: ImportJobStatus;
  totalRows: number;
  successRows: number;
  errorRows: number;
  skippedRows: number;
  errors: ImportRowError[];
  reconciliation?: ReconciliationResult;
};

export type { Row };
