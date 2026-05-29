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
  valuation?: { fairValue: number; upside: number; signal: "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL"; score: number; };
}

type SignalKey = "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL";

const SIGNAL_MAP: Record<SignalKey, { bg: string; color: string; label: string }> = {
  STRONG_BUY: { bg: "#1F5C3E", color: "#F6F2E8", label: "Achat fort" },
  BUY:        { bg: "#D6E4D6", color: "#1F5C3E", label: "Achat" },
  HOLD:       { bg: "#E8E0CE", color: "#3A3E33", label: "Neutre" },
  SELL:       { bg: "#EBD7D2", color: "#B84A3E", label: "Vendre" },
  STRONG_SELL:{ bg: "#EBD7D2", color: "#B84A3E", label: "Vendre" },
};

const AVATAR_COLORS = [
  "#1F5C3E","#2d5e7e","#7e3d2d","#5e2d7e","#7e6b2d",
  "#2d7e5e","#3d2d7e","#7e2d5e","#2d6e7e","#5e7e2d",
];
function avatarColor(sym: string) {
  let h = 0;
  for (const c of sym) h = (h * 31 + c.charCodeAt(0)) & 0x7fffffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function SignalBadge({ signal }: { signal?: SignalKey }) {
  if (!signal) return <span style={{ color: "var(--muted)", fontSize: 12 }}>—</span>;
  const s = SIGNAL_MAP[signal];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "3px 10px", borderRadius: 9999,
      background: s.bg, color: s.color,
      fontSize: 12, fontWeight: 600,
      fontFamily: "var(--font-geist-mono, monospace)",
      whiteSpace: "nowrap",
    }}>{s.label}</span>
  );
}

