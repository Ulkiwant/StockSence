import { createServerSupabaseClient } from "@/lib/supabase-server";
import { ADMIN_EMAIL, Plan } from "@/lib/plan";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) return Response.json({ plan: "free" as Plan, guest: true });

  // Admin email → accès total permanent
  if (user.email === ADMIN_EMAIL) {
    return Response.json({ plan: "admin" as Plan, email: user.email });
  }

  // Vérifier la table user_plans
  const { data } = await supabase
    .from("user_plans")
    .select("plan, expires_at")
    .eq("email", user.email)
    .single();

  if (!data) return Response.json({ plan: "free" as Plan });

  // Vérifier l'expiration
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return Response.json({ plan: "free" as Plan, expired: true });
  }

  return Response.json({ plan: data.plan as Plan, email: user.email });
}
