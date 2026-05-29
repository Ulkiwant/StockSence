/* eslint-disable @typescript-eslint/no-explicit-any */

const YF_HEADERS: HeadersInit = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  Origin: "https://finance.yahoo.com",
  Referer: "https://finance.yahoo.com/",
};

async function yfGet(url: string): Promise<any> {
  const res = await fetch(url, { headers: YF_HEADERS });
  if (!res.ok) throw new Error(`Yahoo Finance HTTP ${res.status}: ${url}`);
  return res.json();
}

let _crumb: string | null = null;
let _cookies = "";

async function getYFCrumb(): Promise<{ crumb: string; cookies: string } | null> {
  if (_crumb) return { crumb: _crumb, cookies: _cookies };
  try {
    // Step 1: get session cookies from Yahoo Finance
    const pageRes = await fetch("https://finance.yahoo.com/quote/AAPL", {
      headers: {
        ...YF_HEADERS,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      },
      redirect: "follow",
    });
    const raw = pageRes.headers.get("set-cookie") ?? "";
    // Collect all cookie names/values (ignoring attributes)
    const cookiePairs = raw
      .split(/,(?=[^ ]+=)/)
      .map((s) => s.split(";")[0].trim())
      .filter(Boolean)
      .join("; ");
    _cookies = cookiePairs;

    // Step 2: fetch crumb
    const crumbRes = await fetch(
      "https://query2.finance.yahoo.com/v1/test/getcrumb",
      {
        headers: {
          ...YF_HEADERS,
          cookie: _cookies,
          "Content-Type": "text/plain",
        },
      }
    );
    if (!crumbRes.ok) return null;
    _crumb = (await crumbRes.text()).trim();
    return _crumb ? { crumb: _crumb, cookies: _cookies } : null;
  } catch {
    return null;
  }
}

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

const EXCHANGE_PRIORITY: Record<string, number> = {
  NYQ: 1, NYSE: 1, NMS: 2, NGM: 3, NCM: 4,
  PAR: 5, AMS: 6, XET: 7, LSE: 8, MIL: 9,
  TOR: 10, ASX: 11, HKG: 12,
};

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(inc|corp|co|ltd|sa|plc|nv|ag|se|spa|bv|sas|s\.a|s\.p\.a)\b\.?/gi, "")
    .replace(/[^a-z0-9]/g, "");
}

