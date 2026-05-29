"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { SearchModal } from "@/components/SearchModal";
import { createClient } from "@/lib/supabase";
import { Star, Download } from "lucide-react";
import Footer from "@/components/Footer";
import { useSettings } from "@/lib/settings";

interface WatchItem { symbol: string; name: string; }
interface StockData {
  symbol: string; name: string; currentPrice: number;
  change: number; changePercent: number; currency: string;
  sector?: string;
  valuation?: { fairValue: number; upside: number; signal: SignalKey; score: number };
}
interface HistData { change7d: number; change30d: number; sparkline: number[]; }
interface Rec { symbol: string; name: string; currentPrice?: number; changePercent?: number; currency?: string; signal?: SignalKey; score?: number; }

type SignalKey = "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL";
type FilterKey = "all" | "STRONG_BUY" | "watch" | "overvalued";

const SIGNAL_MAP: Record<SignalKey, { bg: string; color: string; label: string }> = {
  STRONG_BUY: { bg: "#1F5C3E", color: "#F6F2E8", label: "Achat fort" },
  BUY:        { bg: "#D6E4D6", color: "#1F5C3E", label: "Achat" },
  HOLD:       { bg: "#E8E0CE", color: "#3A3E33", label: "Neutre" },
  SELL:       { bg: "#EBD7D2", color: "#B84A3E", label: "Vendre" },
  STRONG_SELL:{ bg: "#EBD7D2", color: "#B84A3E", label: "Surévalué" },
};

const MARKET_INDICES = [
  { symbol: "^GSPC",   label: "S&P 500",   desc: "500 plus grandes entreprises américaines" },
  { symbol: "^IXIC",   label: "Nasdaq",    desc: "Indice tech US — Apple, Microsoft, Nvidia..." },
  { symbol: "EURUSD=X",label: "EUR / USD", desc: "Taux de change euro contre dollar", isRate: true },
  { symbol: "^FCHI",   label: "CAC 40",    desc: "Indice phare de la bourse de Paris" },
];

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("").slice(0, 2);
}
function avatarBg(name: string) {
  const palette = ["#1F5C3E","#2d5e7e","#7e3d2d","#5e2d7e","#7e6b2d","#2d7e5e","#3d2d7e","#7e2d5e","#2d6e7e","#5e7e2d"];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0x7fffffff;
  return palette[h % palette.length];
}

function SignalBadge({ signal, small }: { signal?: SignalKey; small?: boolean }) {
  if (!signal) return <span style={{ color: "var(--muted)", fontSize: 12 }}>—</span>;
  const s = SIGNAL_MAP[signal];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: small ? "2px 8px" : "3px 10px", borderRadius: 9999, background: s.bg, color: s.color, fontSize: small ? 11 : 12, fontWeight: 600, whiteSpace: "nowrap" }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", opacity: 0.7 }} />
      {s.label}
    </span>
  );
}

function ScoreCell({ score }: { score?: number }) {
  if (score === undefined) return <span style={{ color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)", fontSize: 13 }}>—</span>;
  const color = score >= 70 ? "var(--signal-up)" : score >= 50 ? "var(--signal-neutral,#8b7a2d)" : "var(--signal-down)";
  return <span style={{ color, fontFamily: "var(--font-geist-mono, monospace)", fontSize: 13, fontWeight: 600 }}>{score} <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 11 }}>/100</span></span>;
}

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (data.length < 2) return <span style={{ color: "var(--muted)", fontSize: 12 }}>—</span>;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const w = 72, h = 26;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(" ");
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={positive ? "var(--signal-up)" : "var(--signal-down)"} strokeWidth="1.5" strokeLinejoin="round" /></svg>;
}

const thStyle: React.CSSProperties = {
  textAlign: "left", fontWeight: 500, fontSize: 11,
  textTransform: "uppercase", letterSpacing: "0.1em",
  color: "var(--muted)", padding: "10px 12px", whiteSpace: "nowrap",
};

