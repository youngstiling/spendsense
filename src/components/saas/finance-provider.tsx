"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loadQuickDemoRows, replaceDemoRows } from "@/lib/config";
import { getSpendTransactionsClient } from "@/lib/finance/get-transactions-client";
import { spendTransactionsToEngineRows } from "@/lib/finance/parse-transactions";
import { runAuditReport } from "@/lib/finance/audit-engine";
import type { AuditReport } from "@/lib/finance/audit-engine";
import { runFinancialEngine } from "@/lib/finance/run-financial-engine";
import type { FinancialEngineResult } from "@/lib/finance/types";

type FinanceContextValue = {
  ready: boolean;
  loading: boolean;
  aiInsights: string[];
  aiLoading: boolean;
  engine: FinancialEngineResult | null;
  audit: AuditReport | null;
  transactionCount: number;
  refresh: () => Promise<void>;
  loadDemo: () => void;
  fetchAiInsights: () => Promise<void>;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transactionCount, setTransactionCount] = useState(0);
  const [engine, setEngine] = useState<FinancialEngineResult | null>(null);
  const [audit, setAudit] = useState<AuditReport | null>(null);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const spendRows = await getSpendTransactionsClient();
    const txs = spendTransactionsToEngineRows(spendRows);
    setTransactionCount(spendRows.length);
    setEngine(txs.length ? runFinancialEngine(txs) : null);

    let auditReport: AuditReport | null = null;
    try {
      const res = await fetch("/api/finance/audit");
      if (res.ok) {
        const json = (await res.json()) as {
          sql?: { total: number; rowCount: number; authenticated: boolean };
        };
        if (json.sql?.authenticated) {
          auditReport = runAuditReport(
            json.sql.total,
            json.sql.rowCount,
            spendRows
          );
        } else if (spendRows.length) {
          auditReport = runAuditReport(0, 0, spendRows);
        }
      } else if (spendRows.length) {
        auditReport = runAuditReport(0, 0, spendRows);
      }
    } catch {
      if (spendRows.length) auditReport = runAuditReport(0, 0, spendRows);
    }
    setAudit(auditReport);

    setLoading(false);
    setReady(true);
  }, []);

  const fetchAiInsights = useCallback(async () => {
    setAiLoading(true);
    try {
      const spendRows = await getSpendTransactionsClient();
      const eng = spendRows.length
        ? runFinancialEngine(spendTransactionsToEngineRows(spendRows))
        : null;
      if (!eng) {
        setAiInsights([]);
        return;
      }

      const { generateInsights } = await import(
        "@/lib/finance/generate-ai-insights"
      );

      try {
        const res = await fetch("/api/finance/insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ engine: eng }),
        });
        if (res.ok) {
          const json = (await res.json()) as { insights?: string[] };
          if (json.insights?.length) {
            setAiInsights(json.insights);
            return;
          }
        }
      } catch {
        /* fall through to client-side narratives */
      }

      setAiInsights(await generateInsights(eng));
    } catch {
      setAiInsights(["Unable to generate insights. Load data first."]);
    } finally {
      setAiLoading(false);
    }
  }, []);

  const loadDemo = useCallback(() => {
    const demo = loadQuickDemoRows();
    replaceDemoRows(demo);
    void refresh();
  }, [refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      ready,
      loading,
      aiInsights,
      aiLoading,
      engine,
      audit,
      transactionCount,
      refresh,
      loadDemo,
      fetchAiInsights,
    }),
    [
      ready,
      loading,
      aiInsights,
      aiLoading,
      engine,
      audit,
      transactionCount,
      refresh,
      loadDemo,
      fetchAiInsights,
    ]
  );

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
}
