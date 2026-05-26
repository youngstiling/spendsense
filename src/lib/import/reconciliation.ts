import type { Row } from "@/lib/csv-shared";
import type { ImportRowError } from "./types";

export type VerificationStatus =
  | "pending_verification"
  | "verified"
  | "warning"
  | "failed";

export type ReconciliationExceptionType =
  | "RejectedRow"
  | "MissingAmount"
  | "InvalidDate"
  | "InvalidSupplier"
  | "DuplicateTransaction"
  | "BlankTransaction"
  | "NegativeValue"
  | "FormatError";

export type ReconciliationMetrics = {
  rowCount: number;
  totalSpend: number;
  supplierCount: number;
  transactionCount: number;
  dateRangeStart: string | null;
  dateRangeEnd: string | null;
  currency: string;
};

export type ReconciliationException = {
  rowNumber: number;
  errorType: ReconciliationExceptionType;
  columnName: string | null;
  originalValue: string | null;
  reason: string;
};

export type VerificationCertificate = {
  importId: string;
  organisationId: string;
  filename: string;
  uploadedBy: string;
  uploadedAt: string;
  verifiedAt: string;
  sourceRowCount: number;
  importedRowCount: number;
  sourceTotal: number;
  importedTotal: number;
  variance: number;
  confidenceScore: number;
  status: VerificationStatus;
  processingDurationMs: number;
};

export type ReconciliationResult = {
  status: VerificationStatus;
  statusLabel: string;
  message: string;
  whatHappened: string;
  trustVerdict: string;
  dataCanBeTrusted: boolean;
  source: ReconciliationMetrics;
  imported: ReconciliationMetrics;
  variance: number;
  confidenceScore: number;
  verifiedAt: string;
  processingDurationMs: number;
  certificate: VerificationCertificate;
  exceptions: ReconciliationException[];
};

type BuildReconciliationOptions = {
  importId: string;
  organisationId: string;
  filename: string;
  uploadedBy: string;
  uploadedAt: string;
  startedAt?: number;
  verifiedAt?: string;
  sourceRows: Row[];
  importedRows: Row[];
  validationErrors?: ImportRowError[];
  duplicateRows?: number;
  skippedRows?: number;
  integrityError?: string;
};

function moneyToCents(value: number): number {
  return Math.round((Number(value) || 0) * 100);
}

function centsToMoney(value: number): number {
  return value / 100;
}

export function calculateReconciliationMetrics(rows: Row[]): ReconciliationMetrics {
  const dates = rows.map((row) => row.date).filter(Boolean).sort();
  const totalCents = rows.reduce(
    (sum, row) => sum + moneyToCents(Number(row.amount) || 0),
    0
  );
  const suppliers = new Set(
    rows
      .map((row) => row.canonicalSupplier ?? row.supplierRaw ?? row.supplier)
      .map((supplier) => String(supplier ?? "").trim())
      .filter(Boolean)
  );

  return {
    rowCount: rows.length,
    totalSpend: centsToMoney(totalCents),
    supplierCount: suppliers.size,
    transactionCount: rows.length,
    dateRangeStart: dates[0] ?? null,
    dateRangeEnd: dates[dates.length - 1] ?? null,
    currency: "GBP",
  };
}

function exceptionTypeForError(error: ImportRowError): ReconciliationExceptionType {
  const message = error.message.toLowerCase();
  if (message.includes("duplicate")) return "DuplicateTransaction";
  if (message.includes("missing") && error.fieldKey === "amount") return "MissingAmount";
  if (message.includes("invalid") && error.fieldKey === "date") return "InvalidDate";
  if (message.includes("supplier")) return "InvalidSupplier";
  if (message.includes("negative")) return "NegativeValue";
  if (message.includes("blank")) return "BlankTransaction";
  if (message.includes("format")) return "FormatError";
  return "RejectedRow";
}

export function reconciliationExceptionsFromImportErrors(
  errors: ImportRowError[] = []
): ReconciliationException[] {
  return errors.map((error) => ({
    rowNumber: error.rowNumber,
    errorType: exceptionTypeForError(error),
    columnName: error.columnName,
    originalValue: error.rawValue ?? null,
    reason: error.message,
  }));
}

function aggregateException(
  count: number,
  errorType: ReconciliationExceptionType,
  reason: string
): ReconciliationException[] {
  if (count <= 0) return [];
  return [
    {
      rowNumber: 0,
      errorType,
      columnName: null,
      originalValue: null,
      reason,
    },
  ];
}

function confidenceFor(
  status: VerificationStatus,
  source: ReconciliationMetrics,
  imported: ReconciliationMetrics,
  variance: number,
  exceptions: number
): number {
  if (status === "verified") return 100;

  const rowGap = Math.abs(source.rowCount - imported.rowCount);
  const spendGapPct =
    source.totalSpend > 0 ? Math.abs(variance / source.totalSpend) * 100 : 0;
  const rowGapPct = source.rowCount > 0 ? (rowGap / source.rowCount) * 100 : 0;

  if (status === "warning") {
    return Math.max(95, Math.min(99, 99 - Math.min(exceptions, 4)));
  }

  return Math.max(
    0,
    Math.min(94, Math.round(94 - rowGapPct * 2 - spendGapPct * 2 - exceptions))
  );
}

