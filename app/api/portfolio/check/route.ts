import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getStockDetails } from "@/lib/yahoo";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { symbol, portfolioHoldings } = await req.json();

  if (!symbol) return Response.json({ error: "Symbol requis" }, { status: 400 });

  // Fetch stock data for the proposed investment
  let stockData;
  try {
    stockData = await getStockDetails(symbol) as (NonNullable<Awaited<ReturnType<typeof getStockDetails>>> & {
      valuation?: {signal?:string;fairValue?:number;upside?:number;score?:number};
      operatingMargin?: number;
      trailingPE?: number;
    });
  } catch {
    return Response.json({ error: "Action introuvable" }, { status: 404 });
  }
  if (!stockData) return Response.json({ error: "Action introuvable" }, { status: 404 });

  // Build portfolio summary
  const totalValue = portfolioHoldings?.reduce((s: number, h: {marketValue: number}) => s + h.marketValue, 0) ?? 0;
  const holdingsSummary = portfolioHoldings?.length
    ? portfolioHoldings.map((h: {name:string;symbol:string;sector:string;pct:number;signal?:string}) =>
        `- ${h.name} (${h.symbol}) · Secteur : ${h.sector || "?"} · ${h.pct?.toFixed(1) ?? "?"}% du portefeuille${h.signal ? ` · Signal : ${h.signal}` : ""}`
      ).join("\n")
    : "Portefeuille vide";

  const prompt = `Tu es un conseiller en gestion de patrimoine. Un investisseur te demande si acheter "${stockData.name}" (${symbol}) est une bonne idée au vu de son portefeuille actuel. Réponds en français simple, sans jargon.

═══ SON PORTEFEUILLE ACTUEL ═══
Valeur totale : ${totalValue > 0 ? `${totalValue.toFixed(0)} €` : "non renseignée"}
Positions :
${holdingsSummary}

═══ ACTION PROPOSÉE ═══
Nom : ${stockData.name}
Ticker : ${symbol}
Secteur : ${stockData.sector || "—"}
Prix actuel : ${stockData.currentPrice?.toFixed(2) ?? "—"} ${stockData.currency ?? ""}
P/E : ${stockData.trailingPE?.toFixed(1) ?? "—"}
Signal Finazen : ${stockData.valuation?.signal ?? "—"}
Juste valeur estimée : ${stockData.valuation?.fairValue?.toFixed(2) ?? "—"} ${stockData.currency ?? ""}
Upside estimé : ${stockData.valuation?.upside != null ? `${stockData.valuation.upside.toFixed(1)}%` : "—"}
Marge opérationnelle : ${stockData.operatingMargin != null ? `${(stockData.operatingMargin * 100).toFixed(1)}%` : "—"}

═══ INSTRUCTIONS ═══
Réponds UNIQUEMENT en JSON valide avec cette structure exacte :
{
  "verdict": "OUI" | "PEUT-ETRE" | "NON",
  "titre": "Phrase courte de verdict (max 12 mots)",
  "resume": "2-3 phrases accessibles expliquant le verdict en langage débutant",
  "points_positifs": ["point 1 concret", "point 2 concret"],
  "points_attention": ["risque 1 simple", "risque 2 simple"],
  "doublon": true | false,
  "doublon_detail": "Si doublon, quel actif existant se ressemble et pourquoi (sinon null)",
  "diversification": "AMELIORE" | "NEUTRE" | "REDUIT",
  "diversification_detail": "Courte explication sur l'apport en diversification",
  "allocation_suggeree": "X%" ou null,
  "allocation_detail": "Pourquoi ce pourcentage (sinon null)"
}`;

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });

    const text = (message.content[0] as { type: string; text: string }).text ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const analysis = JSON.parse(jsonMatch[0]);

    return Response.json({
      analysis,
      stock: {
        name: stockData.name,
        symbol,
        sector: stockData.sector,
        currentPrice: stockData.currentPrice,
        currency: stockData.currency,
        signal: stockData.valuation?.signal,
        upside: stockData.valuation?.upside,
        score: stockData.valuation?.score,
      },
    });
  } catch (e) {
    console.error("Portfolio check error:", e);
    return Response.json({ error: "Erreur lors de l'analyse" }, { status: 500 });
  }
}
