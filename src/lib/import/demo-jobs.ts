import { loadDemoRows, replaceDemoRows } from "@/lib/config";
import { readJsonStorage } from "@/lib/safe-storage";
import type { Row } from "@/lib/csv-shared";
import type { ColumnMapping, ImportJobSummary, ImportRowError } from "./types";
import type { ReconciliationResult } from "./reconciliation";

const JOBS_KEY = "spendsense-import-jobs";

export type DemoImportJob = ImportJobSummary & {
  mapping: ColumnMapping;
  errors: ImportRowError[];
  importedRows?: Row[];
  previousRows?: Row[];
  reconciliation?: ReconciliationResult;
};

function rowFingerprint(row: Row): string {
  return `${row.date}|${row.supplier}|${row.amount}|${row.category}`;
}

export function listDemoJobs(): DemoImportJob[] {
  return readJsonStorage<DemoImportJob[]>(JOBS_KEY, []);
}

export function saveDemoJob(job: DemoImportJob) {
  const jobs = listDemoJobs();
  jobs.unshift(job);
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs.slice(0, 50)));
}

export function rollbackDemoJob(jobId: string): { ok: boolean; error?: string } {
  const jobs = listDemoJobs();
  const index = jobs.findIndex((j) => j.id === jobId);
  if (index === -1) {
    return { ok: false, error: "Import not found." };
  }

  const job = jobs[index];
  if (job.status === "rolled_back") {
    return { ok: false, error: "This import was already undone." };
  }

  if (job.previousRows !== undefined) {
    replaceDemoRows(job.previousRows);
  } else if (job.importedRows?.length) {
    const remove = new Set(job.importedRows.map(rowFingerprint));
    const remaining = loadDemoRows().filter((r) => !remove.has(rowFingerprint(r)));
    replaceDemoRows(remaining);
  } else {
    return { ok: false, error: "No row data stored for this import." };
  }

  jobs[index] = { ...job, status: "rolled_back", completedAt: new Date().toISOString() };
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
  return { ok: true };
}
