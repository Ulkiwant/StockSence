"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import type { AuthChangeEvent, Session, UserResponse } from "@supabase/supabase-js";
import { Bell, LogOut, User, Settings, KeyRound, ChevronDown, Menu, X } from "lucide-react";
import SearchBar from "./SearchBar";
import Brand from "./Brand";
import { useSettings } from "@/lib/settings";
import type { Locale, Currency } from "@/lib/settings";

const NAV_LINKS = [
  { href: "/",          key: "nav.home",     exact: true  },
  { href: "/watchlist", key: "nav.watchlist", exact: false },
  { href: "/portfolio", key: "nav.portfolio", exact: false },
  { href: "/advisor",   key: "nav.advisor",   exact: false },
  { href: "/faq",       key: "nav.faq",       exact: false },
  { href: "/glossaire", key: "nav.glossary",  exact: false },
];

export default function Navbar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const supabase  = createClient();
  const [user, setUser]           = useState<{ email?: string } | null>(null);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { locale, currency, setLocale, setCurrency, t } = useSettings();

  useEffect(() => {
    supabase.auth.getUser().then((res: UserResponse) => setUser(res.data.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
    setMobileOpen(false);
    router.push("/");
    router.refresh();
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <>
      <nav style={{
        background: "rgba(245, 241, 234, 0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--line)",
        position: "sticky", top: 0, zIndex: 50,
        padding: "0 20px", height: 60,
        display: "flex", alignItems: "center", gap: 16,
      }}>
        {/* Brand */}
        <Brand size="md" />

        {/* Search — desktop only */}
        <div className="nav-desktop" style={{ flex: 1, maxWidth: 360 }}>
          <SearchBar compact />
        </div>

        {/* Nav pills — desktop only */}
        <div className="nav-desktop" style={{ display: "flex", gap: 2, marginLeft: "auto", flexShrink: 0 }}>
          {NAV_LINKS.map(({ href, key, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href) && href !== "/";
            return (
              <NavLink key={href} href={href} active={exact ? pathname === href : active}>
                {t(key)}
              </NavLink>
            );
          })}
        </div>

        {/* Language & currency — desktop only */}
        <div className="nav-desktop" style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <div style={{ display: "flex", border: "1px solid var(--line)", borderRadius: 6, overflow: "hidden" }}>
            {(["fr", "en"] as const).map((l: Locale) => (
              <button key={l} onClick={() => setLocale(l)} style={{
                padding: "3px 8px", fontSize: 11, fontWeight: 600,
                background: locale === l ? "var(--ink)" : "transparent",
                color: locale === l ? "#fff" : "var(--muted)",
                border: "none", cursor: "pointer", textTransform: "uppercase",
              }}>{l}</button>
            ))}
          </div>
          <div style={{ display: "flex", border: "1px solid var(--line)", borderRadius: 6, overflow: "hidden" }}>
            {(["EUR", "USD"] as const).map((c: Currency) => (
              <button key={c} onClick={() => setCurrency(c)} style={{
                padding: "3px 8px", fontSize: 11, fontWeight: 600,
                background: currency === c ? "var(--ink)" : "transparent",
                color: currency === c ? "#fff" : "var(--muted)",
                border: "none", cursor: "pointer",
              }}>{c === "EUR" ? "€" : "$"}</button>
            ))}
          </div>
        </div>

        {/* Auth — desktop only */}
        <div className="nav-desktop" style={{ flexShrink: 0, marginLeft: 6, display: "flex" }}>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Link href="/parametres/alertes" title="Alertes email" style={{
                width: 34, height: 34, borderRadius: "50%", border: "1px solid var(--line)",
                background: pathname.startsWith("/parametres") ? "var(--accent-soft)" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: pathname.startsWith("/parametres") ? "var(--accent)" : "var(--muted)", transition: "all 0.15s",
              }}><Bell size={15} strokeWidth={1.8} /></Link>
              <div ref={menuRef} style={{ position: "relative" }}>
                <button onClick={() => setMenuOpen((o) => !o)} style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "3px 10px 3px 4px", borderRadius: 9999,
                  background: menuOpen ? "var(--paper-3)" : "var(--accent-soft)",
                  border: `1.5px solid ${menuOpen ? "var(--line)" : "var(--accent)"}`,
                  cursor: "pointer", transition: "all 0.15s",
                }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                    {user.email?.[0]?.toUpperCase() ?? <User size={12} />}
                  </div>
                  <ChevronDown size={13} strokeWidth={2.5} color="var(--accent)" style={{ transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.18s" }} />
                </button>
                {menuOpen && (
                  <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 230, background: "var(--paper)", border: "1.5px solid var(--line)", borderRadius: 14, boxShadow: "0 8px 32px rgba(10,22,40,0.10)", overflow: "hidden", zIndex: 200 }}>
                    <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid var(--line)" }}>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 2 }}>Connecté en tant que</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
                    </div>
                    <div style={{ padding: "6px 0" }}>
                      <DropdownLink href="/parametres/compte" icon={<Settings size={14} strokeWidth={1.8} />} onClick={() => setMenuOpen(false)}>Mon compte</DropdownLink>
                      <DropdownLink href="/parametres/compte#password" icon={<KeyRound size={14} strokeWidth={1.8} />} onClick={() => setMenuOpen(false)}>Changer le mot de passe</DropdownLink>
                      <DropdownLink href="/parametres/alertes" icon={<Bell size={14} strokeWidth={1.8} />} onClick={() => setMenuOpen(false)}>Alertes email</DropdownLink>
                    </div>
                    <div style={{ borderTop: "1px solid var(--line)", padding: "6px 0 4px" }}>
                      <button onClick={handleSignOut} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", background: "transparent", border: "none", cursor: "pointer", color: "#c0392b", fontSize: 13, fontWeight: 500, transition: "background 0.12s", textAlign: "left" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                        <LogOut size={14} strokeWidth={1.8} />{t("nav.logout")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <Link href="/auth/login" className="btn-ghost" style={{ borderRadius: 9999, padding: "7px 16px", fontSize: 13 }}>{t("nav.login")}</Link>
              <Link href="/auth/signup" className="btn-primary" style={{ borderRadius: 9999, padding: "7px 16px", fontSize: 13 }}>{t("nav.signup")}</Link>
            </div>
          )}
        </div>

        {/* Hamburger — mobile only */}
        <div className="nav-hamburger" style={{ marginLeft: "auto", gap: 8, alignItems: "center" }}>
          {user && (
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
              {user.email?.[0]?.toUpperCase() ?? <User size={13} />}
            </div>
          )}
          <button onClick={() => setMobileOpen((o) => !o)} style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid var(--line)", background: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* ── Mobile menu overlay ── */}
      {mobileOpen && (
        <div className="mobile-nav-overlay">
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 60, borderBottom: "1px solid var(--line)", flexShrink: 0 }}>
            <Brand size="md" />
            <button onClick={() => setMobileOpen(false)} style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid var(--line)", background: "var(--paper-3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <X size={18} />
            </button>
          </div>

          {/* Search */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
            <SearchBar compact />
          </div>

          {/* Nav links */}
          <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 2 }}>
            {NAV_LINKS.map(({ href, key, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href) && href !== "/";
              const isActive = exact ? pathname === href : active;
              return (
                <Link key={href} href={href} onClick={() => setMobileOpen(false)} style={{
                  display: "flex", alignItems: "center", padding: "13px 16px", borderRadius: 12,
                  fontSize: 16, fontWeight: isActive ? 600 : 500,
                  color: isActive ? "var(--ink)" : "var(--muted)",
                  background: isActive ? "var(--paper-3)" : "transparent",
                }}>
                  {t(key)}
                </Link>
              );
            })}
          </div>

          {/* Language & currency */}
          <div style={{ padding: "16px 20px", borderTop: "1px solid var(--line)", display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>Langue</span>
            <div style={{ display: "flex", border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden" }}>
              {(["fr", "en"] as const).map((l: Locale) => (
                <button key={l} onClick={() => setLocale(l)} style={{ padding: "6px 14px", fontSize: 13, fontWeight: 600, background: locale === l ? "var(--ink)" : "transparent", color: locale === l ? "#fff" : "var(--muted)", border: "none", cursor: "pointer", textTransform: "uppercase" }}>{l}</button>
              ))}
            </div>
            <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500, marginLeft: 8 }}>Devise</span>
            <div style={{ display: "flex", border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden" }}>
              {(["EUR", "USD"] as const).map((c: Currency) => (
                <button key={c} onClick={() => setCurrency(c)} style={{ padding: "6px 14px", fontSize: 13, fontWeight: 600, background: currency === c ? "var(--ink)" : "transparent", color: currency === c ? "#fff" : "var(--muted)", border: "none", cursor: "pointer" }}>{c === "EUR" ? "€" : "$"}</button>
              ))}
            </div>
          </div>

          {/* Auth */}
          <div style={{ padding: "16px 20px", borderTop: "1px solid var(--line)", marginTop: "auto" }}>
            {user ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>
                  Connecté : <span style={{ color: "var(--ink)", fontWeight: 500 }}>{user.email}</span>
                </div>
                <Link href="/parametres/compte" onClick={() => setMobileOpen(false)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)", fontSize: 14, fontWeight: 500 }}>
                  <Settings size={16} strokeWidth={1.8} />Mon compte
                </Link>
                <button onClick={handleSignOut} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, border: "1px solid #fecaca", background: "#fef2f2", color: "#c0392b", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
                  <LogOut size={16} strokeWidth={1.8} />{t("nav.logout")}
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Link href="/auth/login" onClick={() => setMobileOpen(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "13px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)", fontSize: 15, fontWeight: 500, textAlign: "center" }}>
                  {t("nav.login")}
                </Link>
                <Link href="/auth/signup" onClick={() => setMobileOpen(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "13px", borderRadius: 12, border: "none", background: "#1F5C3E", color: "#F6F2E8", fontSize: 15, fontWeight: 600, textAlign: "center" }}>
                  {t("nav.signup")}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function DropdownLink({ href, icon, children, onClick }: { href: string; icon: React.ReactNode; children: React.ReactNode; onClick?: () => void }) {
  return (
    <Link href={href} onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", color: "var(--ink)", fontSize: 13, fontWeight: 500, transition: "background 0.12s" }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--paper-2)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}>
      <span style={{ color: "var(--muted)" }}>{icon}</span>{children}
    </Link>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} style={{ padding: "5px 12px", borderRadius: 9999, fontSize: 13, fontWeight: active ? 600 : 500, color: active ? "var(--ink)" : "var(--muted)", background: active ? "var(--paper-3)" : "transparent", border: "1px solid " + (active ? "var(--line)" : "transparent"), transition: "all 0.15s", whiteSpace: "nowrap" }}>
      {children}
    </Link>
  );
}
