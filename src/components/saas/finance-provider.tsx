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
import { getTransactionsClient } from "@/lib/finance/get-transactions-client";
import { runFinancialEngine } from "@/lib/finance/run-financial-engine";
import type { FinancialEngineResult } from "@/lib/finance/types";

type FinanceContextValue = {
  ready: boolean;
  loading: boolean;
  aiInsights: string[];
  aiLoading: boolean;
  engine: FinancialEngineResult | null;
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
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const txs = await getTransactionsClient();
    setTransactionCount(txs.length);
    setEngine(txs.length ? runFinancialEngine(txs) : null);
    setLoading(false);
    setReady(true);
  }, []);

  const fetchAiInsights = useCallback(async () => {
    setAiLoading(true);
    try {
      const txs = await getTransactionsClient();
      const eng = txs.length ? runFinancialEngine(txs) : null;
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
