import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/portfolio", "/watchlist"];

export async function proxy(request: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) return NextResponse.next({ request });

    let response = NextResponse.next({ request });

    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          try { return request.cookies.getAll(); } catch { return []; }
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          } catch { /* ignore cookie errors */ }
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    const pathname = request.nextUrl.pathname;
    const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));

    if (!user && isProtected) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/auth/login";
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    return response;
  } catch {
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
