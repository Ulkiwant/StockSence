import { NextRequest } from "next/server";
import { getHistoricalPrices } from "@/lib/yahoo";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  // Auth requise
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { holdings, period } = await req.json();
  if (!holdings?.length) return Response.json([]);

  const validPeriod = ["1mo", "3mo", "6mo", "1y"].includes(period) ? period : "3mo";

  // Fetch historical prices for all holdings in parallel
  const histories = await Promise.allSettled(
    holdings.map(async (h: { symbol: string; quantity: number; avg_price: number }) => {
      const prices = await getHistoricalPrices(h.symbol, validPeriod as any);
      return { symbol: h.symbol, quantity: h.quantity, avg_price: h.avg_price, prices };
    })
  );

  const results = histories
    .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
    .map((r) => r.value);

  if (!results.length) return Response.json([]);

  // Merge all dates across all holdings
  const allDates = Array.from(
    new Set(results.flatMap((r) => r.prices.map((p: any) => p.date)))
  ).sort();

  // Build price lookup map per symbol
  const priceMaps: Record<string, Record<string, number>> = {};
  for (const r of results) {
    priceMaps[r.symbol] = {};
    for (const p of r.prices) {
      priceMaps[r.symbol][p.date] = p.close;
    }
  }

  // For each date, compute total portfolio value and total cost
  const totalCost = results.reduce((s, r) => s + r.avg_price * r.quantity, 0);

  // Fill forward missing prices
  const lastKnown: Record<string, number> = {};
  const history = allDates.map((date) => {
    let value = 0;
    for (const r of results) {
      const price = priceMaps[r.symbol][date];
      if (price != null) lastKnown[r.symbol] = price;
      value += (lastKnown[r.symbol] ?? r.avg_price) * r.quantity;
    }
    return { date, value: Math.round(value * 100) / 100, cost: Math.round(totalCost * 100) / 100 };
  });

  return Response.json(history);
}
