import Link from "next/link";
import type { ReactNode } from "react";

export function AppNav({
  active,
  action,
}: {
  active: "dashboard" | "overview" | "upload";
  action?: ReactNode;
}) {
  const link = "px-3 py-1.5 rounded-md text-sm transition-colors";
  const idle = "text-slate-600 hover:bg-slate-100";
  const on = "bg-turquoise-600 text-white font-medium";

  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-lg font-semibold text-slate-900">SpendSense</p>
        <nav className="flex gap-1 mt-3">
          <Link
            href="/dashboard"
            className={`${link} ${active === "dashboard" ? on : idle}`}
          >
            Dashboard
          </Link>
          <Link
            href="/overview"
            className={`${link} ${active === "overview" ? on : idle}`}
          >
            Overview
          </Link>
          <Link
            href="/upload"
            className={`${link} ${active === "upload" ? on : idle}`}
          >
            Upload
          </Link>
          <Link
            href="/import"
            className={`${link} text-slate-500 hover:bg-slate-100`}
          >
            Advanced
          </Link>
        </nav>
      </div>
      {action}
    </header>
  );
}