export default function WatchlistPage() {
  const { t } = useSettings();
  const [items, setItems]       = useState<WatchItem[]>([]);
  const [stocks, setStocks]     = useState<StockData[]>([]);
  const [histData, setHistData] = useState<Record<string, HistData>>({});
  const [loading, setLoading]   = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filter, setFilter]     = useState<FilterKey>("all");
  const [query, setQuery]       = useState("");
  const [recs, setRecs]         = useState<Rec[]>([]);
  const [mktData, setMktData]   = useState<Record<string, { price: number; changePercent: number }>>({});
  const supabase = createClient();

  /* ── Load history in background ── */
  const loadHistory = useCallback(async (symbols: string[]) => {
    const results = await Promise.allSettled(
      symbols.map(async (sym) => {
        const res = await fetch(`/api/stock/${sym}/history?period=1mo`);
        if (!res.ok) return null;
        const raw = await res.json();
        const prices: number[] = Array.isArray(raw)
          ? raw.map((d: Record<string, unknown>) => {
              const c = d.close ?? d.adjClose ?? d.price;
              return typeof c === "number" ? c : null;
            }).filter((v): v is number => v !== null)
          : [];
        if (prices.length < 2) return null;
        const last = prices[prices.length - 1];
        const start7 = prices[Math.max(0, prices.length - 7)];
        return { sym, change30d: ((last - prices[0]) / prices[0]) * 100, change7d: ((last - start7) / start7) * 100, sparkline: prices };
      })
    );
    setHistData((prev) => {
      const next = { ...prev };
      results.forEach((r) => {
        if (r.status === "fulfilled" && r.value) {
          next[r.value.sym] = { change30d: r.value.change30d, change7d: r.value.change7d, sparkline: r.value.sparkline };
        }
      });
      return next;
    });
  }, []);

  /* ── Load market indices ── */
  const loadMarket = useCallback(async () => {
    const results = await Promise.allSettled(
      MARKET_INDICES.map(async (idx) => {
        const res = await fetch(`/api/stock/${encodeURIComponent(idx.symbol)}`);
        if (!res.ok) return null;
        const d = await res.json();
        if (d.error || !d.currentPrice) return null;
        return { symbol: idx.symbol, price: d.currentPrice as number, changePercent: (d.changePercent ?? 0) as number };
      })
    );
    const map: Record<string, { price: number; changePercent: number }> = {};
    results.forEach((r, i) => {
      if (r.status === "fulfilled" && r.value) map[MARKET_INDICES[i].symbol] = r.value;
    });
    setMktData(map);
  }, []);

  /* ── Load trending → recommendations ── */
  const loadTrending = useCallback(async (watchlist: string[]) => {
    try {
      const res = await fetch("/api/trending");
      const data = await res.json();
      const candidates: { symbol: string; name: string }[] = Array.isArray(data)
        ? (data as Record<string, unknown>[]).map((d) => ({ symbol: String(d.symbol ?? ""), name: String(d.name ?? d.symbol ?? "") })).filter((d) => d.symbol && !watchlist.includes(d.symbol))
        : [];
      const top3 = candidates.slice(0, 3);
      const enriched = await Promise.allSettled(
        top3.map(async (c) => {
          const res2 = await fetch(`/api/stock/${c.symbol}`);
          if (!res2.ok) return c as Rec;
          const d = await res2.json();
          return { symbol: c.symbol, name: d.name ?? c.name, currentPrice: d.currentPrice, changePercent: d.changePercent, currency: d.currency, signal: d.valuation?.signal as SignalKey | undefined, score: d.valuation?.score as number | undefined } as Rec;
        })
      );
      setRecs(enriched.filter((r) => r.status === "fulfilled").map((r) => (r as PromiseFulfilledResult<Rec>).value));
    } catch { /* ignore */ }
  }, []);

  /* ── Main load ── */
  const loadWatchlist = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    setLoggedIn(!!data.user);
    let symbols: WatchItem[] = [];
    if (data.user) {
      const res = await fetch("/api/watchlist");
      symbols = await res.json();
    } else {
      const saved = JSON.parse(localStorage.getItem("watchlist") ?? "[]") as string[];
      symbols = saved.map((s) => ({ symbol: s, name: localStorage.getItem(`watchlist-name-${s}`) ?? s }));
    }
    setItems(symbols);
    if (symbols.length === 0) { setLoading(false); return; }
    const results = await Promise.allSettled(symbols.map((w) => fetch(`/api/stock/${w.symbol}`).then((r) => r.json())));
    const data2 = results.filter((r): r is PromiseFulfilledResult<StockData> => r.status === "fulfilled" && !r.value?.error).map((r) => r.value);
    setStocks(data2);
    setLoading(false);
    loadHistory(data2.map((s) => s.symbol));
    loadTrending(symbols.map((s) => s.symbol));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadWatchlist(); loadMarket(); }, [loadWatchlist, loadMarket]);

  /* ── Watchlist mutations ── */
  const handleFollow = useCallback(async (symbol: string, name: string) => {
    setItems((prev) => prev.find((i) => i.symbol === symbol) ? prev : [...prev, { symbol, name }]);
    if (loggedIn) {
      await fetch("/api/watchlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ symbol, name }) });
    } else {
      const saved = JSON.parse(localStorage.getItem("watchlist") ?? "[]") as string[];
      if (!saved.includes(symbol)) { localStorage.setItem("watchlist", JSON.stringify([...saved, symbol])); localStorage.setItem(`watchlist-name-${symbol}`, name); }
    }
    try {
      const res = await fetch(`/api/stock/${symbol}`);
      const d = await res.json();
      if (!d.error) { setStocks((prev) => prev.find((s) => s.symbol === symbol) ? prev : [...prev, d]); loadHistory([symbol]); }
    } catch { /* ignore */ }
  }, [loggedIn, loadHistory]);

  const handleUnfollow = useCallback(async (symbol: string) => {
    setItems((prev) => prev.filter((i) => i.symbol !== symbol));
    setStocks((prev) => prev.filter((s) => s.symbol !== symbol));
    setHistData((prev) => { const n = { ...prev }; delete n[symbol]; return n; });
    if (loggedIn) {
      await fetch("/api/watchlist", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ symbol }) });
    } else {
      const saved = JSON.parse(localStorage.getItem("watchlist") ?? "[]") as string[];
      localStorage.setItem("watchlist", JSON.stringify(saved.filter((s) => s !== symbol)));
      localStorage.removeItem(`watchlist-name-${symbol}`);
    }
  }, [loggedIn]);

  const watchlistSymbols = items.map((i) => i.symbol);

  /* ── Computed values ── */
  const filteredStocks = stocks.filter((s) => {
    if (query && !s.name.toLowerCase().includes(query.toLowerCase())) return false;
    if (filter === "STRONG_BUY") return s.valuation?.signal === "STRONG_BUY";
    if (filter === "watch") return s.valuation?.signal === "HOLD";
    if (filter === "overvalued") return s.valuation?.signal === "SELL" || s.valuation?.signal === "STRONG_SELL";
    return true;
  });

  const risingCount   = stocks.filter((s) => s.changePercent >= 0).length;
  const avgRisingPct  = stocks.filter((s) => s.changePercent >= 0).reduce((sum, s) => sum + s.changePercent, 0) / Math.max(risingCount, 1);
  const topGainer     = stocks.length ? stocks.reduce((b, s) => s.changePercent > b.changePercent ? s : b, stocks[0]) : null;
  const strongBuyCount= stocks.filter((s) => s.valuation?.signal === "STRONG_BUY").length;
  const watchCount    = stocks.filter((s) => s.valuation?.signal === "HOLD").length;
  const overvaluedCnt = stocks.filter((s) => s.valuation?.signal === "SELL" || s.valuation?.signal === "STRONG_SELL").length;
  const perf30dArr    = Object.values(histData).map((h) => h.change30d);
  const avgPerf30d    = perf30dArr.length > 0 ? perf30dArr.reduce((a, b) => a + b, 0) / perf30dArr.length : null;

  const alerts = stocks.filter((s) => s.valuation?.signal === "STRONG_BUY" || s.valuation?.signal === "SELL" || s.valuation?.signal === "STRONG_SELL").slice(0, 3);

  return (
    <div style={{ background: "var(--paper-3)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "40px 32px 0" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <Link href="/" style={{ color: "var(--muted)" }}>Rently</Link>
              <span style={{ opacity: 0.4 }}>/</span>
              <span>Mes actions</span>
            </div>
            <h1 style={{ fontFamily: "var(--font-instrument, serif)", fontSize: "clamp(40px,4.4vw,56px)", fontWeight: 400, color: "var(--ink)", margin: "0 0 10px 0", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
              Mes <em style={{ fontStyle: "italic", color: "var(--signal-up)" }}>actions</em>.
            </h1>
            <p style={{ fontSize: 15, color: "var(--muted)", maxWidth: 580, margin: 0, lineHeight: 1.6 }}>
              {items.length} valeur{items.length !== 1 ? "s" : ""} suivie{items.length !== 1 ? "s" : ""} — surveille les signaux, compare leur santé et garde un œil sur les opportunités qui te ressemblent.
            </p>
            {!loggedIn && (
              <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>
                <Link href="/auth/login" style={{ color: "var(--signal-up)", fontWeight: 500 }}>{t("nav.login")}</Link>{" "}{t("common.sign_in_sync")}
              </p>
            )}
          </div>
          <div style={{ display: "flex", gap: 10, flexShrink: 0, alignItems: "flex-start", paddingTop: 6 }}>
            <button style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 9999, border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
              <Download size={13} strokeWidth={2} />Exporter
            </button>
            <button onClick={() => setSearchOpen(true)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 9999, border: "none", background: "#1F5C3E", color: "#F6F2E8", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              Ajouter une action
            </button>
          </div>
        </div>

        {/* ── 2-column layout ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 308px", gap: 24, alignItems: "start" }}>

          {/* ═══ LEFT ═══ */}
          <div>
            {/* KPI strip */}
            {stocks.length > 0 && !loading && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
                <KpiCard icon={<CheckIcon />} label="En hausse aujourd'hui">
                  <div style={{ fontFamily: "var(--font-instrument, serif)", fontSize: 36, lineHeight: 1, color: "var(--signal-up)" }}>
                    {risingCount} <span style={{ fontSize: 14, color: "var(--muted)", fontFamily: "inherit" }}>/ {stocks.length}</span>
                  </div>
                  <div style={{ fontSize: 12, color: risingCount > 0 ? "var(--signal-up)" : "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)" }}>
                    {risingCount > 0 ? `+${avgRisingPct.toFixed(2)} % en moyenne` : "Aucune hausse"}
                  </div>
                </KpiCard>

                <KpiCard icon={<ArrowIcon />} label="Plus forte hausse">
                  <div style={{ fontFamily: "var(--font-instrument, serif)", fontSize: topGainer && topGainer.name.length > 14 ? 18 : 26, lineHeight: 1.1, color: "var(--ink)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {topGainer ? topGainer.name.split(" ").slice(0, 2).join(" ") : "—"}
                  </div>
                  <div style={{ fontSize: 12, fontFamily: "var(--font-geist-mono, monospace)", color: topGainer && topGainer.changePercent >= 0 ? "var(--signal-up)" : "var(--signal-down)" }}>
                    {topGainer ? `${topGainer.changePercent >= 0 ? "▲ +" : "▼ "}${topGainer.changePercent.toFixed(2)} %` : "—"}
                    {topGainer ? ` · ${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(topGainer.currentPrice)} ${topGainer.currency}` : ""}
                  </div>
                </KpiCard>

                <KpiCard icon={<ClockIcon />} label="Signaux actifs">
                  <div style={{ fontFamily: "var(--font-instrument, serif)", fontSize: 36, lineHeight: 1, color: strongBuyCount > 0 ? "var(--signal-up)" : "var(--ink)" }}>
                    {strongBuyCount + overvaluedCnt} <span style={{ fontSize: 14, color: "var(--muted)", fontFamily: "inherit" }}>/ {stocks.length}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)" }}>
                    {strongBuyCount > 0 ? `${strongBuyCount} achat${strongBuyCount > 1 ? "s" : ""} fort${strongBuyCount > 1 ? "s" : ""}` : "Aucun achat fort"}
                    {overvaluedCnt > 0 ? ` · ${overvaluedCnt} vente${overvaluedCnt > 1 ? "s" : ""}` : ""}
                  </div>
                </KpiCard>

                <KpiCard icon={<ChartIcon />} label="Performance 30 j">
                  <div style={{ fontFamily: "var(--font-instrument, serif)", fontSize: 36, lineHeight: 1, color: avgPerf30d == null ? "var(--muted)" : avgPerf30d >= 0 ? "var(--signal-up)" : "var(--signal-down)" }}>
                    {avgPerf30d == null ? "—" : `${avgPerf30d >= 0 ? "+" : ""}${avgPerf30d.toFixed(1)}`}
                    {avgPerf30d != null && <span style={{ fontSize: 16, marginLeft: 2 }}>%</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)" }}>
                    {perf30dArr.length > 0 ? `moy. sur ${perf30dArr.length} valeur${perf30dArr.length > 1 ? "s" : ""}` : "Chargement…"}
                  </div>
                </KpiCard>
              </div>
            )}

            {/* Empty state */}
            {items.length === 0 && !loading && (
              <div style={{ textAlign: "center", padding: "80px 24px", border: "1.5px dashed var(--line)", borderRadius: 18, background: "var(--paper)" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#D6E4D6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <Star size={24} strokeWidth={1.5} color="#1F5C3E" />
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>{t("watchlist.empty_title")}</h2>
                <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 24 }}>{t("watchlist.empty_desc")}</p>
                <button onClick={() => setSearchOpen(true)} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 24px", borderRadius: 9999, background: "#1F5C3E", color: "#F6F2E8", fontWeight: 500, fontSize: 14, cursor: "pointer", border: "none" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                  {t("watchlist.add_btn")}
                </button>
              </div>
            )}

            {items.length > 0 && (
              <>
                {/* Filter bar */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {([
                      { key: "all"        as FilterKey, label: "Tous",         count: stocks.length },
                      { key: "STRONG_BUY" as FilterKey, label: "Achat fort",   count: strongBuyCount },
                      { key: "watch"      as FilterKey, label: "À surveiller", count: watchCount },
                      { key: "overvalued" as FilterKey, label: "Surévalués",   count: overvaluedCnt },
                    ]).map(({ key, label, count }) => (
                      <button key={key} onClick={() => setFilter(key)} style={{
                        padding: "7px 14px", borderRadius: 9999, fontSize: 13, fontWeight: 500, cursor: "pointer",
                        border: filter === key ? "1.5px solid var(--ink)" : "1px solid var(--line)",
                        background: filter === key ? "var(--ink)" : "var(--paper)",
                        color: filter === key ? "var(--paper)" : "var(--ink)",
                        display: "flex", alignItems: "center", gap: 6,
                      }}>
                        {label}
                        <span style={{ fontSize: 11, background: filter === key ? "rgba(255,255,255,0.18)" : "var(--paper-3)", borderRadius: 999, padding: "1px 6px", fontFamily: "var(--font-geist-mono, monospace)" }}>{count}</span>
                      </button>
                    ))}
                  </div>
                  <div style={{ flex: 1, minWidth: 160, position: "relative" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filtrer dans la liste..." style={{ width: "100%", padding: "7px 14px 7px 32px", borderRadius: 9999, border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                  </div>
                </div>

                {/* Table */}
                <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 18, overflow: "hidden", boxShadow: "0 1px 0 rgba(255,255,255,0.5) inset" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", minWidth: 780, borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "var(--paper-3)", borderBottom: "1px solid var(--line)" }}>
                          <th style={{ ...thStyle, width: 28 }} />
                          <th style={thStyle}>Action</th>
                          <th style={{ ...thStyle, textAlign: "right" }}>Prix</th>
                          <th style={{ ...thStyle, textAlign: "right" }}>1 J ↓</th>
                          <th style={{ ...thStyle, textAlign: "right" }}>7 J</th>
                          <th style={{ ...thStyle, textAlign: "right" }}>30 J</th>
                          <th style={{ ...thStyle, textAlign: "center" }}>Tendance 30 J</th>
                          <th style={thStyle}>Signal IA</th>
                          <th style={{ ...thStyle, textAlign: "right" }}>Note</th>
                          <th style={{ ...thStyle, width: 32 }} />
                        </tr>
                      </thead>
                      <tbody>
                        {loading && Array.from({ length: 4 }).map((_, i) => (
                          <tr key={i}><td colSpan={10} style={{ padding: 0 }}><div className="skeleton" style={{ height: 62, margin: 0, borderRadius: 0 }} /></td></tr>
                        ))}
                        {!loading && filteredStocks.map((stock, i) => {
                          const isPos = stock.changePercent >= 0;
                          const price = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(stock.currentPrice);
                          const inWl  = watchlistSymbols.includes(stock.symbol);
                          const bg    = avatarBg(stock.name);
                          const hist  = histData[stock.symbol];
                          const p7    = hist?.change7d;
                          const p30   = hist?.change30d;
                          return (
                            <tr key={stock.symbol}
                              style={{ borderBottom: i < filteredStocks.length - 1 ? "1px solid var(--line)" : "none", transition: "background .12s" }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.37)")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                              <td style={{ padding: "0 4px 0 12px", textAlign: "center", verticalAlign: "middle" }}>
                                <button onClick={() => inWl ? handleUnfollow(stock.symbol) : handleFollow(stock.symbol, stock.name)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: inWl ? "#C9A24E" : "var(--muted)" }}>
                                  <Star size={15} strokeWidth={1.8} fill={inWl ? "#C9A24E" : "none"} />
                                </button>
                              </td>
                              <td style={{ padding: "14px 12px", verticalAlign: "middle" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 180 }}>
                                  <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: bg, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700, color: "#F6F2E8", border: "1px solid rgba(0,0,0,0.08)" }}>
                                    {initials(stock.name)}
                                  </div>
                                  <div style={{ minWidth: 0 }}>
                                    <Link href={`/stock/${stock.symbol}`} style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--ink)", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {stock.name}
                                    </Link>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: "14px 12px", textAlign: "right", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                                <div style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{price}</div>
                                <div style={{ fontSize: 11, color: "var(--muted)" }}>{stock.currency}</div>
                              </td>
                              <td style={{ padding: "14px 12px", textAlign: "right", verticalAlign: "middle", fontFamily: "var(--font-geist-mono, monospace)", fontSize: 13, fontWeight: 600, color: isPos ? "var(--signal-up)" : "var(--signal-down)", whiteSpace: "nowrap" }}>
                                {isPos ? "▲ +" : "▼ "}{stock.changePercent.toFixed(2)} %
                              </td>
                              <td style={{ padding: "14px 12px", textAlign: "right", verticalAlign: "middle", fontFamily: "var(--font-geist-mono, monospace)", fontSize: 13, color: p7 == null ? "var(--muted)" : p7 >= 0 ? "var(--signal-up)" : "var(--signal-down)", whiteSpace: "nowrap" }}>
                                {p7 == null ? "—" : `${p7 >= 0 ? "+" : ""}${p7.toFixed(1)} %`}
                              </td>
                              <td style={{ padding: "14px 12px", textAlign: "right", verticalAlign: "middle", fontFamily: "var(--font-geist-mono, monospace)", fontSize: 13, color: p30 == null ? "var(--muted)" : p30 >= 0 ? "var(--signal-up)" : "var(--signal-down)", whiteSpace: "nowrap" }}>
                                {p30 == null ? "—" : `${p30 >= 0 ? "+" : ""}${p30.toFixed(1)} %`}
                              </td>
                              <td style={{ padding: "14px 12px", textAlign: "center", verticalAlign: "middle" }}>
                                <Sparkline data={hist?.sparkline ?? []} positive={p30 == null || p30 >= 0} />
                              </td>
                              <td style={{ padding: "14px 12px", verticalAlign: "middle" }}>
                                <SignalBadge signal={stock.valuation?.signal} />
                              </td>
                              <td style={{ padding: "14px 12px", textAlign: "right", verticalAlign: "middle" }}>
                                <ScoreCell score={stock.valuation?.score} />
                              </td>
                              <td style={{ padding: "14px 10px", textAlign: "center", verticalAlign: "middle" }}>
                                <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4, fontSize: 18, letterSpacing: 1 }}>···</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {!loading && stocks.length > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderTop: "1px solid var(--line)", background: "var(--paper-3)", fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)" }}>
                      <span>{filteredStocks.length} action{filteredStocks.length > 1 ? "s" : ""} · trié par variation 1J décroissante</span>
                    </div>
                  )}
                </div>

                {/* Recommendations */}
                {recs.length > 0 && (
                  <div style={{ marginTop: 52 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
                      <div>
                        <h2 style={{ fontFamily: "var(--font-instrument, serif)", fontSize: "clamp(28px,3vw,38px)", fontWeight: 400, color: "var(--ink)", margin: 0, letterSpacing: "-0.015em" }}>
                          Tu pourrais <em style={{ fontStyle: "italic", color: "var(--signal-up)" }}>aussi suivre</em>.
                        </h2>
                        <p style={{ fontSize: 13, color: "var(--muted)", margin: "6px 0 0" }}>
                          {recs.length} action{recs.length > 1 ? "s" : ""} sélectionnée{recs.length > 1 ? "s" : ""} en fonction de ta liste et de ton profil équilibré.
                        </p>
                      </div>
                      <button style={{ padding: "9px 18px", borderRadius: 9999, border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)", fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
                        Voir toutes les idées →
                      </button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 52 }}>
                      {recs.map((rec) => {
                        const bg = avatarBg(rec.name);
                        const isPos = (rec.changePercent ?? 0) >= 0;
                        return (
                          <div key={rec.symbol} style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 18, padding: 22, display: "flex", flexDirection: "column" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700, color: "#F6F2E8", flexShrink: 0 }}>
                                  {initials(rec.name)}
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>{rec.name}</div>
                              </div>
                              <SignalBadge signal={rec.signal} small />
                            </div>
                            <div style={{ flexGrow: 1 }} />
                            <div style={{ borderTop: "1px dashed var(--line)", paddingTop: 12, marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <div style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 13 }}>
                                {rec.currentPrice != null ? (
                                  <>
                                    <span style={{ color: "var(--ink)", fontWeight: 600 }}>{new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(rec.currentPrice)} {rec.currency ?? ""}</span>
                                    {rec.changePercent != null && <span style={{ color: isPos ? "var(--signal-up)" : "var(--signal-down)", marginLeft: 8 }}>{isPos ? "+" : ""}{rec.changePercent.toFixed(2)} %</span>}
                                  </>
                                ) : <span style={{ color: "var(--muted)" }}>—</span>}
                              </div>
                              <button onClick={() => handleFollow(rec.symbol, rec.name)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 9999, border: "none", background: "var(--ink)", color: "var(--paper)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                                + Suivre
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ═══ RIGHT SIDEBAR ═══ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 24 }}>

            {/* Alertes */}
            {alerts.length > 0 && (
              <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 16, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <h3 style={{ margin: 0, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)" }}>Alertes</h3>
                  <span style={{ background: "#1F5C3E", color: "#F6F2E8", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 9999, fontFamily: "var(--font-geist-mono, monospace)" }}>
                    {alerts.length} nouvelle{alerts.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {alerts.map((s, i) => {
                    const sig = s.valuation?.signal;
                    const isStrongBuy = sig === "STRONG_BUY";
                    const isSell = sig === "SELL" || sig === "STRONG_SELL";
                    const iconBg = isStrongBuy ? "#D6E4D6" : "#EBD7D2";
                    const iconColor = isStrongBuy ? "#1F5C3E" : "#B84A3E";
                    const title = isStrongBuy ? `${s.name} — passe en Achat fort` : isSell ? `${s.name} — signal de vente` : `${s.name} — à surveiller`;
                    const desc = isStrongBuy ? "L'IA détecte un signal d'élan haussier durable." : isSell ? "Valorisation tendue — risque de correction." : "Signal modéré — surveiller les prochains jours.";
                    return (
                      <div key={s.symbol} style={{ padding: "12px 0", borderBottom: i < alerts.length - 1 ? "1px dashed var(--line)" : "none", display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: iconBg, display: "grid", placeItems: "center", flexShrink: 0 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            {isStrongBuy ? <path d="M5 12l5 5L20 7"/> : <path d="M12 8v4M12 16h.01"/>}
                          </svg>
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 3, lineHeight: 1.4 }}>{title}</div>
                          <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>{desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Market indices */}
            <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 16, padding: 20 }}>
              <h3 style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)" }}>Marchés</h3>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {MARKET_INDICES.map((idx, i) => {
                  const d = mktData[idx.symbol];
                  const up = d == null || d.changePercent >= 0;
                  return (
                    <div key={idx.symbol} style={{ padding: "11px 0", borderBottom: i < MARKET_INDICES.length - 1 ? "1px dashed var(--line)" : "none", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{idx.label}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{idx.desc}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        {d ? (
                          <>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", fontFamily: "var(--font-geist-mono, monospace)" }}>
                              {new Intl.NumberFormat("fr-FR", { minimumFractionDigits: idx.isRate ? 4 : 2, maximumFractionDigits: idx.isRate ? 4 : 2 }).format(d.price)}
                            </div>
                            <div style={{ fontSize: 11, color: up ? "var(--signal-up)" : "var(--signal-down)", fontFamily: "var(--font-geist-mono, monospace)" }}>
                              {up ? "▲ +" : "▼ "}{d.changePercent.toFixed(2)} %
                            </div>
                          </>
                        ) : <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)" }}>—</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Astuce */}
            <div style={{ background: "linear-gradient(135deg,#E9F0E5 0%,#F4F1E2 100%)", border: "1px solid var(--line)", borderRadius: 16, padding: 20 }}>
              <h3 style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#1F5C3E", fontFamily: "var(--font-geist-mono, monospace)" }}>Astuce</h3>
              <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--ink)", lineHeight: 1.6 }}>
                Les signaux <strong>Achat fort</strong> sont calibrés sur 3 à 5 ans. Évite de réagir aux variations d&apos;un jour — laisse parler ton horizon.
              </p>
              <Link href="/glossaire" style={{ fontSize: 12, color: "#1F5C3E", fontWeight: 600, textDecoration: "none" }}>
                Comprendre les signaux →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 64 }}>
        <Footer />
      </div>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} watchlistSymbols={watchlistSymbols} onFollow={handleFollow} onUnfollow={handleUnfollow} />
    </div>
  );
}

/* ── Small helper components ── */
function KpiCard({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 14, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 7 }}>{icon}{label}</span>
      {children}
    </div>
  );
}
function CheckIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>; }
function ArrowIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M5 12h14"/></svg>; }
function ClockIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/></svg>; }
function ChartIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m7 14 4-4 4 3 5-7"/></svg>; }
