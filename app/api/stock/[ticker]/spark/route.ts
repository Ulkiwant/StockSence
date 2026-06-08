import { NextRequest } from "next/server";
import { getIntradaySparkline } from "@/lib/yahoo";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;

  if (!/^[A-Z0-9.\-\^=]{1,20}$/i.test(ticker)) {
    return Response.json({ points: [] }, { status: 400 });
  }

  const points = await getIntradaySparkline(ticker.toUpperCase());
  return Response.json({ points });
}
