"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/overview", label: "Overview" },
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

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-zinc-800 bg-[#0B0B0C] px-3 py-6">
      <div className="mb-8 px-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          SpendSense
        </p>
        <p className="mt-1 text-sm font-medium text-white">Insight Engine</p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5">
        {NAV.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`rounded-lg px-3 py-2 text-sm transition ${
                active
                  ? "bg-zinc-800 font-medium text-white"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-1 border-t border-zinc-800 pt-4">
        <Link
          href="/dashboard"
          className="block rounded-lg px-3 py-2 text-xs text-zinc-500 hover:text-zinc-300"
        >
          Classic dashboard →
        </Link>
        <Link
          href="/import"
          className="block rounded-lg px-3 py-2 text-xs text-cyan-500 hover:text-cyan-400"
        >
          Import CSV
        </Link>
      </div>
    </aside>
  );
}
