"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { AuthChangeEvent, Session, UserResponse } from "@supabase/supabase-js";
import { ArrowRight, Search, ChevronRight } from "lucide-react";
import TickerTape from "@/components/TickerTape";
import ValuationGauge from "@/components/ValuationGauge";
import SignalPill from "@/components/SignalPill";
import Footer from "@/components/Footer";

/* ── demo stocks (analyse en direct) ─────────────────────────── */
const DEMO_STOCKS = [
  { symbol: "AAPL",  name: "Apple Inc.",  market: "NASDAQ",   price: 189.30, change: +1.24, score:  55, pe: 29.1, peg: 1.8, evebitda: 22.4 },
  { symbol: "MC.PA", name: "LVMH",        market: "Euronext", price: 768.10, change: -0.91, score:  25, pe: 21.3, peg: 1.4, evebitda: 14.2 },
  { symbol: "MSFT",  name: "Microsoft",   market: "NASDAQ",   price: 415.60, change: +0.82, score:   5, pe: 34.2, peg: 2.1, evebitda: 25.8 },
  { symbol: "TSLA",  name: "Tesla",       market: "NASDAQ",   price: 172.40, change: -2.10, score: -30, pe: 58.3, peg: 3.2, evebitda: 42.1 },
];
const SUGGESTIONS = ["Apple", "LVMH", "Microsoft", "Tesla"];

/* ── étapes ─────────────────────────────────────────────────────── */
const STEPS = [
  { step: "01", title: "Recherchez une action",   desc: "Tapez un nom d'entreprise ou un marché — quelques lettres suffisent." },
  { step: "02", title: "L'IA analyse en direct",  desc: "Valorisation fondamentale, score de risque, comparaison sectorielle en quelques secondes." },
  { step: "03", title: "Décidez en confiance",    desc: "Signal clair achat / neutre / vente, avec explications en français, sans abonnement." },
];

/* ── témoignages ────────────────────────────────────────────────── */
const TESTIMONIALS = [
  {
    initial: "S", name: "Sophie", age: 26, job: "Infirmière",
    quote: "Grâce au conseiller IA, j'ai commencé à placer 150 €/mois il y a 18 mois. Je n'aurais jamais cru que c'était aussi accessible.",
  },
  {
    initial: "M", name: "Marc", age: 34, job: "Artisan",
    quote: "J'ai réalisé que mon livret A me faisait perdre de l'argent face à l'inflation. StockSense m'a ouvert les yeux.",
  },
  {
    initial: "L", name: "Léa", age: 41, job: "Enseignante",
    quote: "En 20 minutes chrono, j'avais un portefeuille ETF diversifié et adapté à ma situation. Simple, clair, sans jargon.",
  },
];

/* ── live search hook ───────────────────────────────────────────── */
function useLiveSearch() {
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<{ symbol: string; name: string; exchange: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    const id = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const d = await r.json();
        setResults(d);
        setOpen(true);
      } finally { setLoading(false); }
    }, 280);
    return () => clearTimeout(id);
  }, [query]);

  return { query, setQuery, results, loading, open, setOpen };
}

/* ── simulateur ─────────────────────────────────────────────────── */
function calcSim(montant: number, annees: number) {
  const r = 0.07 / 12;          // taux mensuel S&P500 historique
  const n = annees * 12;         // nombre de mois
  const fv = n === 0 ? 0 : montant * ((Math.pow(1 + r, n) - 1) / r);
  const invested = montant * n;
  const gains    = fv - invested;
  const gainsPct = invested > 0 ? (gains / invested) * 100 : 0;
  return { fv, invested, gains, gainsPct };
}

function eur(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency", currency: "EUR", maximumFractionDigits: 0,
  }).format(n);
}

