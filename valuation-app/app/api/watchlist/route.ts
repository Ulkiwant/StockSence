import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const isConfigured = () => !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const ALLOWED_EMAIL = "quentin.celette@edu.em-lyon.com";

export async function GET() {
  if (!isConfigured()) return Response.json([]);
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json([]);
  const { data } = await supabase.from("watchlists").select("symbol, name").eq("user_id", user.id);
  return Response.json(data ?? []);
}

export async function POST(req: NextRequest) {
  if (!isConfigured()) return Response.json({ error: "Auth not configured" }, { status: 503 });
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.email !== ALLOWED_EMAIL) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { symbol, name } = await req.json();
  await supabase.from("watchlists").upsert({ user_id: user.id, symbol, name }, { onConflict: "user_id,symbol" });
  return Response.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!isConfigured()) return Response.json({ error: "Auth not configured" }, { status: 503 });
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.email !== ALLOWED_EMAIL) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { symbol } = await req.json();
  await supabase.from("watchlists").delete().eq("user_id", user.id).eq("symbol", symbol);
  return Response.json({ ok: true });
}
