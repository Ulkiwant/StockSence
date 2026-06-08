import { NextRequest } from "next/server";
import { getStockDetails } from "@/lib/yahoo";
import { computeValuation } from "@/lib/valuation";
import { checkRateLimit, getRateLimitKey } from "@/lib/rateLimit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  // 60 analyses/minute par IP
  if (!checkRateLimit(getRateLimitKey(_req), 60, 60)) {
    return Response.json({ error: "Trop de requêtes" }, { status: 429 });
  }
  const { ticker } = await params;
  // Validation du format ticker (ex: AAPL, MC.PA, ^GSPC, BRK-B)
  if (!/^[A-Z0-9.\-\^=]{1,20}$/i.test(ticker)) {
    return Response.json({ error: "Format de ticker invalide" }, { status: 400 });
  }
  const details = await getStockDetails(ticker.toUpperCase());
  if (!details) {
    return Response.json({ error: "Stock not found" }, { status: 404 });
  }

  const valuation = computeValuation({
    currentPrice: details.currentPrice,
    eps: details.eps,
    freeCashFlow: details.freeCashFlow,
    sharesOutstanding: details.sharesOutstanding,
    revenueGrowth: details.revenueGrowth,
    operatingMargin: details.operatingMargin,
    debtToEquity: details.debtToEquity,
    returnOnEquity: details.returnOnEquity,
    priceToBook: details.priceToBook,
    forwardPE: details.forwardPE,
    trailingPE: details.trailingPE,
    beta: details.beta,
    dividendYield: details.dividendYield,
    sector: details.sector,
    industry: details.industry,
  });

  return Response.json({
    ...details,
    valuation: {
      fairValue: Math.round(valuation.fairValue * 100) / 100,
      upside: Math.round(valuation.upside * 1000) / 10,
      signal: valuation.signal,
      score: valuation.score,
      strengths: valuation.strengths,
      risks: valuation.risks,
    },
  });
}
