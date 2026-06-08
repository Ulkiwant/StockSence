import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { ADMIN_EMAIL, PLAN_LIMITS, type Plan } from "@/lib/plan";

const isConfigured = () => !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/** Récupère le plan de l'utilisateur depuis la table user_plans */
async function getUserPlan(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, email: string): Promise<Plan> {
  if (email === ADMIN_EMAIL) return "admin";
  const { data } = await supabase.from("user_plans").select("plan, expires_at").eq("email", email).single();
  if (!data) return "free";
  if (data.expires_at && new Date(data.expires_at) < new Date()) return "free";
  return (data.plan as Plan) ?? "free";
}

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
  if (!user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { symbol, name } = await req.json();

  // Vérifier la limite de watchlist selon le plan
  const plan   = await getUserPlan(supabase, user.email);
  const limits = PLAN_LIMITS[plan];

  if (limits.watchlistMax < Infinity) {
    const { count } = await supabase.from("watchlists").select("*", { count: "exact", head: true }).eq("user_id", user.id);
    if ((count ?? 0) >= limits.watchlistMax) {
      return Response.json({
        error: "LIMIT_REACHED",
        message: `Votre plan ${plan} est limité à ${limits.watchlistMax} actions. Passez à l'offre supérieure pour en ajouter plus.`,
        limit: limits.watchlistMax,
        plan,
      }, { status: 403 });
    }
  }

  await supabase.from("watchlists").upsert({ user_id: user.id, symbol, name }, { onConflict: "user_id,symbol" });
  return Response.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!isConfigured()) return Response.json({ error: "Auth not configured" }, { status: 503 });
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { symbol } = await req.json();
  await supabase.from("watchlists").delete().eq("user_id", user.id).eq("symbol", symbol);
  return Response.json({ ok: true });
}
