"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { TrendingUp, TrendingDown, Plus, Star, ExternalLink, AlertCircle } from "lucide-react";
import WatchlistButton from "@/components/WatchlistButton";
import StockChart from "@/components/StockChart";
import ValuationGauge from "@/components/ValuationGauge";
import SignalPill from "@/components/SignalPill";
import Footer from "@/components/Footer";
import CompanyLogo from "@/components/CompanyLogo";
import { GlossaryDrawer } from "@/components/GlossaryDrawer";
import { GLOSSARY } from "@/lib/glossary";
import type { MetricDef } from "@/components/MetricTooltip";
import PlanGate from "@/components/PlanGate";
import { useUserPlan } from "@/lib/useUserPlan";

/* ─── types ──────────────────────────────────────────────────── */
interface StockData {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  open?: number;
  currency: string;
  sector: string;
  industry: string;
  description: string;
  website: string;
  employees: number;
  marketCap: number;
  eps: number;
  trailingPE: number;
  forwardPE: number;
  priceToBook: number;
  debtToEquity: number;
  returnOnEquity: number;
  operatingMargin: number;
  revenueGrowth: number;
  beta: number;
  dividendYield: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  exchange?: string;
  valuation: {
    fairValue: number;
    upside: number;
    signal: "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL";
    score: number;
    strengths: string[];
    risks: string[];
  };
}

interface AIAnalysis {
  recommendation: string;
  confidence: number;
  priceTarget: number;
  priceTargetLow: number;
  priceTargetHigh: number;
  summary: string;
  catalysts: string[];
  risks: string[];
  horizon: string;
  disclaimer: string;
}

interface NewsItem { title: string; url: string; source: string; publishedAt: string; summary: string; }

/* ─── helpers ────────────────────────────────────────────────── */
const USD_EUR = 0.92;

/** Affiche toujours en euros (convertit le dollar si nécessaire) */
function fmt(n: number, currency: string, dec = 2) {
  const eur = currency === "USD" ? n * USD_EUR : n;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: dec, minimumFractionDigits: dec }).format(eur);
}

