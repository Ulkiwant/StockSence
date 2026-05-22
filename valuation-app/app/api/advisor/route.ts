import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const p = await req.json();

  const prompt = `Tu es un conseiller financier expert en gestion de patrimoine privé. Génère un portefeuille personnalisé précis et actionnable.

STYLE : Écris dans un français simple et accessible, comme si tu parlais à quelqu'un qui investit pour la première fois. Pas de jargon financier. Si tu dois utiliser un terme technique, explique-le brièvement entre parenthèses. Phrases courtes et percutantes.

═══ PROFIL COMPLET ═══

IDENTITÉ :
- Prénom : ${p.firstName || "Non renseigné"}
- Tranche d'âge : ${p.age}
- Situation professionnelle : ${p.situation}
- Situation familiale : ${p.family}
- Épargne de précaution constituée : ${p.hasEmergencyFund ? "Oui" : "Non / en cours"}

PROFIL DE RISQUE :
- Tolérance au risque : ${p.riskTolerance}
- Réaction face à une baisse de 20% : ${p.reactionToDrop}
- Niveau d'implication souhaité : ${p.involvement}

HORIZON & CAPITAL :
- Horizon d'investissement : ${p.horizon}
- Capital initial : ${p.capital} €
- Versement mensuel : ${p.monthly > 0 ? p.monthly + " €/mois" : "aucun"}
- Déjà investi en bourse : ${p.alreadyInvested ? "Oui" : "Non"}
- Expérience : ${p.experience}

OBJECTIFS :
- Objectif principal : ${p.goal}
- Dividendes souhaités : ${p.wantsDividends === "oui" ? "Oui, revenu régulier prioritaire" : p.wantsDividends === "optionnel" ? "Optionnel si disponible" : "Non, privilégier la croissance"}
- Enveloppe(s) fiscale(s) : ${Array.isArray(p.taxWrapper) && p.taxWrapper.length > 0 ? p.taxWrapper.join(" + ") : "Au choix"}

PRÉFÉRENCES D'ALLOCATION :
- Préférence géographique : ${p.geography}
- Secteurs favoris : ${p.favoriteSectors?.length ? p.favoriteSectors.join(", ") : "aucun en particulier"}
- Secteurs exclus : ${p.excludedSectors?.length ? p.excludedSectors.join(", ") : "aucun"}
- Intérêt pour l'investissement responsable (ESG) : ${p.esgInterest}

POSITIONS EXISTANTES À COMPLÉTER :
${p.existingHoldings?.length
  ? p.existingHoldings.map((h: { symbol: string; name: string; weight: string }) => `- ${h.symbol} (${h.name}) : environ ${h.weight} du patrimoine`).join("\n")
  : "Aucune position existante signalée."}
→ Construire un portefeuille qui COMPLÈTE et DIVERSIFIE ces positions existantes (éviter de recommander les mêmes actifs).

ACTIONS IMPOSÉES PAR L'UTILISATEUR (à intégrer obligatoirement avec un poids approprié) :
${p.forcedStocks?.length
  ? p.forcedStocks.map((s: { symbol: string; name: string; signal: string; upside: number }) => `- ${s.symbol} (${s.name}) : signal ${s.signal}, upside estimé ${s.upside?.toFixed(1)}%`).join("\n")
  : "Aucune action imposée."}
→ Si des actions sont imposées, les inclure avec un poids entre 5% et 20% chacune, ajuster les autres lignes en conséquence.

═══ RÈGLES STRICTES ═══
1. La somme des pourcentages = EXACTEMENT 100
2. Entre 5 et 8 lignes d'allocation maximum
3. Répartition ETF/actions — détermine-la toi-même selon le profil de risque :
   - Prudent → 75-100% ETF, 0-25% actions individuelles
   - Équilibré → 50-70% ETF, 30-50% actions individuelles
   - Dynamique → 30-50% ETF, 50-70% actions individuelles
4. Si dividendes prioritaires → inclure des ETF/actions à dividendes (ex: SCHD, VYM, CW8.PA)
5. Si ESG intéressé → privilégier des ETF ESG/SRI
6. Intégrer les secteurs favoris si compatibles avec le profil de risque
7. Adapter l'enveloppe fiscale (PEA = actions européennes max 75%, CTO = tout)
8. Symboles réels uniquement (Yahoo Finance, Euronext Paris, NYSE/NASDAQ)

Réponds UNIQUEMENT avec ce JSON valide, sans texte avant ni après :
{
  "portfolioName": "Nom court et accrocheur (3-5 mots)",
  "summary": "2-3 phrases simples et chaleureuses qui expliquent pourquoi ce portefeuille correspond à la personne. Pas de jargon.",
  "expectedReturn": "X-Y% par an",
  "riskLevel": "Faible",
  "dividendYield": "X.X% de rendement en dividendes estimé (ou null si non pertinent)",
  "taxAdvice": "1 phrase simple sur l'enveloppe recommandée et pourquoi c'est avantageux",
  "allocations": [
    {
      "symbol": "IWDA.AS",
      "name": "iShares Core MSCI World ETF",
      "type": "ETF",
      "percentage": 40,
      "rationale": "1 phrase très simple qui explique à quoi sert cet actif dans le portefeuille, sans termes techniques",
      "currency": "EUR",
      "dividendFrequency": "Capitalisant"
    }
  ],
  "strategy": "2 phrases simples et claires sur l'approche globale, sans acronymes",
  "rebalancing": "1 phrase simple disant quand vérifier et ajuster son portefeuille",
  "tips": ["conseil concret et simple formulé comme une action à faire, sans jargon"],
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
    return Response.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error("Advisor error:", err);
    return Response.json({ error: "Génération échouée" }, { status: 500 });
  }
}
