"use client";

import { useState } from "react";
import { useFinance } from "../finance-provider";
import { answerFinanceQuestion } from "@/lib/finance/chat-query";
import {
  EmptyState,
  LoadingState,
  PageHeader,
  useEngineReady,
} from "../ui";

const SUGGESTIONS = [
  "Which pub is above trend?",
  "Top 3 suppliers increasing costs",
  "Top financial risks",
  "Total spend this month",
];

export function ChatPage() {
  const { engine } = useFinance();
  const { hasData, loading } = useEngineReady();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

  async function ask(q: string) {
    const trimmed = q.trim();
    if (!trimmed || !engine) return;
    setAsking(true);
    setAnswer(null);
    try {
      const { answer: localAnswer } = answerFinanceQuestion(trimmed, engine);
      setAnswer(localAnswer);
    } catch {
      setAnswer("Could not process question. Try again.");
    } finally {
      setAsking(false);
    }
  }

  if (loading) return <LoadingState />;
  if (!hasData) return <EmptyState />;

  return (
    <>
      <PageHeader
        title="Chat"
        subtitle="Natural language queries on your spend dataset"
      />
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setQuestion(s);
                void ask(s);
              }}
              className="rounded-lg border border-turquoise-200 bg-turquoise-50 px-3 py-1.5 text-xs font-medium text-turquoise-900 transition hover:bg-turquoise-100"
            >
              {s}
            </button>
          ))}
        </div>
        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void ask(question);
          }}
        >
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about overspending, suppliers, risks…"
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-turquoise-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-turquoise-500/20"
          />
          <button
            type="submit"
            disabled={asking}
            className="rounded-xl bg-turquoise-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-turquoise-700 disabled:opacity-50"
          >
            {asking ? "…" : "Ask"}
          </button>
        </form>
        {answer && (
          <div className="mt-6 rounded-xl border border-turquoise-100 bg-turquoise-50/60 p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
              {answer}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
