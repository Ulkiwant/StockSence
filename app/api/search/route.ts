import { NextRequest } from "next/server";
import { searchStocks } from "@/lib/yahoo";
import { checkRateLimit, getRateLimitKey } from "@/lib/rateLimit";

/* ── Dictionnaire local — termes courants que Yahoo Finance ne reconnaît pas ── */
const LOCAL_FALLBACK: { keywords: string[]; symbol: string; name: string; exchange: string }[] = [
  // Russell — tickers vérifiés ✅
  { keywords: ["russell 2000", "russell2000", "small cap us", "petites entreprises"], symbol: "RS2K.PA", name: "Amundi Russell 2000 UCITS ETF", exchange: "Euronext Paris" },
  { keywords: ["russell", "small cap", "us small cap"], symbol: "R2US.PA", name: "SPDR Russell 2000 US Small Cap UCITS ETF", exchange: "Euronext Paris" },
  // S&P 500 — vérifiés ✅
  { keywords: ["sp 500", "s&p500", "s&p 500", "sp500", "standard poor"], symbol: "SXR8.DE", name: "iShares Core S&P 500 UCITS ETF USD", exchange: "XETRA" },
  { keywords: ["s&p 500 acc", "cspx"], symbol: "CSPX.AS", name: "iShares Core S&P 500 UCITS ETF USD Acc", exchange: "Amsterdam" },
  // MSCI World — vérifiés ✅
  { keywords: ["cw8", "msci world amundi", "amundi world"], symbol: "CW8.PA", name: "Amundi MSCI World UCITS ETF", exchange: "Euronext Paris" },
  { keywords: ["msci world", "monde entier", "world etf", "global etf", "iwda"], symbol: "IWDA.AS", name: "iShares Core MSCI World UCITS ETF", exchange: "Amsterdam" },
  { keywords: ["all world", "all-world", "vwce", "ftse all", "vanguard world"], symbol: "VWCE.DE", name: "Vanguard FTSE All-World UCITS ETF", exchange: "XETRA" },
  // Emerging markets — vérifiés ✅
  { keywords: ["emerging", "émergent", "marchés émergents", "pays émergents", "iemm"], symbol: "IEMM.AS", name: "iShares Core MSCI Emerging Markets IMI UCITS ETF", exchange: "Amsterdam" },
  { keywords: ["emerging amundi", "amundi emerging", "aeem"], symbol: "AEEM.PA", name: "Amundi MSCI Emerging Markets UCITS ETF", exchange: "Euronext Paris" },
  // Nasdaq / Tech — vérifiés ✅
  { keywords: ["nasdaq 100", "nasdaq100", "qqq", "tech us etf", "technologie us"], symbol: "QQQ", name: "Invesco QQQ Trust (Nasdaq 100)", exchange: "Nasdaq" },
  { keywords: ["nasdaq europe", "nasdaq pea", "cndx"], symbol: "QDVE.DE", name: "iShares S&P 500 Information Technology Sector UCITS ETF", exchange: "XETRA" },
  // Europe — vérifiés ✅
  { keywords: ["euro stoxx", "stoxx 600", "europe etf", "etf europe", "meud"], symbol: "MEUD.PA", name: "Amundi Core Stoxx Europe 600 UCITS ETF", exchange: "Euronext Paris" },
  { keywords: ["cac 40", "cac40", "france etf"], symbol: "CAC.PA", name: "Amundi CAC 40 UCITS ETF", exchange: "Euronext Paris" },
  // Obligations / Bonds — vérifiés ✅
  { keywords: ["obligation", "bond etf", "fixed income", "gouvernement bond", "ibgl"], symbol: "IBGL.AS", name: "iShares € Govt Bond 15-30yr UCITS ETF", exchange: "Amsterdam" },
  { keywords: ["obligations court terme", "bond court"], symbol: "IBGS.AS", name: "iShares € Govt Bond 1-3yr UCITS ETF", exchange: "Amsterdam" },
  // Or / Gold — vérifiés ✅
  { keywords: ["or", "gold", "gold etf", "phau"], symbol: "PHAU.AS", name: "WisdomTree Physical Gold", exchange: "Amsterdam" },
  { keywords: ["gold shares", "spdr gold"], symbol: "GLD", name: "SPDR Gold Shares", exchange: "NYSE Arca" },
  // Secteurs — vérifiés ✅
  { keywords: ["énergie propre", "clean energy", "énergie renouvelable", "inrg"], symbol: "INRG.AS", name: "iShares Global Clean Energy UCITS ETF", exchange: "Amsterdam" },
  { keywords: ["santé", "healthcare etf", "pharma etf", "whcs"], symbol: "WHCS.AS", name: "iShares MSCI World Health Care Sector UCITS ETF", exchange: "Amsterdam" },
  { keywords: ["inde", "india etf", "india", "indd"], symbol: "INDD.AS", name: "iShares MSCI India UCITS ETF", exchange: "Amsterdam" },
  { keywords: ["chine", "china etf", "china", "cnya"], symbol: "CNYA.AS", name: "iShares MSCI China UCITS ETF", exchange: "Amsterdam" },
  { keywords: ["japon", "japan etf", "japan", "ijpa"], symbol: "IJPA.AS", name: "iShares Core MSCI Japan IMI UCITS ETF", exchange: "Amsterdam" },
];

