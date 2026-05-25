import type { FinancialEngineResult } from "./types";

export type ChatAnswer = {
  answer: string;
  matched: boolean;
};

function norm(q: string): string {
  return q.toLowerCase().trim();
}

export function answerFinanceQuestion(
  question: string,
  result: FinancialEngineResult
): ChatAnswer {
  const q = norm(question);

  if (!result.referenceMonth) {
    return {
      matched: true,
      answer: "No transaction data loaded. Import a CSV or load demo data first.",
    };
  }

  if (/benchmark|rank|peer|average per pub|vs average|compare pub/.test(q)) {
    const summary = result.benchmarkSummary;
    if (!summary || !result.pubBenchmarks.length) {
      return {
        matched: true,
        answer: "No spend-pattern benchmark is available yet. Import spend data for at least one month first.",
      };
    }
    const top3 = result.pubBenchmarks.slice(0, 3);
    const list = top3
      .map(
        (p) =>
          `${p.rank}. ${p.pubName}: £${Math.round(p.currentSpend).toLocaleString("en-GB")} (${p.variancePercent >= 0 ? "+" : ""}${p.variancePercent.toFixed(1)}% vs spend average)`
      )
      .join("\n");
    return {
      matched: true,
      answer: `Spend-pattern average for ${summary.currentMonth}: £${Math.round(summary.averageSpendPerPub).toLocaleString("en-GB")} per pub. Higher spend may reflect pub size or trading volume.\n${list}`,
    };
  }

  if (/overspend|over spend|exceed/.test(q)) {
    const top = result.pubOverspends.filter((p) => p.flagged)[0];
    if (!top) {
      return {
        matched: true,
        answer: "No pubs are currently above their own spend trend by more than 20%.",
      };
    }
    return {
      matched: true,
      answer: `${top.pubName} is furthest above its own spend trend at ${top.variancePercent.toFixed(1)}% (GBP ${Math.round(top.actualSpend).toLocaleString("en-GB")} actual vs GBP ${Math.round(top.expectedSpend).toLocaleString("en-GB")} expected). Treat this as a review signal, not a judgement on the pub.`,
    };
  }

  if (/top\s*3|three\s*supplier|supplier.*increas|inflation|cost.*supplier/.test(q)) {
    const top3 = result.supplierInflations
      .filter((s) => s.flagged)
      .slice(0, 3);
    if (!top3.length) {
      return {
        matched: true,
        answer: "No suppliers flagged for cost inflation (>10%) in the last 3 vs prior 3 months.",
      };
    }
    const list = top3
      .map(
        (s, i) =>
          `${i + 1}. ${s.supplier} (+${s.inflationPercent.toFixed(1)}%, ${s.affectedPubs} pubs)`
      )
      .join("\n");
    return { matched: true, answer: `Top inflating suppliers:\n${list}` };
  }

  if (/risk|worst pub|highest risk/.test(q)) {
    const risks = result.topRisks;
    if (!risks.length) {
      return { matched: true, answer: "No elevated financial risks detected in the current dataset." };
    }
    const list = risks
      .map((r, i) => `${i + 1}. ${r.pubName} (score ${r.riskScore}) — ${r.keyIssue}`)
      .join("\n");
    return { matched: true, answer: `Top financial risks:\n${list}` };
  }

  if (/increase|spike|month.*month|mom/.test(q)) {
    const top = result.spendIncreases.filter((s) => s.flagged)[0];
    if (!top) {
      return {
        matched: true,
        answer: "No pubs flagged for month-on-month spend increases above 15%.",
      };
    }
    return {
      matched: true,
      answer: `${top.pubName} has the largest spend increase at ${top.percentIncrease.toFixed(1)}% (£${Math.round(top.absoluteIncrease).toLocaleString("en-GB")} absolute).`,
    };
  }

  if (/budget|variance/.test(q)) {
    const top = result.budgetVariances.filter((b) => b.flagged)[0];
    if (!top) {
      return {
        matched: true,
        answer: "No pubs exceed mock budget thresholds (>20% above trailing 3-month average).",
      };
    }
    return {
      matched: true,
      answer: `${top.pubName} has the highest budget variance at ${top.variancePercent.toFixed(1)}% (actual £${Math.round(top.actual).toLocaleString("en-GB")} vs budget £${Math.round(top.budget).toLocaleString("en-GB")}).`,
    };
  }

  if (/total|portfolio|spend this month/.test(q)) {
    const o = result.overview;
    return {
      matched: true,
      answer: `Total portfolio spend (${result.referenceMonth}): £${Math.round(o.totalSpendThisMonth).toLocaleString("en-GB")}. ${o.percentVsLastMonth >= 0 ? "+" : ""}${o.percentVsLastMonth.toFixed(1)}% vs prior month. ${o.overspendingPubsCount} pub(s) above their own spend trend.`,
    };
  }

  if (/how many|count.*pub/.test(q)) {
    const pubs = new Set(
      result.spendIncreases.map((s) => s.pubName)
    ).size;
    return {
      matched: true,
      answer: `The dataset covers ${pubs} pub${pubs === 1 ? "" : "s"} with spend in ${result.referenceMonth}.`,
    };
  }

  return {
    matched: false,
    answer:
      'Try: "Which pub is above trend?", "Top 3 suppliers increasing costs", "Top financial risks", or "Total spend this month".',
  };
}
