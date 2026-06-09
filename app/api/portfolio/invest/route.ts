import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { ADMIN_EMAIL, type Plan } from "@/lib/plan";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Plan check
  let userPlan: Plan = "free";
  if (user.email === ADMIN_EMAIL) {
    userPlan = "admin";
  } else {
    const { data: planData } = await supabase.from("user_plans").select("plan, expires_at").eq("email", user.email).single();
    if (planData && (!planData.expires_at || new Date(planData.expires_at) >= new Date())) {
      userPlan = planData.plan as Plan;
    }
  }
  if (userPlan === "free") {
    return Response.json({ error: "Cette fonctionnalité est réservée aux abonnés Investisseur et Premium." }, { status: 403 });
  }

  const { amount, holdings, totals } = await req.json();
  if (!amount || amount <= 0) return Response.json({ error: "Montant invalide" }, { status: 400 });

  const holdingsSummary = holdings?.length
    ? holdings.map((h: { name: string; symbol: string; sector: string; asset_type: string; pct: number; signal?: string; marketValue: number }) =>
        `- ${h.name} (${h.symbol}) | Type: ${h.asset_type} | Secteur: ${h.sector || "?"} | ${h.pct?.toFixed(1)}% du portefeuille | Valeur: ${h.marketValue?.toFixed(0)}€`
      ).join("\n")
    : "Portefeuille vide";

  const totalValue = totals?.value ?? 0;
  const amountPct = totalValue > 0 ? ((amount / totalValue) * 100).toFixed(1) : "—";

  const prompt = `Tu es un conseiller en investissement expert. Un client veut investir ${amount}€ supplémentaires dans son portefeuille (soit environ ${amountPct}% de sa valeur actuelle de ${totalValue.toFixed(0)}€).

═══ PORTEFEUILLE ACTUEL ═══
Valeur totale : ${totalValue.toFixed(0)}€
${holdingsSummary}

═══ MISSION ═══
Propose 4 à 5 opportunités d'investissement CONCRÈTES et DIVERSIFIÉES avec les ${amount}€ disponibles.
Règles :
- Éviter les doublons avec ce qui est déjà détenu
- Compléter les manques de diversification identifiés
- Adapter au profil apparent du portefeuille (actions croissance ? ETF passif ? dividendes ?)
- Inclure tickers réels (Yahoo Finance) et répartition suggérée des ${amount}€
- Mélanger ETF et actions si pertinent
- Si ${amount}€ < 200€, favoriser les ETF fractionnable ou actions accessibles

Réponds UNIQUEMENT en JSON valide :
{
  "intro": "1-2 phrases sur la logique globale de tes suggestions",
  "suggestions": [
    {
      "symbol": "TICKER",
      "name": "Nom complet",
      "type": "ETF" | "Action",
      "montant_suggere": 150,
      "rationale": "Pourquoi cet actif PRÉCISÉMENT pour CE portefeuille (2 phrases max)",
      "apport": "Ce qu'il apporte : ex 'Exposition Asie manquante' ou 'Dividendes stables'",
      "risque": "Faible" | "Modéré" | "Élevé"
    }
  ],
  "avertissement": "Ceci ne constitue pas un conseil en investissement personnalisé."
}`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    });

    const text = (message.content[0] as { type: string; text: string }).text ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON");
    const result = JSON.parse(jsonMatch[0]);
    return Response.json(result);
  } catch (e) {
    console.error("Invest suggest error:", e);
    return Response.json({ error: "Erreur lors de la génération" }, { status: 500 });
  }
}
