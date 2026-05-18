"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import ScenarioAnalysis from "@/components/ScenarioAnalysis";

interface Holding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  avg_price: number;
  currency: string;
  asset_type: string;
}

interface EnrichedHolding extends Holding {
  currentPrice: number;
  pnl: number;
  pnlPct: number;
  marketValue: number;
  sector: string;
}

interface HistoryPoint { date: string; value: number; cost: number; }

interface PortfolioAnalysis {
  summary: string;
  globalScore: number;
  diversification: string;
  mainRisk: string;
  recommendations: { type: string; symbol: string; reason: string }[];
  missingExposures: string[];
  strengths: string[];
  disclaimer: string;
}

const PERIODS = ["1mo", "3mo", "6mo", "1y"] as const;
const PERIOD_LABELS: Record<string, string> = { "1mo": "1M", "3mo": "3M", "6mo": "6M", "1y": "1A" };
const REC_COLORS: Record<string, string> = {
  RENFORCER: "var(--accent-green)", CONSERVER: "#fcd34d",
  ALLÉGER: "#f97316", VENDRE: "var(--accent-red)",
};

const CHART_COLORS = [
  "#3b7bff", "#7b5aff", "#86efac", "#fcd34d", "#f97316",
  "#ef4444", "#06b6d4", "#ec4899", "#a3e635", "#f59e0b",
];

function fmt(n: number, currency = "USD") {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
}

function fmtDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function fmtShort(n: number) {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return n.toFixed(0);
}

