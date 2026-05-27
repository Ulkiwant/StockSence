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

export async function searchStocks(query: string) {
  try {
    const raw = await (yahooFinance.search as any)(query, { quotesCount: 8 });
    const quotes = (raw?.quotes ?? []) as any[];
    return quotes
      .filter((q: any) => ["EQUITY", "ETF", "MUTUALFUND"].includes(q.quoteType) && q.symbol)
      .map((q: any) => ({
        symbol: q.symbol as string,
        name: (q.shortname || q.longname || q.symbol) as string,
        exchange: (q.exchange || "") as string,
        quoteType: (q.quoteType || "EQUITY") as string,
      }));
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
