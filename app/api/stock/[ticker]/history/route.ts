import { NextRequest } from "next/server";
import { getHistoricalPrices } from "@/lib/yahoo";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const period = (req.nextUrl.searchParams.get("period") ?? "1y") as
    | "1mo" | "3mo" | "6mo" | "1y" | "5y";

  const data = await getHistoricalPrices(ticker.toUpperCase(), period);
  return Response.json(data);
}
