import YahooFinanceClass from "yahoo-finance2";
/* eslint-disable @typescript-eslint/no-explicit-any */
const yf = new (YahooFinanceClass as any)({ suppressNotices: ["yahooSurvey"] });

const INDICES = [
  { symbol: "^FCHI",    label: "CAC 40",    desc: "40 plus grandes entreprises françaises" },
  { symbol: "^GSPC",    label: "S&P 500",   desc: "500 plus grandes entreprises américaines" },
  { symbol: "^IXIC",    label: "Nasdaq",    desc: "Indice tech US — Apple, Microsoft, Nvidia…" },
  { symbol: "EURUSD=X", label: "EUR / USD", desc: "Taux de change euro contre dollar" },
  { symbol: "^TNX",     label: "OAT 10 ans",desc: "Taux de la dette française à 10 ans" },
];

export async function GET() {
  const results = await Promise.allSettled(
    INDICES.map(async ({ symbol, label, desc }) => {
      const q = await (yf.quote as any)(symbol);
      return {
        label,
        desc,
        price: q.regularMarketPrice as number,
        change: q.regularMarketChangePercent as number,
      };
    })
  );

  const data = results.map((r, i) => ({
    label:  INDICES[i].label,
    desc:   INDICES[i].desc,
    price:  r.status === "fulfilled" ? r.value.price  : null,
    change: r.status === "fulfilled" ? r.value.change : null,
  }));

  return Response.json(data, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  });
}
