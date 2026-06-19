import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { ADMIN_EMAIL, type Plan } from "@/lib/plan";
import { INVESTOR_PROFILES, determineProfile } from "@/lib/investorProfiles";

export async function POST(req: NextRequest) {
  // Récupérer le plan de l'utilisateur (sert uniquement à débloquer
  // l'affichage détaillé de l'exemple de répartition — contenu statique
  // identique pour tous, sans génération ni personnalisation).
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let userPlan: Plan | "guest" = "guest";

  if (user?.email) {
    if (user.email === ADMIN_EMAIL) {
      userPlan = "admin";
    } else {
      const { data: planData } = await supabase
        .from("user_plans")
        .select("plan, expires_at")
        .eq("email", user.email)
        .single();

      if (planData && (!planData.expires_at || new Date(planData.expires_at) >= new Date())) {
        userPlan = planData.plan as Plan;
      } else {
        userPlan = "free";
      }
    }
  }

  const answers = await req.json();
  const profileKey = determineProfile(answers);
  const profile = INVESTOR_PROFILES[profileKey];

  return Response.json({ ...profile, isGuest: userPlan === "guest", userPlan });
}
