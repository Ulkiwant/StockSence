"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import type { AuthChangeEvent, Session, UserResponse } from "@supabase/supabase-js";
import { Bell, LogOut, User, Menu, X, Search, ChevronRight,
         Settings, CreditCard, HelpCircle, Shield } from "lucide-react";
import Brand from "./Brand";
import { useMobile } from "@/lib/useMobile";

const NAV_LINKS = [
  { href: "/",          label: "Accueil",      exact: true  },
  { href: "/debutant",  label: "🌱 Débuter",   exact: false },
  { href: "/watchlist", label: "Mes actions",  exact: false },
  { href: "/portfolio", label: "Portefeuille", exact: false },
  { href: "/advisor",   label: "Profils",      exact: false },
  { href: "/faq",       label: "FAQ",          exact: false },
  { href: "/glossaire", label: "Glossaire",    exact: false },
  { href: "/tarifs",    label: "Tarifs",       exact: false },
];

export default function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();
  const isMobile = useMobile();

  const [user, setUser]         = useState<{ email?: string } | null>(null);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef    = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then((res: UserResponse) => setUser(res.data.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line

  // Ferme les menus quand on navigue
  useEffect(() => { setMenuOpen(false); setProfileOpen(false); }, [pathname]);

  // Ferme le dropdown profil en cliquant ailleurs
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileOpen]);

  // Bloque le scroll body quand menu ouvert
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href) && href !== "/";
  };

  // Sur la homepage uniquement : position fixed (toujours visible en scrollant)
  // Sur les autres pages : sticky classique (disparaît quand on scroll)
  const isHome = pathname === "/";

  /* ── MOBILE NAVBAR ── */
  if (isMobile) {
    return (
      <>
        {isHome && <div style={{ height: 56, flexShrink: 0 }} />}
        <nav style={{
          background: "rgba(245,241,234,0.95)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--line)",
          position: isHome ? "fixed" : "sticky", top: 0, zIndex: 100,
          left: 0, right: 0,
          padding: "0 16px", height: 56,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <Brand size="sm" />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Search icon */}
            <Link href="/#search" style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
              <Search size={16} strokeWidth={1.8} />
            </Link>
            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(o => !o)}
              style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid var(--line)", background: menuOpen ? "var(--ink)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: menuOpen ? "var(--paper)" : "var(--ink)", cursor: "pointer" }}
            >
              {menuOpen ? <X size={18} strokeWidth={2} /> : <Menu size={18} strokeWidth={2} />}
            </button>
          </div>
        </nav>

        {/* ── Drawer mobile ── */}
        {menuOpen && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 99,
            background: "rgba(10,22,40,0.40)", backdropFilter: "blur(4px)",
          }} onClick={() => setMenuOpen(false)}>
            <div
              ref={menuRef}
              onClick={e => e.stopPropagation()}
              style={{
                position: "absolute", top: 56, left: 0, right: 0,
                background: "var(--paper)", borderBottom: "1px solid var(--line)",
                padding: "16px 0 24px",
              }}
            >
              {/* Nav links */}
              {NAV_LINKS.map(({ href, label, exact }) => (
                <Link key={href} href={href} onClick={() => setMenuOpen(false)} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "13px 20px", fontSize: 16, fontWeight: isActive(href, exact) ? 700 : 500,
                  color: isActive(href, exact) ? "var(--accent)" : "var(--ink)",
                  borderBottom: "1px solid var(--line)", textDecoration: "none",
                  background: isActive(href, exact) ? "var(--accent-soft)" : "transparent",
                }}>
                  {label}
                  <ChevronRight size={16} color="var(--muted)" />
                </Link>
              ))}

              {/* Auth */}
              <div style={{ padding: "16px 20px 0" }}>
                {user ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--accent-soft)", border: "1.5px solid var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "var(--accent)" }}>
                        {user.email?.[0]?.toUpperCase() ?? <User size={14} />}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{user.email}</div>
                        <Link href="/parametres/compte" onClick={() => setMenuOpen(false)} style={{ fontSize: 11, color: "var(--accent)" }}>Mon compte</Link>
                      </div>
                    </div>
                    <Link href="/parametres/alertes" onClick={() => setMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--muted)", padding: "6px 0" }}>
                      <Bell size={16} strokeWidth={1.8} /> Alertes email
                    </Link>
                    <button onClick={handleSignOut} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#c0392b", background: "none", border: "none", cursor: "pointer", padding: "6px 0" }}>
                      <LogOut size={16} strokeWidth={1.8} /> Se déconnecter
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <Link href="/auth/login" onClick={() => setMenuOpen(false)} style={{ display: "block", textAlign: "center", padding: "13px", borderRadius: 12, border: "1.5px solid var(--line)", color: "var(--ink)", fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
                      Connexion
                    </Link>
                    <Link href="/auth/signup" onClick={() => setMenuOpen(false)} style={{ display: "block", textAlign: "center", padding: "13px", borderRadius: 12, background: "var(--accent)", color: "#fff", fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
                      Créer un compte gratuit
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  /* ── DESKTOP NAVBAR ── */
  return (
    <>
      {isHome && <div style={{ height: 60, flexShrink: 0 }} />}
      <nav style={{
        background: "rgba(245, 241, 234, 0.92)",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--line)",
        position: isHome ? "fixed" : "sticky", top: 0, zIndex: 50,
        left: 0, right: 0,
        padding: "0 20px", height: 60,
        display: "flex", alignItems: "center", gap: 16,
      }}>
      <Brand size="md" />

      {/* Search */}
      <div style={{ flex: 1, maxWidth: 360 }}>
        <NavSearchBar />
      </div>

      {/* Nav links */}
      <div style={{ display: "flex", gap: 2, marginLeft: "auto", flexShrink: 0 }}>
        {NAV_LINKS.map(({ href, label, exact }) => (
          <NavLink key={href} href={href} active={isActive(href, exact)}>{label}</NavLink>
        ))}
      </div>

      {/* Auth */}
      <div style={{ flexShrink: 0, marginLeft: 6 }}>
        {user ? (
          <div ref={profileRef} style={{ position: "relative" }}>
            {/* Avatar cliquable */}
            <button
              onClick={() => setProfileOpen(o => !o)}
              style={{
                width: 34, height: 34, borderRadius: "50%",
                background: profileOpen ? "var(--accent)" : "var(--accent-soft)",
                border: `1.5px solid ${profileOpen ? "var(--accent)" : "rgba(45,125,90,0.35)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700,
                color: profileOpen ? "#fff" : "var(--accent)",
                cursor: "pointer", transition: "all 0.15s", flexShrink: 0,
              }}
              title="Mon compte"
            >
              {user.email?.[0]?.toUpperCase() ?? <User size={14} />}
            </button>

            {/* ── Dropdown profil ── */}
            {profileOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 10px)", right: 0,
                width: 260, background: "var(--paper)",
                border: "1.5px solid var(--line)", borderRadius: 16,
                boxShadow: "0 8px 32px rgba(10,22,40,0.12)",
                overflow: "hidden", zIndex: 200,
              }}>
                {/* Profil header */}
                <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid var(--line)", background: "var(--paper-2)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                      {user.email?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {user.email}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--accent)", fontWeight: 600, marginTop: 2 }}>
                        Plan gratuit ✓
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compte & paramètres */}
                <div style={{ padding: "6px 0" }}>
                  {[
                    { href: "/parametres/compte",  icon: <Settings size={15} strokeWidth={1.8} />,  label: "Mon compte" },
                    { href: "/parametres/alertes", icon: <Bell size={15} strokeWidth={1.8} />,      label: "Alertes email" },
                    { href: "/tarifs",             icon: <CreditCard size={15} strokeWidth={1.8} />, label: "Offres & tarifs" },
                    { href: "/faq",                icon: <HelpCircle size={15} strokeWidth={1.8} />, label: "Aide & FAQ" },
                    ...(user.email === "quentin.celette@edu.em-lyon.com"
                      ? [{ href: "/admin", icon: <Shield size={15} strokeWidth={1.8} />, label: "Administration" }]
                      : []
                    ),
                  ].map(item => (
                    <Link key={item.href} href={item.href} onClick={() => setProfileOpen(false)} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 16px", color: "var(--ink)", fontSize: 13,
                      fontWeight: 500, textDecoration: "none", transition: "background 0.1s",
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--paper-2)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <span style={{ color: "var(--muted)", display: "flex" }}>{item.icon}</span>
                      {item.label}
                    </Link>
                  ))}
                </div>

                {/* Déconnexion */}
                <div style={{ borderTop: "1px solid var(--line)", padding: "6px 0 4px" }}>
                  <button onClick={handleSignOut} style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 16px", background: "transparent", border: "none",
                    cursor: "pointer", color: "#c0392b", fontSize: 13, fontWeight: 500,
                    textAlign: "left", transition: "background 0.1s",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#fef2f2")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <LogOut size={15} strokeWidth={1.8} />
                    Se déconnecter
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/auth/login" className="btn-ghost" style={{ borderRadius: 9999, padding: "7px 16px", fontSize: 13 }}>Connexion</Link>
            <Link href="/auth/signup" className="btn-primary" style={{ borderRadius: 9999, padding: "7px 16px", fontSize: 13 }}>S&apos;inscrire</Link>
          </div>
        )}
      </div>
    </nav>
    </>
  );
}

/* ── Sub-components ── */
function NavSearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const [results, setResults] = useState<{symbol:string;name:string}[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    const t = setTimeout(async () => {
      const r = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const d = await r.json();
      setResults(Array.isArray(d) ? d.slice(0,5) : []);
      setOpen(true);
    }, 280);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", background: "var(--paper-2)", border: "1.5px solid var(--line)", borderRadius: 9999, padding: "4px 12px", gap: 8, transition: "border-color 0.15s" }}
        onFocusCapture={e => e.currentTarget.style.borderColor = "var(--accent)"}
        onBlurCapture={e => { e.currentTarget.style.borderColor = "var(--line)"; setTimeout(() => setOpen(false), 150); }}
      >
        <Search size={13} color="var(--muted)" />
        <input value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && results[0]) { router.push(`/stock/${results[0].symbol}`); setQuery(""); setOpen(false); } }}
          placeholder="Rechercher une entreprise…"
          style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 13, color: "var(--ink)", fontFamily: "inherit" }}
        />
      </div>
      {open && results.length > 0 && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#fff", border: "1.5px solid var(--line)", borderRadius: 12, overflow: "hidden", zIndex: 200, boxShadow: "0 8px 24px rgba(10,22,40,0.10)" }}>
          {results.map(r => (
            <button key={r.symbol} onClick={() => { router.push(`/stock/${r.symbol}`); setQuery(""); setOpen(false); }}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", borderBottom: "1px solid var(--line)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--paper-2)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{r.name}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} style={{ padding: "6px 14px", borderRadius: 9999, fontSize: 13, fontWeight: active ? 600 : 500, color: active ? "var(--paper)" : "var(--muted)", background: active ? "var(--ink)" : "transparent", border: "1px solid transparent", transition: "all 0.15s", whiteSpace: "nowrap" }}>
      {children}
    </Link>
  );
}