export default function PortfolioPage() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [enriched, setEnriched] = useState<EnrichedHolding[]>([]);
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [totals, setTotals] = useState({ value: 0, cost: 0, pnl: 0 });
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [period, setPeriod] = useState<typeof PERIODS[number]>("3mo");
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Add form
  const [addSymbol, setAddSymbol] = useState("");
  const [addName, setAddName] = useState("");
  const [addQty, setAddQty] = useState("");
  const [addPRU, setAddPRU] = useState("");
  const [addCurrency, setAddCurrency] = useState("USD");
  const [addType, setAddType] = useState("stock");
  const [addLoading, setAddLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const loadHoldings = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/portfolio");
    const data = await res.json();
    setHoldings(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { loadHoldings(); }, [loadHoldings]);

  // Enrich with current prices
  useEffect(() => {
    if (!holdings.length) { setEnriched([]); setTotals({ value: 0, cost: 0, pnl: 0 }); return; }
    Promise.allSettled(
      holdings.map(async (h) => {
        const res = await fetch(`/api/stock/${h.symbol}`);
        if (!res.ok) return { ...h, currentPrice: h.avg_price, pnl: 0, pnlPct: 0, marketValue: h.avg_price * h.quantity, sector: "N/A" };
        const d = await res.json();
        const cp = d.currentPrice ?? h.avg_price;
        return { ...h, currentPrice: cp, pnl: (cp - h.avg_price) * h.quantity, pnlPct: ((cp - h.avg_price) / h.avg_price) * 100, marketValue: cp * h.quantity, sector: d.sector ?? "N/A" };
      })
    ).then((results) => {
      const ok = results.filter((r): r is PromiseFulfilledResult<EnrichedHolding> => r.status === "fulfilled").map((r) => r.value);
      setEnriched(ok);
      setTotals({ value: ok.reduce((s, p) => s + p.marketValue, 0), cost: ok.reduce((s, p) => s + p.avg_price * p.quantity, 0), pnl: ok.reduce((s, p) => s + p.pnl, 0) });
    });
  }, [holdings]);

  // Load history chart
  const loadHistory = useCallback(async (p: string) => {
    if (!holdings.length) return;
    setHistoryLoading(true);
    const res = await fetch("/api/portfolio/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ holdings: holdings.map((h) => ({ symbol: h.symbol, quantity: h.quantity, avg_price: h.avg_price })), period: p }),
    });
    const data = await res.json();
    setHistory(Array.isArray(data) ? data : []);
    setHistoryLoading(false);
  }, [holdings]);

  useEffect(() => { if (holdings.length) loadHistory(period); }, [holdings, period, loadHistory]);

  const resolveSymbol = async (sym: string) => {
    if (!sym || sym.length < 1) return;
    setResolving(true);
    setResolveError(null);
    try {
      const res = await fetch(`/api/stock/${sym.toUpperCase()}`);
      if (!res.ok) { setResolveError("Symbole introuvable"); setResolving(false); return; }
      const d = await res.json();
      if (d.name) setAddName(d.name);
      if (d.currency) setAddCurrency(d.currency);
      if (d.quoteType) {
        const qt = String(d.quoteType).toUpperCase();
        if (qt === "ETF" || qt === "MUTUALFUND") setAddType("etf");
        else setAddType("stock");
      }
    } catch {
      setResolveError("Erreur de résolution");
    }
    setResolving(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addSymbol || !addQty || !addPRU) return;
    setAddLoading(true);
    await fetch("/api/portfolio", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol: addSymbol.toUpperCase(), name: addName || addSymbol.toUpperCase(), quantity: parseFloat(addQty), avg_price: parseFloat(addPRU), currency: addCurrency, asset_type: addType }),
    });
    setShowAdd(false);
    setAddSymbol(""); setAddName(""); setAddQty(""); setAddPRU("");
    setAddType("stock"); setAddCurrency("USD");
    setResolveError(null);
    setAddLoading(false);
    setAnalysis(null);
    loadHoldings();
  };

  const handleDelete = async (id: string) => {
    await fetch("/api/portfolio", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setAnalysis(null);
    loadHoldings();
  };

  const handleAnalyze = async () => {
    if (!enriched.length) return;
    setAnalyzing(true);
    const res = await fetch("/api/portfolio/analyze", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ holdings: enriched }),
    });
    const data = await res.json();
    if (data.analysis) setAnalysis(data.analysis);
    setAnalyzing(false);
  };

  const totalPct = totals.cost > 0 ? (totals.pnl / totals.cost) * 100 : 0;
  const isUp = totals.pnl >= 0;

  // Chart performance over selected period
  const chartPerf = history.length >= 2
    ? ((history[history.length - 1].value - history[0].value) / history[0].value) * 100
    : null;
  const chartPerfUp = chartPerf == null || chartPerf >= 0;

  // Allocation donut data
  const totalVal = enriched.reduce((s, h) => s + h.marketValue, 0);
  const allocData = enriched
    .map((h, i) => ({ symbol: h.symbol, name: h.name, pct: totalVal > 0 ? (h.marketValue / totalVal) * 100 : 0, color: CHART_COLORS[i % CHART_COLORS.length], value: h.marketValue, currency: h.currency }))
    .sort((a, b) => b.pct - a.pct);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 6 }}>Mon Portefeuille</h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>{holdings.length} position{holdings.length !== 1 ? "s" : ""}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleAnalyze} disabled={analyzing || !enriched.length} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 10,
            background: "linear-gradient(135deg, #3b7bff, #7b5aff)", border: "none",
            color: "#fff", fontSize: 14, fontWeight: 600, cursor: analyzing || !enriched.length ? "not-allowed" : "pointer",
            opacity: !enriched.length ? 0.4 : 1,
          }}>
            <span>✨</span>{analyzing ? "Analyse…" : "Analyser avec l'IA"}
          </button>
          <button onClick={() => setShowAdd(true)} style={{
            padding: "10px 18px", borderRadius: 10, border: "1px solid var(--border)",
            background: "var(--bg-card)", color: "var(--text-primary)", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>+ Ajouter</button>
        </div>
      </div>

      {/* ── Summary cards ── */}
      {enriched.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
          {[
            { label: "Valeur totale", value: fmt(totals.value), color: "var(--text-primary)" },
            { label: "Investi", value: fmt(totals.cost), color: "var(--text-secondary)" },
            { label: "Plus/Moins-value", value: `${isUp ? "+" : ""}${fmt(totals.pnl)}`, color: isUp ? "var(--accent-green)" : "var(--accent-red)" },
            { label: "Performance globale", value: `${isUp ? "+" : ""}${totalPct.toFixed(2)}%`, color: isUp ? "var(--accent-green)" : "var(--accent-red)" },
          ].map((card) => (
            <div key={card.label} className="card" style={{ padding: "18px 20px" }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>{card.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: card.color }}>{card.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Charts row ── */}
      {enriched.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, marginBottom: 28 }}>

          {/* Evolution chart */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>Évolution du portefeuille</div>
                {chartPerf != null && (
                  <div style={{ fontSize: 22, fontWeight: 800, color: chartPerfUp ? "var(--accent-green)" : "var(--accent-red)" }}>
                    {chartPerfUp ? "+" : ""}{chartPerf.toFixed(2)}%
                    <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 8, fontWeight: 400 }}>sur la période</span>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {PERIODS.map((p) => (
                  <button key={p} onClick={() => setPeriod(p)} style={{
                    padding: "5px 10px", borderRadius: 7, fontSize: 12, fontWeight: 600,
                    border: `1px solid ${period === p ? "rgba(59,123,255,0.5)" : "var(--border)"}`,
                    background: period === p ? "rgba(59,123,255,0.12)" : "transparent",
                    color: period === p ? "var(--accent-blue)" : "var(--text-muted)",
                    cursor: "pointer",
                  }}>{PERIOD_LABELS[p]}</button>
                ))}
              </div>
            </div>

            {historyLoading ? (
              <div className="skeleton" style={{ height: 180, borderRadius: 8 }} />
            ) : history.length > 1 ? (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={history} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="valueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartPerfUp ? "#86efac" : "#fca5a5"} stopOpacity={0.18} />
                      <stop offset="95%" stopColor={chartPerfUp ? "#86efac" : "#fca5a5"} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b7bff" stopOpacity={0.08} />
                      <stop offset="95%" stopColor="#3b7bff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                    axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tickFormatter={(v) => fmtShort(v)} tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                    axisLine={false} tickLine={false} width={44} />
                  <Tooltip
                    contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "var(--text-muted)", marginBottom: 4 }}
                    labelFormatter={(label: unknown) => fmtDate(String(label))}
                    formatter={(value: unknown, name: unknown) => [
                      `${fmtShort(Number(value))} €`,
                      name === "value" ? "Valeur" : "Investi",
                    ]}
                  />
                  <Area type="monotone" dataKey="cost" stroke="#3b7bff" strokeWidth={1.5}
                    strokeDasharray="4 4" fill="url(#costGrad)" dot={false} />
                  <Area type="monotone" dataKey="value" stroke={chartPerfUp ? "#86efac" : "#fca5a5"}
                    strokeWidth={2} fill="url(#valueGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 13 }}>
                Données insuffisantes pour la période sélectionnée
              </div>
            )}
          </div>

          {/* Allocation donut */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>Répartition actuelle</div>
            <DonutChart data={allocData} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
              {allocData.map((a) => (
                <div key={a.symbol} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: a.color, flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name || a.symbol}</span>
                      <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{a.symbol}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)", flexShrink: 0 }}>{a.pct.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Add modal ── */}
      {showAdd && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        }} onClick={(e) => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div className="card" style={{ width: "100%", maxWidth: 440, padding: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Ajouter une position</h2>
            <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Symbole avec auto-résolution */}
              <div>
                <label style={labelStyle}>Symbole *</label>
                <div style={{ position: "relative" }}>
                  <input
                    value={addSymbol}
                    onChange={(e) => { setAddSymbol(e.target.value.toUpperCase()); setResolveError(null); }}
                    onBlur={(e) => resolveSymbol(e.target.value)}
                    required
                    placeholder="AAPL, IWDA.AS, CW8.PA…"
                    style={{ ...inputStyle, paddingRight: 36 }}
                  />
                  {resolving && (
                    <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--text-muted)" }}>⏳</div>
                  )}
                </div>
                {resolveError && <div style={{ fontSize: 11, color: "var(--accent-red)", marginTop: 4 }}>{resolveError} — vérifiez le symbole Yahoo Finance</div>}
              </div>

              {/* Type — mis en avant */}
              <div>
                <label style={labelStyle}>Type d'actif</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[
                    { value: "stock", label: "📈 Action" },
                    { value: "etf",   label: "🗂 ETF" },
                    { value: "crypto", label: "₿ Crypto" },
                  ].map((opt) => (
                    <button key={opt.value} type="button" onClick={() => setAddType(opt.value)} style={{
                      flex: 1, padding: "9px 8px", borderRadius: 9, border: `1px solid ${addType === opt.value ? "rgba(59,123,255,0.5)" : "var(--border)"}`,
                      background: addType === opt.value ? "rgba(59,123,255,0.12)" : "rgba(255,255,255,0.03)",
                      color: addType === opt.value ? "var(--accent-blue)" : "var(--text-secondary)",
                      fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                    }}>{opt.label}</button>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Nom {resolving ? <span style={{ color: "var(--text-muted)" }}>(chargement…)</span> : "(auto-rempli ou manuel)"}</label>
                <input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="iShares Core MSCI World…" style={inputStyle} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Quantité *</label>
                  <input type="number" value={addQty} onChange={(e) => setAddQty(e.target.value)} required placeholder="10" min="0" step="any" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>PRU * (prix moyen)</label>
                  <input type="number" value={addPRU} onChange={(e) => setAddPRU(e.target.value)} required placeholder="150.00" min="0" step="any" style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Devise</label>
                <select value={addCurrency} onChange={(e) => setAddCurrency(e.target.value)} style={{ ...inputStyle, appearance: "none" }}>
                  {["USD", "EUR", "GBP", "CHF", "JPY"].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                <button type="button" onClick={() => { setShowAdd(false); setAddSymbol(""); setAddName(""); setAddQty(""); setAddPRU(""); setAddType("stock"); setAddCurrency("USD"); setResolveError(null); }} style={{
                  flex: 1, padding: "12px", borderRadius: 10, border: "1px solid var(--border)",
                  background: "transparent", color: "var(--text-secondary)", fontSize: 14, cursor: "pointer",
                }}>Annuler</button>
                <button type="submit" disabled={addLoading} style={{
                  flex: 2, padding: "12px", borderRadius: 10, border: "none",
                  background: "linear-gradient(135deg, #3b7bff, #7b5aff)",
                  color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}>{addLoading ? "Ajout…" : "Ajouter la position"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Holdings table ── */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 68, borderRadius: 12 }} />)}
        </div>
      ) : holdings.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 24px", border: "1px dashed var(--border)", borderRadius: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📈</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Portefeuille vide</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>Ajoutez vos premières positions pour suivre vos performances.</p>
          <button onClick={() => setShowAdd(true)} style={{
            padding: "12px 28px", borderRadius: 10, border: "none",
            background: "linear-gradient(135deg, #3b7bff, #7b5aff)",
            color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>+ Ajouter une position</button>
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden", marginBottom: 28 }}>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 80px 90px 90px 100px 100px 36px",
            padding: "12px 20px", borderBottom: "1px solid var(--border)",
            fontSize: 11, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase",
          }}>
            <span>Actif</span><span style={{ textAlign: "right" }}>Qté</span>
            <span style={{ textAlign: "right" }}>PRU</span><span style={{ textAlign: "right" }}>Cours</span>
            <span style={{ textAlign: "right" }}>Valeur</span><span style={{ textAlign: "right" }}>P&L</span>
            <span />
          </div>
          {enriched.map((h, i) => {
            const isPos = h.pnl >= 0;
            return (
              <div key={h.id} style={{
                display: "grid", gridTemplateColumns: "1fr 80px 90px 90px 100px 100px 36px",
                padding: "14px 20px", alignItems: "center",
                borderBottom: i < enriched.length - 1 ? "1px solid var(--border)" : "none",
                transition: "background 0.15s",
              }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                    background: h.asset_type === "etf" ? "rgba(123,90,255,0.15)" : "rgba(59,123,255,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 700,
                    color: h.asset_type === "etf" ? "var(--accent-purple)" : "var(--accent-blue)",
                  }}>{h.symbol.slice(0, 3)}</div>
                  <div>
                    <Link href={`/stock/${h.symbol}`} style={{ fontWeight: 600, fontSize: 14 }}>{h.name}</Link>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
                      <span style={{ fontSize: 11, color: "var(--text-muted)", background: "rgba(255,255,255,0.05)", padding: "1px 6px", borderRadius: 4 }}>{h.symbol}</span>
                      {" · "}{h.asset_type === "etf" ? "ETF" : "Action"} · {h.currency}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right", fontSize: 13 }}>{h.quantity}</div>
                <div style={{ textAlign: "right", fontSize: 13 }}>{h.avg_price.toFixed(2)}</div>
                <div style={{ textAlign: "right", fontSize: 13, fontWeight: 600 }}>{h.currentPrice.toFixed(2)}</div>
                <div style={{ textAlign: "right", fontSize: 13, fontWeight: 600 }}>{fmt(h.marketValue, h.currency)}</div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isPos ? "var(--accent-green)" : "var(--accent-red)" }}>
                    {isPos ? "+" : ""}{h.pnlPct.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: 11, color: isPos ? "var(--accent-green)" : "var(--accent-red)" }}>
                    {isPos ? "+" : ""}{h.pnl.toFixed(0)} {h.currency}
                  </div>
                </div>
                <button onClick={() => handleDelete(h.id)} style={{
                  width: 28, height: 28, borderRadius: 7, border: "none",
                  background: "rgba(252,165,165,0.1)", color: "var(--accent-red)",
                  cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                }}>×</button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Scenario Analysis ── */}
      {enriched.length > 0 && (
        <ScenarioAnalysis
          positions={enriched.map((h) => ({
            symbol: h.symbol,
            name: h.name,
            marketValue: h.marketValue,
            asset_type: h.asset_type,
            beta: undefined,
            sector: h.sector,
          }))}
          totalValue={totals.value}
          monthlyContribution={0}
        />
      )}

      {/* ── AI Analysis ── */}
      {analysis && (
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg, #3b7bff, #7b5aff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>✨</div>
            <h2 style={{ fontSize: 17, fontWeight: 700 }}>Analyse IA du portefeuille</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 20, marginBottom: 24, alignItems: "center" }}>
            <div style={{ position: "relative", width: 80, height: 80 }}>
              <svg viewBox="0 0 80 80" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
                <circle cx="40" cy="40" r="32" fill="none"
                  stroke={analysis.globalScore >= 65 ? "#86efac" : analysis.globalScore >= 40 ? "#fcd34d" : "#fca5a5"}
                  strokeWidth="7" strokeDasharray={`${(analysis.globalScore / 100) * 201} 201`} strokeLinecap="round" />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 18, fontWeight: 800 }}>{analysis.globalScore}</span>
                <span style={{ fontSize: 9, color: "var(--text-muted)" }}>/100</span>
              </div>
            </div>
            <div>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text-secondary)", marginBottom: 8 }}>{analysis.summary}</p>
              <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, background: "rgba(59,123,255,0.1)", color: "var(--accent-blue)" }}>
                Diversification : {analysis.diversification}
              </span>
            </div>
          </div>
          {analysis.recommendations?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>Recommandations</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {analysis.recommendations.map((r, i) => {
                  const holding = enriched.find(h => h.symbol === r.symbol);
                  const displayName = holding?.name && holding.name !== r.symbol ? holding.name : r.symbol;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                      <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: `${REC_COLORS[r.type]}20`, color: REC_COLORS[r.type], flexShrink: 0 }}>{r.type}</span>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{displayName}</span>
                        {holding?.name && holding.name !== r.symbol && <span style={{ fontSize: 11, color: "var(--text-muted)", background: "rgba(255,255,255,0.05)", padding: "1px 5px", borderRadius: 4, marginLeft: 6 }}>{r.symbol}</span>}
                        <span style={{ fontSize: 13, color: "var(--text-secondary)", marginLeft: 6 }}>{r.reason}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {analysis.strengths?.length > 0 && (
              <div>
                <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-green)", marginBottom: 8 }}>▲ Points forts</h3>
                {analysis.strengths.map((s, i) => (
                  <div key={i} style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 5, display: "flex", gap: 6 }}>
                    <span style={{ color: "var(--accent-green)" }}>✓</span>{s}
                  </div>
                ))}
              </div>
            )}
            {analysis.missingExposures?.length > 0 && (
              <div>
                <h3 style={{ fontSize: 12, fontWeight: 600, color: "#fcd34d", marginBottom: 8 }}>◎ Expositions manquantes</h3>
                {analysis.missingExposures.map((s, i) => (
                  <div key={i} style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 5, display: "flex", gap: 6 }}>
                    <span style={{ color: "#fcd34d" }}>+</span>{s}
                  </div>
                ))}
              </div>
            )}
          </div>
          {analysis.mainRisk && (
            <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, background: "rgba(252,165,165,0.06)", border: "1px solid rgba(252,165,165,0.15)" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-red)" }}>⚠ Risque principal : </span>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{analysis.mainRisk}</span>
            </div>
          )}
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 16 }}>{analysis.disclaimer}</p>
        </div>
      )}
    </div>
  );
}

