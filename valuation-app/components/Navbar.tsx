"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import type { AuthChangeEvent, Session, UserResponse } from "@supabase/supabase-js";
import { Bell, LogOut, User, BarChart2 } from "lucide-react";
import SearchBar from "./SearchBar";
import Brand from "./Brand";

const NAV_LINKS = [
  { href: "/",          label: "Accueil",     exact: true  },
  { href: "/watchlist", label: "Mes actions", exact: false },
  { href: "/portfolio", label: "Portefeuille",exact: false },
  { href: "/advisor",   label: "Conseiller",  exact: false },
  { href: "/faq",       label: "FAQ",         exact: false },
  { href: "/glossaire", label: "Glossaire",   exact: false },
];

export default function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<{ email?: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then((res: UserResponse) => setUser(res.data.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <nav style={{
      background: "rgba(245, 241, 234, 0.92)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      borderBottom: "1px solid var(--line)",
      position: "sticky",
      top: 0,
      zIndex: 50,
      padding: "0 20px",
      height: 60,
      display: "flex",
      alignItems: "center",
      gap: 16,
    }}>
      {/* Brand */}
      <Brand size="md" />

      {/* Search */}
      <div style={{ flex: 1, maxWidth: 360 }}>
        <SearchBar compact />
      </div>

      {/* Nav pills */}
      <div style={{ display: "flex", gap: 2, marginLeft: "auto", flexShrink: 0 }}>
        {NAV_LINKS.map(({ href, label, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href) && href !== "/";
          const isHome = exact && pathname === href;
          const isActive = href === "/" ? isHome : active;
          return (
            <NavLink key={href} href={href} active={isActive}>
              {label}
            </NavLink>
          );
        })}
      </div>

      {/* Auth */}
      <div style={{ flexShrink: 0, marginLeft: 6 }}>
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Link
              href="/parametres/alertes"
              title="Alertes email"
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                border: "1px solid var(--line)",
                background: pathname.startsWith("/parametres") ? "var(--accent-soft)" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: pathname.startsWith("/parametres") ? "var(--accent)" : "var(--muted)",
                transition: "all 0.15s",
              }}
            >
              <Bell size={15} strokeWidth={1.8} />
            </Link>
            <Link
              href="/portfolio"
              title="Portefeuille"
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                border: "1px solid var(--line)",
                background: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--muted)",
                transition: "all 0.15s",
              }}
            >
              <BarChart2 size={15} strokeWidth={1.8} />
            </Link>
            {/* Avatar */}
            <div
              title={user.email}
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "var(--accent-soft)",
                border: "1.5px solid var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                color: "var(--accent)",
                cursor: "default",
                flexShrink: 0,
              }}
            >
              {user.email?.[0]?.toUpperCase() ?? <User size={14} />}
            </div>
            <button
              onClick={handleSignOut}
              title="Déconnexion"
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                border: "1px solid var(--line)",
                background: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--muted)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--paper-3)"; e.currentTarget.style.color = "var(--ink)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted)"; }}
            >
              <LogOut size={15} strokeWidth={1.8} />
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/auth/login" className="btn-ghost" style={{ borderRadius: 9999, padding: "7px 16px", fontSize: 13 }}>
              Connexion
            </Link>
            <Link href="/auth/signup" className="btn-primary" style={{ borderRadius: 9999, padding: "7px 16px", fontSize: 13 }}>
              S&apos;inscrire
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        padding: "5px 12px",
        borderRadius: 9999,
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        color: active ? "var(--ink)" : "var(--muted)",
        background: active ? "var(--paper-3)" : "transparent",
        border: "1px solid " + (active ? "var(--line)" : "transparent"),
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Link>
  );
}
