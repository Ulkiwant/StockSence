import { NextRequest } from "next/server";
import { getStockNews } from "@/lib/yahoo";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const news = await getStockNews(ticker.toUpperCase());
  return Response.json(news);
}
