import { getTrendingStocks } from "@/lib/yahoo";

export const dynamic = "force-dynamic";

export async function GET() {
  const stocks = await getTrendingStocks();
  return Response.json(stocks);
}
