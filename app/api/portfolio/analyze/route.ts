import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getStockDetails } from "@/lib/yahoo";
import { ADMIN_EMAIL, PLANS_WITH_AI, type Plan } from "@/lib/plan";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Accessible à l'admin ET aux plans payants (investisseur / premium)
  const adminEmail = process.env.ADMIN_EMAIL ?? ADMIN_EMAIL;
  let userPlan: Plan = "free";
  if (user.email === adminEmail) {
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
    return Response.json({ error: "Analyse IA réservée aux plans Investisseur et Premium" }, { status: 403 });
  }

  const { holdings } = await req.json();
  if (!holdings?.length) return Response.json({ error: "Portfolio vide" }, { status: 400 });

  // Si les holdings sont déjà enrichis (currentPrice fourni par le client), on évite
  // le double-fetch Yahoo qui peut provoquer des timeouts sur un grand portefeuille.
  // Sinon on enrichit uniquement les positions manquantes.
  const positions: any[] = await Promise.all(
    holdings.map(async (h: any) => {
      if (h.currentPrice != null && h.marketValue != null) return h; // déjà enrichi
      const details = await getStockDetails(h.symbol).catch(() => null);
      const currentPrice = details?.currentPrice ?? h.avg_price;
      const pnl = (currentPrice - h.avg_price) * h.quantity;
      const pnlPct = ((currentPrice - h.avg_price) / h.avg_price) * 100;
      const marketValue = currentPrice * h.quantity;
      return { ...h, currentPrice, pnl, pnlPct, marketValue, sector: details?.sector ?? "N/A" };
    })
  );

  const totalValue = positions.reduce((s, p) => s + (p.marketValue ?? 0), 0);
  const totalCost = positions.reduce((s, p) => s + p.avg_price * p.quantity, 0);
  const totalPnl = totalValue - totalCost;

  const prompt = `Tu es un conseiller financier expert. Analyse ce portefeuille boursier et fournis des recommandations d'optimisation simples, compréhensibles par un non-professionnel.

PORTEFEUILLE :
${positions.map((p) => `- ${p.symbol} (${p.name ?? p.symbol}) : ${p.quantity} titres, PRU ${p.avg_price.toFixed(2)} ${p.currency}, cours actuel ${p.currentPrice.toFixed(2)}, P&L ${p.pnl >= 0 ? "+" : ""}${p.pnl.toFixed(0)} (${p.pnlPct >= 0 ? "+" : ""}${p.pnlPct.toFixed(1)}%), valeur ${p.marketValue.toFixed(0)} ${p.currency}, secteur: ${p.sector}`).join("\n")}

Valeur totale : ${totalValue.toFixed(0)} | Coût total : ${totalCost.toFixed(0)} | P&L total : ${totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(0)} (${((totalPnl / totalCost) * 100).toFixed(1)}%)

Réponds UNIQUEMENT en JSON avec cette structure :
{
  "summary": "Résumé du portefeuille en 2 phrases simples",
  "globalScore": 0-100,
  "diversification": "Bonne" | "Correcte" | "Insuffisante",
  "mainRisk": "Le principal risque en 1 phrase",
  "recommendations": [
    { "type": "RENFORCER" | "ALLÉGER" | "CONSERVER" | "VENDRE", "symbol": "AAPL", "reason": "explication courte sans jargon" }
  ],
  "missingExposures": ["exposition manquante 1", "exposition manquante 2"],
  "strengths": ["point fort 1", "point fort 2"],
  "disclaimer": "Ceci n'est pas un conseil en investissement."
}`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });
    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON");
    const analysis = JSON.parse(jsonMatch[0]);
    return Response.json({ analysis, positions, totalValue, totalCost, totalPnl });
  } catch (err) {
    console.error("Portfolio analysis error:", err);
    return Response.json({ error: "Analyse échouée" }, { status: 500 });
  }
}
