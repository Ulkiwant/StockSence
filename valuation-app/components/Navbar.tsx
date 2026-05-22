"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import type { AuthChangeEvent, Session, UserResponse } from "@supabase/supabase-js";
import { Bell, LogOut, User, Settings, KeyRound, ChevronDown } from "lucide-react";
import SearchBar from "./SearchBar";
import Brand from "./Brand";
import { useSettings } from "@/lib/settings";
import type { Locale, Currency } from "@/lib/settings";

const NAV_LINK_KEYS = [
  { href: "/",          key: "nav.home",      exact: true  },
  { href: "/watchlist", key: "nav.watchlist",  exact: false },
  { href: "/portfolio", key: "nav.portfolio",  exact: false },
  { href: "/advisor",   key: "nav.advisor",    exact: false },
  { href: "/faq",       key: "nav.faq",        exact: false },
  { href: "/glossaire", key: "nav.glossary",   exact: false },
];

export default function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { locale, currency, setLocale, setCurrency, t } = useSettings();

  useEffect(() => {
    supabase.auth.getUser().then((res: UserResponse) => setUser(res.data.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

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
        {NAV_LINK_KEYS.map(({ href, key, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href) && href !== "/";
          const isHome = exact && pathname === href;
          const isActive = href === "/" ? isHome : active;
          return (
            <NavLink key={href} href={href} active={isActive}>
              {t(key)}
            </NavLink>
          );
        })}
      </div>

      {/* Language & Currency toggles */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        {/* Language toggle */}
        <div style={{ display: "flex", border: "1px solid var(--line)", borderRadius: 6, overflow: "hidden" }}>
          {(["fr", "en"] as const).map((l: Locale) => (
            <button key={l} onClick={() => setLocale(l)} style={{
              padding: "3px 8px", fontSize: 11, fontWeight: 600,
              background: locale === l ? "var(--ink)" : "transparent",
              color: locale === l ? "#fff" : "var(--muted)",
              border: "none", cursor: "pointer", textTransform: "uppercase",
            }}>
              {l}
            </button>
          ))}
        </div>

        {/* Currency toggle */}
        <div style={{ display: "flex", border: "1px solid var(--line)", borderRadius: 6, overflow: "hidden" }}>
          {(["EUR", "USD"] as const).map((c: Currency) => (
            <button key={c} onClick={() => setCurrency(c)} style={{
              padding: "3px 8px", fontSize: 11, fontWeight: 600,
              background: currency === c ? "var(--ink)" : "transparent",
              color: currency === c ? "#fff" : "var(--muted)",
              border: "none", cursor: "pointer",
            }}>
              {c === "EUR" ? "€" : "$"}
            </button>
          ))}
        </div>
      </div>

      {/* Auth */}
      <div style={{ flexShrink: 0, marginLeft: 6 }}>
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* Bell */}
            <Link
              href="/parametres/alertes"
              title="Alertes email"
              style={{
                width: 34, height: 34, borderRadius: "50%",
                border: "1px solid var(--line)",
                background: pathname.startsWith("/parametres") ? "var(--accent-soft)" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: pathname.startsWith("/parametres") ? "var(--accent)" : "var(--muted)",
                transition: "all 0.15s",
              }}
            >
              <Bell size={15} strokeWidth={1.8} />
            </Link>

            {/* Avatar + dropdown */}
            <div ref={menuRef} style={{ position: "relative" }}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "3px 10px 3px 4px",
                  borderRadius: 9999,
                  background: menuOpen ? "var(--paper-3)" : "var(--accent-soft)",
                  border: `1.5px solid ${menuOpen ? "var(--line)" : "var(--accent)"}`,
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                {/* Avatar circle */}
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: "var(--accent)", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, flexShrink: 0,
                }}>
                  {user.email?.[0]?.toUpperCase() ?? <User size={12} />}
                </div>
                <ChevronDown
                  size={13} strokeWidth={2.5}
                  color="var(--accent)"
                  style={{ transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.18s" }}
                />
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 8px)", right: 0,
                  width: 230,
                  background: "var(--paper)",
                  border: "1.5px solid var(--line)",
                  borderRadius: 14,
                  boxShadow: "0 8px 32px rgba(10,22,40,0.10)",
                  overflow: "hidden",
                  zIndex: 200,
                }}>
                  {/* Email header */}
                  <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid var(--line)" }}>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 2 }}>Connecté en tant que</div>
                    <div style={{
                      fontSize: 13, fontWeight: 600, color: "var(--ink)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {user.email}
                    </div>
                  </div>

                  {/* Menu items */}
                  <div style={{ padding: "6px 0" }}>
                    <DropdownLink
                      href="/parametres/compte"
                      icon={<Settings size={14} strokeWidth={1.8} />}
                      onClick={() => setMenuOpen(false)}
                    >
                      Mon compte
                    </DropdownLink>
                    <DropdownLink
                      href="/parametres/compte#password"
                      icon={<KeyRound size={14} strokeWidth={1.8} />}
                      onClick={() => setMenuOpen(false)}
                    >
                      Changer le mot de passe
                    </DropdownLink>
                    <DropdownLink
                      href="/parametres/alertes"
                      icon={<Bell size={14} strokeWidth={1.8} />}
                      onClick={() => setMenuOpen(false)}
                    >
                      Alertes email
                    </DropdownLink>
                  </div>

                  {/* Separator + Sign out */}
                  <div style={{ borderTop: "1px solid var(--line)", padding: "6px 0 4px" }}>
                    <button
                      onClick={handleSignOut}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 10,
                        padding: "9px 16px",
                        background: "transparent", border: "none", cursor: "pointer",
                        color: "#c0392b", fontSize: 13, fontWeight: 500,
                        transition: "background 0.12s",
                        textAlign: "left",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <LogOut size={14} strokeWidth={1.8} />
                      {t("nav.logout")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/auth/login" className="btn-ghost" style={{ borderRadius: 9999, padding: "7px 16px", fontSize: 13 }}>
              {t("nav.login")}
            </Link>
            <Link href="/auth/signup" className="btn-primary" style={{ borderRadius: 9999, padding: "7px 16px", fontSize: 13 }}>
              {t("nav.signup")}
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

function DropdownLink({ href, icon, children, onClick }: { href: string; icon: React.ReactNode; children: React.ReactNode; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "9px 16px",
        color: "var(--ink)", fontSize: 13, fontWeight: 500,
        transition: "background 0.12s",
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--paper-2)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
    >
      <span style={{ color: "var(--muted)" }}>{icon}</span>
      {children}
    </Link>
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
