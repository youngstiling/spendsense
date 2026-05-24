"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppNav } from "@/components/app-nav";
import { CsvUploadWizard } from "@/components/import/csv-upload-wizard";
import { ImportHistoryPanel } from "@/components/import/import-history-panel";
import { DeleteDataButton } from "@/components/delete-data-button";
import { hasDemoRows, isDemoModeClient } from "@/lib/config";

export default function ImportPage() {
  const demo = isDemoModeClient();
  const router = useRouter();
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const bumpHistory = () => {
    setHistoryRefreshKey((k) => k + 1);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <AppNav active="upload" />
        {demo ? (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-950">
            Demo mode — imports stored in this browser. Enterprise API available with Supabase.
          </div>
        ) : (
          <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700">
            Not logged in? Imports are saved in this browser until you sign in to sync with Supabase.
          </div>
        )}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
          <h1 className="text-xl font-semibold text-slate-900 mb-1">Import spend data</h1>
          <p className="text-sm text-slate-500 mb-6">
            Upload or paste CSV. Map columns with live validation, debit/credit support, and supplier preview.
          </p>
          <CsvUploadWizard onImportComplete={bumpHistory} />
          {(demo ? hasDemoRows() : true) && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <DeleteDataButton onDeleted={bumpHistory} />
            </div>
          )}
        </div>
        <div className="mt-6">
          <ImportHistoryPanel refreshKey={historyRefreshKey} onChanged={bumpHistory} />
        </div>
      </div>
    </div>
  );
}
