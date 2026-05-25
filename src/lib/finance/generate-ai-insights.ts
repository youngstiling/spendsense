import type { FinancialEngineResult } from "./types";

function ruleBasedInsights(result: FinancialEngineResult): string[] {
  const bullets: string[] = [];
  const { overview, portfolioOverspend, benchmarkSummary, highlights } = result;

  if (overview.overspendingPubsCount > 0) {
    bullets.push(
      `${overview.overspendingPubsCount} pub${overview.overspendingPubsCount === 1 ? "" : "s"} sit more than 20% above their own spend trend, driven primarily by supplier cost changes and month-on-month spikes.`
    );
  }

  if (portfolioOverspend && portfolioOverspend.variancePercent > 10) {
    bullets.push(
      `Portfolio spend is ${portfolioOverspend.variancePercent.toFixed(0)}% above the six-month baseline, with £${Math.round(portfolioOverspend.excessSpend).toLocaleString("en-GB")} in excess spend this period.`
    );
  }

  if (benchmarkSummary && benchmarkSummary.highestVariancePercent > 20) {
    bullets.push(
      `${benchmarkSummary.highestSpender} has the highest spend pattern versus the portfolio average at ${benchmarkSummary.highestVariancePercent.toFixed(0)}% above average. Review category and supplier mix before drawing performance conclusions.`
    );
  }

  if (highlights.biggestIncrease?.flagged) {
    bullets.push(
      `${highlights.biggestIncrease.pubName} shows the steepest month-on-month increase at ${highlights.biggestIncrease.percentIncrease.toFixed(0)}% — warranting immediate category review.`
    );
  }

  if (highlights.worstSupplier?.flagged) {
    bullets.push(
      `${highlights.worstSupplier.supplier} supplier costs are inflating ${highlights.worstSupplier.inflationPercent.toFixed(0)}% across ${highlights.worstSupplier.affectedPubs} site${highlights.worstSupplier.affectedPubs === 1 ? "" : "s"}.`
    );
  }

  if (highlights.biggestRisk) {
    bullets.push(
      `Highest financial risk: ${highlights.biggestRisk.pubName} (score ${highlights.biggestRisk.riskScore}) — ${highlights.biggestRisk.keyIssue}.`
    );
  }

  if (!bullets.length) {
    bullets.push(
      "Spend patterns are within expected ranges across the portfolio. Continue monitoring supplier trends and monthly variances."
    );
  }

  return bullets.slice(0, 5);
}

export async function generateInsights(
  result: FinancialEngineResult
): Promise<string[]> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return ruleBasedInsights(result);

  const summary = {
    referenceMonth: result.referenceMonth,
    overview: result.overview,
    topRisks: result.topRisks.slice(0, 3),
    benchmarks: result.pubBenchmarks.slice(0, 5),
    benchmarkSummary: result.benchmarkSummary,
    overspending: result.pubOverspends.filter((p) => p.flagged).slice(0, 5),
    inflation: result.supplierInflations.filter((s) => s.flagged).slice(0, 5),
    spendSpikes: result.spendIncreases.filter((s) => s.flagged).slice(0, 5),
  };

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content:
              "You are a hospitality finance analyst. Write 3-5 bullet insights in plain English, investor-grade tone. Each bullet one sentence. No markdown. UK GBP context.",
          },
          {
            role: "user",
            content: `Financial engine output:\n${JSON.stringify(summary, null, 2)}`,
          },
        ],
      }),
    });

    if (!res.ok) return ruleBasedInsights(result);

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) return ruleBasedInsights(result);

    const bullets = text
      .split(/\n+/)
      .map((line) => line.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean);

    return bullets.length ? bullets.slice(0, 5) : ruleBasedInsights(result);
  } catch {
    return ruleBasedInsights(result);
  }
}
