import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/portfolio", "/watchlist"];
const ADMIN_ROUTES     = ["/admin"];  // /api/admin/* est re-vérifié côté API server

export async function proxy(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;

    // Vérification de session via cookie Supabase (sans appel réseau)
    const hasSession = request.cookies.getAll().some(
      ({ name }) => name.startsWith("sb-") && name.includes("-auth-token")
    );

    // ── 1. Routes admin (page /admin uniquement — les API /api/admin/* vérifient elles-mêmes) ──
    const isAdminRoute = ADMIN_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
    if (isAdminRoute && !hasSession) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/auth/login";
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // ── 2. Routes utilisateur protégées (portfolio, watchlist) ──
    const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
    if (isProtected && !hasSession) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/auth/login";
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next({ request });
  } catch {
    return NextResponse.next({ request });
  }
}

export const config = {
  // Appliquer sur toutes les routes sauf les assets statiques
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
