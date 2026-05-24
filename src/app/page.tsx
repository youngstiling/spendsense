import Link from "next/link";
import { isDemoMode } from "@/lib/demo";

export default function HomePage() {
  const demo = isDemoMode();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
        Spend Intelligence
      </h1>
      <p className="mt-4 max-w-md text-slate-500">
        Import pub spend CSVs and see KPIs, charts, and savings insights in one
        dashboard.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/login"
          className="rounded-md bg-teal-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
        >
          Login
        </Link>
        {demo && (
          <Link
            href="/dashboard"
            className="rounded-md border border-slate-300 bg-white px-8 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Demo dashboard
          </Link>
        )}
      </div>
    </main>
  );
}
