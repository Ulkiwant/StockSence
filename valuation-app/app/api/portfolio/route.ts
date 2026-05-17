import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const isConfigured = () => !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const ALLOWED_EMAIL = "quentin.celette@edu.em-lyon.com";

export async function GET() {
  if (!isConfigured()) return Response.json([]);
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json([]);
  const { data } = await supabase.from("holdings").select("*").eq("user_id", user.id).order("created_at", { ascending: true });
  return Response.json(data ?? []);
}

export async function POST(req: NextRequest) {
  if (!isConfigured()) return Response.json({ error: "Auth not configured" }, { status: 503 });
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.email !== ALLOWED_EMAIL) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { symbol, name, quantity, avg_price, currency, asset_type } = body;
  if (!symbol || !quantity || !avg_price) return Response.json({ error: "Champs manquants" }, { status: 400 });

  const { data: existing } = await supabase.from("holdings").select("*").eq("user_id", user.id).eq("symbol", symbol.toUpperCase()).single();

  if (existing) {
    const totalQty = existing.quantity + quantity;
    const newAvg = (existing.avg_price * existing.quantity + avg_price * quantity) / totalQty;
    const { data } = await supabase.from("holdings").update({ quantity: totalQty, avg_price: Math.round(newAvg * 100) / 100 }).eq("id", existing.id).select().single();
    return Response.json(data);
  }

  const { data } = await supabase.from("holdings").insert({ user_id: user.id, symbol: symbol.toUpperCase(), name: name ?? symbol.toUpperCase(), quantity, avg_price, currency: currency ?? "USD", asset_type: asset_type ?? "stock" }).select().single();
  return Response.json(data, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  if (!isConfigured()) return Response.json({ error: "Auth not configured" }, { status: 503 });
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.email !== ALLOWED_EMAIL) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await req.json();
  await supabase.from("holdings").delete().eq("id", id).eq("user_id", user.id);
  return Response.json({ ok: true });
}
