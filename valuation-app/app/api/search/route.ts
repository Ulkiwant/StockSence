import { NextRequest } from "next/server";
import { searchStocks } from "@/lib/yahoo";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 1) return Response.json([]);

  const results = await searchStocks(q);
  return Response.json(results);
}
