"use client";

import { AppNav } from "@/components/app-nav";
import { CsvDropzoneUpload } from "@/components/upload/csv-dropzone-upload";
import { isDemoModeClient } from "@/lib/config";

export default function UploadPage() {
  const demo = isDemoModeClient();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-turquoise-50/40">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <AppNav active="upload" />
        {demo && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-950">
            Demo mode - uploads stored in this browser. Sign in on production for Supabase.
          </div>
        )}
        <div className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-turquoise-700">
              Onboarding
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              Upload your first spend CSV
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Drop a supplier spend export and SpendSense will clean it, skip bad
              rows, and send you straight to the insight dashboard.
            </p>
            <div className="mt-6">
              <CsvDropzoneUpload />
            </div>
          </div>

          <aside className="rounded-2xl border border-turquoise-100 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Best CSV format
            </h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>
                Required: <span className="font-medium text-slate-800">date</span>{" "}
                and <span className="font-medium text-slate-800">amount</span>.
              </p>
              <p>
                Strongly recommended: pub, supplier, category, and description.
              </p>
              <p>
                Leave replace unticked to append new months onto existing data.
              </p>
            </div>
            <div className="mt-6 rounded-xl bg-turquoise-50 p-4 text-xs leading-5 text-turquoise-900">
              After import, open Overview or Benchmark first. Those two pages show
              whether the data landed correctly and which pubs need attention.
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
