"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-turquoise-50/40 text-slate-900">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        <nav className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold">SpendSense</p>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-turquoise-700">
              Pub Spend Intelligence
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Sign in
            </Link>
            <Link
              href="/upload"
              className="rounded-xl bg-turquoise-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-turquoise-700"
            >
              Upload CSV
            </Link>
          </div>
        </nav>

        <div className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-turquoise-200 bg-white px-3 py-1 text-xs font-semibold text-turquoise-800 shadow-sm">
              Built for pub groups, operators, and finance teams
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Turn pub spend CSVs into instant financial insight.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Upload supplier spend data and see which pubs are above their usual spend pattern,
              which suppliers are rising, where budget is drifting, and what to
              act on first.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/upload"
                className="rounded-xl bg-turquoise-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-turquoise-900/15 hover:bg-turquoise-700"
              >
                Start with a CSV
              </Link>
              <Link
                href="/overview"
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                View dashboard
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5">
            <p className="text-sm font-semibold text-slate-900">
              What users get after upload
            </p>
            <div className="mt-4 space-y-3">
              {[
                "Compare every pub against the portfolio spend pattern",
                "Flag spend outliers, supplier inflation, and budget variance",
                "Rank top financial risks by site",
                "Ask natural-language questions about the data",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl bg-turquoise-600 p-5 text-white">
              <p className="text-xs font-bold uppercase tracking-widest text-turquoise-100">
                Typical first insight
              </p>
              <p className="mt-2 text-2xl font-semibold">
                “This pub is 24% above the spend-pattern average.”
              </p>
              <p className="mt-2 text-sm text-turquoise-50">
                From upload to answer in minutes, without rebuilding spreadsheets.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
