import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getStockDetails } from "@/lib/yahoo";
import { computeValuation } from "@/lib/valuation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { checkRateLimit, getRateLimitKey } from "@/lib/rateLimit";
import { PLAN_LIMITS, PLANS_WITH_AI, type Plan, ADMIN_EMAIL } from "@/lib/plan";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/** Validation du format du ticker (ex : AAPL, MC.PA, ^GSPC) */
const TICKER_REGEX = /^[A-Z0-9.\-\^=]{1,20}$/i;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  // ── 1. Authentification requise ──
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    return Response.json({ error: "Connexion requise pour accéder à l'analyse IA" }, { status: 401 });
  }

  // ── 2. Vérification du plan (investisseur / premium / admin) ──
  let userPlan: Plan = "free";
  if (user.email === (process.env.ADMIN_EMAIL ?? ADMIN_EMAIL)) {
    userPlan = "admin";
  } else {
    const { data: planData } = await supabase
      .from("user_plans")
      .select("plan, expires_at")
      .eq("email", user.email)
      .single();
    if (planData && (!planData.expires_at || new Date(planData.expires_at) >= new Date())) {
      userPlan = planData.plan as Plan;
    }
  }

  if (!PLANS_WITH_AI.includes(userPlan)) {
    return Response.json(
      { error: "L'analyse IA est réservée aux plans Investisseur et Premium" },
      { status: 403 }
    );
  }

  // ── 3. Rate limit par email (selon quota du plan) ──
  const aiLimit = PLAN_LIMITS[userPlan].aiAnalysesPerDay;
  if (isFinite(aiLimit)) {
    const key = `analyze:${user.email}:${new Date().toISOString().slice(0, 10)}`;
    if (!checkRateLimit(key, aiLimit, 24 * 3600)) {
      return Response.json(
        { error: `Limite d'analyse IA atteinte (${aiLimit}/jour). Réessaie demain.` },
        { status: 429 }
      );
    }
  }

  // ── 4. Validation du ticker ──
  const { ticker } = await params;
  if (!TICKER_REGEX.test(ticker)) {
    return Response.json({ error: "Format de ticker invalide" }, { status: 400 });
  }

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
    console.error("Claude analysis error:", err instanceof Error ? err.message : "unknown");
    return Response.json({ error: "Analysis failed" }, { status: 500 });
  }
}
