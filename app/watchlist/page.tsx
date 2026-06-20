"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { SearchModal } from "@/components/SearchModal";
import { createClient } from "@/lib/supabase";
import { Star, Plus, Download, TrendingUp, TrendingDown, Clock, BarChart2, Search, Sparkles } from "lucide-react";
import Footer from "@/components/Footer";
import CompanyLogo from "@/components/CompanyLogo";
import CircleAction from "@/components/CircleAction";
import { useMobile } from "@/lib/useMobile";

const USD_TO_EUR = 0.92;

interface WatchItem { symbol: string; name: string; }
interface StockData {
  symbol: string; name: string; currentPrice: number;
  change: number; changePercent: number; currency: string;
  sector?: string;
  valuation?: { fairValue: number; upside: number; signal: string; score: number };
}
interface Market { label: string; desc: string; price: number | null; change: number | null; }
interface Idea { symbol: string; name: string; price: number; currency: string; change: number; signal: string; score: number; reason: string; }

const SIG_LABEL: Record<string, string> = {
  STRONG_BUY: "Très sous-évalué", BUY: "Sous-évalué", HOLD: "Neutre",
  SELL: "À surveiller", STRONG_SELL: "Surévalué",
};
const SIG_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  STRONG_BUY: { bg: "#1F5C3E",            color: "#F6F2E8",            border: "#1F5C3E" },
  BUY:        { bg: "rgba(45,125,90,0.12)", color: "var(--signal-up)",  border: "rgba(45,125,90,0.30)" },
  HOLD:       { bg: "var(--paper-3)",       color: "var(--muted)",      border: "var(--line)" },
  SELL:       { bg: "rgba(176,125,0,0.10)", color: "#7A5A1F",           border: "rgba(176,125,0,0.30)" },
  STRONG_SELL:{ bg: "rgba(184,74,58,0.10)", color: "var(--signal-down)",border: "rgba(184,74,58,0.30)" },
};

