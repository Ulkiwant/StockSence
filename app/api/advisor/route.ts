import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { ADMIN_EMAIL, type Plan } from "@/lib/plan";
import { checkRateLimit, getRateLimitKey } from "@/lib/rateLimit";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  // Récupérer le plan de l'utilisateur
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let userPlan: Plan | "guest" = "guest";

  if (user?.email) {
    if (user.email === ADMIN_EMAIL) {
      userPlan = "admin";
    } else {
      const { data: planData } = await supabase
        .from("user_plans")
        .select("plan, expires_at")
        .eq("email", user.email)
        .single();

      if (planData && (!planData.expires_at || new Date(planData.expires_at) >= new Date())) {
        userPlan = planData.plan as Plan;
      } else {
        userPlan = "free";
      }
    }
  }

  // Rate limiting par plan
  if (userPlan === "free") {
    // 1 fois tous les 3 mois — rate limit IP basique (1 requête par 90 jours)
    const key = `advisor:free:${getRateLimitKey(req)}`;
    const windowSeconds = 90 * 24 * 60 * 60; // 90 jours
    if (!checkRateLimit(key, 1, windowSeconds)) {
      const nextDate = new Date();
      nextDate.setMonth(nextDate.getMonth() + 3);
      return Response.json(
        {
          error: `Disponible une fois tous les 3 mois — prochaine utilisation : ${nextDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`,
        },
        { status: 429 }
      );
    }
  } else if (userPlan === "investisseur") {
    // 3 fois par mois — rate limit par email + mois courant
    const now = new Date();
    const monthKey = `advisor:investisseur:${user!.email}:${now.getFullYear()}-${now.getMonth() + 1}`;
    if (!checkRateLimit(monthKey, 3, 31 * 24 * 60 * 60)) {
      return Response.json(
        { error: "Limite mensuelle atteinte — 3 consultations par mois avec le plan Investisseur." },
        { status: 429 }
      );
    }
  }
  // premium / admin : pas de limite

  const p = await req.json();

  const prompt = `Tu es un conseiller financier expert en gestion de patrimoine privé. Génère un portefeuille personnalisé précis et actionnable.

═══ PROFIL COMPLET ═══

IDENTITÉ :
- Tranche d'âge : ${p.age}
- Situation professionnelle : ${p.situation}
- Situation familiale : ${p.family}
  → Impact sur le niveau de sécurité requis : parent isolé = prudence maximale, célibataire sans charge = plus de flexibilité

PROFIL DE RISQUE :
- Tolérance au risque : ${p.riskTolerance}
- Réaction face à une baisse de 30% : ${p.reactionToDrop}

HORIZON & CAPITAL :
- Horizon d'investissement : ${p.horizon}
- Capital initial : ${p.capital} €
- Versement mensuel : ${p.monthly > 0 ? p.monthly + " €/mois" : "aucun"}
- Enveloppe(s) fiscale(s) : ${Array.isArray(p.taxWrapper) && p.taxWrapper.length > 0 ? p.taxWrapper.join(" + ") : "Au choix de l'IA selon le profil"}

PATRIMOINE EXISTANT (NE PAS DUPLIQUER) :
Actifs déclarés : ${Array.isArray(p.existingAssets) && p.existingAssets.length > 0 ? p.existingAssets.join(", ") : "Aucun déclaré"}
- Si immobilier existant → réduire ou exclure les SCPI et foncières
- Si Livret A existant → capital de précaution couvert, on peut prendre plus de risque
- Si assurance-vie existante → ne pas dupliquer, proposer ce qui complète
- Si déjà investi en actions/ETF → voir les positions ci-dessous pour éviter les doublons

POSITIONS BOURSIÈRES EXISTANTES (à compléter, PAS à dupliquer) :
${p.existingHoldings?.length
  ? p.existingHoldings.map((h: { symbol: string; name: string; sector: string }) => `- ${h.name} (secteur : ${h.sector})`).join("\n")
  : "Aucune position existante détectée."}
→ RÈGLE CRITIQUE : ne pas recommander des actifs déjà possédés. Proposer ce qui MANQUE et DIVERSIFIE.
→ Si secteur Tech déjà surreprésenté → moins de Tech dans le nouveau portefeuille.

OBJECTIF :
- Objectif principal : ${p.goal}

ACTIONS IMPOSÉES PAR L'UTILISATEUR (à intégrer obligatoirement avec un poids approprié) :
${p.forcedStocks?.length
  ? p.forcedStocks.map((s: { symbol: string; name: string; signal: string; upside: number }) => `- ${s.symbol} (${s.name}) : signal ${s.signal}, upside estimé ${s.upside?.toFixed(1)}%`).join("\n")
  : "Aucune action imposée."}
→ Si des actions sont imposées, les inclure avec un poids entre 5% et 20% chacune, ajuster les autres lignes en conséquence.

═══ RÈGLES STRICTES ═══
1. La somme des pourcentages = EXACTEMENT 100
2. Entre 5 et 8 lignes d'allocation maximum
3. Respecter la répartition actions/ETF demandée : "${p.allocationMix}"
4. Si dividendes prioritaires → inclure des ETF/actions à dividendes (ex: SCHD, VYM, CW8.PA)
5. Si ESG intéressé → privilégier des ETF ESG/SRI
6. Intégrer les secteurs favoris si compatibles avec le profil de risque
7. Adapter l'enveloppe fiscale (PEA = actions européennes max 75%, CTO = tout)
8. Symboles réels uniquement (Yahoo Finance, Euronext Paris, NYSE/NASDAQ)

Réponds UNIQUEMENT avec ce JSON valide, sans texte avant ni après :
{
  "portfolioName": "Nom court et accrocheur (3-5 mots)",
  "summary": "2-3 phrases personnalisées avec le prénom si fourni, expliquant pourquoi ce portefeuille lui correspond",
  "expectedReturn": "X-Y% par an",
  "riskLevel": "Faible",
  "dividendYield": "X.X% de rendement en dividendes estimé (ou null si non pertinent)",
  "taxAdvice": "1 phrase sur l'enveloppe fiscale recommandée et pourquoi",
  "allocations": [
    {
      "symbol": "IWDA.AS",
      "name": "iShares Core MSCI World ETF",
      "type": "ETF",
      "percentage": 40,
      "rationale": "Exposition mondiale diversifiée, cœur de portefeuille",
      "currency": "EUR",
      "dividendFrequency": "Capitalisant"
    }
  ],
  "strategy": "2 phrases sur la stratégie et l'approche globale",
  "rebalancing": "Fréquence et méthode recommandées",
  "tips": ["conseil pratique 1", "conseil pratique 2", "conseil pratique 3"],
  "disclaimer": "Ceci n'est pas un conseil en investissement. Consultez un professionnel agréé."
}`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });
    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const result = JSON.parse(jsonMatch[0]);
    return Response.json({ ...result, isGuest: userPlan === "guest", userPlan });
  } catch (err) {
    console.error("Advisor error:", err);
    return Response.json({ error: "Génération échouée" }, { status: 500 });
  }
}
