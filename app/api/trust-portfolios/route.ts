import { getHistoricalPrices } from "@/lib/yahoo";
import { INVESTOR_PROFILES, type ProfileKey } from "@/lib/investorProfiles";
import { simulateDCA } from "@/lib/backtest";

// Contenu public, identique pour tous les visiteurs — recalculé au plus
// une fois par heure pour ne pas marteler Yahoo Finance à chaque visite.
export const revalidate = 3600;

const SHOWN_PROFILES: ProfileKey[] = ["prudent", "equilibre", "dynamique"];
const INITIAL = 1000;
const MONTHLY = 100;

export async function GET() {
  try {
    const results = await Promise.allSettled(
      SHOWN_PROFILES.map(async (key) => {
        const group = INVESTOR_PROFILES[key];
        // Variante "monde" par défaut — celle qui sert de référence pour ce profil de risque.
        const variant = group.variants[0];
        const allocations = variant.allocations.map((a: { symbol: string; percentage: number }) => ({ symbol: a.symbol, percentage: a.percentage }));

        const priceLists = await Promise.allSettled(
          allocations.map((a: { symbol: string }) => getHistoricalPrices(a.symbol, "1y"))
        );

        const pricesBySymbol: Record<string, { date: string; close: number }[]> = {};
        priceLists.forEach((r, i) => {
          if (r.status === "fulfilled") pricesBySymbol[allocations[i].symbol] = r.value;
        });

        const backtest = simulateDCA(allocations, pricesBySymbol, INITIAL, MONTHLY);
        if (!backtest) return null;

        return {
          key,
          label: group.label,
          portfolioName: variant.portfolioName,
          ...backtest,
        };
      })
    );

    const profiles = results
      .filter((r): r is PromiseFulfilledResult<NonNullable<Awaited<ReturnType<typeof simulateDCA>>> & { key: ProfileKey; label: string; portfolioName: string }> =>
        r.status === "fulfilled" && r.value !== null
      )
      .map((r) => r.value);

    return Response.json({
      profiles,
      initial: INITIAL,
      monthly: MONTHLY,
      generatedAt: new Date().toISOString(),
      disclaimer: "Simulation pédagogique basée sur des cours réels de marché (versement initial + mensualités identiques depuis 12 mois, sur la répartition de chaque profil-type). Frais de courtage et fiscalité non inclus. Les performances passées ne préjugent pas des performances futures.",
    });
  } catch (e) {
    console.error("trust-portfolios error:", e);
    return Response.json({ error: "Erreur de calcul" }, { status: 500 });
  }
}
