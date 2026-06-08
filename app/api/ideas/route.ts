/* Daily stock ideas — seeded by date, enriched with real valuation data */
import { NextRequest } from "next/server";
import { checkRateLimit, getRateLimitKey } from "@/lib/rateLimit";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { ADMIN_EMAIL, type Plan } from "@/lib/plan";

// Curated pool of quality names to rotate through
const POOL = [
  "ASML","MC.PA","OR.PA","AIR.PA","SAN.PA","BNP.PA","TTE.PA","AI.PA","CAP.PA","DSY.PA",
  "HO.PA","KER.PA","RMS.PA","SU.PA","VIE.PA","EN.PA","CS.PA","ACA.PA","GLE.PA","SGO.PA",
  "AAPL","MSFT","NVDA","GOOGL","AMZN","META","TSLA","JPM","V","MA",
  "JNJ","PG","KO","PEP","COST","WMT","HD","UNH","ABBV","LLY",
  "IWDA.AS","CW8.PA","VWCE.DE","ESGE.PA","IUSQ.DE","QDVE.DE",
];

// Brief AI-style reasons by signal type and sector
const REASONS: Record<string, string[]> = {
  STRONG_BUY: [
    "Signal d'achat fort confirmé par les fondamentaux et la dynamique des 3 derniers mois.",
    "Valorisation attractive par rapport au secteur, avec une croissance solide des bénéfices.",
    "Momentum haussier soutenu — l'action performe bien au-dessus de son indice de référence.",
    "Marge de sécurité importante par rapport à la juste valeur estimée par nos modèles.",
    "Profil risque/rendement parmi les plus favorables de la cote en ce moment.",
  ],
  BUY: [
    "Fondamentaux solides et price-to-earnings raisonnable pour le secteur.",
    "Croissance des revenus régulière, exposition intéressante pour un horizon 3–5 ans.",
    "Bien diversifié, beta faible — convient parfaitement à un profil équilibré.",
    "Dividende régulier et bilan sain, bonne alternative aux fonds monétaires.",
    "Élan de marché positif depuis 6 mois, avec des résultats meilleurs que prévu.",
  ],
  HOLD: [
    "Entreprise de qualité, mais le cours intègre déjà les anticipations. À conserver.",
    "Valorisation dans la moyenne, à surveiller pour un meilleur point d'entrée.",
    "Profil défensif intéressant si tu cherches à réduire la volatilité de ton portefeuille.",
    "Secteur en transition — les prochains résultats trimestriels seront décisifs.",
    "Entreprise rentable avec peu de dette — convient pour diversifier sans prendre trop de risque.",
  ],
};

function seedRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return Math.abs(s) / 0xffffffff;
  };
}

function dailySeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

/** Nombre d'idées autorisées par plan */
const IDEAS_LIMIT: Record<Plan | "guest", number> = {
  guest: 0,
  free: 3,
  investisseur: 10,
  premium: 15,
  admin: 15,
};

export async function GET(req: NextRequest) {
  // 10 appels/minute max par IP (route coûteuse)
  if (!checkRateLimit(getRateLimitKey(req), 10, 60)) {
    return Response.json({ error: "Trop de requêtes" }, { status: 429 });
  }

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

  const limit = IDEAS_LIMIT[userPlan];

  // Si guest, retourner immédiatement sans générer
  if (userPlan === "guest") {
    return Response.json(
      { ideas: [], plan: "guest", limit: 0, total: 15 },
      { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=7200" } }
    );
  }

  const rng = seedRandom(dailySeed());

  // Shuffle pool deterministically
  const shuffled = [...POOL].sort(() => rng() - 0.5);
  // Always generate full 15 then slice to plan limit
  const selected = shuffled.slice(0, 15);

  // Enrich with real data
  type IdeaResult = {
    symbol: string; name: string; price: number; currency: string;
    change: number; signal: string; score: number; upside: number;
    reason: string; sector: string;
  };

  const enriched = await Promise.allSettled(
    selected.map(async (symbol): Promise<IdeaResult | null> => {
      const res = await fetch(`${req.nextUrl.origin}/api/stock/${symbol}`);
      if (!res.ok) return null;
      const d = await res.json();
      if (d.error) return null;
      const sig  = (d.valuation?.signal ?? "HOLD") as string;
      const pool = REASONS[sig] ?? REASONS.HOLD;
      const idx  = Math.floor(rng() * pool.length);
      return {
        symbol:   d.symbol,
        name:     d.name,
        price:    d.currentPrice,
        currency: d.currency,
        change:   d.changePercent,
        signal:   sig,
        score:    d.valuation?.score ?? 50,
        upside:   d.valuation?.upside ?? 0,
        reason:   pool[idx],
        sector:   d.sector ?? "",
      };
    })
  );

  const allData = enriched
    .filter((r): r is PromiseFulfilledResult<IdeaResult> => r.status === "fulfilled" && r.value !== null)
    .map((r) => r.value)
    .sort((a, b) => b.score - a.score);

  const total = allData.length;
  const data = allData.slice(0, limit);

  return Response.json(
    { ideas: data, plan: userPlan, limit, total },
    { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=7200" } }
  );
}
