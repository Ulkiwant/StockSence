import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_EMAIL, Plan } from "@/lib/plan";

// Client service role — contourne le RLS pour les opérations admin
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  // Vérification auth de l'utilisateur courant (pas service role)
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    return Response.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { email, plan, note, expires_at } = await req.json() as {
    email: string; plan: Plan; note?: string; expires_at?: string;
  };

  if (!email || !plan) return Response.json({ error: "email et plan requis" }, { status: 400 });
  if (!["free", "investisseur", "premium", "admin"].includes(plan)) {
    return Response.json({ error: "Plan invalide" }, { status: 400 });
  }

  // Utilise le service role pour bypasser le RLS
  const { error } = await supabaseAdmin
    .from("user_plans")
    .upsert({
      email: email.toLowerCase().trim(),
      plan,
      note: note ?? null,
      expires_at: expires_at ?? null,
      granted_at: new Date().toISOString(),
    }, { onConflict: "email" });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ success: true, email, plan });
}