/* ── Donut chart ── */
function DonutChart({ data }: { data: { symbol: string; pct: number; color: string }[] }) {
  const size = 120;
  const r = 46;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  let cumulative = 0;
  const slices = data.map((d) => {
    const offset = circ * (1 - cumulative / 100);
    const dash = (d.pct / 100) * circ;
    cumulative += d.pct;
    return { ...d, offset, dash };
  });

  return (
    <svg width={size} height={size} style={{ display: "block", margin: "0 auto" }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="18" />
      {slices.map((s, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none"
          stroke={s.color} strokeWidth="18"
          strokeDasharray={`${s.dash} ${circ - s.dash}`}
          strokeDashoffset={s.offset}
          style={{ transform: "rotate(-90deg)", transformOrigin: `${cx}px ${cy}px`, transition: "stroke-dasharray 0.5s ease" }}
        />
      ))}
      <text x={cx} y={cy - 4} textAnchor="middle" style={{ fontSize: 11, fill: "var(--text-muted)" }}>Total</text>
      <text x={cx} y={cy + 12} textAnchor="middle" style={{ fontSize: 13, fontWeight: 700, fill: "var(--text-primary)" }}>
        {data.length} pos.
      </text>
    </svg>
  );
}

const labelStyle: React.CSSProperties = { fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 5 };
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 9,
  background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
  color: "var(--text-primary)", fontSize: 14, outline: "none", boxSizing: "border-box",
};
