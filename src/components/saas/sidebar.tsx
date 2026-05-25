"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/overview", label: "Overview" },
  { href: "/control-room", label: "Control Room" },
  { href: "/benchmark", label: "Benchmark" },
  { href: "/spend-increases", label: "Spend Increases" },
  { href: "/overspending", label: "Overspending" },
  { href: "/suppliers", label: "Suppliers" },
  { href: "/budget", label: "Budget" },
  { href: "/risks", label: "Risks" },
  { href: "/insights", label: "Insights" },
  { href: "/chat", label: "Chat" },
] as const;

export function SaasSidebar() {
  const pathname = usePathname();
  const link = "rounded-lg px-3 py-2 text-sm transition-colors";
  const idle = "text-slate-600 hover:bg-slate-100";
  const on = "bg-turquoise-600 font-medium text-white";

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-slate-200/80 bg-white px-3 py-6 shadow-sm">
      <div className="mb-8 px-2">
        <p className="text-lg font-semibold text-slate-900">SpendSense</p>
        <p className="mt-0.5 text-xs font-medium text-turquoise-700">
          Insight Engine
        </p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5">
        {NAV.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`${link} ${active ? on : idle}`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-1 border-t border-slate-100 pt-4">
        <Link
          href="/dashboard"
          className="block rounded-lg px-3 py-2 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700"
        >
          Classic dashboard →
        </Link>
        <Link
          href="/import"
          className="block rounded-lg px-3 py-2 text-xs font-semibold text-turquoise-700 hover:bg-turquoise-50"
        >
          Import CSV
        </Link>
      </div>
    </aside>
  );
}
