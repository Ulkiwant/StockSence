"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Star, Briefcase, Target, User } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useMobile } from "@/lib/useMobile";
import { isStandalone, subscribe } from "@/lib/installPrompt";
import type { AuthChangeEvent, Session, UserResponse } from "@supabase/supabase-js";

export default function MobileTabBar() {
  const isMobile = useMobile();
  const pathname = usePathname();
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then((res: UserResponse) => setUser(res.data.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_e: AuthChangeEvent, session: Session | null) => setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setStandalone(isStandalone());
    return subscribe(() => setStandalone(isStandalone()));
  }, []);

  if (!isMobile) return null;
  // Pas de bottom bar sur les écrans d'auth (plein écran, focus formulaire)
  if (pathname.startsWith("/auth/")) return null;

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  // Une fois installée, le tableau de bord (watchlist) remplace la landing
  // marketing comme premier onglet — mais on garde un libellé honnête
  // ("Watchlist"), pas "Accueil" qui ne correspondrait pas au contenu affiché.
  const tabs = standalone
    ? [
        { href: "/watchlist", label: "Watchlist",   icon: Home,      exact: false },
        { href: "/advisor",   label: "Profils",      icon: Target,    exact: false },
        { href: "/portfolio", label: "Portefeuille", icon: Briefcase, exact: false },
      ]
    : [
        { href: "/",          label: "Accueil",      icon: Home,      exact: true  },
        { href: "/watchlist", label: "Watchlist",     icon: Star,      exact: false },
        { href: "/advisor",   label: "Profils",       icon: Target,    exact: false },
        { href: "/portfolio", label: "Portefeuille",  icon: Briefcase, exact: false },
      ];

  const accountTab = {
    href: user ? "/parametres/compte" : "/auth/login",
    label: user ? "Compte" : "Connexion",
  };

  return (
    <nav
      className="mobile-tab-bar"
      style={{
        position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 90,
        background: "rgba(245,241,234,0.96)",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        borderTop: "1px solid var(--line)",
        display: "flex", alignItems: "stretch",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {tabs.map(({ href, label, icon: Icon, exact }) => {
        const active = isActive(href, exact);
        return (
          <Link key={href} href={href} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 3, padding: "8px 4px 7px",
            color: active ? "var(--accent)" : "var(--muted)",
            textDecoration: "none",
          }}>
            <Icon size={20} strokeWidth={active ? 2.3 : 1.8} />
            <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 500 }}>{label}</span>
          </Link>
        );
      })}
      <Link href={accountTab.href} style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 3, padding: "8px 4px 7px",
        color: isActive(accountTab.href, false) ? "var(--accent)" : "var(--muted)",
        textDecoration: "none",
      }}>
        <User size={20} strokeWidth={isActive(accountTab.href, false) ? 2.3 : 1.8} />
        <span style={{ fontSize: 10.5, fontWeight: isActive(accountTab.href, false) ? 700 : 500 }}>{accountTab.label}</span>
      </Link>
    </nav>
  );
}