/* ══════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const router = useRouter();
  const [, setUser] = useState<{ email?: string } | null>(null);
  const [activeDemo, setActiveDemo] = useState(DEMO_STOCKS[0]);
  const [montant, setMontant]       = useState(200);
  const [annees, setAnnees]         = useState(10);
  const search      = useLiveSearch();
  const analysisRef = useRef<HTMLElement>(null);

  /* auth (pour adapter le CTA si connecté) */
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then((res: UserResponse) => setUser(res.data.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_e: AuthChangeEvent, s: Session | null) => setUser(s?.user ?? null)
    );
    return () => subscription.unsubscribe();
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

  const sim = calcSim(montant, annees);

  return (
    <div style={{ background: "var(--paper)" }}>

      {/* ── Ticker tape ─────────────────────────────────────────── */}
      <TickerTape />

      {/* ════════════════════════════════════════════════════════════
          SECTION 1 — HERO
      ════════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "96px 32px 80px", textAlign: "center" }}>

        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "5px 16px", borderRadius: 9999,
          border: "1px solid var(--accent-soft)", background: "var(--accent-soft)",
          marginBottom: 32,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
          <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>Beta gratuit · Aucune carte bancaire requise</span>
        </div>

        {/* H1 */}
        <h1 style={{
          fontSize: "clamp(28px, 5vw, 54px)",
          fontWeight: 800,
          letterSpacing: "-2px",
          lineHeight: 1.12,
          color: "var(--ink)",
          marginBottom: 28,
        }}>
          1 000 € sur un livret pendant 10 ans ={" "}
          <span style={{ color: "var(--muted)", fontWeight: 700 }}>1 030 €.</span>
          <br />
          Investis intelligemment ={" "}
          <span style={{ color: "var(--accent)", fontWeight: 800 }}>~1 967 €.</span>
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 18,
          color: "var(--muted)",
          lineHeight: 1.65,
          maxWidth: 520,
          margin: "0 auto 44px",
        }}>
          StockSense te montre comment faire,{" "}
          <strong style={{ color: "var(--ink)", fontWeight: 600 }}>en 2 minutes</strong>,{" "}
          sans jargon.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 18 }}>
          <Link href="/advisor" className="btn-primary" style={{ fontSize: 16, padding: "14px 28px", gap: 8 }}>
            Trouver mon portefeuille <ArrowRight size={16} strokeWidth={2} />
          </Link>
          <button
            onClick={() => analysisRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="btn-secondary"
            style={{ fontSize: 15, padding: "14px 24px" }}
          >
            Analyser une action
          </button>
        </div>
        <p style={{ fontSize: 12, color: "var(--muted)" }}>
          Sans inscription · Résultat immédiat · 100% gratuit
        </p>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SECTION 2 — PREUVES SOCIALES
      ════════════════════════════════════════════════════════════ */}
      <section style={{
        borderTop: "1px solid var(--line)",
        borderBottom: "1px solid var(--line)",
        background: "var(--paper-2)",
        padding: "44px 32px",
      }}>
        <div style={{
          maxWidth: 680,
          margin: "0 auto",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 0,
          flexWrap: "wrap",
        }}>
          {[
            { value: "2 400+", label: "analyses réalisées" },
            { value: "180+",   label: "actions couvertes"  },
            { value: "100%",   label: "gratuit en beta"    },
          ].map((s, i) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center" }}>
              {i > 0 && (
                <div style={{ width: 1, height: 44, background: "var(--line)", margin: "0 36px" }} />
              )}
              <div style={{ textAlign: "center" }}>
                <div style={{
                  fontSize: 36, fontWeight: 800, color: "var(--ink)",
                  fontFamily: "var(--font-geist-mono, monospace)",
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "-0.04em", lineHeight: 1,
                }}>{s.value}</div>
                <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 5 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SECTION 3 — COMMENT ÇA MARCHE
      ════════════════════════════════════════════════════════════ */}
      <section style={{ background: "var(--ink)", padding: "88px 32px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <h2 style={{
              fontSize: "clamp(24px, 4vw, 38px)",
              fontWeight: 700, letterSpacing: "-0.8px",
              color: "#fff", marginBottom: 12,
            }}>
              Comment ça marche
            </h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.72)" }}>
              Trois étapes, moins de 30 secondes.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 0,
          }}>
            {STEPS.map(({ step, title, desc }, i) => (
              <div key={step} style={{ display: "flex" }}>
                {i > 0 && (
                  <div style={{
                    width: 1, background: "rgba(255,255,255,0.10)",
                    margin: "0 32px", alignSelf: "stretch",
                  }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 48, fontWeight: 800, letterSpacing: "-0.04em",
                    color: "var(--accent)",
                    fontFamily: "var(--font-geist-mono, monospace)",
                    fontVariantNumeric: "tabular-nums",
                    marginBottom: 16,
                  }}>{step}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 10, letterSpacing: "-0.2px" }}>
                    {title}
                  </h3>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.72)", lineHeight: 1.65 }}>
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SECTION 4 — SIMULATEUR INTERACTIF
      ════════════════════════════════════════════════════════════ */}
      <section style={{ padding: "88px 32px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>

          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{
              fontSize: "clamp(24px, 4vw, 38px)",
              fontWeight: 700, letterSpacing: "-0.8px",
              color: "var(--ink)", marginBottom: 12,
            }}>
              Et si tu avais commencé aujourd&apos;hui ?
            </h2>
            <p style={{ fontSize: 15, color: "var(--muted)" }}>
              Simule ta croissance avec un rendement historique moyen de 7 %/an.
            </p>
          </div>

          {/* Carte simulateur */}
          <div style={{
            background: "var(--paper-2)",
            border: "1.5px solid var(--line)",
            borderRadius: 20,
            padding: "36px 32px",
          }}>
            {/* Inputs */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 28,
              marginBottom: 36,
            }}>
              {/* Montant mensuel */}
              <div>
                <label style={{
                  display: "block", fontSize: 12, fontWeight: 700,
                  color: "var(--muted)", marginBottom: 10,
                  letterSpacing: "0.06em", textTransform: "uppercase",
                }}>
                  Montant mensuel
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="number"
                    value={montant}
                    min={10}
                    max={10000}
                    step={10}
                    onChange={(e) => setMontant(Math.max(10, Number(e.target.value)))}
                    style={{
                      width: "100%",
                      padding: "12px 44px 12px 16px",
                      borderRadius: 12,
                      border: "1.5px solid var(--line)",
                      background: "#fff",
                      fontSize: 22,
                      fontWeight: 800,
                      color: "var(--ink)",
                      fontFamily: "var(--font-geist-mono, monospace)",
                      fontVariantNumeric: "tabular-nums",
                      letterSpacing: "-0.03em",
                    }}
                  />
                  <span style={{
                    position: "absolute", right: 14, top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 18, fontWeight: 800, color: "var(--accent)",
                    pointerEvents: "none",
                  }}>€</span>
                </div>
              </div>

              {/* Durée slider */}
              <div>
                <label style={{
                  display: "block", fontSize: 12, fontWeight: 700,
                  color: "var(--muted)", marginBottom: 10,
                  letterSpacing: "0.06em", textTransform: "uppercase",
                }}>
                  Durée :{" "}
                  <span style={{ color: "var(--accent)", fontFamily: "var(--font-geist-mono, monospace)" }}>
                    {annees} {annees === 1 ? "an" : "ans"}
                  </span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={annees}
                  onChange={(e) => setAnnees(Number(e.target.value))}
                  style={{
                    width: "100%",
                    marginTop: 14,
                    accentColor: "var(--accent)",
                    cursor: "pointer",
                  }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>1 an</span>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>30 ans</span>
                </div>
              </div>
            </div>

            {/* Résultats */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 0,
              background: "var(--ink)",
              borderRadius: 14,
              overflow: "hidden",
              marginBottom: 20,
            }}>
              {[
                {
                  label: "Valeur finale",
                  value: eur(sim.fv),
                  sub: null,
                  color: "#fff",
                  bold: true,
                },
                {
                  label: "Total investi",
                  value: eur(sim.invested),
                  sub: null,
                  color: "rgba(255,255,255,0.80)",
                  bold: false,
                },
                {
                  label: "Gains générés",
                  value: eur(sim.gains),
                  sub: `+${sim.gainsPct.toFixed(0)} %`,
                  color: "#6ee7b7",
                  bold: true,
                },
              ].map((item, i) => (
                <div key={item.label} style={{
                  textAlign: "center",
                  padding: "22px 12px",
                  borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.08)" : "none",
                }}>
                  <div style={{
                    fontSize: 10, color: "rgba(255,255,255,0.50)",
                    fontWeight: 700, letterSpacing: "0.07em",
                    textTransform: "uppercase", marginBottom: 8,
                  }}>
                    {item.label}
                  </div>
                  <div style={{
                    fontSize: "clamp(15px, 2.2vw, 22px)",
                    fontWeight: item.bold ? 800 : 600,
                    color: item.color,
                    fontFamily: "var(--font-geist-mono, monospace)",
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: "-0.03em",
                    lineHeight: 1.1,
                  }}>
                    {item.value}
                  </div>
                  {item.sub && (
                    <div style={{
                      fontSize: 13, color: "#6ee7b7",
                      fontWeight: 700, marginTop: 4,
                      fontFamily: "var(--font-geist-mono, monospace)",
                    }}>
                      {item.sub}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Disclaimer */}
            <p style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", lineHeight: 1.55 }}>
              Basé sur le rendement historique moyen du S&P500. Performances passées ne garantissent pas les performances futures.
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          ANALYSE EN DIRECT (bloc déplacé après le simulateur)
      ════════════════════════════════════════════════════════════ */}
      <section
        ref={analysisRef}
        id="analyse"
        style={{ borderTop: "1px solid var(--line)", padding: "88px 32px" }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <h2 style={{
              fontSize: "clamp(22px, 3.5vw, 36px)",
              fontWeight: 700, letterSpacing: "-0.6px",
              color: "var(--ink)", marginBottom: 10,
            }}>
              Curieux ? Analyse une action en direct
            </h2>
            <p style={{ fontSize: 15, color: "var(--muted)" }}>
              Tape le nom d&apos;une entreprise et vois l&apos;analyse IA instantanément.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 400px",
            gap: 56,
            alignItems: "start",
          }}>
            {/* Colonne gauche : recherche */}
            <div>
              {/* Barre de recherche */}
              <div style={{ position: "relative", marginBottom: 18 }}>
                <div
                  style={{
                    display: "flex", alignItems: "center",
                    background: "#fff", border: "1.5px solid var(--line)",
                    borderRadius: 9999, padding: "12px 18px", gap: 10,
                    boxShadow: "0 2px 12px rgba(10,22,40,0.06)",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                  }}
                  onFocusCapture={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(45,125,90,0.12)";
                  }}
                  onBlurCapture={(e) => {
                    e.currentTarget.style.borderColor = "var(--line)";
                    e.currentTarget.style.boxShadow = "0 2px 12px rgba(10,22,40,0.06)";
                  }}
                >
                  <Search size={16} strokeWidth={1.8} color="var(--muted)" />
                  <input
                    type="text"
                    value={search.query}
                    onChange={(e) => search.setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && search.results[0]) handleSearchGo(search.results[0].symbol);
                    }}
                    placeholder="Ex : Apple, LVMH, Microsoft…"
                    style={{
                      flex: 1, background: "transparent", border: "none",
                      outline: "none", color: "var(--ink)", fontSize: 15,
                      fontFamily: "inherit",
                    }}
                  />
                  <button
                    onClick={() => { if (search.results[0]) handleSearchGo(search.results[0].symbol); }}
                    style={{
                      padding: "7px 18px", borderRadius: 9999,
                      background: "var(--accent)", color: "#fff",
                      fontWeight: 600, fontSize: 13, border: "none",
                      cursor: "pointer", transition: "background 0.15s", flexShrink: 0,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent)")}
                  >
                    Analyser
                  </button>
                </div>

                {/* Dropdown résultats */}
                {search.open && search.results.length > 0 && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
                    background: "#fff", border: "1.5px solid var(--line)",
                    borderRadius: 14, overflow: "hidden", zIndex: 100,
                    boxShadow: "0 8px 32px rgba(10,22,40,0.12)",
                  }}>
                    {search.results.slice(0, 6).map((r, i) => (
                      <button
                        key={r.symbol}
                        onClick={() => handleSearchGo(r.symbol)}
                        style={{
                          width: "100%", display: "flex", alignItems: "center", gap: 10,
                          padding: "10px 14px", background: "transparent", border: "none",
                          borderBottom: i < Math.min(search.results.length, 6) - 1
                            ? "1px solid var(--line)" : "none",
                          cursor: "pointer", textAlign: "left",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--paper-2)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: 7,
                          background: "var(--accent-soft)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 9, fontWeight: 800, color: "var(--accent)", flexShrink: 0,
                        }}>
                          {r.symbol.slice(0, 3)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)" }}>{r.symbol}</div>
                          <div style={{
                            fontSize: 11, color: "var(--muted)",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>{r.name}</div>
                        </div>
                        <ChevronRight size={14} color="var(--muted)" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Pills suggestions */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSuggestion(s)}
                    style={{
                      padding: "5px 14px", borderRadius: 9999,
                      border: "1.5px solid var(--line)",
                      background: "transparent", color: "var(--muted)",
                      fontSize: 12, fontWeight: 500, cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--accent)";
                      e.currentTarget.style.color = "var(--accent)";
                      e.currentTarget.style.background = "var(--accent-soft)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--line)";
                      e.currentTarget.style.color = "var(--muted)";
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.65 }}>
                Clique sur un nom ci-dessus pour voir une démo interactive, ou tape directement dans
                la barre de recherche pour analyser n&apos;importe quelle action en temps réel.
              </p>
            </div>

            {/* Colonne droite : carte sombre d'analyse */}
            <div style={{
              background: "var(--ink)", borderRadius: 20,
              padding: "28px 24px", color: "#fff",
              boxShadow: "0 24px 64px rgba(10,22,40,0.22)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}>
              {/* En-tête */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800, color: "#fff",
                }}>
                  {activeDemo.symbol.slice(0, 3)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{activeDemo.name}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.70)" }}>
                    {activeDemo.symbol} · {activeDemo.market}
                  </div>
                </div>
                <SignalPill
                  score={
                    activeDemo.score >= 40 ? "STRONG_BUY"
                    : activeDemo.score >= 15 ? "BUY"
                    : activeDemo.score > -15 ? "HOLD"
                    : activeDemo.score > -40 ? "SELL"
                    : "STRONG_SELL"
                  }
                />
              </div>

              {/* Prix */}
              <div style={{
                marginBottom: 20, paddingBottom: 20,
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}>
                <div style={{
                  fontSize: 34, fontWeight: 700, letterSpacing: "-0.04em",
                  fontFamily: "var(--font-geist-mono, monospace)",
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {activeDemo.price.toFixed(2)} $
                </div>
                <div style={{
                  fontSize: 13, marginTop: 2,
                  color: activeDemo.change >= 0 ? "#6ee7b7" : "#fca5a5",
                  fontFamily: "var(--font-geist-mono, monospace)",
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {activeDemo.change >= 0 ? "+" : ""}{activeDemo.change.toFixed(2)}% aujourd&apos;hui
                </div>
              </div>

              {/* Jauge */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <ValuationGauge score={activeDemo.score} size="sm" />
              </div>

              {/* Commentaire éditorial */}
              <p style={{
                fontSize: 13, color: "rgba(255,255,255,0.80)",
                lineHeight: 1.6, marginBottom: 20,
                paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.08)",
              }}>
                {activeDemo.score > 30
                  ? "La valorisation suggère un potentiel de hausse significatif par rapport aux fondamentaux."
                  : activeDemo.score > 0
                  ? "L'action semble correctement valorisée au regard des métriques sectorielles."
                  : "Le cours actuel intègre déjà des anticipations de croissance élevées."}
              </p>

              {/* 3 métriques */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[
                  {
                    label: "PER", value: activeDemo.pe,
                    color: activeDemo.pe < 20 ? "#6ee7b7" : activeDemo.pe < 30 ? "#fde68a" : "#fca5a5",
                    hint: activeDemo.pe < 20 ? "✓ Raisonnable" : activeDemo.pe < 30 ? "~ Moyenne" : "↑ Élevé",
                    desc: "Prix / bénéfice — plus c'est bas, moins c'est cher",
                  },
                  {
                    label: "PEG", value: activeDemo.peg,
                    color: activeDemo.peg < 1 ? "#6ee7b7" : activeDemo.peg < 2 ? "#fde68a" : "#fca5a5",
                    hint: activeDemo.peg < 1 ? "✓ Attractif" : activeDemo.peg < 2 ? "~ Correct" : "↑ Élevé",
                    desc: "PER ajusté à la croissance — idéal < 1",
                  },
                  {
                    label: "EV/EBITDA", value: activeDemo.evebitda,
                    color: activeDemo.evebitda < 12 ? "#6ee7b7" : activeDemo.evebitda < 20 ? "#fde68a" : "#fca5a5",
                    hint: activeDemo.evebitda < 12 ? "✓ Bas" : activeDemo.evebitda < 20 ? "~ Moyen" : "↑ Cher",
                    desc: "Valeur entreprise / profits bruts",
                  },
                ].map((m) => (
                  <div key={m.label} style={{
                    background: "rgba(255,255,255,0.06)", borderRadius: 10,
                    padding: "10px 12px", border: `1px solid ${m.color}33`,
                  }}>
                    <div style={{
                      fontSize: 9, color: "rgba(255,255,255,0.65)",
                      marginBottom: 4, letterSpacing: "0.04em", textTransform: "uppercase",
                    }}>{m.label}</div>
                    <div style={{
                      fontSize: 20, fontWeight: 700, color: m.color,
                      fontFamily: "var(--font-geist-mono, monospace)",
                      fontVariantNumeric: "tabular-nums",
                      letterSpacing: "-0.03em", marginBottom: 4,
                    }}>{m.value}</div>
                    <div style={{ fontSize: 9, color: m.color, fontWeight: 600, marginBottom: 5, opacity: 0.9 }}>
                      {m.hint}
                    </div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.58)", lineHeight: 1.4 }}>
                      {m.desc}
                    </div>
                  </div>
                ))}
              </div>

              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.50)", marginTop: 14, textAlign: "center" }}>
                Données simulées à titre d&apos;illustration
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SECTION 5 — TÉMOIGNAGES
      ════════════════════════════════════════════════════════════ */}
      <section style={{
        background: "var(--paper-2)",
        borderTop: "1px solid var(--line)",
        padding: "88px 32px",
      }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{
              fontSize: "clamp(22px, 3.5vw, 34px)",
              fontWeight: 700, letterSpacing: "-0.6px",
              color: "var(--ink)", marginBottom: 10,
            }}>
              Ils ont sauté le pas
            </h2>
            <p style={{ fontSize: 15, color: "var(--muted)" }}>
              Des profils comme le tien, qui ont découvert l&apos;investissement autrement.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 20,
          }}>
            {TESTIMONIALS.map((t) => (
              <div key={t.name} style={{
                background: "var(--paper)",
                border: "1.5px solid var(--line)",
                borderRadius: 18,
                padding: "28px 24px",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(45,125,90,0.30)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(10,22,40,0.08)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--line)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                {/* Identité */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: "var(--accent)", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, fontWeight: 800, flexShrink: 0,
                  }}>
                    {t.initial}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>
                      {t.name}, {t.age} ans
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{t.job}</div>
                  </div>
                </div>
                {/* Citation */}
                <p style={{
                  fontSize: 14, color: "var(--ink)",
                  lineHeight: 1.68, fontStyle: "italic", opacity: 0.82,
                }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SECTION 6 — CTA FINAL
      ════════════════════════════════════════════════════════════ */}
      <section style={{ background: "var(--accent)", padding: "96px 32px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{
            fontSize: "clamp(26px, 4.5vw, 46px)",
            fontWeight: 800, letterSpacing: "-1.2px",
            color: "#fff", marginBottom: 18, lineHeight: 1.12,
          }}>
            Ton argent mérite mieux qu&apos;un livret.
          </h2>
          <p style={{
            fontSize: 16, color: "rgba(255,255,255,0.78)",
            marginBottom: 40, lineHeight: 1.65,
          }}>
            Rejoins des milliers d&apos;investisseurs débutants qui ont pris le contrôle de leur épargne.
          </p>

          <Link
            href="/advisor"
            style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              padding: "16px 34px", borderRadius: 9999,
              background: "#fff", color: "var(--accent)",
              fontWeight: 800, fontSize: 16, textDecoration: "none",
              boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
              transition: "transform 0.12s, box-shadow 0.12s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 36px rgba(0,0,0,0.20)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "none";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.15)";
            }}
          >
            Créer mon portefeuille gratuit <ArrowRight size={17} strokeWidth={2.5} />
          </Link>

          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.60)", marginTop: 20 }}>
            Sans inscription · Résultat immédiat · 100% gratuit
          </p>
        </div>
      </section>

      {/* Disclaimer légal + Footer */}
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
