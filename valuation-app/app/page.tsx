"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { AuthChangeEvent, Session, UserResponse } from "@supabase/supabase-js";
import {
  BarChart2, BookOpen, TrendingUp, Star, BellRing, Globe,
  Search, ArrowRight, Check, ChevronRight,
} from "lucide-react";
import TickerTape from "@/components/TickerTape";
import ValuationGauge from "@/components/ValuationGauge";
import SignalPill from "@/components/SignalPill";
import Footer from "@/components/Footer";
import StockCard from "@/components/StockCard";

/* ── demo stocks for hero card ───────────────────────────────── */
const DEMO_STOCKS = [
  // Achat fort  (score ≥ 40)
  { symbol: "AAPL",  name: "Apple Inc.",    market: "NASDAQ",   price: 189.30, change: +1.24, score:  55, pe: 29.1, peg: 1.8, evebitda: 22.4 },
  // Achat       (15 ≤ score < 40)
  { symbol: "MC.PA", name: "LVMH",          market: "Euronext", price: 768.10, change: -0.91, score:  25, pe: 21.3, peg: 1.4, evebitda: 14.2 },
  // Neutre      (-15 < score < 15)
  { symbol: "MSFT",  name: "Microsoft",     market: "NASDAQ",   price: 415.60, change: +0.82, score:   5, pe: 34.2, peg: 2.1, evebitda: 25.8 },
  // Vente       (score ≤ -15)
  { symbol: "TSLA",  name: "Tesla",         market: "NASDAQ",   price: 172.40, change: -2.10, score: -30, pe: 58.3, peg: 3.2, evebitda: 42.1 },
];
const SUGGESTIONS = ["Apple", "LVMH", "Microsoft", "Tesla"];

/* ── features ─────────────────────────────────────────────────── */
const FEATURES = [
  { n: "01", Icon: TrendingUp, title: "Valorisation IA",            desc: "Signal clair achat/vente basé sur la vraie valeur fondamentale de l'entreprise." },
  { n: "02", Icon: BarChart2,  title: "Suivi de portefeuille",      desc: "Visualisez gains, pertes et répartition sectorielle en temps réel." },
  { n: "03", Icon: BookOpen,   title: "Conseiller patrimonial IA",  desc: "Profil investisseur et portefeuille personnalisé en 2 minutes." },
  { n: "04", Icon: Star,       title: "Watchlist personnalisée",    desc: "Regroupez vos actions favorites et suivez leurs signaux au quotidien." },
  { n: "05", Icon: BellRing,   title: "Alertes email",              desc: "Soyez notifié dès qu'un signal change ou qu'un prix varie." },
  { n: "06", Icon: Globe,      title: "Multi-marchés",              desc: "Actions françaises, américaines, européennes et ETF — 180+ valeurs." },
];

/* ── steps ─────────────────────────────────────────────────────── */
const STEPS = [
  { step: "01", title: "Recherchez une action",  desc: "Tapez un nom d'entreprise ou un marché — quelques lettres suffisent." },
  { step: "02", title: "L'IA analyse en direct", desc: "Valorisation fondamentale, score de risque, comparaison sectorielle en quelques secondes." },
  { step: "03", title: "Décidez en confiance",   desc: "Signal clair achat / neutre / vente, avec explications en français, sans abonnement." },
];

/* ── pricing items ──────────────────────────────────────────────── */
const PRICING = [
  "Valorisation IA illimitée",
  "Watchlist jusqu'à 50 actions",
  "Portefeuille simulé",
  "Conseiller patrimonial IA",
  "Données en temps réel",
  "Alertes email",
  "Support prioritaire",
];

interface TrendingStock {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  currency: string;
}

/* ── live search hook ───────────────────────────────────────────── */
function useLiveSearch() {
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<{ symbol: string; name: string; exchange: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const d = await r.json();
        setResults(d);
        setOpen(true);
      } finally { setLoading(false); }
    }, 280);
    return () => clearTimeout(t);
  }, [query]);

  return { query, setQuery, results, loading, open, setOpen };
}