function localSearch(q: string): { symbol: string; name: string; exchange: string }[] {
  const lower = q.toLowerCase().trim();
  const matches: { symbol: string; name: string; exchange: string; score: number }[] = [];

  for (const entry of LOCAL_FALLBACK) {
    for (const keyword of entry.keywords) {
      if (keyword.includes(lower) || lower.includes(keyword) || entry.name.toLowerCase().includes(lower)) {
        const score = keyword === lower ? 3 : keyword.startsWith(lower) ? 2 : 1;
        matches.push({ symbol: entry.symbol, name: entry.name, exchange: entry.exchange, score });
        break;
      }
    }
  }

  return matches
    .sort((a, b) => b.score - a.score)
    .map(({ symbol, name, exchange }) => ({ symbol, name, exchange }));
}

/** Bourses principales — les correspondances exactes de ticker ici remontent en priorité */
const MAJOR_EXCHANGES = ["NYSE", "NMS", "NASDAQ", "NYQ", "NGM", "PCX", "Euronext", "PAR", "AMS", "XETRA"];

/**
 * Trie les résultats Yahoo Finance :
 * - Correspondance exacte de ticker sur une bourse majeure → score 3
 * - Correspondance exacte de ticker toutes bourses → score 2
 * - Correspondance dans le nom → score 1
 * Évite qu'une entreprise OTC "vole" le ticker d'une cotation NYSE connue.
 */
function sortResults(
  results: { symbol: string; name: string; exchange: string }[],
  query: string
): { symbol: string; name: string; exchange: string }[] {
  const q = query.toUpperCase().trim();
  return [...results].sort((a, b) => {
    const scoreOf = (r: { symbol: string; exchange: string }) => {
      const isMajor = MAJOR_EXCHANGES.some(ex => r.exchange?.toUpperCase().includes(ex.toUpperCase()));
      if (r.symbol.toUpperCase() === q) return isMajor ? 3 : 2;
      return 1;
    };
    return scoreOf(b) - scoreOf(a);
  });
}

export async function GET(req: NextRequest) {
  // 30 recherches/minute par IP
  if (!checkRateLimit(getRateLimitKey(req), 30, 60)) {
    return Response.json({ error: "Trop de requêtes" }, { status: 429 });
  }
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 1) return Response.json([]);

  // Recherche principale via Yahoo Finance
  const yahooResults = await searchStocks(q);

  // Si Yahoo retourne des résultats, on les complète avec le fallback local
  // Si Yahoo ne retourne rien, on utilise uniquement le fallback
  const local = localSearch(q);

  if (yahooResults.length > 0) {
    // Dédoublonner : ne pas inclure les locaux déjà dans Yahoo
    const yahooSymbols = new Set(yahooResults.map(r => r.symbol));
    const extraLocal = local.filter(l => !yahooSymbols.has(l.symbol));
    // Trier pour remonter les correspondances exactes ticker sur NYSE/NASDAQ
    const merged = sortResults([...yahooResults, ...extraLocal], q);
    return Response.json(merged.slice(0, 8));
  }

  // Yahoo vide → retourner les locaux
  if (local.length > 0) return Response.json(local.slice(0, 6));

  return Response.json([]);
}
