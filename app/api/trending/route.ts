import { getTrendingStocks } from "@/lib/yahoo";

export const revalidate = 3600;

export async function GET() {
  const stocks = await getTrendingStocks();
  return Response.json(stocks);
}
