"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import SignalBadge from "@/components/SignalBadge";
import WatchlistButton from "@/components/WatchlistButton";
import StockChart from "@/components/StockChart";
import FinanceTooltip from "@/components/FinanceTooltip";
import { MetricTooltip, MetricDef } from "@/components/MetricTooltip";
import { GlossaryDrawer } from "@/components/GlossaryDrawer";
import { GLOSSARY } from "@/lib/glossary";

interface NewsItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  summary: string;
}

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

function fmt(n: number, currency: string, decimals = 2) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(n);
}

function fmtBig(n: number) {
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)} T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} Md`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)} M`;
  return n.toLocaleString("fr-FR");
}

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "à l'instant";
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

function MetricRow({
  label,
  value,
  tooltip,
}: {
  label: string;
  value: string;
  tooltip?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
        {tooltip ? (
          <FinanceTooltip term={tooltip}>{label}</FinanceTooltip>
        ) : (
          label
        )}
      </span>
      <span style={{ fontSize: 14, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

export default function StockPage() {
  const params = useParams();
  const ticker = (params.ticker as string).toUpperCase();

  const [data, setData] = useState<StockData | null>(null);
  const [ai, setAI] = useState<AIAnalysis | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [openDef, setOpenDef] = useState<MetricDef | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/stock/${ticker}`)
      .then((r) => {
        if (!r.ok) throw new Error("Stock not found");
        return r.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
        // Load AI analysis after main data
        setLoadingAI(true);
        fetch(`/api/stock/${ticker}/analyze`)
          .then((r) => r.json())
          .then((a) => {
            if (!a.error) setAI(a);
          })
          .finally(() => setLoadingAI(false));
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [ticker]);

  useEffect(() => {
    fetch(`/api/stock/${ticker}/news`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setNews(d); })
      .catch(() => {});
  }, [ticker]);

  if (loading) {
    return (
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 200, borderRadius: 16 }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ maxWidth: 600, margin: "80px auto", padding: "0 24px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Action introuvable</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
          Le symbole « {ticker} » n'a pas été trouvé. Vérifiez le nom ou cherchez via la barre de recherche.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            padding: "10px 24px",
            borderRadius: 10,
            background: "var(--cta-bg)",
            color: "var(--cta-text)",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  const isUp = data.change >= 0;
  const v = data.valuation;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, fontSize: 13, color: "var(--text-muted)" }}>
        <Link href="/" style={{ color: "var(--text-muted)" }}>Accueil</Link>
        <span>/</span>
        <span style={{ color: "var(--text-secondary)" }}>{data.sector}</span>
        <span>/</span>
        <span style={{ color: "var(--text-primary)" }}>{ticker}</span>
      </div>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        flexWrap: "wrap", gap: 16, marginBottom: 32,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: "linear-gradient(135deg, rgba(59,123,255,0.2), rgba(123,90,255,0.2))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 800, color: "var(--accent-blue)",
          }}>
            {ticker.slice(0, 2)}
          </div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px" }}>{data.name}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{ticker}</span>
              <span style={{ color: "var(--text-muted)" }}>·</span>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{data.sector}</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <WatchlistButton symbol={ticker} name={data.name} />
          <SignalBadge signal={v.signal} size="md" />
        </div>
      </div>

      {/* Price + Fair Value */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
        {/* Current price */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>Prix actuel</div>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-1px" }}>
            {fmt(data.currentPrice, data.currency)}
          </div>
          <div style={{ fontSize: 14, color: isUp ? "var(--accent-green)" : "var(--accent-red)", marginTop: 4, fontWeight: 500 }}>
            {isUp ? "+" : ""}{fmt(data.change, data.currency)} ({isUp ? "+" : ""}{(data.changePercent * 100).toFixed(2)}%) aujourd'hui
          </div>
        </div>

        {/* Fair Value */}
        <div className="card" style={{ padding: 24, position: "relative", overflow: "hidden" }}>
          <div style={{
            position: "absolute", inset: 0,
            background: v.upside > 0
              ? "radial-gradient(ellipse at top right, rgba(134,239,172,0.05) 0%, transparent 60%)"
              : "radial-gradient(ellipse at top right, rgba(252,165,165,0.05) 0%, transparent 60%)",
            pointerEvents: "none",
          }} />
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
            <FinanceTooltip term="Valeur intrinsèque">Valeur cible estimée</FinanceTooltip>
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-1px" }}>
            {fmt(v.fairValue, data.currency)}
          </div>
          <div style={{
            fontSize: 14,
            color: v.upside > 0 ? "var(--accent-green)" : "var(--accent-red)",
            marginTop: 4, fontWeight: 600,
          }}>
            {v.upside > 0 ? "▲" : "▼"} {Math.abs(v.upside)}% de {v.upside > 0 ? "potentiel" : "risque"}
          </div>
        </div>

        {/* Score */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>Score global</div>
          <div style={{ position: "relative", width: 100, height: 100, margin: "0 auto" }}>
            <svg viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="40" fill="none"
                stroke={v.score >= 65 ? "#86efac" : v.score >= 40 ? "#fcd34d" : "#fca5a5"}
                strokeWidth="8"
                strokeDasharray={`${(v.score / 100) * 251} 251`}
                strokeLinecap="round"
                style={{ transition: "stroke-dasharray 1s ease" }}
              />
            </svg>
            <div style={{
              position: "absolute", inset: 0, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 22, fontWeight: 800 }}>{v.score}</span>
              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>/100</span>
            </div>
          </div>
        </div>

        {/* 52 weeks */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
            <FinanceTooltip term="52 semaines">Fourchette 52 semaines</FinanceTooltip>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: "var(--accent-red)" }}>
              {fmt(data.fiftyTwoWeekLow, data.currency)}
            </span>
            <span style={{ fontSize: 13, color: "var(--accent-green)" }}>
              {fmt(data.fiftyTwoWeekHigh, data.currency)}
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", position: "relative" }}>
            {data.fiftyTwoWeekHigh > data.fiftyTwoWeekLow && (
              <>
                <div style={{
                  position: "absolute", height: "100%", borderRadius: 3,
                  background: "linear-gradient(90deg, var(--accent-red), var(--accent-green))",
                  width: `${((data.currentPrice - data.fiftyTwoWeekLow) / (data.fiftyTwoWeekHigh - data.fiftyTwoWeekLow)) * 100}%`,
                }} />
                <div style={{
                  position: "absolute",
                  left: `${((data.currentPrice - data.fiftyTwoWeekLow) / (data.fiftyTwoWeekHigh - data.fiftyTwoWeekLow)) * 100}%`,
                  top: "50%", transform: "translate(-50%, -50%)",
                  width: 10, height: 10, borderRadius: "50%",
                  background: "#fff", border: "2px solid var(--bg-primary)",
                }} />
              </>
            )}
          </div>
          <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-secondary)", marginTop: 8 }}>
            Actuel : {fmt(data.currentPrice, data.currency)}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ marginBottom: 24 }}>
        <StockChart ticker={ticker} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
        {/* AI Analysis */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "var(--cta-bg)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
            }}>
              ✨
            </div>
            <h2 style={{ fontSize: 15, fontWeight: 700 }}>Analyse IA</h2>
          </div>

          {loadingAI ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 16, borderRadius: 4, width: i === 2 ? "60%" : "100%" }} />
              ))}
            </div>
          ) : ai ? (
            <div>
              {/* Recommendation */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 16, padding: "12px 16px", borderRadius: 12,
                background: ai.recommendation === "ACHETER"
                  ? "rgba(134,239,172,0.08)"
                  : ai.recommendation === "VENDRE"
                  ? "rgba(252,165,165,0.08)"
                  : "rgba(251,191,36,0.08)",
              }}>
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Recommandation</div>
                  <div style={{
                    fontSize: 20, fontWeight: 800,
                    color: ai.recommendation === "ACHETER" ? "var(--accent-green)"
                      : ai.recommendation === "VENDRE" ? "var(--accent-red)"
                      : "#fcd34d",
                  }}>
                    {ai.recommendation}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Confiance</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{ai.confidence}%</div>
                </div>
              </div>

              {/* Price target */}
              <div style={{ marginBottom: 16, padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>Prix cible IA</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 22, fontWeight: 700 }}>{fmt(ai.priceTarget, data.currency)}</span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    [{fmt(ai.priceTargetLow, data.currency)} – {fmt(ai.priceTargetHigh, data.currency)}]
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>{ai.horizon}</div>
              </div>

              {/* Summary */}
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text-secondary)", marginBottom: 16 }}>
                {ai.summary}
              </p>

              {/* Catalysts */}
              {ai.catalysts?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-green)", marginBottom: 8 }}>
                    ▲ Catalyseurs
                  </div>
                  {ai.catalysts.map((c, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--text-secondary)", marginBottom: 6 }}>
                      <span style={{ color: "var(--accent-green)", flexShrink: 0 }}>+</span>
                      {c}
                    </div>
                  ))}
                </div>
              )}

              {/* AI Risks */}
              {ai.risks?.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-red)", marginBottom: 8 }}>
                    ▼ Risques
                  </div>
                  {ai.risks.map((r, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--text-secondary)", marginBottom: 6 }}>
                      <span style={{ color: "var(--accent-red)", flexShrink: 0 }}>−</span>
                      {r}
                    </div>
                  ))}
                </div>
              )}

              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 16, lineHeight: 1.5 }}>
                {ai.disclaimer}
              </p>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: 13 }}>
              Analyse IA non disponible (clé API requise)
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Valuation strengths/risks */}
          {(v.strengths.length > 0 || v.risks.length > 0) && (
            <div className="card" style={{ padding: 24 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Points clés</h2>
              {v.strengths.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, fontSize: 13, alignItems: "flex-start" }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: 4, background: "rgba(134,239,172,0.12)",
                    color: "var(--accent-green)", display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, fontSize: 10, fontWeight: 700,
                  }}>✓</span>
                  <span style={{ color: "var(--text-secondary)" }}>{s}</span>
                </div>
              ))}
              {v.risks.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, fontSize: 13, alignItems: "flex-start" }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: 4, background: "rgba(252,165,165,0.12)",
                    color: "var(--accent-red)", display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, fontSize: 10, fontWeight: 700,
                  }}>!</span>
                  <span style={{ color: "var(--text-secondary)" }}>{r}</span>
                </div>
              ))}
            </div>
          )}

          {/* Financial Metrics */}
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Indicateurs financiers</h2>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>Survolez pour les explications</p>

            {/* MetricTooltip grid — métriques clés */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
              <MetricTooltip
                label="P/E"
                value={data.trailingPE > 0 ? data.trailingPE.toFixed(1) : "N/A"}
                contextText={
                  data.trailingPE <= 0 ? undefined
                  : data.trailingPE < 15 ? "Bon marché"
                  : data.trailingPE < 25 ? "Dans la moyenne"
                  : "Au-dessus de la moyenne"
                }
                contextColor={
                  data.trailingPE <= 0 ? undefined
                  : data.trailingPE < 15 ? "green"
                  : data.trailingPE < 25 ? "yellow"
                  : "red"
                }
                def={{
                  ...GLOSSARY.pe,
                  currentPosition:
                    data.trailingPE <= 0 ? 2
                    : data.trailingPE < 10 ? 0
                    : data.trailingPE < 18 ? 1
                    : data.trailingPE < 25 ? 2
                    : data.trailingPE < 35 ? 3
                    : 4,
                }}
                onOpenGlossary={setOpenDef}
              />
              <MetricTooltip
                label="DCF"
                value={v.upside > 0 ? `+${v.upside}%` : `${v.upside}%`}
                contextText={
                  v.upside > 15 ? "Nettement sous-évalué"
                  : v.upside > 5 ? "Légèrement sous-évalué"
                  : v.upside > -5 ? "Prix juste"
                  : v.upside > -15 ? "Légèrement surévalué"
                  : "Nettement surévalué"
                }
                contextColor={v.upside > 5 ? "green" : v.upside > -5 ? "yellow" : "red"}
                def={{
                  ...GLOSSARY.dcf,
                  currentPosition:
                    v.upside > 15 ? 0
                    : v.upside > 5 ? 1
                    : v.upside > -5 ? 2
                    : v.upside > -15 ? 3
                    : 4,
                }}
                onOpenGlossary={setOpenDef}
              />
              <MetricTooltip
                label="ROE"
                value={data.returnOnEquity > 0 ? pct(data.returnOnEquity) : "N/A"}
                contextText={
                  data.returnOnEquity <= 0 ? undefined
                  : data.returnOnEquity > 0.20 ? "Très bon"
                  : data.returnOnEquity > 0.10 ? "Correct"
                  : "Faible"
                }
                contextColor={
                  data.returnOnEquity <= 0 ? undefined
                  : data.returnOnEquity > 0.20 ? "green"
                  : data.returnOnEquity > 0.10 ? "yellow"
                  : "red"
                }
                def={{
                  ...GLOSSARY.roe,
                  currentPosition:
                    data.returnOnEquity <= 0 ? 1
                    : data.returnOnEquity > 0.25 ? 4
                    : data.returnOnEquity > 0.15 ? 3
                    : data.returnOnEquity > 0.10 ? 2
                    : data.returnOnEquity > 0.05 ? 1
                    : 0,
                }}
                onOpenGlossary={setOpenDef}
              />
              <MetricTooltip
                label="Beta"
                value={data.beta.toFixed(2)}
                contextText={
                  data.beta < 0.5 ? "Très stable"
                  : data.beta < 1.0 ? "Stable"
                  : data.beta < 1.5 ? "Marché"
                  : "Volatil"
                }
                contextColor={
                  data.beta < 0.5 ? "green"
                  : data.beta < 1.0 ? "green"
                  : data.beta < 1.5 ? "yellow"
                  : "red"
                }
                def={{
                  ...GLOSSARY.beta,
                  currentPosition:
                    data.beta < 0.5 ? 0
                    : data.beta < 0.8 ? 1
                    : data.beta < 1.2 ? 2
                    : data.beta < 1.5 ? 3
                    : 4,
                }}
                onOpenGlossary={setOpenDef}
              />
            </div>

            {/* Reste des métriques en liste */}
            <MetricRow label="P/E prévisionnel" value={data.forwardPE > 0 ? data.forwardPE.toFixed(1) : "N/A"} />
            <MetricRow label="BPA" value={data.eps > 0 ? fmt(data.eps, data.currency) : "N/A"} tooltip="EPS" />
            <MetricRow label="Marge opérat." value={data.operatingMargin !== 0 ? pct(data.operatingMargin) : "N/A"} tooltip="Marge opérationnelle" />
            <MetricRow label="Croissance CA" value={data.revenueGrowth !== 0 ? pct(data.revenueGrowth) : "N/A"} />
            <MetricRow label="Dette/Fonds propres" value={data.debtToEquity > 0 ? data.debtToEquity.toFixed(2) : "N/A"} tooltip="Dette/Capitaux propres" />
            <MetricRow label="Prix/Valeur comptable" value={data.priceToBook > 0 ? data.priceToBook.toFixed(2) : "N/A"} />
            <MetricRow label="Dividende" value={data.dividendYield > 0 ? pct(data.dividendYield) : "Aucun"} tooltip="Dividende" />
            <MetricRow label="Capitalisation" value={data.marketCap > 0 ? fmtBig(data.marketCap) : "N/A"} tooltip="Capitalisation" />
          </div>

          {/* Company info */}
          {data.description && (
            <div className="card" style={{ padding: 24 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>À propos</h2>
              <p style={{
                fontSize: 13, lineHeight: 1.7, color: "var(--text-secondary)",
                display: "-webkit-box", WebkitLineClamp: 6, WebkitBoxOrient: "vertical", overflow: "hidden",
              }}>
                {data.description}
              </p>
              {data.employees > 0 && (
                <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>
                  👥 {data.employees.toLocaleString("fr-FR")} employés
                  {data.website && (
                    <> · <a href={data.website} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-blue)" }}>
                      Site web ↗
                    </a></>
                  )}
                </div>
              )}
            </div>
          )}

          {/* News */}
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📰 Actualités récentes</h2>
            {news.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Aucune actualité disponible</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {news.slice(0, 5).map((item, i) => (
                  <div key={i} style={{ borderBottom: i < Math.min(news.length, 5) - 1 ? "1px solid var(--border)" : "none", paddingBottom: i < Math.min(news.length, 5) - 1 ? 16 : 0 }}>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", textDecoration: "none", lineHeight: 1.5, display: "block", marginBottom: 4 }}
                    >
                      {item.title}
                    </a>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {item.source} · {timeAgo(item.publishedAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <GlossaryDrawer def={openDef} onClose={() => setOpenDef(null)} />
    </div>
  );
}
