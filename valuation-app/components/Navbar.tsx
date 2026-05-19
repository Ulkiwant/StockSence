"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import type { AuthChangeEvent, Session, UserResponse } from "@supabase/supabase-js";
import SearchBar from "./SearchBar";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<{ email?: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then((res: UserResponse) => setUser(res.data.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <nav style={{
      background: "rgba(17,17,16,0.88)", backdropFilter: "blur(20px)",
      borderBottom: "1px solid var(--border-subtle)", position: "sticky", top: 0, zIndex: 50,
      padding: "0 20px", height: 64, display: "flex", alignItems: "center", gap: 16,
    }}>
      {/* Logo */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: "rgba(134,239,172,0.10)",
          border: "1px solid rgba(134,239,172,0.22)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: 15, color: "var(--accent)",
        }}>S</div>
        <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.3px", color: "var(--text-primary)" }}>
          Stock<span className="gradient-text">Sense</span>
        </span>
      </Link>

      {/* Search */}
      <div style={{ flex: 1, maxWidth: 380 }}>
        <SearchBar compact />
      </div>

      {/* Nav links */}
      <div style={{ display: "flex", gap: 2, marginLeft: "auto", flexShrink: 0 }}>
        <NavLink href="/" active={pathname === "/"}>Accueil</NavLink>
        <NavLink href="/watchlist" active={pathname === "/watchlist"}>Mes actions</NavLink>
        <NavLink href="/portfolio" active={pathname.startsWith("/portfolio")}>Portefeuille</NavLink>
        <NavLink href="/advisor" active={pathname.startsWith("/advisor")}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 12 }}>🎯</span> Conseiller
          </span>
        </NavLink>
        <NavLink href="/faq" active={pathname.startsWith("/faq")}>FAQ</NavLink>
        <NavLink href="/glossaire" active={pathname.startsWith("/glossaire")}>Glossaire</NavLink>
      </div>

      {/* Auth */}
      <div style={{ flexShrink: 0, marginLeft: 8 }}>
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "rgba(134,239,172,0.12)",
              border: "1px solid rgba(134,239,172,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: "var(--accent)", cursor: "default",
            }} title={user.email}>
              {user.email?.[0]?.toUpperCase() ?? "?"}
            </div>
            <button onClick={handleSignOut} style={{
              padding: "6px 14px", borderRadius: 8,
              border: "1px solid var(--border-default)",
              background: "rgba(255,255,255,0.03)",
              color: "var(--text-secondary)", fontSize: 13,
              cursor: "pointer", transition: "all 0.15s",
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"; }}
            >
              Déconnexion
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/auth/login" style={{
              padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500,
              color: "var(--text-secondary)",
              border: "1px solid var(--border-default)",
              background: "rgba(255,255,255,0.03)",
              transition: "all 0.15s",
            }}>Connexion</Link>
            <Link href="/auth/signup" style={{
              padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
              color: "var(--cta-text)", background: "var(--cta-bg)", border: "none",
              transition: "opacity 0.15s",
            }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >S'inscrire</Link>
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} style={{
      padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 500,
      color: active ? "var(--accent)" : "var(--text-secondary)",
      background: active ? "rgba(134,239,172,0.08)" : "transparent",
      border: active ? "1px solid rgba(134,239,172,0.15)" : "1px solid transparent",
      transition: "all 0.15s", whiteSpace: "nowrap",
    }}>
      {children}
    </Link>
  );
}
