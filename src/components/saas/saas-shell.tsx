"use client";

import type { ReactNode } from "react";
import { FinanceProvider } from "./finance-provider";
import { SaasSidebar } from "./sidebar";

export function SaasShell({ children }: { children: ReactNode }) {
  return (
    <FinanceProvider>
      <div className="flex min-h-screen bg-[#0B0B0C] text-zinc-100">
        <SaasSidebar />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </FinanceProvider>
  );
}