function statusCopy(status: VerificationStatus): { label: string; message: string } {
  if (status === "verified") {
    return {
      label: "EVERYTHING MATCHES",
      message: "100% of uploaded spend data reconciled successfully.",
    };
  }
  if (status === "warning") {
    return {
      label: "VERIFIED WITH EXCEPTIONS",
      message: "Imported data reconciled, with exceptions captured for review.",
    };
  }
  return {
    label: "RECONCILIATION FAILED",
    message: "Uploaded data does not match imported records.",
  };
}

function buildWhatHappened({
  status,
  source,
  imported,
  exceptions,
  variance,
}: {
  status: VerificationStatus;
  source: ReconciliationMetrics;
  imported: ReconciliationMetrics;
  exceptions: ReconciliationException[];
  variance: number;
}): string {
  const base = `${source.rowCount.toLocaleString("en-GB")} source row${source.rowCount === 1 ? "" : "s"} were checked against ${imported.rowCount.toLocaleString("en-GB")} imported row${imported.rowCount === 1 ? "" : "s"}. Source total ${source.totalSpend.toLocaleString("en-GB", { style: "currency", currency: "GBP" })}; imported total ${imported.totalSpend.toLocaleString("en-GB", { style: "currency", currency: "GBP" })}; variance ${variance.toLocaleString("en-GB", { style: "currency", currency: "GBP" })}.`;

  if (status === "verified") {
    return `${base} Row counts and spend totals match exactly, with no exceptions.`;
  }

  if (status === "warning") {
    return `${base} The accepted imported data reconciled, and ${exceptions.length.toLocaleString("en-GB")} exception${exceptions.length === 1 ? "" : "s"} were captured separately for review.`;
  }

  return `${base} The imported data could not be reconciled to the source file.`;
}

function trustVerdictFor(status: VerificationStatus): string {
  if (status === "verified") {
    return "Can this data be trusted? Yes. This dataset can be used for dashboards, insights, benchmarks, anomaly detection and AI recommendations.";
  }

  if (status === "warning") {
    return "Can this data be trusted? Yes, with the listed exceptions understood. Reconciled rows can power analytics; exceptions remain visible for audit review.";
  }

  return "Can this data be trusted? No. This dataset must not power analytics until the reconciliation failure is resolved.";
}

export function buildReconciliationResult({
  importId,
  organisationId,
  filename,
  uploadedBy,
  uploadedAt,
  startedAt,
  verifiedAt = new Date().toISOString(),
  sourceRows,
  importedRows,
  validationErrors = [],
  duplicateRows = 0,
  skippedRows = 0,
  integrityError,
}: BuildReconciliationOptions): ReconciliationResult {
  const source = calculateReconciliationMetrics(sourceRows);
  const imported = calculateReconciliationMetrics(importedRows);
  const sourceCents = moneyToCents(source.totalSpend);
  const importedCents = moneyToCents(imported.totalSpend);
  const variance = centsToMoney(importedCents - sourceCents);
  const exceptions = [
    ...reconciliationExceptionsFromImportErrors(validationErrors),
    ...aggregateException(
      duplicateRows,
      "DuplicateTransaction",
      `${duplicateRows.toLocaleString("en-GB")} duplicate transaction${duplicateRows === 1 ? "" : "s"} skipped during import.`
    ),
    ...aggregateException(
      skippedRows,
      "RejectedRow",
      `${skippedRows.toLocaleString("en-GB")} source row${skippedRows === 1 ? "" : "s"} rejected before import.`
    ),
    ...aggregateException(
      integrityError ? 1 : 0,
      "FormatError",
      integrityError ?? ""
    ),
  ];

  const rowCountsMatch = source.rowCount === imported.rowCount;
  const totalsMatch = sourceCents === importedCents;
  const importedSomething = imported.rowCount > 0;
  const status: VerificationStatus =
    integrityError
      ? "failed"
      : rowCountsMatch && totalsMatch && exceptions.length === 0
      ? "verified"
      : importedSomething && (exceptions.length > 0 || Math.abs(importedCents - sourceCents) <= 1)
        ? "warning"
        : "failed";
  const confidenceScore = confidenceFor(
    status,
    source,
    imported,
    variance,
    exceptions.length
  );
  const processingDurationMs = Math.max(
    0,
    Math.round(Date.now() - (startedAt ?? Date.now()))
  );
  const { label, message } = statusCopy(status);
  const whatHappened = buildWhatHappened({
    status,
    source,
    imported,
    exceptions,
    variance,
  });
  const trustVerdict = trustVerdictFor(status);

  return {
    status,
    statusLabel: label,
    message,
    whatHappened,
    trustVerdict,
    dataCanBeTrusted: status !== "failed",
    source,
    imported,
    variance,
    confidenceScore,
    verifiedAt,
    processingDurationMs,
    exceptions,
    certificate: {
      importId,
      organisationId,
      filename,
      uploadedBy,
      uploadedAt,
      verifiedAt,
      sourceRowCount: source.rowCount,
      importedRowCount: imported.rowCount,
      sourceTotal: source.totalSpend,
      importedTotal: imported.totalSpend,
      variance,
      confidenceScore,
      status,
      processingDurationMs,
    },
  };
}
