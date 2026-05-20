import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient as createServerClient } from "@/lib/supabase-server";

// GET  /api/alerts  — liste les alertes de l'utilisateur connecté
export async function GET() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("user_id", user.id)
    .order("ticker");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/alerts  — crée ou met à jour une alerte
export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { ticker, alert_type, threshold, active } = body as {
    ticker: string;
    alert_type: "signal_change" | "price_variation";
    threshold?: number | null;
    active: boolean;
  };

  if (!ticker || !alert_type) {
    return NextResponse.json({ error: "ticker and alert_type are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("alerts")
    .upsert(
      { user_id: user.id, ticker: ticker.toUpperCase(), alert_type, threshold: threshold ?? null, active },
      { onConflict: "user_id,ticker,alert_type" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/alerts?ticker=AAPL&alert_type=signal_change
export async function DELETE(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const ticker     = searchParams.get("ticker")?.toUpperCase();
  const alert_type = searchParams.get("alert_type");

  if (!ticker || !alert_type) {
    return NextResponse.json({ error: "ticker and alert_type are required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("alerts")
    .delete()
    .eq("user_id", user.id)
    .eq("ticker", ticker)
    .eq("alert_type", alert_type);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
