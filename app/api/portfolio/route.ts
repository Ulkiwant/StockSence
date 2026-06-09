import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { ADMIN_EMAIL, PLAN_LIMITS, type Plan } from "@/lib/plan";

const isConfigured = () => !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

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
  const { data } = await supabase.from("holdings").select("*").eq("user_id", user.id).order("created_at", { ascending: true });
  return Response.json(data ?? []);
}

export async function POST(req: NextRequest) {
  if (!isConfigured()) return Response.json({ error: "Auth not configured" }, { status: 503 });
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { symbol, name, quantity, avg_price, currency, asset_type } = body;
  if (!symbol || !quantity || !avg_price) return Response.json({ error: "Champs manquants" }, { status: 400 });

  // Vérifier la limite de positions selon le plan (uniquement pour les nouvelles positions)
  const { data: existing } = await supabase.from("holdings").select("*").eq("user_id", user.id).eq("symbol", symbol.toUpperCase()).single();

  if (!existing) {
    const plan   = await getUserPlan(supabase, user.email);
    const limits = PLAN_LIMITS[plan];
    if (limits.portfolioMax < Infinity) {
      const { count } = await supabase.from("holdings").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      if ((count ?? 0) >= limits.portfolioMax) {
        return Response.json({
          error: "LIMIT_REACHED",
          message: `Votre plan est limité à ${limits.portfolioMax} positions. Passez à l'offre supérieure pour en ajouter plus.`,
          limit: limits.portfolioMax, plan,
        }, { status: 403 });
      }
    }
  }

  if (existing) {
    const totalQty = existing.quantity + quantity;
    const newAvg   = (existing.avg_price * existing.quantity + avg_price * quantity) / totalQty;
    const { data } = await supabase.from("holdings").update({ quantity: totalQty, avg_price: Math.round(newAvg * 100) / 100 }).eq("id", existing.id).select().single();
    return Response.json(data);
  }

  const { data } = await supabase.from("holdings").insert({ user_id: user.id, symbol: symbol.toUpperCase(), name: name ?? symbol.toUpperCase(), quantity, avg_price, currency: currency ?? "EUR", asset_type: asset_type ?? "stock" }).select().single();
  return Response.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!isConfigured()) return Response.json({ error: "Auth not configured" }, { status: 503 });
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id, quantity, avg_price } = await req.json();
  if (!id || !quantity || !avg_price) return Response.json({ error: "Champs manquants" }, { status: 400 });
  const { data } = await supabase
    .from("holdings")
    .update({ quantity: parseFloat(quantity), avg_price: parseFloat(avg_price) })
    .eq("id", id).eq("user_id", user.id)
    .select().single();
  return Response.json(data);
}

export async function DELETE(req: NextRequest) {
  if (!isConfigured()) return Response.json({ error: "Auth not configured" }, { status: 503 });
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await supabase.from("holdings").delete().eq("id", id).eq("user_id", user.id);
  return Response.json({ ok: true });
}
