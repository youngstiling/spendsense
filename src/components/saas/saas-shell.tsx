"use client";

import type { ReactNode } from "react";
import { FinanceProvider } from "./finance-provider";
import { SaasSidebar } from "./sidebar";

export function SaasShell({ children }: { children: ReactNode }) {
  return (
    <FinanceProvider>
      <div className="flex min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white text-slate-900">
        <SaasSidebar />
        <main className="flex-1 overflow-y-auto p-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </FinanceProvider>
  );
}