export async function searchStocks(query: string) {
  try {
    const url =
      `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}` +
      `&lang=en-US&region=US&quotesCount=12&newsCount=0` +
      `&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query`;
    const data = await yfGet(url);
    const quotes: any[] = data?.finance?.result?.[0]?.quotes ?? data?.quotes ?? [];
    const candidates = quotes
      .filter((q: any) => ["EQUITY", "ETF", "MUTUALFUND"].includes(q.quoteType) && q.symbol)
      .map((q: any) => ({
        symbol: q.symbol as string,
        name: (q.shortname || q.longname || q.symbol) as string,
        exchange: (q.exchange || "") as string,
        quoteType: (q.quoteType || "EQUITY") as string,
      }));

    const byName = new Map<string, (typeof candidates)[0]>();
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

async function fetchQuoteSummary(symbol: string) {
  const auth = await getYFCrumb();
  const modules = "financialData,defaultKeyStatistics,assetProfile,summaryDetail";
  const crumbParam = auth ? `&crumb=${encodeURIComponent(auth.crumb)}` : "";
  const url =
    `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}` +
    `?modules=${modules}${crumbParam}`;
  const fetchOpts: RequestInit = {
    headers: auth
      ? { ...YF_HEADERS, cookie: auth.cookies }
      : YF_HEADERS,
  };
  const res = await fetch(url, fetchOpts);
  if (!res.ok) return null;
  const data = await res.json();
  return data?.quoteSummary?.result?.[0] ?? null;
}

async function fetchChartMeta(symbol: string) {
  const url =
    `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
    `?interval=1d&range=5d&includePrePost=false`;
  const data = await yfGet(url);
  return (data?.chart?.result?.[0]?.meta ?? null) as any;
}

export async function getStockDetails(symbol: string): Promise<StockDetails | null> {
  try {
    const [meta, summary] = await Promise.allSettled([
      fetchChartMeta(symbol),
      fetchQuoteSummary(symbol),
    ]);

    const m = meta.status === "fulfilled" ? meta.value : null;
    const s = summary.status === "fulfilled" ? summary.value : null;

    if (!m && !s) return null;

    const fd = s?.financialData ?? {};
    const ks = s?.defaultKeyStatistics ?? {};
    const ap = s?.assetProfile ?? {};
    const sd = s?.summaryDetail ?? {};

    return {
      symbol: m?.symbol ?? symbol,
      name: m?.longName ?? m?.shortName ?? symbol,
      quoteType: (m?.instrumentType ?? "EQUITY") as string,
      currentPrice: m?.regularMarketPrice ?? 0,
      change:
        m != null
          ? (m.regularMarketPrice ?? 0) - (m.chartPreviousClose ?? m.regularMarketPrice ?? 0)
          : 0,
      changePercent:
        m != null && m.chartPreviousClose
          ? ((m.regularMarketPrice - m.chartPreviousClose) / m.chartPreviousClose)
          : 0,
      marketCap: m?.marketCap ?? sd?.marketCap ?? 0,
      sector: ap?.sector ?? "Unknown",
      industry: ap?.industry ?? "Unknown",
      currency: m?.currency ?? "USD",
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
      beta: ks?.beta ?? sd?.beta ?? 1,
      dividendYield: sd?.dividendYield ?? 0,
      fiftyTwoWeekHigh: m?.fiftyTwoWeekHigh ?? sd?.fiftyTwoWeekHigh ?? 0,
      fiftyTwoWeekLow: m?.fiftyTwoWeekLow ?? sd?.fiftyTwoWeekLow ?? 0,
      averageVolume: m?.regularMarketVolume ?? 0,
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
    const interval = period === "5y" ? "1wk" : "1d";
    const period1 = Math.floor(new Date(periodMap[period]).getTime() / 1000);
    const period2 = Math.floor(Date.now() / 1000);
    const url =
      `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
      `?interval=${interval}&period1=${period1}&period2=${period2}`;
    const data = await yfGet(url);
    const result = data?.chart?.result?.[0];
    if (!result) return [];
    const timestamps: number[] = result.timestamp ?? [];
    const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];
    const volumes: number[] = result.indicators?.quote?.[0]?.volume ?? [];
    return timestamps
      .map((ts: number, i: number) => ({
        date: new Date(ts * 1000).toISOString().split("T")[0],
        close: closes[i],
        volume: volumes[i] ?? 0,
      }))
      .filter((r) => r.close != null);
  } catch {
    return [];
  }
}

export interface NewsItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  summary: string;
}

export async function getStockNews(symbol: string): Promise<NewsItem[]> {
  try {
    const url =
      `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(symbol)}` +
      `&lang=en-US&region=US&quotesCount=0&newsCount=6`;
    const data = await yfGet(url);
    const news: any[] = data?.finance?.result?.[0]?.news ?? data?.news ?? [];
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
  const today = new Date();
  const seed =
    today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  let rng = seed;
  const rand = () => {
    rng = (rng * 1664525 + 1013904223) & 0xffffffff;
    return (rng >>> 0) / 0xffffffff;
  };
  const shuffled = [...TRENDING_POOL].sort(() => rand() - 0.5);
  const daily = shuffled.slice(0, 6);

  const results = await Promise.allSettled(
    daily.map(async (sym) => {
      const meta = await fetchChartMeta(sym);
      if (!meta) throw new Error("no meta");
      return {
        symbol: meta.symbol ?? sym,
        name: meta.longName ?? meta.shortName ?? sym,
        currentPrice: meta.regularMarketPrice ?? 0,
        change:
          (meta.regularMarketPrice ?? 0) -
          (meta.chartPreviousClose ?? meta.regularMarketPrice ?? 0),
        changePercent:
          meta.chartPreviousClose
            ? ((meta.regularMarketPrice - meta.chartPreviousClose) /
              meta.chartPreviousClose)
            : 0,
        marketCap: meta.marketCap ?? 0,
        sector: "",
        industry: "",
        currency: meta.currency ?? "USD",
        logoUrl: "",
      } as StockQuote;
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<StockQuote> => r.status === "fulfilled")
    .map((r) => r.value);
}
