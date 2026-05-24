"use client";

import { useCallback, useEffect, useState } from "react";
import { isDemoModeClient } from "@/lib/config";
import { listDemoJobs, rollbackDemoJob, type DemoImportJob } from "@/lib/import/demo-jobs";

type ApiImport = {
  id: string;
  filename: string;
  status: string;
  totalRows: number;
  successRows: number;
  errorRows: number;
  createdAt: string;
};

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "completed":
      return "Completed";
    case "partial":
      return "Partial";
    case "rolled_back":
      return "Undone";
    case "failed":
      return "Failed";
    default:
      return status;
  }
}

export function ImportHistoryPanel({
  onChanged,
  refreshKey = 0,
}: {
  onChanged?: () => void;
  refreshKey?: number;
}) {
  const demo = isDemoModeClient();
  const [jobs, setJobs] = useState<(DemoImportJob | ApiImport)[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    if (demo) {
      setJobs(listDemoJobs());
      return;
    }
    try {
      const res = await fetch("/api/imports");
      const data = await res.json();
      if (res.ok) setJobs(data.imports ?? []);
    } catch {
      setJobs([]);
    }
  }, [demo]);

  useEffect(() => {
    refresh();
  }, [refresh, refreshKey]);

  async function undo(id: string) {
    if (!window.confirm("Undo this import? Rows from that upload will be removed.")) return;

    setBusyId(id);
    setMessage("");

    if (demo) {
      const result = rollbackDemoJob(id);
      setMessage(result.ok ? "Import undone." : result.error ?? "Could not undo.");
      await refresh();
      onChanged?.();
    } else {
      try {
        const res = await fetch(`/api/imports/${id}`, { method: "DELETE" });
        const data = await res.json();
        setMessage(res.ok ? "Import undone." : data.error ?? "Could not undo.");
        await refresh();
        onChanged?.();
      } catch {
        setMessage("Could not undo import.");
      }
    }

    setBusyId(null);
  }

  if (!jobs.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
        No imports yet. Upload a CSV above to see history here.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-800">Recent imports</p>
        <button
          type="button"
          onClick={() => refresh()}
          className="text-xs text-teal-700 hover:underline"
        >
          Refresh
        </button>
      </div>
      {message && (
        <p className="px-4 py-2 text-xs text-slate-600 border-b border-slate-100">{message}</p>
      )}
      <ul className="divide-y divide-slate-100">
        {jobs.slice(0, 10).map((job) => {
          const canUndo = job.status !== "rolled_back" && job.successRows > 0;
          return (
            <li key={job.id} className="px-4 py-3 flex flex-wrap items-center gap-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900 truncate">{job.filename}</p>
                <p className="text-xs text-slate-500">
                  {formatWhen(job.createdAt)}
                  {" | "}
                  {job.successRows.toLocaleString()} rows
                  {" | "}
                  {statusLabel(job.status)}
                  {"errorRows" in job && job.errorRows > 0 ? ` | ${job.errorRows} errors` : ""}
                </p>
              </div>
              {canUndo && (
                <button
                  type="button"
                  disabled={busyId === job.id}
                  onClick={() => undo(job.id)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {busyId === job.id ? "Undoing..." : "Undo"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
