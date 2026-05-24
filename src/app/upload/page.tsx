"use client";

import { AppNav } from "@/components/app-nav";
import { CsvDropzoneUpload } from "@/components/upload/csv-dropzone-upload";
import { isDemoModeClient } from "@/lib/config";

export default function UploadPage() {
  const demo = isDemoModeClient();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-xl mx-auto px-4 py-8">
        <AppNav active="upload" />
        {demo && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-950">
            Demo mode - uploads stored in this browser. Sign in on production for Supabase.
          </div>
        )}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
          <h1 className="text-xl font-semibold text-slate-900 mb-1">Upload CSV</h1>
          <p className="text-sm text-slate-500 mb-6">
            Drop a spend CSV to feed the dashboard. Data is cleaned automatically and
            bad rows are skipped.
          </p>
          <CsvDropzoneUpload />
        </div>
      </div>
    </div>
  );
}