/* ══════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const router = useRouter();
  const [user, setUser]       = useState<{ email?: string } | null>(null);
  const [trending, setTrending] = useState<TrendingStock[]>([]);
  const [trendLoading, setTrendLoading] = useState(true);
  const [activeDemo, setActiveDemo] = useState(DEMO_STOCKS[0]);
  const search = useLiveSearch();

  /* auth */
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then((res: UserResponse) => setUser(res.data.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_e: AuthChangeEvent, s: Session | null) => setUser(s?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  /* trending */
  useEffect(() => {
    fetch("/api/trending")
      .then((r) => r.json())
      .then((d) => { setTrending(d); setTrendLoading(false); })
      .catch(() => setTrendLoading(false));
  }, []);

  const handleSearchGo = (symbol: string) => {
    search.setQuery(""); search.setOpen(false);
    router.push(`/stock/${symbol}`);
  };

  const handleSuggestion = (name: string) => {
    const found = DEMO_STOCKS.find((d) => d.name.toLowerCase().includes(name.toLowerCase()));
    if (found) setActiveDemo(found);
    else router.push(`/stock/${DEMO_STOCKS[0].symbol}`);
  };

  return (
    <div style={{ background: "var(--paper)" }}>

      {/* ── Ticker tape ─────────────────────────────── */}
      <TickerTape />

      {/* ════════════════════════════════════════════════
          HERO — 2 colonnes
      ════════════════════════════════════════════════ */}
      <section style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "80px 32px 72px",
        display: "grid",
        gridTemplateColumns: "1fr 420px",
        gap: 64,
        alignItems: "center",
      }}>
        {/* LEFT — editorial */}
        <div>
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "5px 14px", borderRadius: 9999,
            border: "1px solid var(--accent-soft)", background: "var(--accent-soft)",
            marginBottom: 28,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
            <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>Beta gratuit · Données en temps réel</span>
          </div>

          {/* H1 */}
          <h1 style={{
            fontSize: "clamp(34px, 5vw, 58px)",
            fontWeight: 700,
            letterSpacing: "-1.5px",
            lineHeight: 1.1,
            color: "var(--ink)",
            marginBottom: 20,
          }}>
            Une action vaut-elle{" "}
            <span style={{ color: "var(--accent)", fontWeight: 800, fontStyle: "normal" }}>
              vraiment
            </span>{" "}
            son prix ?
          </h1>

          <p style={{
            fontSize: 17,
            color: "var(--ink)",
            opacity: 0.72,
            lineHeight: 1.7,
            maxWidth: 480,
            marginBottom: 36,
          }}>
            Valorisation fondamentale par l&apos;IA, score de risque et signal clair —
            sans jargon, pour tout investisseur.
          </p>

          {/* Search */}
          <div style={{ position: "relative", marginBottom: 20 }}>
            <div style={{
              display: "flex", alignItems: "center",
              background: "#fff", border: "1.5px solid var(--line)",
              borderRadius: 9999, padding: "12px 18px", gap: 10,
              boxShadow: "0 2px 12px rgba(10,22,40,0.06)",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
              onFocusCapture={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(45,125,90,0.12)"; }}
              onBlurCapture={(e)  => { e.currentTarget.style.borderColor = "var(--line)";   e.currentTarget.style.boxShadow = "0 2px 12px rgba(10,22,40,0.06)"; }}
            >
              <Search size={16} strokeWidth={1.8} color="var(--muted)" />
              <input
                type="text"
                value={search.query}
                onChange={(e) => search.setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && search.results[0]) handleSearchGo(search.results[0].symbol); }}
                placeholder="Apple, LVMH, Nvidia, ETF..."
                style={{
                  flex: 1, background: "transparent", border: "none",
                  outline: "none", color: "var(--ink)", fontSize: 15, fontFamily: "inherit",
                }}
              />
              <button
                onClick={() => { if (search.results[0]) handleSearchGo(search.results[0].symbol); }}
                style={{
                  padding: "7px 18px", borderRadius: 9999,
                  background: "var(--accent)", color: "#fff",
                  fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer",
                  transition: "background 0.15s",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent)")}
              >
                Analyser
              </button>
            </div>

            {/* Dropdown */}
            {search.open && search.results.length > 0 && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
                background: "#fff", border: "1.5px solid var(--line)",
                borderRadius: 14, overflow: "hidden", zIndex: 100,
                boxShadow: "0 8px 32px rgba(10,22,40,0.12)",
              }}>
                {search.results.slice(0, 6).map((r, i) => (
                  <button key={r.symbol} onClick={() => handleSearchGo(r.symbol)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 14px", background: "transparent", border: "none",
                      borderBottom: i < Math.min(search.results.length, 6) - 1 ? "1px solid var(--line)" : "none",
                      cursor: "pointer", textAlign: "left",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--paper-2)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 7, background: "var(--accent-soft)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9, fontWeight: 800, color: "var(--accent)", flexShrink: 0,
                    }}>{r.symbol.slice(0, 3)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)" }}>{r.symbol}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                    </div>
                    <ChevronRight size={14} color="var(--muted)" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Suggestion pills */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 40 }}>
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => handleSuggestion(s)}
                style={{
                  padding: "5px 14px", borderRadius: 9999, border: "1.5px solid var(--line)",
                  background: "transparent", color: "var(--muted)", fontSize: 12, fontWeight: 500,
                  cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.background = "var(--accent-soft)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)";   e.currentTarget.style.color = "var(--muted)";   e.currentTarget.style.background = "transparent"; }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 0, flexWrap: "wrap" }}>
            {[
              { value: "2 400+", label: "Analyses réalisées" },
              { value: "180+",   label: "Actions couvertes" },
              { value: "100%",   label: "Gratuit en beta" },
            ].map((s, i) => (
              <div key={s.label} style={{ display: "flex" }}>
                {i > 0 && <div style={{ width: 1, background: "var(--line)", margin: "0 24px", alignSelf: "stretch" }} />}
                <div>
                  <div style={{
                    fontSize: 26, fontWeight: 700, color: "var(--ink)",
                    fontFamily: "var(--font-geist-mono, monospace)",
                    fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em",
                  }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — dark preview card */}
        <div style={{
          background: "var(--ink)", borderRadius: 20,
          padding: "28px 24px", color: "#fff",
          boxShadow: "0 24px 64px rgba(10,22,40,0.22)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10,
              background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 800, color: "#fff",
            }}>
              {activeDemo.symbol.slice(0, 3)}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{activeDemo.name}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.70)" }}>{activeDemo.symbol} · {activeDemo.market}</div>
            </div>
            <SignalPill score={activeDemo.score >= 40 ? "STRONG_BUY" : activeDemo.score >= 15 ? "BUY" : activeDemo.score > -15 ? "HOLD" : activeDemo.score > -40 ? "SELL" : "STRONG_SELL"} />
          </div>

          {/* Price */}
          <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{
              fontSize: 34, fontWeight: 700, letterSpacing: "-0.04em",
              fontFamily: "var(--font-geist-mono, monospace)", fontVariantNumeric: "tabular-nums",
            }}>
              {activeDemo.price.toFixed(2)} <span style={{ fontSize: 16, fontWeight: 400, color: "rgba(255,255,255,0.65)" }}>USD</span>
            </div>
            <div style={{
              fontSize: 13, marginTop: 2,
              color: activeDemo.change >= 0 ? "#6ee7b7" : "#fca5a5",
              fontFamily: "var(--font-geist-mono, monospace)", fontVariantNumeric: "tabular-nums",
            }}>
              {activeDemo.change >= 0 ? "+" : ""}{activeDemo.change.toFixed(2)}% aujourd&apos;hui
            </div>
          </div>

          {/* Gauge */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <ValuationGauge score={activeDemo.score} size="sm" />
          </div>

          {/* Editorial quote */}
          <p style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.80)",
            lineHeight: 1.6,
            marginBottom: 20,
            paddingTop: 12,
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}>
            {activeDemo.score > 30
              ? "La valorisation suggère un potentiel de hausse significatif par rapport aux fondamentaux."
              : activeDemo.score > 0
              ? "L'action semble correctement valorisée au regard des métriques sectorielles."
              : "Le cours actuel intègre déjà des anticipations de croissance élevées."}
          </p>

          {/* 3 metrics — coded color + novice description */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              {
                label: "PER",
                value: activeDemo.pe,
                desc: "Prix / bénéfice — plus c'est bas, moins c'est cher",
                color: activeDemo.pe < 20 ? "#6ee7b7" : activeDemo.pe < 30 ? "#fde68a" : "#fca5a5",
                hint: activeDemo.pe < 20 ? "✓ Raisonnable" : activeDemo.pe < 30 ? "~ Dans la moyenne" : "↑ Élevé",
              },
              {
                label: "PEG",
                value: activeDemo.peg,
                desc: "PER ajusté à la croissance — idéal < 1",
                color: activeDemo.peg < 1 ? "#6ee7b7" : activeDemo.peg < 2 ? "#fde68a" : "#fca5a5",
                hint: activeDemo.peg < 1 ? "✓ Attractif" : activeDemo.peg < 2 ? "~ Correct" : "↑ Élevé",
              },
              {
                label: "EV/EBITDA",
                value: activeDemo.evebitda,
                desc: "Valeur de l'entreprise / profits bruts — comparer dans le même secteur",
                color: activeDemo.evebitda < 12 ? "#6ee7b7" : activeDemo.evebitda < 20 ? "#fde68a" : "#fca5a5",
                hint: activeDemo.evebitda < 12 ? "✓ Bas" : activeDemo.evebitda < 20 ? "~ Moyen" : "↑ Cher",
              },
            ].map((m) => (
              <div key={m.label} style={{
                background: "rgba(255,255,255,0.06)", borderRadius: 10,
                padding: "10px 12px", border: `1px solid ${m.color}33`,
              }}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.65)", marginBottom: 4, letterSpacing: "0.04em", textTransform: "uppercase" }}>{m.label}</div>
                <div style={{
                  fontSize: 20, fontWeight: 700, color: m.color,
                  fontFamily: "var(--font-geist-mono, monospace)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em",
                  marginBottom: 4,
                }}>{m.value}</div>
                <div style={{ fontSize: 9, color: m.color, fontWeight: 600, marginBottom: 5, opacity: 0.9 }}>{m.hint}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.58)", lineHeight: 1.4 }}>{m.desc}</div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.50)", marginTop: 14, textAlign: "center" }}>
            Données simulées à titre d&apos;illustration
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          FEATURES — Six outils, un seul écran
      ════════════════════════════════════════════════ */}
      <section style={{ borderTop: "1px solid var(--line)", padding: "88px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{
              fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 700,
              letterSpacing: "-0.8px", color: "var(--ink)", marginBottom: 12,
            }}>
              Six outils, un seul écran
            </h2>
            <p style={{ fontSize: 16, color: "var(--muted)", maxWidth: 480, margin: "0 auto" }}>
              Analyse, portefeuille, watchlist et conseiller — tout au même endroit.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "var(--line)", border: "1px solid var(--line)", borderRadius: 18, overflow: "hidden" }}>
            {FEATURES.map(({ n, Icon, title, desc }) => (
              <div key={n} style={{
                background: "var(--paper)", padding: "28px 24px",
                transition: "background 0.15s",
              }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--paper-2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--paper)")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 9,
                    background: "var(--accent-soft)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Icon size={17} strokeWidth={1.7} color="var(--accent)" />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: "0.06em" }}>{n}</span>
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginBottom: 6, letterSpacing: "-0.2px" }}>
                  {title}
                </h3>
                <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          HOW IT WORKS — fond --ink
      ════════════════════════════════════════════════ */}
      <section id="how-it-works" style={{ background: "var(--ink)", padding: "88px 32px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 700, letterSpacing: "-0.8px", color: "#fff", marginBottom: 12 }}>
              Comment ça marche
            </h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.72)" }}>Trois étapes, moins de 30 secondes.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
            {STEPS.map(({ step, title, desc }, i) => (
              <div key={step} style={{ display: "flex" }}>
                {i > 0 && (
                  <div style={{ width: 1, background: "rgba(255,255,255,0.10)", margin: "0 32px", alignSelf: "stretch" }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 48, fontWeight: 800, letterSpacing: "-0.04em",
                    color: "var(--accent)",
                    fontFamily: "var(--font-geist-mono, monospace)",
                    fontVariantNumeric: "tabular-nums",
                    marginBottom: 16,
                  }}>{step}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 10, letterSpacing: "-0.2px" }}>{title}</h3>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.72)", lineHeight: 1.65 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          TRENDING STOCKS
      ════════════════════════════════════════════════ */}
      <section style={{ padding: "88px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 style={{ fontSize: "clamp(20px, 3vw, 30px)", fontWeight: 700, letterSpacing: "-0.5px", color: "var(--ink)", marginBottom: 4 }}>
                Actions du jour
              </h2>
              <p style={{ fontSize: 13, color: "var(--muted)" }}>Sélection mise à jour chaque jour</p>
            </div>
            <span style={{ fontSize: 12, color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </span>
          </div>

          {trendLoading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 14 }} />)}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {trending.map((s) => <StockCard key={s.symbol} {...s} />)}
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          PRICING — 2 colonnes
      ════════════════════════════════════════════════ */}
      <section style={{ borderTop: "1px solid var(--line)", padding: "88px 32px" }}>
        <div style={{ maxWidth: 920, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 400px", gap: 64, alignItems: "center" }}>
          {/* Left text */}
          <div>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 700, letterSpacing: "-0.8px", color: "var(--ink)", marginBottom: 16 }}>
              Gratuit pendant toute la beta
            </h2>
            <p style={{ fontSize: 16, color: "var(--muted)", lineHeight: 1.7, marginBottom: 24 }}>
              Accès complet à toutes les fonctionnalités. Aucune carte bancaire requise.
              StockSense est un outil pédagogique — l&apos;accès restera accessible au plus grand nombre.
            </p>
            <Link href="/auth/signup" className="btn-primary" style={{ display: "inline-flex", gap: 8 }}>
              Créer un compte gratuit <ArrowRight size={15} strokeWidth={2} />
            </Link>
          </div>

          {/* Right card */}
          <div style={{
            borderRadius: 18, border: "1.5px solid var(--accent-soft)",
            background: "var(--paper-2)", padding: "36px 32px",
          }}>
            <div style={{
              fontSize: 52, fontWeight: 800, color: "var(--ink)",
              fontFamily: "var(--font-geist-mono, monospace)",
              fontVariantNumeric: "tabular-nums", letterSpacing: "-0.04em", lineHeight: 1,
              marginBottom: 4,
            }}>
              0 €
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 28 }}>
              Accès complet · Aucune carte
            </div>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
              {PRICING.map((item) => (
                <li key={item} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--ink)" }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: "50%",
                    background: "var(--accent-soft)", display: "inline-flex",
                    alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <Check size={11} strokeWidth={2.5} color="var(--accent)" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          CONSEILLER CTA — fond accent-soft
      ════════════════════════════════════════════════ */}
      <section style={{ background: "var(--accent-soft)", borderTop: "1px solid rgba(45,125,90,0.20)", padding: "88px 32px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(22px, 4vw, 36px)", fontWeight: 700, letterSpacing: "-0.8px", color: "var(--ink)", marginBottom: 14 }}>
            Vous ne savez pas par où commencer ?
          </h2>
          <p style={{ fontSize: 15, color: "var(--muted)", maxWidth: 480, margin: "0 auto 32px", lineHeight: 1.65 }}>
            Répondez à 8 questions sur vos objectifs et obtenez un portefeuille
            personnalisé, clé en main — sans jargon.
          </p>
          <Link href="/advisor" className="btn-primary" style={{ display: "inline-flex", gap: 8, fontSize: 15, padding: "14px 28px" }}>
            Créer mon portefeuille gratuit <ArrowRight size={16} strokeWidth={2} />
          </Link>
          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 16 }}>
            Sans inscription · Résultat immédiat · 100% gratuit
          </p>
        </div>
      </section>

      {/* Disclaimer + Footer */}
      <div style={{ padding: "24px 32px", textAlign: "center", borderTop: "1px solid var(--line)" }}>
        <p style={{ fontSize: 11, color: "var(--muted)", maxWidth: 680, margin: "0 auto", lineHeight: 1.6 }}>
          StockSense est un outil d&apos;aide à la décision pédagogique. Les informations présentées ne constituent pas
          un conseil en investissement au sens de la réglementation AMF. Investir comporte des risques de perte en capital.
        </p>
      </div>
      <Footer />
    </div>
  );
}
