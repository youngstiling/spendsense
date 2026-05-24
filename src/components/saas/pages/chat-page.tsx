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
  "Which pub is overspending most?",
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
      <div className="rounded-xl border border-zinc-800 bg-[#111113] p-6">
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setQuestion(s);
                void ask(s);
              }}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
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
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-cyan-700 focus:outline-none"
          />
          <button
            type="submit"
            disabled={asking}
            className="rounded-lg bg-cyan-600 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-50"
          >
            {asking ? "…" : "Ask"}
          </button>
        </form>
        {answer && (
          <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/80 p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
              {answer}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
