/* eslint-disable @typescript-eslint/no-explicit-any */
import YahooFinanceClass from "yahoo-finance2";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QuoteSummaryResult = Record<string, any>;

const yahooFinance = new (YahooFinanceClass as any)({ suppressNotices: ["yahooSurvey"] });

export interface StockQuote {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  marketCap: number;
  sector: string;
  industry: string;
  currency: string;
  logoUrl: string;
}

export interface StockDetails extends StockQuote {
  quoteType: string;
  eps: number;
  forwardPE: number;
  trailingPE: number;
  priceToBook: number;
  debtToEquity: number;
  returnOnEquity: number;
  operatingMargin: number;
  revenueGrowth: number;
  freeCashFlow: number;
  sharesOutstanding: number;
  beta: number;
  dividendYield: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  averageVolume: number;
  description: string;
  website: string;
  employees: number;
  pegRatio: number;
  enterpriseToEbitda: number;
}

// Preferred exchanges: lower index = higher priority
const EXCHANGE_PRIORITY: Record<string, number> = {
  NYQ: 1, NYSE: 1, NMS: 2, NGM: 3, NCM: 4,   // US major
  PAR: 5, AMS: 6, XET: 7, LSE: 8, MIL: 9,   // European major
  TOR: 10, ASX: 11, HKG: 12,                  // Other major
};

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(inc|corp|co|ltd|sa|plc|nv|ag|se|spa|bv|sas|s\.a|s\.p\.a)\b\.?/gi, "")
    .replace(/[^a-z0-9]/g, "");
}

export async function searchStocks(query: string) {
  try {
    const raw = await (yahooFinance.search as any)(query, { quotesCount: 12 });
    const quotes = (raw?.quotes ?? []) as any[];
    const candidates = quotes
      .filter((q: any) => ["EQUITY", "ETF", "MUTUALFUND"].includes(q.quoteType) && q.symbol)
      .map((q: any) => ({
        symbol: q.symbol as string,
        name: (q.shortname || q.longname || q.symbol) as string,
        exchange: (q.exchange || "") as string,
        quoteType: (q.quoteType || "EQUITY") as string,
      }));

    // Deduplicate: one result per unique company name, keeping the best-exchange listing
    const byName = new Map<string, typeof candidates[0]>();
    for (const stock of candidates) {
      const key = normalizeName(stock.name);
      if (!key) continue;
      const existing = byName.get(key);
      if (!existing) {
        byName.set(key, stock);
      } else {
        const ep = EXCHANGE_PRIORITY[existing.exchange] ?? 99;
        const np = EXCHANGE_PRIORITY[stock.exchange] ?? 99;
        if (np < ep) byName.set(key, stock);
      }
    }

    return Array.from(byName.values()).slice(0, 3);
  } catch {
    return [];
  }
}

export async function getStockDetails(symbol: string): Promise<StockDetails | null> {
  try {
    const [quoteRaw, summaryRaw] = await Promise.all([
      (yahooFinance.quote as any)(symbol),
      (yahooFinance.quoteSummary as any)(symbol, {
        modules: ["financialData", "defaultKeyStatistics", "assetProfile", "summaryDetail"],
      }),
    ]);

    const quote = quoteRaw as any;
    const summary = summaryRaw as QuoteSummaryResult;

    const fd = summary.financialData as any;
    const ks = summary.defaultKeyStatistics as any;
    const ap = summary.assetProfile as any;
    const sd = summary.summaryDetail as any;

    return {
      symbol: quote.symbol ?? symbol,
      name: quote.longName ?? quote.shortName ?? symbol,
      quoteType: (quote.quoteType ?? "EQUITY") as string,
      currentPrice: quote.regularMarketPrice ?? 0,
      change: quote.regularMarketChange ?? 0,
      changePercent: (quote.regularMarketChangePercent ?? 0) / 100,
      marketCap: quote.marketCap ?? 0,
      sector: ap?.sector ?? quote.sector ?? "Unknown",
      industry: ap?.industry ?? quote.industry ?? "Unknown",
      currency: quote.currency ?? "USD",
      logoUrl: "",
      eps: ks?.trailingEps ?? 0,
      forwardPE: sd?.forwardPE ?? 0,
      trailingPE: sd?.trailingPE ?? 0,
      priceToBook: ks?.priceToBook ?? 0,
      debtToEquity: fd?.debtToEquity ?? 0,
      returnOnEquity: fd?.returnOnEquity ?? 0,
      operatingMargin: fd?.operatingMargins ?? 0,
      revenueGrowth: fd?.revenueGrowth ?? 0,
      freeCashFlow: fd?.freeCashflow ?? 0,
      sharesOutstanding: ks?.sharesOutstanding ?? 0,
      beta: ks?.beta ?? 1,
      dividendYield: sd?.dividendYield ?? 0,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh ?? 0,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow ?? 0,
      averageVolume: quote.averageVolume3Month ?? quote.regularMarketVolume ?? 0,
      description: ap?.longBusinessSummary ?? "",
      website: ap?.website ?? "",
      employees: ap?.fullTimeEmployees ?? 0,
      pegRatio: ks?.pegRatio ?? 0,
      enterpriseToEbitda: ks?.enterpriseToEbitda ?? 0,
    };
  } catch (err) {
    console.error("Yahoo Finance error:", err);
    return null;
  }
}

function subDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

export async function getHistoricalPrices(
  symbol: string,
  period: "1mo" | "3mo" | "6mo" | "1y" | "5y"
) {
  try {
    const periodMap: Record<string, string> = {
      "1mo": subDays(30),
      "3mo": subDays(90),
      "6mo": subDays(180),
      "1y": subDays(365),
      "5y": subDays(365 * 5),
    };

    const result = await (yahooFinance.chart as any)(symbol, {
      period1: periodMap[period],
      interval: period === "5y" ? "1wk" : "1d",
    }) as any;

    const quotes: any[] = result?.quotes ?? [];
    return quotes
      .filter((r: any) => r.close != null)
      .map((r: any) => ({
        date: new Date(r.date).toISOString().split("T")[0],
        close: r.close as number,
        volume: (r.volume ?? 0) as number,
      }));
  } catch {
    return [];
  }
}

export interface NewsItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string; // ISO date string
  summary: string;
}

export async function getStockNews(symbol: string): Promise<NewsItem[]> {
  try {
    const raw = await (yahooFinance.search as any)(symbol, { quotesCount: 0, newsCount: 6 });
    const news = (raw?.news ?? []) as any[];
    return news.map((n: any) => ({
      title: n.title ?? "",
      url: n.link ?? "",
      source: n.publisher ?? "Yahoo Finance",
      publishedAt: n.providerPublishTime
        ? new Date(n.providerPublishTime * 1000).toISOString()
        : new Date().toISOString(),
      summary: n.summary ?? "",
    }));
  } catch {
    return [];
  }
}

const TRENDING_POOL = [
  "AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA",
  "JPM", "V", "JNJ", "UNH", "XOM", "WMT", "MA", "PG",
  "NFLX", "AMD", "INTC", "BABA", "NKE",
];

export async function getTrendingStocks(): Promise<StockQuote[]> {
  // Deterministic daily seed for consistent rotation
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  let rng = seed;
  const rand = () => {
    rng = (rng * 1664525 + 1013904223) & 0xffffffff;
    return (rng >>> 0) / 0xffffffff;
  };

  const shuffled = [...TRENDING_POOL].sort(() => rand() - 0.5);
  const daily = shuffled.slice(0, 6);

  const results = await Promise.allSettled(
    daily.map(async (sym) => {
      const q = await (yahooFinance.quote as any)(sym) as any;
      return {
        symbol: q.symbol ?? sym,
        name: q.longName ?? q.shortName ?? sym,
        currentPrice: q.regularMarketPrice ?? 0,
        change: q.regularMarketChange ?? 0,
        changePercent: (q.regularMarketChangePercent ?? 0) / 100,
        marketCap: q.marketCap ?? 0,
        sector: "",
        industry: "",
        currency: q.currency ?? "USD",
        logoUrl: "",
      } as StockQuote;
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<StockQuote> => r.status === "fulfilled")
    .map((r) => r.value);
}
