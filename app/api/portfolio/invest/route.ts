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

  const { amount, holdings, totals, accountType = "PEA+CTO", riskProfile } = await req.json();
  if (!amount || amount <= 0) return Response.json({ error: "Montant invalide" }, { status: 400 });

  const holdingsSummary = holdings?.length
    ? holdings.map((h: { name: string; symbol: string; sector: string; asset_type: string; pct: number; signal?: string; marketValue: number }) =>
        `- ${h.name} (${h.symbol}) | Type: ${h.asset_type} | Secteur: ${h.sector || "?"} | ${h.pct?.toFixed(1)}% du portefeuille | Valeur: ${h.marketValue?.toFixed(0)}€`
      ).join("\n")
    : "Portefeuille vide";

  const totalValue = totals?.value ?? 0;
  const amountPct = totalValue > 0 ? ((amount / totalValue) * 100).toFixed(1) : "—";

  // Le nombre d'allocations proposées doit rester cohérent avec le montant :
  // de nombreux courtiers n'autorisent pas l'achat de fractions d'actions,
  // donc fragmenter un petit montant en 4-5 lignes rend chaque ligne inachetable.
  const maxSuggestions =
    amount < 150 ? 1 :
    amount < 400 ? 2 :
    amount < 1000 ? 3 : 5;
  const suggestionRange = maxSuggestions === 1 ? "1 seule opportunité" : `${Math.max(1, maxSuggestions - 1)} à ${maxSuggestions} opportunités`;

  // Contraintes liées au type de compte
  const accountConstraints: Record<string, string> = {
    "PEA": `CONTRAINTE ABSOLUE — Compte PEA uniquement :
- Uniquement des ETF UCITS domiciliés en Europe (ex : CW8.PA, EWLD.PA, PAEEM.PA, PUST.PA, WPEA.PA, BNPP.PA, MSFT.PA n'existe pas — utiliser les codes Euronext) et des actions cotées sur une bourse européenne (.PA, .AS, .DE, .MI, .MC, .L, .BR, .ST…)
- INTERDIT : actions américaines cotées sur NYSE/Nasdaq (AAPL, NVDA, MSFT, etc. sans suffix européen), crypto, obligations en direct, produits dérivés
- Tous les tickers proposés doivent être éligibles PEA`,
    "CTO": `Compte CTO — toutes classes d'actifs autorisées :
- Actions US, européennes, mondiales, ETF UCITS ou non, obligations ETF, REITs, etc.
- Inclure en priorité des titres accessibles via les courtiers français courants`,
    "PEA+CTO": `L'utilisateur dispose d'un PEA ET d'un CTO. Optimise la répartition fiscale :
- Mettre en PEA : ETF UCITS européens, actions européennes (éligibles PEA)
- Mettre en CTO : actions US, ETF non-UCITS, obligations, REITs, titres non éligibles PEA
- Précise l'enveloppe recommandée pour chaque suggestion dans le champ "enveloppe"`,
  };

  // Contraintes liées au profil de risque
  const riskConstraints: Record<string, string> = {
    "prudent": `Profil PRUDENT — préservation du capital :
- ETF obligataires UCITS en priorité (ex : AGGH.AS), ETF monde large (CW8.PA) en complément
- Pas d'actions individuelles, pas de secteurs volatils (tech concentrée, crypto, small caps)
- Risque maximal acceptable : Faible à Modéré`,
    "equilibre": `Profil ÉQUILIBRÉ — croissance modérée :
- Mix ETF monde + ETF obligataires, possible 1-2 actions de qualité à dividendes
- Éviter les positions très concentrées ou spéculatives
- Risque maximal acceptable : Modéré`,
    "dynamique": `Profil DYNAMIQUE — croissance :
- Priorité aux ETF actions monde/émergents/sectoriels, actions croissance solides
- Peut inclure des secteurs porteurs (technologie, santé, énergie)
- Risque maximal acceptable : Élevé`,
    "offensif": `Profil OFFENSIF — performance maximale :
- Positions concentrées acceptées, actions individuelles à fort potentiel, ETF sectoriels
- Marchés émergents, small caps, secteurs en tendance forte — tout est envisageable
- Risque : Élevé assumé`,
  };

  const accountSection = accountConstraints[accountType] ?? accountConstraints["PEA+CTO"];
  const riskSection = riskProfile && riskConstraints[riskProfile]
    ? `\n═══ PROFIL DE RISQUE ═══\n${riskConstraints[riskProfile]}`
    : "";

  const enveloppeField = accountType === "PEA+CTO"
    ? `\n      "enveloppe": "PEA" | "CTO",`
    : "";

  const prompt = `Tu es un conseiller en investissement expert. Un client veut investir ${amount}€ supplémentaires dans son portefeuille (soit environ ${amountPct}% de sa valeur actuelle de ${totalValue.toFixed(0)}€).

═══ PORTEFEUILLE ACTUEL ═══
Valeur totale : ${totalValue.toFixed(0)}€
${holdingsSummary}

═══ TYPE DE COMPTE ═══
${accountSection}
${riskSection}

═══ MISSION ═══
Propose ${suggestionRange} d'investissement CONCRÈTES avec les ${amount}€ disponibles — pas plus de ${maxSuggestions}.
Règles :
- Priorité absolue : chaque allocation doit permettre d'acheter au moins une part/action entière avec le montant qui lui est alloué. La plupart des courtiers n'autorisent pas les fractions d'actions — ne propose donc jamais un montant inférieur au prix unitaire du titre. Avec un petit montant, mieux vaut une seule ligne cohérente que plusieurs lignes inachetables.
- Respecter strictement les contraintes de compte et de profil de risque ci-dessus
- Éviter les doublons avec ce qui est déjà détenu
- Compléter les manques de diversification identifiés, sans sacrifier les règles ci-dessus
- Inclure des tickers réels (Yahoo Finance) et la répartition suggérée des ${amount}€
- Si ${amount}€ < 200€, privilégie un ETF ou une action à prix unitaire accessible plutôt que de diviser le montant

Réponds UNIQUEMENT en JSON valide :
{
  "intro": "1-2 phrases sur la logique globale de tes suggestions",
  "suggestions": [
    {
      "symbol": "TICKER",
      "name": "Nom complet",
      "type": "ETF" | "Action",
      "montant_suggere": 150,${enveloppeField}
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
