/**
 * Simulation d'investissement programmé (DCA) sur des données de marché réelles.
 *
 * Fenêtre TOUJOURS glissante sur les 12 derniers mois (jamais une date fixe
 * choisie après coup) — c'est `getHistoricalPrices(symbol, "1y")` qui fixe le
 * point de départ à "aujourd'hui − 365 jours", donc ce module n'a aucune date
 * en dur : il se met à jour tout seul à chaque appel.
 *
 * Contenu pédagogique uniquement — pas un conseil en investissement, pas une
 * garantie de performance future. Frais de courtage et fiscalité non inclus.
 */

export interface PricePoint {
  date: string; // YYYY-MM-DD
  close: number;
}

export interface AllocationLite {
  symbol: string;
  percentage: number;
}

export interface BacktestSeriesPoint {
  date: string;
  value: number;
}

export interface BacktestResult {
  invested: number;
  currentValue: number;
  gain: number;
  gainPct: number;
  series: BacktestSeriesPoint[];
  startDate: string;
  monthsElapsed: number;
}

/** Premier prix connu à une date >= cible (sinon le dernier prix connu de la série). */
function priceOnOrAfter(prices: PricePoint[], target: Date): PricePoint | null {
  for (const p of prices) {
    if (new Date(p.date) >= target) return p;
  }
  return prices.length ? prices[prices.length - 1] : null;
}

/** Dernier prix connu à une date <= cible (sinon le premier prix de la série). */
function priceOnOrBefore(sortedPrices: PricePoint[], target: Date): PricePoint | null {
  let last: PricePoint | null = null;
  for (const p of sortedPrices) {
    if (new Date(p.date) <= target) last = p;
    else break;
  }
  return last ?? (sortedPrices.length ? sortedPrices[0] : null);
}

/**
 * Simule un versement initial + des versements mensuels réguliers, répartis
 * selon les pourcentages d'allocation, sur la base de prix de clôture réels.
 */
export function simulateDCA(
  allocations: AllocationLite[],
  pricesBySymbol: Record<string, PricePoint[]>,
  initial: number,
  monthly: number
): BacktestResult | null {
  const series = allocations
    .map((a) => pricesBySymbol[a.symbol])
    .filter((s): s is PricePoint[] => Array.isArray(s) && s.length > 0);
  if (series.length !== allocations.length) return null;

  // Point de départ commun = date de début la plus tardive parmi les actifs
  // (certains tickers peuvent avoir un historique légèrement plus court).
  const startDate = series.reduce((latest, s) => {
    const d = new Date(s[0].date);
    return d > latest ? d : latest;
  }, new Date(0));

  const lastDate = series.reduce((earliest, s) => {
    const d = new Date(s[s.length - 1].date);
    return d < earliest ? d : earliest;
  }, new Date(8640000000000000));

  const monthsElapsed = Math.max(
    1,
    Math.floor((lastDate.getTime() - startDate.getTime()) / (30.44 * 24 * 3600 * 1000))
  );

  const events: { date: Date; amount: number }[] = [{ date: startDate, amount: initial }];
  for (let m = 1; m <= monthsElapsed; m++) {
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + m);
    if (d > lastDate) break;
    events.push({ date: d, amount: monthly });
  }

  // Parts achetées à chaque versement, par actif
  const eventShares: { date: Date; sharesBySymbol: Record<string, number>; amount: number }[] = [];
  for (const ev of events) {
    const sharesBySymbol: Record<string, number> = {};
    for (const a of allocations) {
      const point = priceOnOrAfter(pricesBySymbol[a.symbol], ev.date);
      const amountForSymbol = ev.amount * (a.percentage / 100);
      sharesBySymbol[a.symbol] = point && point.close > 0 ? amountForSymbol / point.close : 0;
    }
    eventShares.push({ date: ev.date, sharesBySymbol, amount: ev.amount });
  }

  const invested = events.reduce((s, e) => s + e.amount, 0);

  // Courbe de valeur : axe = dates du 1er actif (référence)
  const axisDates = series[0].map((p) => p.date);
  const valueSeries: BacktestSeriesPoint[] = axisDates.map((date) => {
    const d = new Date(date);
    let value = 0;
    for (const a of allocations) {
      const prices = pricesBySymbol[a.symbol];
      const cumulativeShares = eventShares
        .filter((e) => e.date <= d)
        .reduce((s, e) => s + e.sharesBySymbol[a.symbol], 0);
      const priceNow = priceOnOrBefore(prices, d);
      value += cumulativeShares * (priceNow?.close ?? 0);
    }
    return { date, value: Math.round(value * 100) / 100 };
  });

  const currentValue = valueSeries.length ? valueSeries[valueSeries.length - 1].value : 0;
  const gain = Math.round((currentValue - invested) * 100) / 100;
  const gainPct = invested > 0 ? (gain / invested) * 100 : 0;

  return {
    invested: Math.round(invested * 100) / 100,
    currentValue,
    gain,
    gainPct: Math.round(gainPct * 100) / 100,
    series: valueSeries,
    startDate: startDate.toISOString().split("T")[0],
    monthsElapsed,
  };
}