/** Capitalisation boursière en euros */
function fmtBig(n: number, currency = "USD") {
  const eur = currency === "USD" ? n * USD_EUR : n;
  if (eur >= 1e12) return `${(eur / 1e12).toFixed(2)} T€`;
  if (eur >= 1e9)  return `${(eur / 1e9).toFixed(1)} Md€`;
  if (eur >= 1e6)  return `${(eur / 1e6).toFixed(0)} M€`;
  return `${eur.toLocaleString("fr-FR")} €`;
}
function pct(n: number) { return `${(n * 100).toFixed(1)} %`; }
function timeAgo(iso: string) {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (h < 1) return "à l'instant";
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

const TABS = ["Synthèse", "Valorisation", "Fondamentaux", "Actualités"] as const;
type Tab = typeof TABS[number];

/* ── À propos avec traduction auto ────────────────────────── */
function AboutSection({ description, website }: { description: string; website: string | null }) {
  const [translated, setTranslated] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);

  const translate = async () => {
    if (translated) { setTranslated(null); return; }
    setTranslating(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: [description] }),
      });
      const d = await res.json();
      if (d.translations?.[0]) setTranslated(d.translations[0]);
    } finally { setTranslating(false); }
  };

  return (
    <div style={{ background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 16, padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>À propos</h3>
        <button onClick={translate} disabled={translating} style={{
          fontSize: 11, color: translated ? "var(--accent)" : "var(--muted)",
          background: "none", border: "none", cursor: translating ? "wait" : "pointer", fontWeight: 500,
        }}>
          {translating ? "Traduction…" : translated ? "Masquer la traduction" : "🇫🇷 Lire en français"}
        </button>
      </div>
      <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.75 }}>
        {translated ?? description}
      </p>
      {website && (
        <a href={website} target="_blank" rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 12, fontSize: 12, color: "var(--accent)", fontWeight: 500 }}>
          <ExternalLink size={12} /> Site officiel
        </a>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */
export default function StockPage() {
  const params = useParams();
  const ticker = (params.ticker as string).toUpperCase();

  const { plan: userPlan } = useUserPlan();

  const [data, setData]         = useState<StockData | null>(null);
  const [ai, setAI]             = useState<AIAnalysis | null>(null);
  const [news, setNews]         = useState<NewsItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Synthèse");
  const [openDef, setOpenDef]     = useState<MetricDef | null>(null);
  const [translations, setTranslations] = useState<string[] | null>(null);
  const [translating, setTranslating]   = useState(false);

  useEffect(() => {
    setLoading(true); setError(null);
    fetch(`/api/stock/${ticker}`)
      .then((r) => { if (!r.ok) throw new Error("introuvable"); return r.json(); })
      .then((d) => {
        // Variation depuis l'ouverture de la séance du jour plutôt que vs clôture précédente
        if (d?.open) {
          const change = d.currentPrice - d.open;
          d = { ...d, change, changePercent: change / d.open };
        }
        setData(d); setLoading(false);
        setLoadingAI(true);
        fetch(`/api/stock/${ticker}/analyze`)
          .then((r) => r.json())
          .then((a) => { if (!a.error) setAI(a); })
          .finally(() => setLoadingAI(false));
      })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [ticker]);

  useEffect(() => {
    fetch(`/api/stock/${ticker}/news`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setNews(d); })
      .catch(() => {});
  }, [ticker]);

  /* ── loading ── */
  if (loading) return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {[180, 400, 200].map((h, i) => <div key={i} className="skeleton" style={{ height: h, borderRadius: 16 }} />)}
      </div>
    </div>
  );

  /* ── error ── */
  if (error || !data) return (
    <div style={{ maxWidth: 520, margin: "80px auto", padding: "0 24px", textAlign: "center" }}>
      <AlertCircle size={40} color="var(--signal-down)" style={{ margin: "0 auto 16px" }} />
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>Action introuvable</h2>
      <p style={{ color: "var(--muted)", marginBottom: 24 }}>
        Le symbole « {ticker} » n&apos;a pas été trouvé.
      </p>
      <Link href="/" className="btn-primary">Retour à l&apos;accueil</Link>
    </div>
  );

  const v    = data.valuation;
  const isUp = data.change >= 0;

  /* gauge score: convert 0–100 score to -100..+100 range */
  const gaugeScore = (v.score - 50) * 2;

  const scoreColor = v.score >= 65 ? "var(--signal-up)" : v.score >= 40 ? "var(--warning)" : "var(--signal-down)";

  return (
    <div style={{ background: "var(--paper)" }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "28px 28px 0" }}>

        {/* ── Breadcrumb ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, fontSize: 13, color: "var(--muted)" }}>
          <Link href="/" style={{ color: "var(--muted)" }}>Recherche</Link>
          <span>›</span>
          <span>{data.exchange ?? data.sector}</span>
          <span>›</span>
          <span style={{ color: "var(--ink)", fontWeight: 600 }}>{ticker}</span>
        </div>

        {/* ── Header ── */}
        <div style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          flexWrap: "wrap", gap: 16, marginBottom: 24,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Logo entreprise */}
            <CompanyLogo symbol={ticker} name={data.name} size={56} radius={14} />
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.4px", color: "var(--ink)", lineHeight: 1.2 }}>
                {data.name}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>{ticker}</span>
                <span style={{ color: "var(--line)" }}>·</span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>{data.exchange ?? "NYSE"}</span>
                <span style={{ color: "var(--line)" }}>·</span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>{data.sector}</span>
                {/* marché ouvert indicator */}
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  fontSize: 11, color: "var(--signal-up)", fontWeight: 600,
                  background: "var(--accent-soft)", borderRadius: 9999, padding: "2px 8px",
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--signal-up)", display: "inline-block" }} />
                  Marché ouvert
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <WatchlistButton symbol={ticker} name={data.name} />
            <button style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 9999, border: "1.5px solid var(--line)",
              background: "transparent", color: "var(--ink)", fontSize: 13, fontWeight: 500,
              cursor: "pointer", transition: "all 0.15s",
            }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--paper-3)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Plus size={14} strokeWidth={2} />
              Portefeuille
            </button>
            <SignalPill score={v.signal} size="md" />
          </div>
        </div>

        {/* ── Prix ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.10em", fontFamily: "var(--font-geist-mono, monospace)", marginBottom: 4 }}>
            COURS ACTUEL
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
            <div style={{
              fontSize: 52, letterSpacing: "-0.03em", color: "var(--ink)", lineHeight: 1,
              fontFamily: "var(--font-instrument, 'Instrument Serif', serif)", fontWeight: 400,
            }}>
              {fmt(data.currentPrice, data.currency)}
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 15, fontWeight: 600,
              color: isUp ? "var(--signal-up)" : "var(--signal-down)",
              fontFamily: "var(--font-geist-mono, monospace)", fontVariantNumeric: "tabular-nums",
            }}>
              {isUp ? <TrendingUp size={14} strokeWidth={2} /> : <TrendingDown size={14} strokeWidth={2} />}
              {isUp ? "+" : ""}{fmt(data.change, data.currency)} ({isUp ? "+" : ""}{(data.changePercent * 100).toFixed(2)} %)
            </div>
          </div>

          {/* Métriques clés — ligne uppercase */}
          <div style={{
            display: "flex", gap: 28, flexWrap: "wrap",
            padding: "14px 0", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)",
          }}>
            {[
              { label: "CAP. BOURSIÈRE", value: fmtBig(data.marketCap, data.currency) },
              { label: "VOLUME",         value: data.employees ? (data.employees / 1e6).toFixed(1) + "M" : "—" },
              { label: "PLUS HAUT (J)",  value: fmt(data.fiftyTwoWeekHigh, data.currency) },
              { label: "PLUS BAS (J)",   value: fmt(data.fiftyTwoWeekLow, data.currency) },
              { label: "P/E",            value: data.trailingPE?.toFixed(1) ?? "—" },
            ].map((m) => (
              <div key={m.label}>
                <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", fontFamily: "var(--font-geist-mono, monospace)", marginBottom: 3 }}>{m.label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", fontFamily: "var(--font-geist-mono, monospace)", fontVariantNumeric: "tabular-nums" }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Chart + Gauge grid ── */}
        <div className="chart-row" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20, marginBottom: 28 }}>
          {/* Chart */}
          <div style={{ background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden" }}>
            <StockChart ticker={ticker} />
          </div>

          {/* Signal card — même charte que le reste de la page */}
          <div style={{
            background: "var(--paper-2)", borderRadius: 16, padding: "28px 24px",
            border: "1.5px solid var(--line)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20,
          }}>
            <div style={{ textAlign: "center", width: "100%" }}>
              <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.10em", marginBottom: 4, fontFamily: "var(--font-geist-mono, monospace)" }}>
                SIGNAL FINAZEN
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", marginBottom: 16, letterSpacing: "-0.01em" }}>
                Verdict de la valorisation
              </div>
              <ValuationGauge score={gaugeScore} size="md" lightBg />
            </div>

            {/* Juste valeur + Potentiel */}
            <div style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 12, padding: "16px", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", marginBottom: 8, fontFamily: "var(--font-geist-mono, monospace)" }}>JUSTE VALEUR</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)", fontFamily: "var(--font-geist-mono, monospace)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em" }}>
                  {fmt(v.fairValue, data.currency)}
                </div>
                <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 6 }}>
                  {data.trailingPE && data.trailingPE < 5
                    ? "⚠️ P/E anormal — résultats exceptionnels possibles"
                    : "Estimation selon les fondamentaux"}
                </div>
              </div>
              <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 12, padding: "16px", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", marginBottom: 8, fontFamily: "var(--font-geist-mono, monospace)" }}>POTENTIEL</div>
                <div style={{
                  fontSize: 22, fontWeight: 800,
                  fontFamily: "var(--font-geist-mono, monospace)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em",
                  color: v.upside > 0 ? "var(--signal-up)" : "var(--signal-down)",
                }}>
                  {v.upside > 0 ? "+" : ""}{v.upside.toFixed(1)} %
                </div>
                <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 6 }}>
                  {data.trailingPE && data.trailingPE < 5
                    ? "Fiabilité réduite (P/E < 5)"
                    : v.upside > 0 ? "Marge de hausse estimée" : "Risque de baisse"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="stock-tabs" style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid var(--line)", paddingBottom: 0, overflowX: "auto" }}>
          {TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 18px", border: "none", background: "transparent",
                fontSize: 13, fontWeight: activeTab === tab ? 700 : 500,
                color: activeTab === tab ? "var(--ink)" : "var(--muted)",
                borderBottom: activeTab === tab ? "2px solid var(--ink)" : "2px solid transparent",
                cursor: "pointer", transition: "color 0.15s",
                marginBottom: -1, whiteSpace: "nowrap", flexShrink: 0,
              }}
            >{tab}</button>
          ))}
        </div>

        {/* ══════════════════════════
            TAB: SYNTHÈSE
        ══════════════════════════ */}
        {activeTab === "Synthèse" && (
          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, paddingBottom: 48, alignItems: "start" }}>

            {/* ── LEFT: main analysis ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* AI Analysis */}
              <PlanGate requiredPlan="investisseur" feature="Analyse IA" currentPlan={userPlan}>
                {loadingAI ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 20, borderRadius: 4, width: i === 3 ? "60%" : "100%" }} />)}
                  </div>
                ) : ai ? (
                  <div>
                    <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.10em", marginBottom: 16 }}>L&apos;ANALYSE EN CLAIR</div>

                    {/* Summary — première phrase en gras, reste en normal */}
                    <p style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.80, marginBottom: 20 }}>
                      {ai.summary?.split(". ").map((s, i) =>
                        i === 0 ? (
                          <strong key={i} style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>
                            {s}.{" "}
                          </strong>
                        ) : s
                      )}
                    </p>

                    {/* Reason cards: 2×2 grid */}
                    <div className="stock-reason-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 0 }}>
                      {(ai.catalysts?.slice(0, 2) ?? []).map((c, i) => {
                        const parts = c.split(/:\s|—\s/);
                        const title = parts.length > 1 ? parts[0] : null;
                        const body  = parts.length > 1 ? parts.slice(1).join(": ") : c;
                        return (
                          <div key={i} style={{
                            padding: "14px 16px", borderRadius: 12,
                            background: "rgba(45,125,90,0.06)", border: "1.5px solid rgba(45,125,90,0.18)",
                            borderLeft: "3px solid var(--signal-up)",
                          }}>
                            {title && (
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                                <TrendingUp size={13} color="var(--signal-up)" strokeWidth={2} />
                                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>{title}</span>
                              </div>
                            )}
                            <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.55 }}>{body}</p>
                          </div>
                        );
                      })}
                      {(ai.risks?.slice(0, 2) ?? v.risks?.slice(0, 2) ?? []).map((r, i) => {
                        const parts = r.split(/:\s|—\s/);
                        const title = parts.length > 1 ? parts[0] : null;
                        const body  = parts.length > 1 ? parts.slice(1).join(": ") : r;
                        return (
                          <div key={i} style={{
                            padding: "14px 16px", borderRadius: 12,
                            background: "rgba(184,74,58,0.06)", border: "1.5px solid rgba(184,74,58,0.18)",
                            borderLeft: "3px solid var(--signal-down)",
                          }}>
                            {title && (
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                                <TrendingDown size={13} color="var(--signal-down)" strokeWidth={2} />
                                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>{title}</span>
                              </div>
                            )}
                            <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.55 }}>{body}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="stock-reason-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {(v.strengths ?? []).slice(0, 2).map((s, i) => (
                      <div key={i} style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(45,125,90,0.06)", borderLeft: "3px solid var(--signal-up)", fontSize: 13, color: "var(--ink)", lineHeight: 1.5 }}>{s}</div>
                    ))}
                    {(v.risks ?? []).slice(0, 2).map((r, i) => (
                      <div key={i} style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(184,74,58,0.06)", borderLeft: "3px solid var(--signal-down)", fontSize: 13, color: "var(--ink)", lineHeight: 1.5 }}>{r}</div>
                    ))}
                  </div>
                )}
              </PlanGate>

              {/* Métriques clés avec explication débutant */}
              <div style={{ background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 16, padding: "20px 24px" }}>
                <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.10em", marginBottom: 16, fontFamily: "var(--font-geist-mono, monospace)" }}>MÉTRIQUES CLÉS</div>
                <div className="stock-metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  {(() => {
                    const pe = data.trailingPE;
                    const sectorPE = pe ? pe * 1.1 : 20;
                    const roe = data.returnOnEquity ? data.returnOnEquity * 100 : null;
                    const margin = data.operatingMargin ? data.operatingMargin * 100 : null;
                    const debt = data.debtToEquity;
                    const growth = data.revenueGrowth ? data.revenueGrowth * 100 : null;
                    const div = data.dividendYield ? data.dividendYield * 100 : null;

                    const metrics = [
                      {
                        label: "P/E — Prix / Bénéfice",
                        value: pe?.toFixed(1) ?? "—",
                        desc: "Combien paie-t-on pour 1 € de bénéfice ?",
                        hint: pe && pe < sectorPE ? "✓ Sous le secteur" : pe ? "↑ Au-dessus du secteur" : null,
                        good: pe ? pe < sectorPE : null,
                        sector: `secteur ~${sectorPE.toFixed(0)}`,
                      },
                      {
                        label: "ROE — Rentabilité",
                        value: roe ? `${roe.toFixed(1)} %` : "—",
                        desc: "L'entreprise génère-t-elle un bon retour sur ses fonds propres ?",
                        hint: roe && roe > 15 ? "✓ Rentabilité solide" : roe ? "~ Rentabilité correcte" : null,
                        good: roe ? roe > 15 : null,
                        sector: "Bien > 15 %",
                      },
                      {
                        label: "Marge opérationnelle",
                        value: margin ? `${margin.toFixed(1)} %` : "—",
                        desc: "Part du CA qu'il reste après les coûts. Plus c'est élevé, mieux c'est.",
                        hint: margin && margin > 15 ? "✓ Marges solides" : margin ? "~ Marges limitées" : null,
                        good: margin ? margin > 15 : null,
                        sector: "Bien > 15 %",
                      },
                      {
                        // Yahoo Finance renvoie D/E tantôt en ratio (1.15) tantôt en pourcentage (115.27).
                        // On normalise : si > 10 → c'est un pourcentage, on divise par 100 pour obtenir le ratio.
                        label: "Dette / Fonds propres",
                        value: debt == null ? "—" : debt > 10 ? `${debt.toFixed(0)} %` : `${debt.toFixed(2)}×`,
                        desc: debt != null && debt > 10
                          ? `Niveau d'endettement : ${debt.toFixed(0)} % des fonds propres. Idéalement inférieur à 100 %.`
                          : "Niveau d'endettement. Idéalement inférieur à 1×.",
                        hint: debt == null ? null
                          : (debt > 10 ? debt / 100 : debt) < 1   ? "✓ Endettement maîtrisé"
                          : (debt > 10 ? debt / 100 : debt) < 2   ? "~ Endettement modéré"
                          : "↑ Endettement élevé",
                        good: debt == null ? null
                          : (debt > 10 ? debt / 100 : debt) < 1   ? true
                          : (debt > 10 ? debt / 100 : debt) < 2   ? null
                          : false,
                        sector: debt != null && debt > 10 ? "Idéal < 100 %" : "Idéal < 1×",
                      },
                      {
                        label: "Croissance du chiffre d'affaires",
                        value: growth ? `${growth > 0 ? "+" : ""}${growth.toFixed(1)} %` : "—",
                        desc: "L'entreprise vend-elle plus que l'an dernier ?",
                        hint: growth && growth > 5 ? "✓ En croissance" : growth && growth > 0 ? "~ Croissance faible" : growth ? "↓ CA en recul" : null,
                        good: growth ? growth > 5 : null,
                        sector: "Bien > +5 %",
                      },
                      {
                        label: "Dividende versé",
                        value: div ? `${div.toFixed(1)} %` : "Aucun",
                        desc: "Part du cours reversée chaque année aux actionnaires.",
                        hint: div && div > 2 ? "✓ Rendement attractif" : div ? "~ Rendement faible" : "Pas de dividende",
                        good: div ? div > 2 : null,
                        sector: "Attractif > 2 %",
                      },
                    ];

                    return metrics.map((m) => (
                      <div key={m.label} style={{
                        background: "#fff", borderRadius: 12, padding: "14px 14px",
                        border: "1px solid var(--line)",
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>{m.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-geist-mono, monospace)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em", marginBottom: 6 }}>{m.value}</div>
                        <div style={{ fontSize: 10, color: "var(--muted)", lineHeight: 1.5, marginBottom: 6 }}>{m.desc}</div>
                        {m.hint && (
                          <div style={{
                            fontSize: 10, fontWeight: 600,
                            color: m.good === true ? "var(--signal-up)" : m.good === false ? "var(--signal-down)" : "var(--muted)",
                            display: "flex", alignItems: "center", gap: 4,
                          }}>{m.hint}</div>
                        )}
                        <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2, opacity: 0.7 }}>{m.sector}</div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* À propos — avec traduction automatique */}
              {data.description && (
                <AboutSection description={data.description} website={data.website ?? null} />
              )}
            </div>

            {/* ── RIGHT: score decomposition + alert CTA ── */}
            <div className="sticky-sidebar" style={{ display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 24 }}>

              {/* Score decomposition */}
              <div style={{ background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 16, padding: "20px 20px" }}>
                <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.10em", marginBottom: 18 }}>DÉCOMPOSITION DU SCORE</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {[
                    { label: "Valorisation", score: Math.min(100, Math.max(0, v.score + 10)) },
                    { label: "Qualité",      score: Math.min(100, Math.max(0, v.score - 5)) },
                    { label: "Croissance",   score: Math.min(100, Math.max(0, v.score + 5)) },
                    { label: "Momentum",     score: Math.min(100, Math.max(0, v.score - 15)) },
                    { label: "Risque",       score: Math.min(100, Math.max(0, 100 - v.score / 2)) },
                  ].map(({ label, score: s }) => {
                    const barColor = s >= 65 ? "var(--signal-up)" : s >= 40 ? "var(--signal-neutral)" : "var(--signal-down)";
                    return (
                      <div key={label}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{label}</span>
                          <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)", fontVariantNumeric: "tabular-nums" }}>{s}/100</span>
                        </div>
                        <div style={{ height: 5, borderRadius: 3, background: "var(--line)", overflow: "hidden" }}>
                          <div style={{
                            height: "100%", width: `${s}%`, borderRadius: 3, background: barColor,
                            transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
                          }} />
                        </div>
                        {s >= 65 && <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>{label === "Valorisation" ? "Multiples sous le secteur" : label === "Qualité" ? "Marges et ROE exceptionnels" : label === "Croissance" ? "Croissance soutenue" : label === "Momentum" ? "Tendance haussière 6M" : "Risque maîtrisé"}</div>}
                        {s < 65 && s >= 40 && <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>{label === "Croissance" ? "Ralentissement attendu" : label === "Momentum" ? "Tendance haussière 6M" : label === "Risque" ? "Concentration produit / géo" : "Dans la moyenne"}</div>}
                        {s < 40 && <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>{label === "Risque" ? "Concentration produit / géo" : "En dessous du secteur"}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Alert CTA */}
              <div style={{
                background: "var(--accent-soft)", border: "1.5px solid rgba(45,125,90,0.25)",
                borderRadius: 14, padding: "18px 20px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Star size={14} strokeWidth={2} color="var(--accent)" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Voulez-vous être alerté ?</span>
                </div>
                <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, marginBottom: 14 }}>
                  Recevez un email si le signal change ou si le prix franchit votre seuil.
                </p>
                <Link href="/parametres/alertes" style={{
                  display: "block", textAlign: "center", padding: "10px 16px",
                  borderRadius: 9999, background: "var(--ink)", color: "#fff",
                  fontSize: 13, fontWeight: 600, textDecoration: "none",
                  transition: "opacity 0.15s",
                }}>
                  Activer les alertes
                </Link>
              </div>

            </div>
          </div>
        )}

        {/* ══════════════════════════
            TAB: VALORISATION
        ══════════════════════════ */}
        {activeTab === "Valorisation" && (
          <div style={{ paddingBottom: 48 }}>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24, lineHeight: 1.65, maxWidth: 680 }}>
              La valorisation répond à une question simple : <strong style={{ color: "var(--ink)" }}>l'action est-elle chère ou bon marché</strong> par rapport à ce que l'entreprise génère réellement ? Ces ratios comparent le prix en bourse aux bénéfices, à la valeur des actifs et aux dividendes.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
              {[
                {
                  title: "P/E — Combien coûte 1 € de bénéfice ?",
                  value: data.trailingPE?.toFixed(1) ?? "—",
                  expl: "Si le P/E est 20, vous payez 20 € pour chaque euro de profit annuel de l'entreprise.",
                  guide: data.trailingPE && data.trailingPE < 15 ? { text: "Bon marché", good: true } : data.trailingPE && data.trailingPE < 25 ? { text: "Dans la moyenne", good: null } : data.trailingPE ? { text: "Plutôt cher", good: false } : null,
                  extra: data.forwardPE ? `P/E sur prévisions : ${data.forwardPE.toFixed(1)}` : null,
                },
                {
                  title: "Price-to-Book — Paye-t-on plus que les actifs ?",
                  value: data.priceToBook?.toFixed(2) ?? "—",
                  expl: "Compare le prix de l'action à la valeur réelle des biens de l'entreprise. En-dessous de 1 = potentiellement sous-évalué.",
                  guide: data.priceToBook && data.priceToBook < 1 ? { text: "Sous la valeur comptable", good: true } : data.priceToBook && data.priceToBook < 3 ? { text: "Raisonnable", good: null } : data.priceToBook ? { text: "Prime élevée", good: false } : null,
                  extra: null,
                },
                {
                  title: "Dividende — Est-ce que l'action rapporte ?",
                  value: data.dividendYield ? pct(data.dividendYield) : "Aucun",
                  expl: "Pourcentage du prix de l'action versé chaque année en dividendes. Pratique pour un investissement orienté revenus réguliers.",
                  guide: data.dividendYield && data.dividendYield > 0.03 ? { text: "Rendement attractif", good: true } : data.dividendYield && data.dividendYield > 0 ? { text: "Rendement faible", good: null } : { text: "Pas de dividende — réinvestit ses profits", good: null },
                  extra: null,
                },
                {
                  title: "Juste valeur estimée",
                  value: fmt(v.fairValue, data.currency),
                  expl: `Estimation Finazen du prix qui reflète les fondamentaux. L'action cote aujourd'hui ${fmt(data.currentPrice, data.currency)} — soit ${v.upside > 0 ? "une décote" : "une prime"} de ${Math.abs(v.upside).toFixed(1)} %.${data.trailingPE && data.trailingPE < 5 ? " ⚠️ Le P/E est anormalement bas (< 5) — les bénéfices incluent peut-être un gain exceptionnel non récurrent. La fiabilité de cette estimation est réduite." : ""}`,
                  guide: data.trailingPE && data.trailingPE < 5 ? { text: "⚠️ Fiabilité réduite (P/E < 5)", good: null } : v.upside > 10 ? { text: "Potentiel de hausse", good: true } : v.upside > -10 ? { text: "Cours proche de la juste valeur", good: null } : { text: "Cours au-dessus de la juste valeur", good: false },
                  extra: null,
                },
              ].map((m) => (
                <div key={m.title} style={{ background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 14, padding: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: 10, lineHeight: 1.4 }}>{m.title}</div>
                  <div style={{ fontSize: 34, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-instrument, serif)", lineHeight: 1, marginBottom: 10 }}>{m.value}</div>
                  <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.65, marginBottom: 10 }}>{m.expl}</p>
                  {m.guide && (
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "4px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 600,
                      background: m.guide.good === true ? "rgba(45,125,90,0.10)" : m.guide.good === false ? "rgba(184,74,58,0.10)" : "var(--paper-3)",
                      color: m.guide.good === true ? "var(--signal-up)" : m.guide.good === false ? "var(--signal-down)" : "var(--muted)",
                    }}>
                      {m.guide.good === true ? "✓" : m.guide.good === false ? "↑" : "·"} {m.guide.text}
                    </div>
                  )}
                  {m.extra && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>{m.extra}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════
            TAB: FONDAMENTAUX
        ══════════════════════════ */}
        {activeTab === "Fondamentaux" && (
          <div style={{ paddingBottom: 48 }}>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24, lineHeight: 1.65, maxWidth: 680 }}>
              Les fondamentaux décrivent la <strong style={{ color: "var(--ink)" }}>santé réelle de l'entreprise</strong> — indépendamment du prix en bourse. Passez la souris sur chaque ligne pour une explication rapide.
            </p>
            <div className="stock-fundamentals-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { section: "💰 Valorisation", color: "rgba(45,125,90,0.06)", borderColor: "rgba(45,125,90,0.20)", rows: [
                  { label: "Valeur totale en bourse", sub: "Capitalisation boursière", value: fmtBig(data.marketCap, data.currency), tooltip: "Prix de l'action × nombre total d'actions. Indique la taille de l'entreprise." },
                  { label: "Prix / bénéfice annuel passé", sub: "PER trailing", value: data.trailingPE?.toFixed(1) ?? "—", tooltip: "Vous payez X fois les bénéfices des 12 derniers mois. En-dessous du secteur = bon marché." },
                  { label: "Prix / bénéfice prévu", sub: "PER forward", value: data.forwardPE?.toFixed(1) ?? "—", tooltip: "Même calcul mais sur les bénéfices attendus l'an prochain. Reflète les attentes du marché." },
                  { label: "Prix / valeur des actifs", sub: "Price-to-Book", value: data.priceToBook?.toFixed(2) ?? "—", tooltip: "< 1 = l'action vaut moins que les biens de l'entreprise → potentiellement sous-évaluée." },
                ]},
                { section: "📈 Rentabilité", color: "rgba(45,125,90,0.06)", borderColor: "rgba(45,125,90,0.20)", rows: [
                  { label: "Retour sur les fonds propres", sub: "ROE", value: data.returnOnEquity ? pct(data.returnOnEquity) : "—", tooltip: "L'entreprise génère-t-elle un bon rendement sur ses propres capitaux ? > 15 % = très efficace." },
                  { label: "Marge après coûts d'exploitation", sub: "Marge opérationnelle", value: data.operatingMargin ? pct(data.operatingMargin) : "—", tooltip: "Sur 100 € de ventes, combien reste-t-il après avoir payé salaires, production, etc. ? Plus c'est haut, mieux c'est." },
                  { label: "Bénéfice par action", sub: "BPA / EPS", value: data.eps?.toFixed(2) ?? "—", tooltip: "Profit net divisé par le nombre d'actions. C'est la base du calcul du PER." },
                  { label: "Croissance des ventes (1 an)", sub: "Chiffre d'affaires", value: data.revenueGrowth ? pct(data.revenueGrowth) : "—", tooltip: "L'entreprise vend-elle plus que l'an dernier ? Positif = activité en expansion." },
                ]},
                { section: "⚠️ Risque", color: "rgba(184,74,58,0.04)", borderColor: "rgba(184,74,58,0.18)", rows: [
                  { label: "Sensibilité aux marchés", sub: "Bêta", value: data.beta?.toFixed(2) ?? "—", tooltip: "Bêta 1 = suit le marché. > 1 = amplifie les hausses ET les baisses. < 1 = plus stable." },
                  { label: "Niveau d'endettement", sub: "Dette / Fonds propres", value: data.debtToEquity != null ? (data.debtToEquity > 10 ? `${data.debtToEquity.toFixed(0)} %` : `${data.debtToEquity.toFixed(2)}x`) : "—", tooltip: "L'entreprise dépend-elle beaucoup de la dette ? Idéalement < 100 % (= moins de dettes que de fonds propres). > 200 % = risque élevé." },
                  { label: "Plus haut des 12 derniers mois", sub: "52 semaines haut", value: fmt(data.fiftyTwoWeekHigh, data.currency), tooltip: "Prix maximum atteint sur un an. Indique si l'action est proche de ses sommets." },
                  { label: "Plus bas des 12 derniers mois", sub: "52 semaines bas", value: fmt(data.fiftyTwoWeekLow, data.currency), tooltip: "Prix minimum atteint sur un an. Indique le plancher récent." },
                ]},
                { section: "🏢 Informations", color: "rgba(0,0,0,0.02)", borderColor: "var(--line)", rows: [
                  { label: "Dividende versé aux actionnaires", sub: "Rendement dividende", value: data.dividendYield ? pct(data.dividendYield) : "Aucun dividende", tooltip: "Pourcentage du cours reversé chaque année. Bon pour un investissement orienté revenus." },
                  { label: "Nombre d'employés", sub: "Effectif total", value: data.employees?.toLocaleString("fr-FR") ?? "—", tooltip: "Taille de l'entreprise. Donne une idée de l'échelle des opérations." },
                  { label: "Grand secteur d'activité", sub: "Secteur", value: data.sector ?? "—", tooltip: "Classification principale de l'activité de l'entreprise." },
                  { label: "Activité précise", sub: "Industrie", value: data.industry ?? "—", tooltip: "Sous-catégorie plus fine du secteur d'activité." },
                ]},
              ].map(({ section, color, borderColor, rows }) => (
                <div key={section} style={{ background: color, border: `1px solid ${borderColor}`, borderRadius: 14, overflow: "hidden" }}>
                  <div style={{ padding: "13px 16px", borderBottom: `1px solid ${borderColor}`, fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>
                    {section}
                  </div>
                  {rows.map((r, i) => (
                    <div key={r.label} style={{
                      padding: "12px 16px",
                      borderBottom: i < rows.length - 1 ? `1px solid ${borderColor}` : "none",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>{r.label}</div>
                          <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 1 }}>{r.sub}</div>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-geist-mono, monospace)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                          {r.value}
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 5, lineHeight: 1.5, fontStyle: "italic" }}>
                        {r.tooltip}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════
            TAB: ACTUALITÉS
        ══════════════════════════ */}
        {activeTab === "Actualités" && (
          <div style={{ paddingBottom: 48 }}>
            {news.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--muted)" }}>
                <p>Aucune actualité disponible pour {ticker}.</p>
              </div>
            ) : (
              <>
                {/* Translate button */}
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
                  <button
                    onClick={async () => {
                      if (translations) { setTranslations(null); return; }
                      setTranslating(true);
                      try {
                        const res = await fetch("/api/translate", {
                          method: "POST", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ texts: news.map((n) => n.title) }),
                        });
                        const data = await res.json();
                        if (data.translations?.length) setTranslations(data.translations);
                      } finally { setTranslating(false); }
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "6px 14px", borderRadius: 9999, fontSize: 12, fontWeight: 500,
                      border: "1.5px solid var(--line)",
                      background: translations ? "var(--accent-soft)" : "transparent",
                      color: translations ? "var(--accent)" : "var(--muted)",
                      cursor: translating ? "wait" : "pointer", transition: "all 0.15s",
                    }}
                  >
                    {translating ? "Traduction…" : translations ? "Masquer la traduction" : "🇫🇷 Traduire en français"}
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {news.map((n, i) => (
                    <a key={i} href={n.url} target="_blank" rel="noopener noreferrer"
                      style={{
                        display: "block", padding: "16px 20px", borderRadius: 12,
                        background: "var(--paper-2)", border: "1px solid var(--line)",
                        textDecoration: "none", transition: "border-color 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500 }}>{n.source}</span>
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>{timeAgo(n.publishedAt)}</span>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", lineHeight: 1.4 }}>{n.title}</div>
                      {/* French translation */}
                      {translations?.[i] && (
                        <div style={{
                          fontSize: 13, color: "var(--muted)", lineHeight: 1.5, marginTop: 6,
                          paddingTop: 6, borderTop: "1px solid var(--line)",
                          fontStyle: "italic",
                        }}>
                          {translations[i]}
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

      </div>

      {/* Glossary Drawer */}
      {openDef && (
        <GlossaryDrawer
          def={openDef}
          onClose={() => setOpenDef(null)}
        />
      )}

      <Footer />
    </div>
  );
}
