"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Download, Plus, Sparkles, TrendingUp, Trash2 } from "lucide-react";
import ScenarioAnalysis from "@/components/ScenarioAnalysis";
import { useSettings } from "@/lib/settings";

interface Holding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  avg_price: number;
  currency: string;
  asset_type: string;
}

type SignalKey = "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL";

interface EnrichedHolding extends Holding {
  currentPrice: number;
  pnl: number;
  pnlPct: number;
  marketValue: number;
  sector: string;
  signal?: SignalKey;
  score?: number;
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
  RENFORCER: "var(--signal-up)", CONSERVER: "#8b7a5e",
  ALLÉGER: "#b84a3a", VENDRE: "var(--signal-down)",
};

const CHART_COLORS = [
  "#1F5C3E", "#C9A24E", "#8B5E3C", "#4A6FA5", "#9B7FA8",
  "#5C7A3E", "#C47C5A", "#4A8E7B", "#7A6B4E", "#B87333",
  "#3D6B5A", "#A05C3C", "#6B7A9E", "#7A5E8B", "#8A7A5C",
];

const SIGNAL_LABELS: Record<SignalKey, { label: string; bg: string; color: string }> = {
  STRONG_BUY: { label: "Achat fort", bg: "#1F5C3E", color: "#F6F2E8" },
  BUY:        { label: "Achat",      bg: "#D6E4D6", color: "#1F5C3E" },
  HOLD:       { label: "Neutre",     bg: "#E8E0CE", color: "#3A3E33" },
  SELL:       { label: "Vendre",     bg: "#EBD7D2", color: "#B84A3E" },
  STRONG_SELL:{ label: "Vendre",     bg: "#EBD7D2", color: "#B84A3E" },
};

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
  const { fmtPrice } = useSettings();
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
  const [sortBy, setSortBy] = useState<"value" | "weight">("value");
  const [rebDismissed, setRebDismissed] = useState(false);

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

  // Enrich with current prices, signal, score
  useEffect(() => {
    if (!holdings.length) { setEnriched([]); setTotals({ value: 0, cost: 0, pnl: 0 }); return; }
    Promise.allSettled(
      holdings.map(async (h) => {
        const res = await fetch(`/api/stock/${h.symbol}`);
        if (!res.ok) return { ...h, currentPrice: h.avg_price, pnl: 0, pnlPct: 0, marketValue: h.avg_price * h.quantity, sector: "N/A", signal: undefined, score: undefined };
        const d = await res.json();
        const cp = d.currentPrice ?? h.avg_price;
        return {
          ...h,
          currentPrice: cp,
          pnl: (cp - h.avg_price) * h.quantity,
          pnlPct: ((cp - h.avg_price) / h.avg_price) * 100,
          marketValue: cp * h.quantity,
          sector: d.sector ?? "N/A",
          signal: d.valuation?.signal as SignalKey | undefined,
          score: d.valuation?.score as number | undefined,
        };
      })
    ).then((results) => {
      const ok = results.filter((r) => r.status === "fulfilled").map((r) => (r as PromiseFulfilledResult<EnrichedHolding>).value);
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

  const handleExport = () => {
    if (!enriched.length) return;
    const rows = sortedHoldings.map((h) => {
      const weight = totals.value > 0 ? (h.marketValue / totals.value) * 100 : 0;
      const sig = h.signal ? SIGNAL_LABELS[h.signal] : null;
      return {
        Nom: h.name,
        Quantité: String(h.quantity),
        "Prix moyen": h.avg_price.toFixed(2),
        Devise: h.currency,
        "Cours actuel": h.currentPrice.toFixed(2),
        "Valeur totale (€)": new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(h.marketValue),
        "Part du portefeuille": `${weight.toFixed(1)}%`,
        "Signal IA": sig ? sig.label : "—",
        "Score /100": h.score != null ? String(h.score) : "—",
        Secteur: h.sector,
      };
    });
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(";"), ...rows.map((r) => headers.map((h) => `"${(r as Record<string, string>)[h]}"`).join(";"))].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rently-portefeuille-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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

  const chartPerf = history.length >= 2
    ? ((history[history.length - 1].value - history[0].value) / history[0].value) * 100
    : null;
  const chartPerfUp = chartPerf == null || chartPerf >= 0;

  // Allocation donut data
  const totalVal = enriched.reduce((s, h) => s + h.marketValue, 0);
  const allocData = enriched
    .map((h, i) => ({ symbol: h.symbol, name: h.name, pct: totalVal > 0 ? (h.marketValue / totalVal) * 100 : 0, color: CHART_COLORS[i % CHART_COLORS.length], value: h.marketValue, currency: h.currency }))
    .sort((a, b) => b.pct - a.pct);

  // Sorted holdings
  const sortedHoldings = [...enriched].sort((a, b) => b.marketValue - a.marketValue);

  // Insights from real data
  const uniqueSectors = new Set(enriched.map((h) => h.sector).filter((s) => s !== "N/A")).size;
  const topHolding = allocData[0];
  const topConcentration = topHolding?.pct ?? 0;
  const bestPnl = enriched.length ? enriched.reduce((b, h) => h.pnlPct > b.pnlPct ? h : b, enriched[0]) : null;
  const worstPnl = enriched.length ? enriched.reduce((b, h) => h.pnlPct < b.pnlPct ? h : b, enriched[0]) : null;

  return (
    <div style={{ background: "var(--paper-3)", minHeight: "100vh" }}>
      <div className="pg-pad" style={{ maxWidth: 1320, margin: "0 auto" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 0, paddingBottom: 24, borderBottom: "1px solid var(--line)" }}>
          <div>
            <div style={{
              fontFamily: "var(--font-geist-mono, monospace)", fontSize: 11,
              color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.12em",
              marginBottom: 12, display: "flex", alignItems: "center", gap: 8,
            }}>
              <Link href="/" style={{ color: "var(--muted)" }}>Rently</Link>
              <span style={{ opacity: 0.4 }}>/</span>
              <span>Mon portefeuille</span>
            </div>
            <h1 style={{
              fontFamily: "var(--font-instrument, serif)", fontSize: "clamp(40px,4.4vw,56px)",
              fontWeight: 400, color: "var(--ink)", margin: "0 0 10px 0", lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}>
              Mon <em style={{ fontStyle: "italic", color: "var(--signal-up)" }}>portefeuille</em>.
            </h1>
            <p style={{ fontSize: 15, color: "var(--muted)", margin: 0 }}>
              {holdings.length} position{holdings.length !== 1 ? "s" : ""}
              {uniqueSectors > 0 && ` · ${uniqueSectors} secteur${uniqueSectors > 1 ? "s" : ""}`}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexShrink: 0, alignItems: "flex-start", paddingTop: 6, flexWrap: "wrap" }}>
            <button onClick={handleExport} disabled={!enriched.length} style={{
              display: "flex", alignItems: "center", gap: 7, padding: "10px 18px",
              borderRadius: 9999, border: "1px solid var(--line)",
              background: "var(--paper)", color: "var(--ink)", fontSize: 14, fontWeight: 500,
              cursor: enriched.length ? "pointer" : "not-allowed", opacity: enriched.length ? 1 : 0.4,
            }}>
              <Download size={13} strokeWidth={2} />
              Exporter CSV
            </button>
            <button onClick={handleAnalyze} disabled={analyzing || !enriched.length} style={{
              display: "flex", alignItems: "center", gap: 7, padding: "10px 18px",
              borderRadius: 9999, border: "1px solid var(--line)",
              background: "var(--paper)", color: "var(--ink)", fontSize: 14, fontWeight: 500,
              cursor: analyzing || !enriched.length ? "not-allowed" : "pointer",
              opacity: !enriched.length ? 0.4 : 1,
            }}>
              <Sparkles size={13} />
              {analyzing ? "Analyse…" : "Analyser avec l'IA"}
            </button>
            <button onClick={() => setShowAdd(true)} style={{
              display: "flex", alignItems: "center", gap: 7, padding: "10px 18px",
              borderRadius: 9999, border: "none",
              background: "#1F5C3E", color: "#F6F2E8",
              fontSize: 14, fontWeight: 500, cursor: "pointer",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              Ajouter une transaction
            </button>
          </div>
        </div>

        {/* ── KPI Strip ── */}
        {enriched.length > 0 && (
          <div className="pf-kpi-scroll">
          <div className="pf-kpi-inner" style={{
            display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
            background: "var(--paper)", border: "1px solid var(--line)",
            borderRadius: 18, overflow: "hidden",
            boxShadow: "0 1px 0 rgba(255,255,255,0.5) inset",
          }}>
            {/* Valeur totale */}
            <div style={{
              padding: "24px 26px", borderRight: "1px solid var(--line)",
              background: "linear-gradient(180deg,#E9F0E5 0%,#F4F1E2 100%)",
              display: "flex", flexDirection: "column", gap: 8,
            }}>
              <span style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 12, color: "#2F7D52", textTransform: "uppercase", letterSpacing: "0.1em" }}>Valeur totale</span>
              <div style={{ fontFamily: "var(--font-instrument, serif)", fontSize: 52, lineHeight: 1, letterSpacing: "-0.02em", color: "#1F5C3E", marginTop: 4 }}>
                {new Intl.NumberFormat("fr-FR").format(Math.round(totals.value))}
                <span style={{ fontSize: 22, color: "var(--muted)", fontFamily: "var(--font-geist, sans-serif)" }}>
                  ,{String(Math.round((totals.value % 1) * 100)).padStart(2, "0")} €
                </span>
              </div>
              <div style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 13, color: isUp ? "var(--signal-up)" : "var(--signal-down)", marginTop: 4 }}>
                {isUp ? "▲" : "▼"} {isUp ? "+" : ""}{fmtPrice(totals.pnl, "EUR")} · {isUp ? "+" : ""}{totalPct.toFixed(2)} %
              </div>
            </div>
            {/* Gain total */}
            <div style={{ padding: "24px 26px", borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Gain total</span>
              <div style={{ fontFamily: "var(--font-instrument, serif)", fontSize: 42, lineHeight: 1, letterSpacing: "-0.02em", color: isUp ? "var(--signal-up)" : "var(--signal-down)", marginTop: 4 }}>
                {isUp ? "+" : ""}{fmtPrice(totals.pnl, "EUR")}
              </div>
              <div style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 13, color: isUp ? "var(--signal-up)" : "var(--signal-down)" }}>
                {isUp ? "+" : ""}{totalPct.toFixed(1)} % depuis l&apos;ouverture
              </div>
            </div>
            {/* Sur la période */}
            <div style={{ padding: "24px 26px", borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Sur la période</span>
              <div style={{ fontFamily: "var(--font-instrument, serif)", fontSize: 42, lineHeight: 1, letterSpacing: "-0.02em", color: chartPerf == null ? "var(--muted)" : chartPerfUp ? "var(--signal-up)" : "var(--signal-down)", marginTop: 4 }}>
                {chartPerf == null ? "—" : `${chartPerfUp ? "+" : ""}${chartPerf.toFixed(1)} %`}
              </div>
              <div style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 13, color: "var(--muted)" }}>
                {PERIOD_LABELS[period]}
              </div>
            </div>
            {/* Positions */}
            <div style={{ padding: "24px 26px", display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Positions</span>
              <div style={{ fontFamily: "var(--font-instrument, serif)", fontSize: 42, lineHeight: 1, letterSpacing: "-0.02em", color: "var(--ink)", marginTop: 4 }}>
                {enriched.length}
              </div>
              <div style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 13, color: "var(--muted)" }}>
                {uniqueSectors} secteur{uniqueSectors !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
          </div>
        )}

        {/* ── Add modal ── */}
        {showAdd && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(10,22,40,0.40)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
          }} onClick={(e) => { if (e.target === e.currentTarget) setShowAdd(false); }}>
            <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 18, width: "100%", maxWidth: 440, padding: 28 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: "var(--ink)" }}>Ajouter une position</h2>
              <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={labelStyle}>Symbole *</label>
                  <div style={{ position: "relative" }}>
                    <input
                      value={addSymbol}
                      onChange={(e) => { setAddSymbol(e.target.value.toUpperCase()); setResolveError(null); }}
                      onBlur={(e) => resolveSymbol(e.target.value)}
                      required placeholder="AAPL, IWDA.AS, CW8.PA…"
                      style={{ ...inputStyle, paddingRight: 36 }}
                    />
                    {resolving && <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--muted)" }}>...</div>}
                  </div>
                  {resolveError && <div style={{ fontSize: 11, color: "var(--signal-down)", marginTop: 4 }}>{resolveError} — vérifiez le symbole Yahoo Finance</div>}
                </div>
                <div>
                  <label style={labelStyle}>Type d&apos;actif</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[{ value: "stock", label: "Action" }, { value: "etf", label: "ETF" }, { value: "crypto", label: "Crypto" }].map((opt) => (
                      <button key={opt.value} type="button" onClick={() => setAddType(opt.value)} style={{
                        flex: 1, padding: "9px 8px", borderRadius: 9,
                        border: `1px solid ${addType === opt.value ? "#1F5C3E" : "var(--line)"}`,
                        background: addType === opt.value ? "#D6E4D6" : "transparent",
                        color: addType === opt.value ? "#1F5C3E" : "var(--muted)",
                        fontSize: 13, fontWeight: 600, cursor: "pointer",
                      }}>{opt.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Nom {resolving ? <span style={{ color: "var(--muted)" }}>(chargement…)</span> : "(auto-rempli ou manuel)"}</label>
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
                    flex: 1, padding: "12px", borderRadius: 9999, border: "1px solid var(--line)",
                    background: "transparent", color: "var(--ink)", fontSize: 14, cursor: "pointer",
                  }}>Annuler</button>
                  <button type="submit" disabled={addLoading} style={{
                    flex: 2, padding: "12px", borderRadius: 9999, border: "none",
                    background: "#1F5C3E", color: "#F6F2E8", fontSize: 14, fontWeight: 600, cursor: "pointer",
                  }}>{addLoading ? "Ajout…" : "Ajouter la position"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Loading state ── */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 28 }}>
            {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 68, borderRadius: 12 }} />)}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && holdings.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 24px", border: "1px dashed var(--line)", borderRadius: 18, background: "var(--paper)", marginTop: 28 }}>
            <TrendingUp size={48} style={{ color: "var(--muted)", marginBottom: 16 }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: "var(--ink)" }}>Portefeuille vide</h2>
            <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24 }}>Ajoutez vos premières positions pour suivre vos performances.</p>
            <button onClick={() => setShowAdd(true)} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 28px", borderRadius: 9999, border: "none",
              background: "#1F5C3E", color: "#F6F2E8", fontSize: 14, fontWeight: 500, cursor: "pointer",
            }}>
              <Plus size={15} />Ajouter une position
            </button>
          </div>
        )}

        {/* ── Main 2-column grid ── */}
        {!loading && enriched.length > 0 && (
          <div className="pf-main-grid">

            {/* ── LEFT: Chart + Holdings ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>

              {/* Performance chart */}
              <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 18, padding: "22px 22px 18px", boxShadow: "0 1px 0 rgba(255,255,255,0.5) inset" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>Performance</h3>
                    {chartPerf != null && (
                      <span style={{
                        display: "inline-flex", alignItems: "baseline", gap: 6,
                        background: chartPerfUp ? "#D6E4D6" : "#EBD7D2",
                        color: chartPerfUp ? "#1F5C3E" : "#B84A3E",
                        borderRadius: 9999, padding: "4px 12px", fontSize: 12, fontWeight: 500,
                      }}>
                        {chartPerfUp ? "▲" : "▼"} <span style={{ fontFamily: "var(--font-geist-mono, monospace)", fontWeight: 600 }}>{chartPerfUp ? "+" : ""}{chartPerf.toFixed(2)} %</span> annualisé
                      </span>
                    )}
                  </div>
                  <div style={{ display: "inline-flex", background: "var(--paper-3)", border: "1px solid var(--line)", borderRadius: 9999, padding: 3 }}>
                    {PERIODS.map((p) => (
                      <button key={p} onClick={() => setPeriod(p)} style={{
                        padding: "4px 10px", borderRadius: 9999, fontSize: 12, fontWeight: 500,
                        border: "none", background: period === p ? "var(--ink)" : "transparent",
                        color: period === p ? "var(--paper)" : "var(--muted)", cursor: "pointer",
                      }}>{PERIOD_LABELS[p]}</button>
                    ))}
                  </div>
                </div>

                {historyLoading ? (
                  <div className="skeleton" style={{ height: 200, borderRadius: 8 }} />
                ) : history.length > 1 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={history} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="valGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartPerfUp ? "#1F5C3E" : "#b84a3a"} stopOpacity={0.18} />
                            <stop offset="95%" stopColor={chartPerfUp ? "#1F5C3E" : "#b84a3a"} stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#9C9583" stopOpacity={0.08} />
                            <stop offset="95%" stopColor="#9C9583" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="2 4" stroke="var(--line)" vertical={false} />
                        <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10, fill: "var(--muted)" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                        <YAxis tickFormatter={(v) => fmtShort(v)} tick={{ fontSize: 10, fill: "var(--muted)" }} axisLine={false} tickLine={false} width={44} />
                        <Tooltip
                          contentStyle={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }}
                          labelStyle={{ color: "var(--muted)", marginBottom: 4 }}
                          labelFormatter={(label: unknown) => fmtDate(String(label))}
                          formatter={(value: unknown, name: unknown) => [`${fmtShort(Number(value))} €`, name === "value" ? "Valeur" : "Investi"]}
                        />
                        <Area type="monotone" dataKey="cost" stroke="#9C9583" strokeWidth={1.5} strokeDasharray="4 4" fill="url(#costGrad)" dot={false} />
                        <Area type="monotone" dataKey="value" stroke={chartPerfUp ? "#1F5C3E" : "#b84a3a"} strokeWidth={2.2} fill="url(#valGrad)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                    <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap", marginTop: 12, paddingTop: 12, borderTop: "1px dashed var(--line)", fontSize: 12, color: "var(--muted)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ width: 14, height: 3, background: chartPerfUp ? "#1F5C3E" : "#b84a3a", borderRadius: 2, display: "inline-block" }} />
                        Mon portefeuille
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ width: 14, height: 2, background: "#9C9583", display: "inline-block", backgroundImage: "repeating-linear-gradient(90deg,#9C9583 0 4px,transparent 4px 8px)" }} />
                        Investi (coût)
                      </span>
                    </div>
                  </>
                ) : (
                  <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 13 }}>
                    Données insuffisantes pour la période sélectionnée
                  </div>
                )}
              </div>

              {/* Holdings table */}
              <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 18, overflow: "hidden", boxShadow: "0 1px 0 rgba(255,255,255,0.5) inset" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px 0", flexWrap: "wrap", gap: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--ink)", display: "flex", alignItems: "center", gap: 10 }}>
                    Lignes du portefeuille
                    <span style={{ background: "var(--paper-3)", color: "var(--muted)", fontSize: 11, padding: "1px 9px", borderRadius: 9999, fontFamily: "var(--font-geist-mono, monospace)", fontWeight: 500 }}>
                      {enriched.length} position{enriched.length !== 1 ? "s" : ""}
                    </span>
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)" }}>
                    <span>Trier par</span>
                    {(["value", "weight"] as const).map((key) => (
                      <button key={key} onClick={() => setSortBy(key)} style={{
                        padding: "4px 10px", borderRadius: 9999, fontSize: 12, fontWeight: 500,
                        border: "none", cursor: "pointer",
                        background: sortBy === key ? "var(--ink)" : "var(--paper-3)",
                        color: sortBy === key ? "var(--paper)" : "var(--muted)",
                      }}>
                        {key === "value" ? "Valeur" : "Part"}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ marginTop: 16 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, tableLayout: "fixed" }}>
                    <colgroup>
                      <col style={{ width: "34%" }} />
                      <col style={{ width: "8%" }} />
                      <col style={{ width: "12%" }} />
                      <col style={{ width: "12%" }} />
                      <col style={{ width: "14%" }} />
                      <col style={{ width: "14%" }} />
                      <col style={{ width: "6%" }} />
                    </colgroup>
                    <thead>
                      <tr style={{ background: "var(--paper-3)", borderTop: "1px solid var(--line)" }}>
                        {[
                          { label: "Valeur", align: "left" as const },
                          { label: "Qté", align: "right" as const },
                          { label: "PRU", align: "right" as const },
                          { label: "Cours", align: "right" as const },
                          { label: "Valeur tot.", align: "right" as const },
                          { label: "Part", align: "right" as const },
                          { label: "", align: "center" as const },
                        ].map((th, i) => (
                          <th key={i} style={{
                            padding: "10px 10px", textAlign: th.align,
                            fontSize: 11, fontWeight: 500, color: "var(--muted)",
                            textTransform: "uppercase", letterSpacing: "0.08em",
                            borderBottom: "1px solid var(--line)", whiteSpace: "nowrap",
                          }}>{th.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedHoldings.map((h, i) => {
                        const weight = totals.value > 0 ? (h.marketValue / totals.value) * 100 : 0;
                        const color = CHART_COLORS[enriched.indexOf(h) % CHART_COLORS.length];
                        const sig = h.signal ? SIGNAL_LABELS[h.signal] : null;
                        return (
                          <tr key={h.id}
                            style={{ borderBottom: i < sortedHoldings.length - 1 ? "1px solid var(--line)" : "none", transition: "background .12s" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.37)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            {/* Action */}
                            <td style={{ padding: "12px 10px", verticalAlign: "middle", overflow: "hidden" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{
                                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                                  background: color, display: "grid", placeItems: "center",
                                  fontSize: 10, fontWeight: 700, color: "#F6F2E8",
                                }}>
                                  {h.name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("").slice(0, 2)}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <Link href={`/stock/${h.symbol}`} style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {h.name}
                                  </Link>
                                  {sig && (
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "1px 7px", borderRadius: 9999, background: sig.bg, color: sig.color, fontSize: 10, fontWeight: 600, marginTop: 2 }}>
                                      <span style={{ width: 4, height: 4, borderRadius: "50%", background: "currentColor", opacity: 0.7 }} />
                                      {sig.label}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            {/* Quantité */}
                            <td style={{ padding: "12px 10px", textAlign: "right", fontFamily: "var(--font-geist-mono, monospace)", fontSize: 12, color: "var(--ink)" }}>
                              {h.quantity}
                            </td>
                            {/* PRU */}
                            <td style={{ padding: "12px 10px", textAlign: "right", fontFamily: "var(--font-geist-mono, monospace)", fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden" }}>
                              {h.avg_price.toFixed(2)}<br /><span style={{ fontSize: 10 }}>{h.currency}</span>
                            </td>
                            {/* Cours actuel */}
                            <td style={{ padding: "12px 10px", textAlign: "right", fontFamily: "var(--font-geist-mono, monospace)", fontSize: 12, fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden" }}>
                              {h.currentPrice.toFixed(2)}<br /><span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 400 }}>{h.currency}</span>
                            </td>
                            {/* Valeur */}
                            <td style={{ padding: "12px 10px", textAlign: "right", fontFamily: "var(--font-geist-mono, monospace)", fontSize: 12, fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden" }}>
                              {fmt(h.marketValue, h.currency)}
                            </td>
                            {/* Poids */}
                            <td style={{ padding: "12px 10px", textAlign: "right", verticalAlign: "middle" }}>
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                                <span style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 12, color: "var(--ink)", fontWeight: 600 }}>{weight.toFixed(1)} %</span>
                                <div style={{ width: 44, height: 3, background: "var(--paper-3)", borderRadius: 999, overflow: "hidden" }}>
                                  <div style={{ height: "100%", width: `${Math.min(weight, 100)}%`, background: color, borderRadius: 999 }} />
                                </div>
                              </div>
                            </td>
                            {/* Delete */}
                            <td style={{ padding: "12px 8px", textAlign: "center" }}>
                              <button onClick={() => handleDelete(h.id)} style={{
                                width: 26, height: 26, borderRadius: 7, border: "none",
                                background: "rgba(184,74,58,0.07)", color: "var(--signal-down)",
                                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                margin: "0 auto",
                              }}>
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ── RIGHT: Donut + Signals ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Répartition donut */}
              <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 18, padding: "22px", boxShadow: "0 1px 0 rgba(255,255,255,0.5) inset" }}>
                <h3 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>Répartition</h3>
                <PortfolioDonut data={allocData} totalValue={totals.value} />
              </div>

            </div>
          </div>
        )}

        {/* ── Rebalance banner ── */}
        {!loading && enriched.length >= 2 && topConcentration > 35 && !rebDismissed && (
          <div style={{
            background: "linear-gradient(135deg,#1F5C3E,#14201A)", color: "#F6F2E8",
            borderRadius: 18, padding: "24px 26px",
            display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "center",
            marginBottom: 20, position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", right: -80, top: -80, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(closest-side,rgba(47,125,82,0.35),transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <h3 style={{ margin: "0 0 6px", fontFamily: "var(--font-instrument, serif)", fontWeight: 400, fontSize: 28, letterSpacing: "-0.015em", color: "#F6F2E8" }}>
                Votre portefeuille a une forte <em style={{ fontStyle: "italic", color: "#A8D0AF" }}>concentration</em>.
              </h3>
              <p style={{ margin: 0, color: "#C7C1AF", fontSize: 14, maxWidth: 540 }}>
                {topHolding?.name} représente {topConcentration.toFixed(1)} % de votre portefeuille. Une exposition supérieure à 35 % sur un seul actif augmente le risque. Diversifiez pour réduire la volatilité.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, position: "relative", zIndex: 1, flexShrink: 0 }}>
              <button onClick={() => setShowAdd(true)} style={{
                padding: "10px 18px", borderRadius: 9999, border: "none",
                background: "var(--paper)", color: "var(--ink)",
                fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
              }}>
                Ajouter une position →
              </button>
              <button onClick={() => setRebDismissed(true)} style={{
                padding: "10px 18px", borderRadius: 9999,
                border: "1px solid rgba(255,255,255,0.18)", background: "transparent",
                color: "#F6F2E8", fontSize: 13, fontWeight: 500, cursor: "pointer",
              }}>
                Plus tard
              </button>
            </div>
          </div>
        )}

        {/* ── Insights cards ── */}
        {!loading && enriched.length > 0 && (
          <div className="grid-3col" style={{ marginBottom: 24 }}>
            {/* Diversification */}
            <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 16, padding: 20 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "#D6E4D6", color: "#1F5C3E", display: "grid", placeItems: "center", marginBottom: 12 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "var(--font-geist-mono, monospace)" }}>Force du portefeuille</div>
              <h4 style={{ margin: "8px 0 6px", fontFamily: "var(--font-instrument, serif)", fontWeight: 400, fontSize: 22, lineHeight: 1.2, letterSpacing: "-0.01em" }}>
                {uniqueSectors >= 3 ? "Bien diversifié." : uniqueSectors >= 2 ? "Diversification modérée." : "Peu diversifié."}
              </h4>
              <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
                {uniqueSectors} secteur{uniqueSectors !== 1 ? "s" : ""} représenté{uniqueSectors !== 1 ? "s" : ""} sur {enriched.length} position{enriched.length !== 1 ? "s" : ""}.
                {analysis?.diversification ? ` Score : ${analysis.globalScore}/100.` : ""}
              </p>
            </div>
            {/* Concentration */}
            <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 16, padding: 20 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: topConcentration > 35 ? "#EBD7D2" : "#F0E4C3", color: topConcentration > 35 ? "#B84A3E" : "#7A5A1F", display: "grid", placeItems: "center", marginBottom: 12 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "var(--font-geist-mono, monospace)" }}>Point d&apos;attention</div>
              <h4 style={{ margin: "8px 0 6px", fontFamily: "var(--font-instrument, serif)", fontWeight: 400, fontSize: 22, lineHeight: 1.2, letterSpacing: "-0.01em" }}>
                {topConcentration > 35 ? "Concentration élevée." : "Répartition équilibrée."}
              </h4>
              <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
                {topHolding ? `${topHolding.name} représente ${topConcentration.toFixed(1)} % du portefeuille.` : "—"}
                {topConcentration > 35 ? " Envisagez de diversifier." : " Aucun actif ne domine."}
              </p>
            </div>
            {/* Performance spread */}
            <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 16, padding: 20 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "#EBD7D2", color: "#B84A3E", display: "grid", placeItems: "center", marginBottom: 12 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m7 14 4-4 4 3 5-7"/></svg>
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "var(--font-geist-mono, monospace)" }}>Performance</div>
              <h4 style={{ margin: "8px 0 6px", fontFamily: "var(--font-instrument, serif)", fontWeight: 400, fontSize: 22, lineHeight: 1.2, letterSpacing: "-0.01em" }}>
                {bestPnl && bestPnl.pnlPct > 0 ? `+${bestPnl.pnlPct.toFixed(1)} %` : "—"}
              </h4>
              <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
                {bestPnl ? `Meilleur : ${bestPnl.name} (+${bestPnl.pnlPct.toFixed(1)} %).` : "—"}
                {worstPnl && worstPnl.pnlPct < 0 ? ` Retardataire : ${worstPnl.name} (${worstPnl.pnlPct.toFixed(1)} %).` : ""}
              </p>
            </div>
          </div>
        )}

        {/* ── Scenario Analysis ── */}
        {!loading && enriched.length > 0 && (
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
          <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 18, padding: 28, marginTop: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: "#1F5C3E", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Sparkles size={16} color="#F6F2E8" />
              </div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)" }}>Analyse IA du portefeuille</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 20, marginBottom: 24, alignItems: "center" }}>
              <div style={{ position: "relative", width: 80, height: 80 }}>
                <svg viewBox="0 0 80 80" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="40" cy="40" r="32" fill="none" stroke="var(--line)" strokeWidth="7" />
                  <circle cx="40" cy="40" r="32" fill="none"
                    stroke={analysis.globalScore >= 65 ? "var(--signal-up)" : analysis.globalScore >= 40 ? "var(--signal-neutral)" : "var(--signal-down)"}
                    strokeWidth="7" strokeDasharray={`${(analysis.globalScore / 100) * 201} 201`} strokeLinecap="round" />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)" }}>{analysis.globalScore}</span>
                  <span style={{ fontSize: 9, color: "var(--muted)" }}>/100</span>
                </div>
              </div>
              <div>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--muted)", marginBottom: 8 }}>{analysis.summary}</p>
                <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, background: "#D6E4D6", color: "#1F5C3E" }}>
                  Diversification : {analysis.diversification}
                </span>
              </div>
            </div>
            {analysis.recommendations?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>Recommandations</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {analysis.recommendations.map((r, i) => {
                    const holding = enriched.find(h => h.symbol === r.symbol);
                    const displayName = holding?.name && holding.name !== r.symbol ? holding.name : r.symbol;
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", borderRadius: 10, background: "var(--paper-3)", border: "1px solid var(--line)" }}>
                        <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: `${REC_COLORS[r.type]}20`, color: REC_COLORS[r.type], flexShrink: 0 }}>{r.type}</span>
                        <div>
                          <span style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)" }}>{displayName}</span>
                          <span style={{ fontSize: 13, color: "var(--muted)", marginLeft: 6 }}>{r.reason}</span>
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
                  <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--signal-up)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <TrendingUp size={13} />Points forts
                  </h3>
                  {analysis.strengths.map((s, i) => (
                    <div key={i} style={{ fontSize: 13, color: "var(--muted)", marginBottom: 5, display: "flex", gap: 6 }}>
                      <span style={{ color: "var(--signal-up)" }}>✓</span>{s}
                    </div>
                  ))}
                </div>
              )}
              {analysis.missingExposures?.length > 0 && (
                <div>
                  <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--signal-neutral)", marginBottom: 8 }}>Expositions manquantes</h3>
                  {analysis.missingExposures.map((s, i) => (
                    <div key={i} style={{ fontSize: 13, color: "var(--muted)", marginBottom: 5, display: "flex", gap: 6 }}>
                      <span style={{ color: "var(--signal-neutral)" }}>+</span>{s}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {analysis.mainRisk && (
              <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, background: "rgba(184,74,58,0.05)", border: "1px solid rgba(184,74,58,0.18)" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--signal-down)" }}>Risque principal : </span>
                <span style={{ fontSize: 13, color: "var(--muted)" }}>{analysis.mainRisk}</span>
              </div>
            )}
            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 16 }}>{analysis.disclaimer}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Portfolio donut (light background version) ── */
function PortfolioDonut({ data, totalValue }: { data: { symbol: string; name: string; pct: number; color: string }[]; totalValue: number }) {
  const size = 160;
  const r = 60;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  let cumulative = 0;
  const slices = data.map((d) => {
    const offset = -(circ * cumulative / 100) + circ / 4;
    const dash = (d.pct / 100) * circ;
    cumulative += d.pct;
    return { ...d, offset, dash };
  });

  const fmtK = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0);

  return (
    <div>
      <div style={{ position: "relative", width: size, height: size, margin: "0 auto 16px" }}>
        <svg width={size} height={size}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--line)" strokeWidth="16" />
          {slices.map((s, i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={s.color} strokeWidth="16"
              strokeDasharray={`${s.dash} ${circ - s.dash}`}
              strokeDashoffset={s.offset}
            />
          ))}
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
          <div>
            <div style={{ fontFamily: "var(--font-instrument, serif)", fontSize: 22, lineHeight: 1, color: "var(--ink)" }}>
              {fmtK(totalValue)} €
            </div>
            <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-geist-mono, monospace)" }}>
              Valeur totale
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {data.map((a) => (
          <div key={a.symbol} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, overflow: "hidden" }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: a.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span>
            </div>
            <span style={{ fontSize: 12, color: "var(--muted)", flexShrink: 0, fontFamily: "var(--font-geist-mono, monospace)" }}>{a.pct.toFixed(1)} %</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 5 };
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 12,
  background: "var(--paper-2)", border: "1px solid var(--line)",
  color: "var(--ink)", fontSize: 14, outline: "none", boxSizing: "border-box",
};
