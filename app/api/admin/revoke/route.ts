import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_EMAIL } from "@/lib/plan";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    return Response.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { email } = await req.json() as { email: string };
  if (!email) return Response.json({ error: "email requis" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("user_plans")
    .delete()
    .eq("email", email.toLowerCase().trim());

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
