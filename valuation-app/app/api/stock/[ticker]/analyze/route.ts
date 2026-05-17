import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getStockDetails } from "@/lib/yahoo";
import { computeValuation } from "@/lib/valuation";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "AI analysis not configured" }, { status: 503 });
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

  const prompt = `Tu es un analyste financier senior. Analyse l'action ${details.name} (${ticker}) et fournis une analyse concise pour des investisseurs non-professionnels.

Données financières clés :
- Prix actuel : ${details.currency} ${details.currentPrice}
- Valeur intrinsèque estimée : ${details.currency} ${valuation.fairValue.toFixed(2)}
- Potentiel (upside/downside) : ${(valuation.upside * 100).toFixed(1)}%
- Signal de valorisation : ${valuation.signal}
- Secteur : ${details.sector}
- Croissance des revenus : ${(details.revenueGrowth * 100).toFixed(1)}%
- Marge opérationnelle : ${(details.operatingMargin * 100).toFixed(1)}%
- ROE : ${(details.returnOnEquity * 100).toFixed(1)}%
- Ratio dette/capitaux propres : ${details.debtToEquity.toFixed(2)}
- P/E : ${details.trailingPE.toFixed(1)}
- Beta : ${details.beta.toFixed(2)}
- Points forts identifiés : ${valuation.strengths.join(", ") || "aucun"}
- Risques identifiés : ${valuation.risks.join(", ") || "aucun"}

Réponds uniquement en JSON avec cette structure exacte :
{
  "recommendation": "ACHETER" | "CONSERVER" | "VENDRE",
  "confidence": 0-100,
  "priceTarget": number,
  "priceTargetLow": number,
  "priceTargetHigh": number,
  "summary": "2-3 phrases simples sans jargon financier",
  "catalysts": ["catalyseur 1", "catalyseur 2", "catalyseur 3"],
  "risks": ["risque 1", "risque 2", "risque 3"],
  "horizon": "Court terme (< 6 mois)" | "Moyen terme (6-18 mois)" | "Long terme (> 18 mois)",
  "disclaimer": "Ceci n'est pas un conseil en investissement."
}`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const analysis = JSON.parse(jsonMatch[0]);
    return Response.json(analysis);
  } catch (err) {
    console.error("Claude analysis error:", err);
    return Response.json({ error: "Analysis failed" }, { status: 500 });
  }
}
