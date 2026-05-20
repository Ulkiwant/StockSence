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
import { GlossaryDrawer } from "@/components/GlossaryDrawer";
import { GLOSSARY } from "@/lib/glossary";
import type { MetricDef } from "@/components/MetricTooltip";

/* ─── types ──────────────────────────────────────────────────── */
interface StockData {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
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
function fmt(n: number, currency: string, dec = 2) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: dec, minimumFractionDigits: dec }).format(n);
}
function fmtBig(n: number) {
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)} T$`;
  if (n >= 1e9)  return `${(n / 1e9).toFixed(1)} Md$`;
  if (n >= 1e6)  return `${(n / 1e6).toFixed(0)} M$`;
  return n.toLocaleString("fr-FR");
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

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */
export default function StockPage() {
  const params = useParams();
  const ticker = (params.ticker as string).toUpperCase();

  const [data, setData]         = useState<StockData | null>(null);
  const [ai, setAI]             = useState<AIAnalysis | null>(null);
  const [news, setNews]         = useState<NewsItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Synthèse");
  const [openDef, setOpenDef]   = useState<MetricDef | null>(null);

  useEffect(() => {
    setLoading(true); setError(null);
    fetch(`/api/stock/${ticker}`)
      .then((r) => { if (!r.ok) throw new Error("introuvable"); return r.json(); })
      .then((d) => {
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
            {/* Logo carré */}
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: "var(--accent-soft)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 800, color: "var(--accent)",
              border: "1.5px solid rgba(45,125,90,0.18)",
              flexShrink: 0,
            }}>
              {ticker.slice(0, 2)}
            </div>
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

        {/* ── Prix inline ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
          padding: "16px 20px", background: "var(--paper-2)", borderRadius: 14,
          border: "1px solid var(--line)", marginBottom: 24,
        }}>
          <div style={{
            fontSize: 36, fontWeight: 800, letterSpacing: "-0.04em", color: "var(--ink)",
            fontFamily: "var(--font-geist-mono, monospace)", fontVariantNumeric: "tabular-nums",
          }}>
            {fmt(data.currentPrice, data.currency)}
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 4,
            fontSize: 14, fontWeight: 600,
            color: isUp ? "var(--signal-up)" : "var(--signal-down)",
            fontFamily: "var(--font-geist-mono, monospace)", fontVariantNumeric: "tabular-nums",
          }}>
            {isUp ? <TrendingUp size={14} strokeWidth={2} /> : <TrendingDown size={14} strokeWidth={2} />}
            {isUp ? "+" : ""}{fmt(data.change, data.currency)} ({isUp ? "+" : ""}{(data.changePercent * 100).toFixed(2)}%)
          </div>

          <div style={{ width: 1, background: "var(--line)", alignSelf: "stretch", margin: "0 4px" }} />

          {/* 4 inline metrics */}
          {[
            { label: "PER",        value: data.trailingPE?.toFixed(1)  ?? "—" },
            { label: "Cap. bours.", value: fmtBig(data.marketCap) },
            { label: "52S haut",   value: fmt(data.fiftyTwoWeekHigh, data.currency) },
            { label: "52S bas",    value: fmt(data.fiftyTwoWeekLow, data.currency) },
          ].map((m) => (
            <div key={m.label}>
              <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.04em" }}>{m.label}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", fontFamily: "var(--font-geist-mono, monospace)", fontVariantNumeric: "tabular-nums" }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* ── Chart + Gauge grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20, marginBottom: 28 }}>
          {/* Chart */}
          <div style={{ background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden" }}>
            <StockChart ticker={ticker} />
          </div>

          {/* Dark gauge card */}
          <div style={{
            background: "var(--ink)", borderRadius: 16, padding: "28px 24px",
            color: "#fff", border: "1px solid rgba(255,255,255,0.08)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16,
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", letterSpacing: "0.07em", marginBottom: 4 }}>
                SCORE DE VALORISATION
              </div>
              <ValuationGauge score={gaugeScore} size="md" />
            </div>

            {/* Score decomposition bars */}
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Valorisation",    pct: Math.min(100, Math.max(0, v.score + 10)) },
                { label: "Qualité",         pct: Math.min(100, Math.max(0, v.score - 5)) },
                { label: "Croissance",      pct: Math.min(100, Math.max(0, v.score + 5)) },
                { label: "Momentum",        pct: Math.min(100, Math.max(0, v.score - 15)) },
                { label: "Risque",          pct: Math.min(100, Math.max(0, 100 - v.score / 2)) },
              ].map(({ label, pct: p }) => (
                <div key={label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11 }}>
                    <span style={{ color: "rgba(255,255,255,0.55)" }}>{label}</span>
                    <span style={{ color: "rgba(255,255,255,0.80)", fontFamily: "var(--font-geist-mono, monospace)", fontVariantNumeric: "tabular-nums" }}>{p}/100</span>
                  </div>
                  <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.10)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${p}%`, borderRadius: 2,
                      background: p >= 65 ? "#6ee7b7" : p >= 40 ? "#fde68a" : "#fca5a5",
                      transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Valeur cible */}
            <div style={{
              width: "100%", paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.40)", letterSpacing: "0.04em" }}>VALEUR CIBLE</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", fontFamily: "var(--font-geist-mono, monospace)", fontVariantNumeric: "tabular-nums" }}>
                  {fmt(v.fairValue, data.currency)}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.40)", letterSpacing: "0.04em" }}>POTENTIEL</div>
                <div style={{
                  fontSize: 18, fontWeight: 700, fontFamily: "var(--font-geist-mono, monospace)", fontVariantNumeric: "tabular-nums",
                  color: v.upside > 0 ? "#6ee7b7" : "#fca5a5",
                }}>
                  {v.upside > 0 ? "+" : ""}{v.upside.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid var(--line)", paddingBottom: 0 }}>
          {TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 18px", border: "none", background: "transparent",
                fontSize: 13, fontWeight: activeTab === tab ? 700 : 500,
                color: activeTab === tab ? "var(--ink)" : "var(--muted)",
                borderBottom: activeTab === tab ? "2px solid var(--ink)" : "2px solid transparent",
                cursor: "pointer", transition: "color 0.15s",
                marginBottom: -1,
              }}
            >{tab}</button>
          ))}
        </div>

        {/* ══════════════════════════
            TAB: SYNTHÈSE
        ══════════════════════════ */}
        {activeTab === "Synthèse" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24, paddingBottom: 48 }}>

            {/* AI Analysis */}
            {loadingAI ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 20, borderRadius: 4, width: i === 2 ? "60%" : "100%" }} />)}
              </div>
            ) : ai ? (
              <div style={{ background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 16, padding: "24px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <Star size={16} strokeWidth={1.8} color="var(--accent)" />
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>Analyse IA</h2>
                  {ai.horizon && (
                    <span style={{
                      fontSize: 11, color: "var(--muted)", background: "var(--paper-3)",
                      borderRadius: 9999, padding: "2px 8px", fontWeight: 500, border: "1px solid var(--line)",
                    }}>
                      Horizon {ai.horizon}
                    </span>
                  )}
                </div>

                {/* Summary — serif italic for punchline */}
                <p style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.75, marginBottom: 16 }}>
                  {ai.summary?.split(". ").map((s, i) =>
                    i === 0 ? (
                      <em key={i} style={{ fontFamily: "var(--font-instrument, Georgia, serif)", fontStyle: "italic", fontWeight: 400, fontSize: 16 }}>
                        {s}.{" "}
                      </em>
                    ) : s
                  )}
                </p>

                {/* Price target */}
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 12,
                  padding: "10px 16px", borderRadius: 10,
                  background: "var(--paper-3)", border: "1px solid var(--line)", marginBottom: 16,
                }}>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.04em" }}>PRIX CIBLE IA</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-geist-mono, monospace)", fontVariantNumeric: "tabular-nums" }}>
                      {fmt(ai.priceTarget, data.currency)}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    [{fmt(ai.priceTargetLow, data.currency)} – {fmt(ai.priceTargetHigh, data.currency)}]
                  </div>
                  <div style={{
                    fontSize: 12, fontWeight: 700,
                    color: ai.confidence >= 70 ? "var(--signal-up)" : ai.confidence >= 50 ? "var(--warning)" : "var(--signal-down)",
                  }}>
                    {ai.confidence}% confiance
                  </div>
                </div>

                {/* Reason cards: 2 positives + 2 negatives */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {(ai.catalysts?.slice(0, 2) ?? []).map((c, i) => (
                    <div key={i} style={{
                      padding: "12px 14px", borderRadius: 10,
                      background: "rgba(45,125,90,0.06)",
                      borderLeft: "3px solid var(--signal-up)",
                      fontSize: 13, color: "var(--ink)", lineHeight: 1.5,
                    }}>
                      {c}
                    </div>
                  ))}
                  {(ai.risks?.slice(0, 2) ?? v.risks?.slice(0, 2) ?? []).map((r, i) => (
                    <div key={i} style={{
                      padding: "12px 14px", borderRadius: 10,
                      background: "rgba(184,74,58,0.06)",
                      borderLeft: "3px solid var(--signal-down)",
                      fontSize: 13, color: "var(--ink)", lineHeight: 1.5,
                    }}>
                      {r}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* strengths / risks from valuation */
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {(v.strengths ?? []).slice(0, 2).map((s, i) => (
                  <div key={i} style={{
                    padding: "14px 16px", borderRadius: 12, background: "rgba(45,125,90,0.06)",
                    borderLeft: "3px solid var(--signal-up)", fontSize: 13, color: "var(--ink)", lineHeight: 1.5,
                  }}>{s}</div>
                ))}
                {(v.risks ?? []).slice(0, 2).map((r, i) => (
                  <div key={i} style={{
                    padding: "14px 16px", borderRadius: 12, background: "rgba(184,74,58,0.06)",
                    borderLeft: "3px solid var(--signal-down)", fontSize: 13, color: "var(--ink)", lineHeight: 1.5,
                  }}>{r}</div>
                ))}
              </div>
            )}

            {/* Metrics grid — 6 columns */}
            <div style={{ background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 16, padding: "20px 24px" }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginBottom: 16 }}>Métriques clés</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
                {[
                  { label: "PER",            value: data.trailingPE?.toFixed(1) ?? "—",  sector: "~20" },
                  { label: "PEG",            value: data.trailingPE && data.revenueGrowth ? (data.trailingPE / (data.revenueGrowth * 100)).toFixed(2) : "—", sector: "~1.5" },
                  { label: "EV/EBITDA",      value: "—",                                sector: "~12" },
                  { label: "Marge nette",    value: data.operatingMargin ? pct(data.operatingMargin) : "—", sector: "~15%" },
                  { label: "ROE",            value: data.returnOnEquity ? pct(data.returnOnEquity) : "—", sector: "~15%" },
                  { label: "Dette/Cap.",     value: data.debtToEquity?.toFixed(2) ?? "—", sector: "<1" },
                ].map((m) => (
                  <div key={m.label} style={{
                    background: "#fff", borderRadius: 10, padding: "12px 10px",
                    border: "1px solid var(--line)", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.06em", marginBottom: 6 }}>{m.label}</div>
                    <div style={{
                      fontSize: 18, fontWeight: 700, color: "var(--ink)",
                      fontFamily: "var(--font-geist-mono, monospace)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em",
                    }}>{m.value}</div>
                    <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>secteur {m.sector}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            {data.description && (
              <div style={{ background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 16, padding: "20px 24px" }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginBottom: 12 }}>À propos</h3>
                <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.75 }}>{data.description}</p>
                {data.website && (
                  <a href={data.website} target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 12, fontSize: 12, color: "var(--accent)", fontWeight: 500 }}>
                    <ExternalLink size={12} /> Site officiel
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════
            TAB: VALORISATION
        ══════════════════════════ */}
        {activeTab === "Valorisation" && (
          <div style={{ paddingBottom: 48 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              {[
                { title: "PER (Price-to-Earnings)", value: data.trailingPE?.toFixed(1) ?? "—", desc: "Rapport cours/bénéfice. Plus c'est bas, moins l'action est chère relativement à ses profits.", def: "pe" },
                { title: "PER Forward", value: data.forwardPE?.toFixed(1) ?? "—", desc: "Même ratio mais basé sur les bénéfices estimés pour l'année prochaine.", def: "pe" },
                { title: "Price-to-Book", value: data.priceToBook?.toFixed(2) ?? "—", desc: "Rapport cours/valeur comptable. Un ratio <1 signifie que l'action vaut moins que ses actifs nets.", def: null },
                { title: "Rendement dividende", value: data.dividendYield ? pct(data.dividendYield) : "—", desc: "Part du cours versée en dividendes. Utile pour les investisseurs en quête de revenus réguliers.", def: null },
              ].map((m) => (
                <div key={m.title} style={{
                  background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 14, padding: "20px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{m.title}</span>
                    {m.def && (
                      <button onClick={() => { const def = GLOSSARY[m.def!]; if (def) setOpenDef(def); }}
                        style={{ fontSize: 11, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>
                        Glossaire
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-geist-mono, monospace)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.04em", marginBottom: 8 }}>
                    {m.value}
                  </div>
                  <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>{m.desc}</p>
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { section: "Valorisation", rows: [
                  { label: "Capitalisation boursière", value: fmtBig(data.marketCap) },
                  { label: "PER (trailing)", value: data.trailingPE?.toFixed(2) ?? "—" },
                  { label: "PER (forward)", value: data.forwardPE?.toFixed(2) ?? "—" },
                  { label: "Price-to-Book", value: data.priceToBook?.toFixed(2) ?? "—" },
                ]},
                { section: "Rentabilité", rows: [
                  { label: "ROE (Retour capitaux propres)", value: data.returnOnEquity ? pct(data.returnOnEquity) : "—" },
                  { label: "Marge opérationnelle", value: data.operatingMargin ? pct(data.operatingMargin) : "—" },
                  { label: "BPA (EPS)", value: data.eps?.toFixed(2) ?? "—" },
                  { label: "Croissance CA", value: data.revenueGrowth ? pct(data.revenueGrowth) : "—" },
                ]},
                { section: "Risque", rows: [
                  { label: "Bêta", value: data.beta?.toFixed(2) ?? "—" },
                  { label: "Dette / Capitaux propres", value: data.debtToEquity?.toFixed(2) ?? "—" },
                  { label: "52 sem. haut", value: fmt(data.fiftyTwoWeekHigh, data.currency) },
                  { label: "52 sem. bas", value: fmt(data.fiftyTwoWeekLow, data.currency) },
                ]},
                { section: "Général", rows: [
                  { label: "Dividende", value: data.dividendYield ? pct(data.dividendYield) : "Aucun" },
                  { label: "Effectif", value: data.employees?.toLocaleString("fr-FR") ?? "—" },
                  { label: "Secteur", value: data.sector ?? "—" },
                  { label: "Industrie", value: data.industry ?? "—" },
                ]},
              ].map(({ section, rows }) => (
                <div key={section} style={{ background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden" }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)", fontSize: 12, fontWeight: 700, color: "var(--muted)", letterSpacing: "0.05em" }}>
                    {section.toUpperCase()}
                  </div>
                  {rows.map((r, i) => (
                    <div key={r.label} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "11px 16px",
                      borderBottom: i < rows.length - 1 ? "1px solid var(--line)" : "none",
                    }}>
                      <span style={{ fontSize: 13, color: "var(--muted)" }}>{r.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", fontFamily: "var(--font-geist-mono, monospace)", fontVariantNumeric: "tabular-nums" }}>
                        {r.value}
                      </span>
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
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", lineHeight: 1.4, marginBottom: 6 }}>{n.title}</div>
                    {n.summary && <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>{n.summary}</p>}
                  </a>
                ))}
              </div>
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