function Sparkline({ up, points }: { up: boolean; points?: number[] }) {
  const color = up ? "#16a34a" : "#dc2626";

  // Données réelles intraday disponibles → on trace la vraie courbe
  if (points && points.length >= 2) {
    const W = 68, H = 28, PAD = 3;
    const xs = points.map((_, i) => PAD + (i / (points.length - 1)) * (W - 2 * PAD));
    const ys = points.map(v => PAD + (1 - v) * (H - 2 * PAD)); // haut prix = bas y
    const ptsStr = xs.map((x, i) => `${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
    return (
      <svg width={68} height={28} viewBox="0 0 68 28" fill="none" aria-hidden="true">
        <polyline points={ptsStr} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // Fallback : diagonale simple si pas encore de données
  const fallback = up
    ? "4,22 14,18 24,14 34,16 44,11 54,7 64,4"
    : "4,5 14,9 24,13 34,11 44,15 54,19 64,22";
  return (
    <svg width={68} height={28} viewBox="0 0 68 28" fill="none" aria-hidden="true">
      <polyline points={fallback} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function fmtEur(amount: number, currency: string): string {
  const eur = currency === "USD" ? amount * USD_TO_EUR : amount;
  if (eur >= 1e9)  return `${(eur / 1e9).toFixed(1)} Md€`;
  if (eur >= 1000) return `${eur.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} €`;
  return `${eur.toFixed(2)} €`;
}

function SignalBadge({ signal }: { signal: string }) {
  const s = SIG_STYLE[signal] ?? SIG_STYLE.HOLD;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 9999, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: "nowrap" }}>
      {(signal === "STRONG_BUY" || signal === "BUY") && <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.color, flexShrink: 0 }} />}
      {SIG_LABEL[signal] ?? signal}
    </span>
  );
}

export default function WatchlistPage() {
  const isMobile = useMobile();
  const [items, setItems]       = useState<WatchItem[]>([]);
  const [stocks, setStocks]     = useState<StockData[]>([]);
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({});
  const [markets, setMarkets]   = useState<Market[]>([]);
  const [suggestions, setSuggestions] = useState<Idea[]>([]);
  const [loading, setLoading]   = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filter, setFilter]     = useState<"all"|"buy"|"watch"|"sell">("all");
  const [query, setQuery]       = useState("");
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const supabase = createClient();

  const loadWatchlist = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    setLoggedIn(!!data.user);
    let symbols: WatchItem[] = [];
    if (data.user) {
      const res = await fetch("/api/watchlist");
      symbols = await res.json();
    } else {
      const saved = JSON.parse(localStorage.getItem("watchlist") ?? "[]") as string[];
      symbols = saved.map(s => ({ symbol: s, name: localStorage.getItem(`watchlist-name-${s}`) ?? s }));
    }
    setItems(symbols);
    if (!symbols.length) { setLoading(false); return; }
    const results = await Promise.allSettled(symbols.map(w => fetch(`/api/stock/${w.symbol}`).then(r => r.json())));
    const d2 = results.filter((r): r is PromiseFulfilledResult<StockData> => r.status === "fulfilled" && !r.value?.error).map(r => r.value);
    setStocks(d2);
    setLoading(false);

    // Charger les sparklines intraday en arrière-plan (non bloquant)
    Promise.allSettled(
      d2.map(s =>
        fetch(`/api/stock/${s.symbol}/spark`)
          .then(r => r.json())
          .then(({ points }) => ({ symbol: s.symbol, points: points ?? [] }))
          .catch(() => ({ symbol: s.symbol, points: [] }))
      )
    ).then(res => {
      const map: Record<string, number[]> = {};
      res.forEach(r => {
        if (r.status === "fulfilled" && r.value.points.length >= 2) {
          map[r.value.symbol] = r.value.points;
        }
      });
      setSparklines(map);
    });
  }, []); // eslint-disable-line

  useEffect(() => { loadWatchlist(); }, [loadWatchlist]);

  useEffect(() => {
    fetch("/api/markets").then(r => r.json()).then(setMarkets).catch(() => {});
    fetch("/api/ideas?count=10").then(r => r.json()).then(d => setSuggestions(Array.isArray(d) ? d : (d.ideas ?? []))).catch(() => {});
  }, []);

  const handleFollow = useCallback(async (symbol: string, name: string) => {
    setItems(p => p.find(i => i.symbol === symbol) ? p : [...p, { symbol, name }]);
    if (loggedIn) {
      await fetch("/api/watchlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ symbol, name }) });
    } else {
      const saved = JSON.parse(localStorage.getItem("watchlist") ?? "[]") as string[];
      if (!saved.includes(symbol)) {
        localStorage.setItem("watchlist", JSON.stringify([...saved, symbol]));
        localStorage.setItem(`watchlist-name-${symbol}`, name);
      }
    }
    try { const d = await (await fetch(`/api/stock/${symbol}`)).json(); if (!d.error) setStocks(p => p.find(s => s.symbol === symbol) ? p : [...p, d]); } catch { /**/ }
  }, [loggedIn]);

  const handleUnfollow = useCallback(async (symbol: string) => {
    setItems(p => p.filter(i => i.symbol !== symbol));
    setStocks(p => p.filter(s => s.symbol !== symbol));
    if (loggedIn) await fetch("/api/watchlist", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ symbol }) });
    else {
      const saved = JSON.parse(localStorage.getItem("watchlist") ?? "[]") as string[];
      localStorage.setItem("watchlist", JSON.stringify(saved.filter(s => s !== symbol)));
      localStorage.removeItem(`watchlist-name-${symbol}`);
    }
  }, [loggedIn]);

  // KPIs
  const upStocks  = stocks.filter(s => s.changePercent > 0);
  const topGain   = stocks.reduce<StockData | null>((b, s) => (!b || s.changePercent > b.changePercent) ? s : b, null);
  const avgChg    = stocks.length ? stocks.reduce((sum, s) => sum + s.changePercent * 100, 0) / stocks.length : 0;
  const favCount  = stocks.filter(s => s.valuation?.signal === "STRONG_BUY" || s.valuation?.signal === "BUY").length;

  // Filters
  const filtered = stocks
    .filter(s => {
      if (filter === "buy")   return s.valuation?.signal === "STRONG_BUY" || s.valuation?.signal === "BUY";
      if (filter === "watch") return s.valuation?.signal === "SELL";
      if (filter === "sell")  return s.valuation?.signal === "STRONG_SELL";
      return true;
    })
    .filter(s => !query || s.name.toLowerCase().includes(query.toLowerCase()));

  const watchlistSymbols = items.map(i => i.symbol);
  const suggs = suggestions.filter(s => !watchlistSymbols.includes(s.symbol)).slice(0, 6);

  return (
    <div style={{ background: "var(--paper)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "20px 16px 60px" : "32px 28px 80px" }}>

        {isMobile ? (
          <>
            {/* ── Hero façon Revolut : gros chiffre + contexte ── */}
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.12em", fontFamily: "var(--font-geist-mono, monospace)", textTransform: "uppercase", marginBottom: 8 }}>
                Mes actions
              </div>
              {stocks.length > 0 ? (
                <>
                  <div style={{ fontFamily: "var(--font-instrument, serif)", fontWeight: 400, fontSize: 44, lineHeight: 1, letterSpacing: "-0.02em", color: avgChg >= 0 ? "var(--signal-up)" : "var(--signal-down)" }}>
                    {avgChg >= 0 ? "+" : ""}{avgChg.toFixed(2)} %
                  </div>
                  <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>
                    Variation moyenne aujourd&apos;hui · {upStocks.length}/{stocks.length} en hausse
                  </div>
                </>
              ) : (
                <h1 style={{ fontFamily: "var(--font-instrument, serif)", fontWeight: 400, fontSize: 32, letterSpacing: "-0.02em", margin: 0 }}>
                  Mes <em style={{ fontStyle: "italic", color: "var(--accent)" }}>actions</em>.
                </h1>
              )}
              {!loggedIn && (
                <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 10 }}>
                  <Link href="/auth/login" style={{ color: "var(--accent)", fontWeight: 600 }}>Connexion</Link> pour synchroniser tes actions entre appareils.
                </p>
              )}
            </div>

            {/* ── Actions circulaires ── */}
            <div style={{ display: "flex", justifyContent: "space-around", margin: "22px 0 24px" }}>
              <CircleAction icon={<Plus size={18} strokeWidth={2.3} />} label="Ajouter" primary onClick={() => setSearchOpen(true)} />
              <CircleAction icon={<Search size={18} strokeWidth={2} />} label="Chercher" onClick={() => setShowMobileSearch(s => !s)} />
              <CircleAction icon={<Sparkles size={18} strokeWidth={2} />} label="Idées" onClick={() => { window.location.href = "/idees"; }} />
            </div>

            {showMobileSearch && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--paper-2)", border: "1.5px solid var(--line)", borderRadius: 9999, padding: "9px 14px", marginBottom: 16 }}>
                <Search size={13} color="var(--muted)" />
                <input
                  autoFocus
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Filtrer par nom d'entreprise…"
                  style={{ border: "none", background: "transparent", outline: "none", color: "var(--ink)", fontSize: 13, flex: 1, fontFamily: "inherit" }}
                />
              </div>
            )}
          </>
        ) : (
          <>
            {/* Breadcrumb */}
            <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.12em", fontFamily: "var(--font-geist-mono, monospace)", marginBottom: 16, textTransform: "uppercase", display: "flex", gap: 8 }}>
              <Link href="/" style={{ color: "var(--muted)" }}>Finazen</Link>
              <span>/</span><span>Mes actions</span>
            </div>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
              <div>
                <h1 style={{ fontFamily: "var(--font-instrument, serif)", fontWeight: 400, fontSize: "clamp(36px, 5vw, 58px)", letterSpacing: "-0.02em", lineHeight: 1.05, margin: "0 0 8px" }}>
                  Mes <em style={{ fontStyle: "italic", color: "var(--accent)" }}>actions</em>.
                </h1>
                <p style={{ fontSize: 15, color: "var(--muted)", maxWidth: 540, lineHeight: 1.6, margin: 0 }}>
                  {items.length} valeur{items.length !== 1 ? "s" : ""} suivie{items.length !== 1 ? "s" : ""} — surveille les signaux, compare leur santé et garde un œil sur les opportunités qui te ressemblent.
                  {!loggedIn && <span style={{ marginLeft: 8 }}>· <Link href="/auth/login" style={{ color: "var(--accent)", fontWeight: 600 }}>Connexion</Link> pour synchroniser.</span>}
                </p>
              </div>
              <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 9999, border: "1.5px solid var(--line)", background: "transparent", color: "var(--ink)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                  <Download size={14} strokeWidth={1.8} /> Exporter
                </button>
                <button onClick={() => setSearchOpen(true)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 20px", borderRadius: 9999, border: "none", background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  <Plus size={14} strokeWidth={2.5} />Ajouter une action
                </button>
              </div>
            </div>
          </>
        )}

        {/* KPIs — desktop uniquement (mobile a son propre hero ci-dessus) */}
        {stocks.length > 0 && !isMobile && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
              {[
                { icon: <TrendingUp size={13} />, label: "En hausse aujourd'hui", big: String(upStocks.length), sub: `/ ${stocks.length}`, meta: `${avgChg > 0 ? "+" : ""}${avgChg.toFixed(2)} % en moyenne`, green: upStocks.length > stocks.length / 2 },
                { icon: <span>←</span>, label: "Plus forte hausse", big: topGain ? topGain.name.split(/[\s,]/)[0] : "—", sub: "", meta: topGain ? `▲ ${(topGain.changePercent * 100).toFixed(2)} % · ${fmtEur(topGain.currentPrice, topGain.currency)}` : "", green: true },
                { icon: <Clock size={13} />, label: "Signaux achat", big: String(favCount), sub: `/ ${stocks.length}`, meta: stocks.filter(s => s.valuation?.signal === "STRONG_BUY").map(s => s.name.split(" ")[0]).slice(0, 2).join(" · ") || "—", green: favCount > 0 },
                { icon: <BarChart2 size={13} />, label: "Variation aujourd'hui", big: `${avgChg >= 0 ? "+" : ""}${avgChg.toFixed(1)}`, sub: " %", meta: `Moyenne de tes ${stocks.length} positions`, green: avgChg >= 0 },
              ].map((k, i) => (
                <div key={i} style={{ background: "var(--paper-2)", border: "1.5px solid var(--line)", borderRadius: 16, padding: "18px 22px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--muted)", marginBottom: 10 }}>{k.icon} {k.label}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                    <span style={{ fontFamily: "var(--font-instrument, serif)", fontSize: 36, lineHeight: 1, color: k.green ? "var(--signal-up)" : "var(--ink)", letterSpacing: "-0.02em" }}>{k.big}</span>
                    {k.sub && <span style={{ fontSize: 14, color: "var(--muted)" }}>{k.sub}</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6, fontFamily: "var(--font-geist-mono, monospace)" }}>{k.meta}</div>
                </div>
              ))}
            </div>
        )}

        {/* Empty state */}
        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 24px", border: "1.5px dashed var(--line)", borderRadius: 18, background: "var(--paper-2)" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Star size={24} strokeWidth={1.5} color="var(--accent)" />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>Aucune action suivie</h2>
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 24 }}>Ajoutez vos premières actions pour surveiller leurs signaux.</p>
            <button onClick={() => setSearchOpen(true)} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 24px", borderRadius: 9999, background: "var(--accent)", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", border: "none" }}>
              <Plus size={14} /> Ajouter une action
            </button>
          </div>
        ) : (
          <div style={{ display: isMobile ? "block" : "grid", gridTemplateColumns: isMobile ? undefined : "1fr 290px", gap: 24, alignItems: "start" }}>

            {/* Table */}
            <div>
              {/* Toolbar */}
              <div style={{ display: "flex", flexWrap: isMobile ? "nowrap" : "wrap", gap: 10, marginBottom: 14, alignItems: "center", overflowX: isMobile ? "auto" : undefined }}>
                <div style={{ display: "flex", background: "var(--paper-2)", border: "1.5px solid var(--line)", borderRadius: 9999, padding: 4, gap: 2, flexShrink: 0 }}>
                  {([["all", `Tous ${stocks.length}`], ["buy", `Sous-évalués ${stocks.filter(s => s.valuation?.signal === "STRONG_BUY").length}`], ["watch", `À surveiller ${stocks.filter(s => s.valuation?.signal === "SELL").length}`], ["sell", `Surévalués ${stocks.filter(s => s.valuation?.signal === "STRONG_SELL").length}`]] as const).map(([k, l]) => (
                    <button key={k} onClick={() => setFilter(k)} style={{ padding: "6px 13px", borderRadius: 9999, border: "none", fontSize: 12, fontWeight: filter === k ? 700 : 500, background: filter === k ? "var(--ink)" : "transparent", color: filter === k ? "var(--paper)" : "var(--muted)", cursor: "pointer", whiteSpace: "nowrap" }}>{l}</button>
                  ))}
                </div>
                {!isMobile && (
                  <div style={{ flex: 1, minWidth: 180, display: "flex", alignItems: "center", gap: 8, background: "var(--paper-2)", border: "1.5px solid var(--line)", borderRadius: 9999, padding: "7px 13px" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
                    <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Filtrer par nom d'entreprise…" style={{ border: "none", background: "transparent", outline: "none", color: "var(--ink)", fontSize: 13, flex: 1, fontFamily: "inherit" }} />
                  </div>
                )}
              </div>

              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{items.map(w => <div key={w.symbol} className="skeleton" style={{ height: 64, borderRadius: 10 }} />)}</div>
              ) : isMobile ? (
                /* ── Mobile card list ── */
                <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 18, overflow: "hidden", boxShadow: "0 1px 3px rgba(10,22,40,0.04)" }}>
                  {filtered.map((s, i) => {
                    const isUp = s.changePercent >= 0;
                    const sig  = s.valuation?.signal ?? "HOLD";
                    return (
                      <div key={s.symbol}
                        onClick={() => window.location.href = `/stock/${s.symbol}`}
                        style={{ display: "flex", gap: 12, padding: "14px 16px", alignItems: "center", borderBottom: i < filtered.length - 1 ? "1px solid var(--line)" : "none", cursor: "pointer" }}
                      >
                        <CompanyLogo symbol={s.symbol} name={s.name} size={42} radius={12} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{s.sector || s.symbol}</div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                          <div style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{fmtEur(s.currentPrice, s.currency)}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 11, fontWeight: 600, color: isUp ? "var(--signal-up)" : "var(--signal-down)" }}>
                              {isUp ? "+" : ""}{(s.changePercent * 100).toFixed(2)} % {isUp ? "▲" : "▼"}
                            </span>
                            <SignalBadge signal={sig} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filtered.length === 0 && (
                    <div style={{ padding: "28px 16px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>Aucune entreprise ne correspond à ce filtre.</div>
                  )}
                  <div style={{ padding: "9px 16px", borderTop: "1px solid var(--line)", fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)", background: "var(--paper-3)" }}>
                    {filtered.length} entreprise{filtered.length !== 1 ? "s" : ""}
                  </div>
                </div>
              ) : (
                <div style={{ background: "var(--paper-2)", border: "1.5px solid var(--line)", borderRadius: 16, overflow: "hidden" }}>
                  {/* Table header */}
                  <div style={{ display: "grid", gridTemplateColumns: "28px 2fr 110px 80px 72px 110px 64px 24px", padding: "10px 16px", borderBottom: "1px solid var(--line)", fontSize: 10, color: "var(--muted)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-geist-mono, monospace)" }}>
                    <span/><span>Entreprise</span>
                    <span style={{ textAlign: "right" }}>Prix (€)</span>
                    <span style={{ textAlign: "right" }}>1 jour</span>
                    <span style={{ textAlign: "center" }}>Tendance</span>
                    <span style={{ textAlign: "center" }}>Valorisation</span>
                    <span style={{ textAlign: "center" }}>Note</span>
                    <span/>
                  </div>

                  {filtered.map((s, i) => {
                    const isUp  = s.changePercent >= 0;
                    const sig   = s.valuation?.signal ?? "HOLD";
                    const score = s.valuation?.score ?? 50;
                    return (
                      <div key={s.symbol}
                        onClick={() => window.location.href = `/stock/${s.symbol}`}
                        style={{ display: "grid", gridTemplateColumns: "28px 2fr 110px 80px 72px 110px 64px 24px", padding: "13px 16px", alignItems: "center", borderBottom: i < filtered.length - 1 ? "1px solid var(--line)" : "none", transition: "background 0.12s", cursor: "pointer" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "var(--paper-3)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        {/* Star */}
                        <button onClick={e => { e.stopPropagation(); handleUnfollow(s.symbol); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--accent)", display: "flex" }}>
                          <Star size={14} fill="var(--accent)" strokeWidth={1.5} />
                        </button>

                        {/* Company — FULL NAME ONLY */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                          <CompanyLogo symbol={s.symbol} name={s.name} size={34} radius={8} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                            {s.sector && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{s.sector}</div>}
                          </div>
                        </div>

                        {/* Price in € */}
                        <div style={{ textAlign: "right", fontFamily: "var(--font-geist-mono, monospace)", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{fmtEur(s.currentPrice, s.currency)}</div>

                        {/* 1J */}
                        <div style={{ textAlign: "right", fontFamily: "var(--font-geist-mono, monospace)", fontSize: 12, fontWeight: 600, color: isUp ? "var(--signal-up)" : "var(--signal-down)", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 3 }}>
                          {isUp ? <TrendingUp size={10}/> : <TrendingDown size={10}/>}
                          {isUp ? "+" : ""}{(s.changePercent * 100).toFixed(2)} %
                        </div>

                        {/* Sparkline */}
                        <div style={{ display: "flex", justifyContent: "center" }}>
                          <Sparkline up={isUp} points={sparklines[s.symbol]} />
                        </div>

                        {/* Signal */}
                        <div style={{ display: "flex", justifyContent: "center" }}>
                          <SignalBadge signal={sig} />
                        </div>

                        {/* Score */}
                        <div style={{ textAlign: "center" }}>
                          <span style={{ fontFamily: "var(--font-instrument, serif)", fontSize: 22, color: score >= 70 ? "var(--signal-up)" : score >= 50 ? "#b07d00" : "var(--signal-down)" }}>{score}</span>
                          <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)" }}>/100</span>
                        </div>

                        {/* Remove */}
                        <button onClick={e => { e.stopPropagation(); handleUnfollow(s.symbol); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--muted)", fontSize: 14 }} title="Retirer">···</button>
                      </div>
                    );
                  })}

                  {filtered.length === 0 && (
                    <div style={{ padding: "28px 16px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>Aucune entreprise ne correspond à ce filtre.</div>
                  )}

                  <div style={{ padding: "9px 16px", borderTop: "1px solid var(--line)", fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)", background: "var(--paper-3)" }}>
                    {filtered.length} entreprise{filtered.length !== 1 ? "s" : ""}
                  </div>
                </div>
              )}
            </div>

            {/* Side — hidden on mobile */}
            {!isMobile && <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 80 }}>
              {/* Marchés */}
              <div style={{ background: "var(--paper-2)", border: "1.5px solid var(--line)", borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.12em", fontFamily: "var(--font-geist-mono, monospace)", marginBottom: 14, textTransform: "uppercase" }}>Marchés du jour</div>
                {markets.length === 0
                  ? Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 42, borderRadius: 8, marginBottom: 8 }} />)
                  : markets.map((m, i) => (
                    <div key={m.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "9px 0", borderBottom: i < markets.length - 1 ? "1px dashed var(--line)" : "none" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{m.label}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.4, marginTop: 1 }}>{m.desc}</div>
                      </div>
                      <div style={{ textAlign: "right", fontFamily: "var(--font-geist-mono, monospace)", flexShrink: 0 }}>
                        {m.price !== null
                          ? <>
                              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>
                                {m.label === "EUR / USD" ? m.price.toFixed(4) : m.label === "OAT 10 ans" ? `${m.price.toFixed(2)} %` : m.price.toLocaleString("fr-FR", { maximumFractionDigits: 0 })}
                              </div>
                              {m.change !== null && <div style={{ fontSize: 11, color: m.change >= 0 ? "var(--signal-up)" : "var(--signal-down)", marginTop: 2 }}>{m.change >= 0 ? "▲" : "▼"} {Math.abs(m.change).toFixed(2)} %</div>}
                            </>
                          : <div style={{ fontSize: 12, color: "var(--muted)" }}>—</div>
                        }
                      </div>
                    </div>
                  ))
                }
              </div>

              {/* Astuce */}
              <div style={{ background: "linear-gradient(180deg, #E9F0E5 0%, #F4F1E2 100%)", border: "1px solid rgba(45,125,90,0.25)", borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.12em", fontFamily: "var(--font-geist-mono, monospace)", marginBottom: 10, textTransform: "uppercase" }}>Astuce</div>
                <p style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.6, margin: 0 }}>Les signaux <strong>Très sous-évalué</strong> sont calibrés sur 3 à 5 ans. Évite de réagir aux variations d'un jour — laisse parler ton horizon.</p>
                <Link href="/faq" style={{ display: "inline-block", marginTop: 10, fontSize: 13, color: "var(--accent)", fontWeight: 600 }}>Comprendre les signaux →</Link>
              </div>
            </div>}
          </div>
        )}

        {/* ── Suggestions — 6 cards ── */}
        <section style={{ marginTop: 64 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-instrument, serif)", fontWeight: 400, fontSize: "clamp(28px, 4vw, 44px)", letterSpacing: "-0.015em", margin: 0 }}>
                Tu pourrais <em style={{ fontStyle: "italic", color: "var(--accent)" }}>aussi suivre</em>.
              </h2>
              <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--muted)" }}>Sélection mise à jour chaque jour selon les opportunités du moment.</p>
            </div>
            <Link href="/idees" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 20px", borderRadius: 9999, border: "1.5px solid var(--line)", color: "var(--ink)", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap" }}>Voir toutes les idées →</Link>
          </div>

          {suggs.length === 0
            ? <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 16 }}>{Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 14 }} />)}</div>
            : <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {suggs.map(s => (
                  <div key={s.symbol} style={{ background: "var(--paper-2)", border: "1.5px solid var(--line)", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 10, transition: "transform 0.2s, border-color 0.2s", cursor: "pointer" }}
                    onClick={() => window.location.href = `/stock/${s.symbol}`}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "none"; (e.currentTarget as HTMLElement).style.borderColor = "var(--line)"; }}
                  >
                    {/* Header: logo + nom complet sur 2 lignes si besoin + signal */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <CompanyLogo symbol={s.symbol} name={s.name} size={36} radius={9} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Nom COMPLET — pas de troncature */}
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", lineHeight: 1.35 }}>{s.name}</div>
                      </div>
                      <div style={{ flexShrink: 0 }}>
                        <SignalBadge signal={s.signal} />
                      </div>
                    </div>

                    {/* Description de l'opportunité */}
                    <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, margin: 0, flex: 1 }}>{s.reason}</p>

                    {/* Footer: prix + boutons */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px dashed var(--line)" }}>
                      <span style={{ fontSize: 13, fontFamily: "var(--font-geist-mono, monospace)", color: "var(--ink)" }}>
                        {fmtEur(s.price, s.currency)}{" "}
                        <span style={{ color: s.change >= 0 ? "var(--signal-up)" : "var(--signal-down)", fontWeight: 600 }}>{s.change >= 0 ? "+" : ""}{(s.change * 100).toFixed(2)} %</span>
                      </span>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Link href={`/stock/${s.symbol}`} onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 11px", borderRadius: 9999, border: "1.5px solid var(--line)", color: "var(--muted)", fontSize: 11, fontWeight: 500, whiteSpace: "nowrap" }}>
                          Analyser
                        </Link>
                        <button onClick={e => { e.stopPropagation(); handleFollow(s.symbol, s.name); }} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 9999, background: "var(--ink)", color: "var(--paper)", border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                          <Plus size={10} strokeWidth={2.5} /> Suivre
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
          }
        </section>
      </div>

      <Footer />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} watchlistSymbols={watchlistSymbols} onFollow={handleFollow} onUnfollow={handleUnfollow} />
    </div>
  );
}
