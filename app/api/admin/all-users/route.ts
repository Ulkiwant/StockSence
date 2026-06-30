import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_EMAIL } from "@/lib/plan";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    return Response.json({ error: "Accès refusé" }, { status: 403 });
  }

  // Tous les comptes Supabase Auth — pas seulement ceux ayant un plan attribué.
  const allUsers: { id: string; email: string | undefined; created_at: string; last_sign_in_at: string | null }[] = [];
  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    allUsers.push(...data.users.map((u) => ({
      id: u.id, email: u.email, created_at: u.created_at, last_sign_in_at: u.last_sign_in_at ?? null,
    })));
    if (data.users.length < perPage) break;
    page += 1;
  }

  allUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return Response.json(allUsers);
}