function ScoreCell({ score }: { score?: number }) {
  if (score === undefined) return <span style={{ color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)", fontSize: 13 }}>— /100</span>;
  const color = score >= 70 ? "var(--signal-up)" : score >= 50 ? "var(--signal-neutral)" : "var(--signal-down)";
  return (
    <span style={{ color, fontFamily: "var(--font-geist-mono, monospace)", fontSize: 13, fontWeight: 600 }}>
      {score} <span style={{ color: "var(--muted)", fontWeight: 400 }}>/100</span>
    </span>
  );
}

export default function WatchlistPage() {
  const { t } = useSettings();
  const [items, setItems]     = useState<WatchItem[]>([]);
  const [stocks, setStocks]   = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
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
      symbols = saved.map((s) => ({ symbol: s, name: localStorage.getItem(`watchlist-name-${s}`) ?? s }));
    }
    setItems(symbols);

    if (symbols.length === 0) { setLoading(false); return; }

    const results = await Promise.allSettled(
      symbols.map((w) => fetch(`/api/stock/${w.symbol}`).then((r) => r.json()))
    );
    const data2 = results
      .filter((r): r is PromiseFulfilledResult<StockData> => r.status === "fulfilled" && !r.value?.error)
      .map((r) => r.value);
    setStocks(data2);
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadWatchlist(); }, [loadWatchlist]);

  /* ── Watchlist actions (optimistic) ── */
  const handleFollow = useCallback(async (symbol: string, name: string) => {
    // Optimistic update
    setItems((prev) => prev.find((i) => i.symbol === symbol) ? prev : [...prev, { symbol, name }]);

    if (loggedIn) {
      await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, name }),
      });
    } else {
      const saved = JSON.parse(localStorage.getItem("watchlist") ?? "[]") as string[];
      if (!saved.includes(symbol)) {
        localStorage.setItem("watchlist", JSON.stringify([...saved, symbol]));
        localStorage.setItem(`watchlist-name-${symbol}`, name);
      }
    }
    // Refresh stock data for the new item
    try {
      const res = await fetch(`/api/stock/${symbol}`);
      const d = await res.json();
      if (!d.error) setStocks((prev) => prev.find((s) => s.symbol === symbol) ? prev : [...prev, d]);
    } catch { /* ignore */ }
  }, [loggedIn]);

  const handleUnfollow = useCallback(async (symbol: string) => {
    // Optimistic update
    setItems((prev) => prev.filter((i) => i.symbol !== symbol));
    setStocks((prev) => prev.filter((s) => s.symbol !== symbol));

    if (loggedIn) {
      await fetch("/api/watchlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      });
    } else {
      const saved = JSON.parse(localStorage.getItem("watchlist") ?? "[]") as string[];
      localStorage.setItem("watchlist", JSON.stringify(saved.filter((s) => s !== symbol)));
      localStorage.removeItem(`watchlist-name-${symbol}`);
    }
  }, [loggedIn]);

  const watchlistSymbols = items.map((i) => i.symbol);

  const thStyle: React.CSSProperties = {
    textAlign: "left", fontWeight: 500, fontSize: 11,
    textTransform: "uppercase", letterSpacing: "0.1em",
    color: "var(--muted)", padding: "12px 16px",
    background: "var(--paper-3)", borderBottom: "1px solid var(--line)",
    whiteSpace: "nowrap",
  };

  /* ── Computed KPI data ── */
  const risingCount = stocks.filter((s) => s.changePercent >= 0).length;
  const avgRisingPct = stocks.length > 0
    ? stocks.filter((s) => s.changePercent >= 0).reduce((sum, s) => sum + s.changePercent, 0) / Math.max(risingCount, 1)
    : 0;
  const topGainer = stocks.length > 0
    ? stocks.reduce((best, s) => s.changePercent > best.changePercent ? s : best, stocks[0])
    : null;
  const buySignalCount = stocks.filter((s) => s.valuation?.signal === "STRONG_BUY" || s.valuation?.signal === "BUY").length;
  const scoredStocks = stocks.filter((s) => s.valuation?.score !== undefined);
  const avgScore = scoredStocks.length > 0
    ? Math.round(scoredStocks.reduce((sum, s) => sum + (s.valuation!.score), 0) / scoredStocks.length)
    : null;

  return (
    <div style={{ background: "var(--paper-3)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 28px 80px" }}>

        {/* ── Page header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{
              fontFamily: "var(--font-geist-mono, monospace)", fontSize: 11,
              color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.12em",
              marginBottom: 12, display: "flex", alignItems: "center", gap: 8,
            }}>
              <Link href="/" style={{ color: "var(--muted)" }}>Rently</Link>
              <span style={{ opacity: 0.4 }}>/</span>
              <span>Mes actions</span>
            </div>
            <h1 style={{
              fontFamily: "var(--font-instrument, serif)", fontSize: "clamp(40px,4.4vw,56px)",
              fontWeight: 400, color: "var(--ink)", margin: "0 0 10px 0", lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}>
              Mes <em style={{ fontStyle: "italic", color: "var(--signal-up)" }}>actions</em>.
            </h1>
            <p style={{ fontSize: 15, color: "var(--ink-2, var(--muted))", maxWidth: 560, margin: 0 }}>
              {items.length} valeur{items.length !== 1 ? "s" : ""} suivie{items.length !== 1 ? "s" : ""} — surveillez les signaux, comparez leur santé et gardez un œil sur les opportunités.
            </p>
            {!loggedIn && (
              <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>
                <Link href="/auth/login" style={{ color: "var(--signal-up)", fontWeight: 500 }}>
                  {t("nav.login")}
                </Link>{" "}
                {t("common.sign_in_sync")}
              </p>
            )}
          </div>
          <div style={{ display: "flex", gap: 10, flexShrink: 0, alignItems: "flex-start", paddingTop: 6 }}>
            <button style={{
              display: "flex", alignItems: "center", gap: 7, padding: "10px 18px",
              borderRadius: 9999, border: "1px solid var(--line)",
              background: "var(--paper)", color: "var(--ink)", fontSize: 14,
              fontWeight: 500, cursor: "pointer",
            }}>
              <Download size={13} strokeWidth={2} />
              Exporter
            </button>
            <button onClick={() => setSearchOpen(true)} style={{
              display: "flex", alignItems: "center", gap: 7, padding: "10px 18px",
              borderRadius: 9999, border: "none",
              background: "#1F5C3E", color: "#F6F2E8",
              fontSize: 14, fontWeight: 500, cursor: "pointer",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              Ajouter une action
            </button>
          </div>
        </div>

        {/* ── KPI strip ── */}
        {stocks.length > 0 && !loading && (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14,
            marginBottom: 28,
          }}>
            {/* En hausse */}
            <div style={{
              background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 14,
              padding: "18px 20px", display: "flex", flexDirection: "column", gap: 6,
              minHeight: 108, justifyContent: "space-between",
            }}>
              <span style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                En hausse aujourd&apos;hui
              </span>
              <div style={{ fontFamily: "var(--font-instrument, serif)", fontSize: 36, lineHeight: 1, color: "var(--signal-up)" }}>
                {risingCount} <span style={{ fontSize: 14, color: "var(--muted)", fontFamily: "inherit", marginLeft: 4 }}>/ {stocks.length}</span>
              </div>
              <div style={{ fontSize: 12, color: risingCount > 0 ? "var(--signal-up)" : "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)" }}>
                {risingCount > 0 ? `+${avgRisingPct.toFixed(2)} % en moyenne` : "Aucune hausse"}
              </div>
            </div>

            {/* Plus forte hausse */}
            <div style={{
              background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 14,
              padding: "18px 20px", display: "flex", flexDirection: "column", gap: 6,
              minHeight: 108, justifyContent: "space-between",
            }}>
              <span style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M5 12h14"/></svg>
                Plus forte hausse
              </span>
              <div style={{ fontFamily: "var(--font-instrument, serif)", fontSize: 36, lineHeight: 1, color: "var(--ink)" }}>
                {topGainer ? topGainer.symbol : "—"}
              </div>
              <div style={{
                fontSize: 12, fontFamily: "var(--font-geist-mono, monospace)",
                color: topGainer && topGainer.changePercent >= 0 ? "var(--signal-up)" : "var(--signal-down)",
              }}>
                {topGainer ? `${topGainer.changePercent >= 0 ? "▲ +" : "▼ "}${topGainer.changePercent.toFixed(2)} %` : "—"}
              </div>
            </div>

            {/* Signaux d'achat */}
            <div style={{
              background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 14,
              padding: "18px 20px", display: "flex", flexDirection: "column", gap: 6,
              minHeight: 108, justifyContent: "space-between",
            }}>
              <span style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/></svg>
                Signaux d&apos;achat
              </span>
              <div style={{
                fontFamily: "var(--font-instrument, serif)", fontSize: 36, lineHeight: 1,
                color: buySignalCount > 0 ? "#7A5A1F" : "var(--ink)",
              }}>
                {buySignalCount} <span style={{ fontSize: 14, color: "var(--muted)", fontFamily: "inherit", marginLeft: 4 }}>/ {stocks.length}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)" }}>
                {buySignalCount > 0 ? `${buySignalCount} valeur${buySignalCount > 1 ? "s" : ""} en zone d'achat` : "Aucun signal d'achat"}
              </div>
            </div>

            {/* Note moyenne */}
            <div style={{
              background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 14,
              padding: "18px 20px", display: "flex", flexDirection: "column", gap: 6,
              minHeight: 108, justifyContent: "space-between",
            }}>
              <span style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m7 14 4-4 4 3 5-7"/></svg>
                Note moyenne
              </span>
              <div style={{
                fontFamily: "var(--font-instrument, serif)", fontSize: 36, lineHeight: 1,
                color: avgScore != null ? (avgScore >= 70 ? "var(--signal-up)" : avgScore >= 50 ? "var(--muted)" : "var(--signal-down)") : "var(--muted)",
              }}>
                {avgScore != null ? avgScore : "—"} <span style={{ fontSize: 14, color: "var(--muted)", fontFamily: "inherit", marginLeft: 2 }}>/100</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)" }}>
                {scoredStocks.length > 0 ? `${scoredStocks.length} valeur${scoredStocks.length > 1 ? "s" : ""} analysée${scoredStocks.length > 1 ? "s" : ""}` : "Données insuffisantes"}
              </div>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          /* ── Empty state ── */
          <div style={{
            textAlign: "center", padding: "80px 24px",
            border: "1.5px dashed var(--line)", borderRadius: 18,
            background: "var(--paper)",
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%", background: "var(--accent-soft)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <Star size={24} strokeWidth={1.5} color="var(--signal-up)" />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>
              {t("watchlist.empty_title")}
            </h2>
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 24 }}>
              {t("watchlist.empty_desc")}
            </p>
            <button
              onClick={() => setSearchOpen(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "11px 24px", borderRadius: 9999,
                background: "#1F5C3E", color: "#F6F2E8",
                fontWeight: 500, fontSize: 14, cursor: "pointer", border: "none",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              {t("watchlist.add_btn")}
            </button>
          </div>
        ) : (
          /* ── Table card ── */
          <div style={{
            background: "var(--paper)", border: "1px solid var(--line)",
            borderRadius: 18, overflow: "hidden",
            boxShadow: "0 1px 0 rgba(255,255,255,0.5) inset",
          }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", minWidth: 760, borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Action</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Prix</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>1 J</th>
                    <th style={thStyle}>Signal IA</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Note</th>
                    <th style={{ ...thStyle, width: 40 }} />
                  </tr>
                </thead>
                <tbody>
                  {loading && Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} style={{ padding: 0 }}>
                        <div className="skeleton" style={{ height: 62, margin: 0, borderRadius: 0, borderBottom: "1px solid var(--line)" }} />
                      </td>
                    </tr>
                  ))}
                  {!loading && stocks.map((stock, i) => {
                    const isPos = stock.changePercent >= 0;
                    const price = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(stock.currentPrice);
                    const inWatchlist = watchlistSymbols.includes(stock.symbol);
                    const bg = avatarColor(stock.symbol);
                    return (
                      <tr
                        key={stock.symbol}
                        style={{ borderBottom: i < stocks.length - 1 ? "1px solid var(--line)" : "none", transition: "background .12s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.37)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        {/* Action cell */}
                        <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 200 }}>
                            <div style={{
                              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                              background: bg, display: "grid", placeItems: "center",
                              fontSize: 12, fontWeight: 700, color: "#F6F2E8",
                              fontFamily: "var(--font-geist-mono, monospace)",
                              border: "1px solid rgba(0,0,0,0.08)",
                            }}>
                              {stock.symbol.slice(0, 2)}
                            </div>
                            <div>
                              <div style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                                {stock.symbol}
                              </div>
                              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                                <Link href={`/stock/${stock.symbol}`} style={{ color: "var(--muted)" }}>
                                  {stock.name}
                                </Link>
                              </div>
                            </div>
                          </div>
                        </td>
                        {/* Price */}
                        <td style={{ padding: "14px 16px", textAlign: "right", verticalAlign: "middle", fontFamily: "var(--font-geist-mono, monospace)", fontSize: 14, fontWeight: 500, color: "var(--ink)", whiteSpace: "nowrap" }}>
                          {price} <span style={{ fontSize: 11, color: "var(--muted)" }}>{stock.currency}</span>
                        </td>
                        {/* Change 1J */}
                        <td style={{ padding: "14px 16px", textAlign: "right", verticalAlign: "middle", fontFamily: "var(--font-geist-mono, monospace)", fontSize: 13, fontWeight: 600, color: isPos ? "var(--signal-up)" : "var(--signal-down)", whiteSpace: "nowrap" }}>
                          {isPos ? "▲ +" : "▼ "}{stock.changePercent.toFixed(2)} %
                        </td>
                        {/* Signal */}
                        <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                          <SignalBadge signal={stock.valuation?.signal} />
                        </td>
                        {/* Score */}
                        <td style={{ padding: "14px 16px", textAlign: "right", verticalAlign: "middle" }}>
                          <ScoreCell score={stock.valuation?.score} />
                        </td>
                        {/* Star */}
                        <td style={{ padding: "14px 12px", verticalAlign: "middle", textAlign: "center" }}>
                          <button
                            onClick={() => inWatchlist ? handleUnfollow(stock.symbol) : handleFollow(stock.symbol, stock.name)}
                            title={inWatchlist ? "Retirer de la liste" : "Ajouter à la liste"}
                            style={{
                              background: "none", border: "none", cursor: "pointer",
                              padding: 4, display: "flex", alignItems: "center", justifyContent: "center",
                              color: inWatchlist ? "#C9A24E" : "var(--muted)",
                            }}
                          >
                            <Star size={16} strokeWidth={1.8} fill={inWatchlist ? "#C9A24E" : "none"} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Pager footer */}
            {!loading && stocks.length > 0 && (
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 20px", borderTop: "1px solid var(--line)",
                background: "var(--paper-3)", fontSize: 12, color: "var(--muted)",
              }}>
                <span style={{ fontFamily: "var(--font-geist-mono, monospace)" }}>
                  {stocks.length} action{stocks.length > 1 ? "s" : ""} · trié par ordre d&apos;ajout
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />

      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        watchlistSymbols={watchlistSymbols}
        onFollow={handleFollow}
        onUnfollow={handleUnfollow}
      />
    </div>
  );
}
