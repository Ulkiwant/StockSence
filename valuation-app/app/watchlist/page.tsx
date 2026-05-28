"use client";

import { useEffect, useState, useCallback } from "react";
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

  return (
    <div style={{ background: "var(--paper-3)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 28px 80px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 40, gap: 16, flexWrap: "wrap" }}>
          <div>
            {/* Breadcrumb */}
            <div style={{
              fontFamily: "var(--font-geist-mono, monospace)", fontSize: 11,
              color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em",
              marginBottom: 10,
            }}>
              RENTLY / MES ACTIONS
            </div>
            {/* H1 */}
            <h1 style={{
              fontFamily: "var(--font-instrument, serif)", fontSize: 56,
              fontWeight: 400, color: "var(--ink)", margin: "0 0 12px 0", lineHeight: 1.05,
            }}>
              Mes actions.
            </h1>
            {/* Subtitle */}
            <p style={{ fontSize: 14, color: "var(--muted)", maxWidth: 560 }}>
              {items.length} valeur{items.length !== 1 ? "s" : ""} suivie{items.length !== 1 ? "s" : ""} — surveillez les signaux, comparez leur santé et gardez un œil sur les opportunités qui vous ressemblent.
            </p>
            {!loggedIn && (
              <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>
                <Link href="/auth/login" style={{ color: "var(--accent)", fontWeight: 500 }}>
                  {t("nav.login")}
                </Link>{" "}
                {t("common.sign_in_sync")}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10, flexShrink: 0, alignItems: "flex-start", paddingTop: 8 }}>
            {/* Exporter button — outlined */}
            <button
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "10px 18px", borderRadius: 9999,
                border: "1.5px solid var(--line)",
                background: "transparent",
                color: "var(--ink)", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              <Download size={13} strokeWidth={2} />
              Exporter
            </button>
            {/* Ajouter button — green filled */}
            <button
              onClick={() => setSearchOpen(true)}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "10px 18px", borderRadius: 9999,
                border: "none",
                background: "var(--accent)",
                color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              ＋ Ajouter une action
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          /* Empty state */
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
              <Star size={24} strokeWidth={1.5} color="var(--accent)" />
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
                background: "var(--accent)", color: "#fff",
                fontWeight: 600, fontSize: 13, cursor: "pointer",
                border: "none",
              }}
            >
              ＋ {t("watchlist.add_btn")}
            </button>
          </div>
        ) : (
          /* Table */
          <div style={{
            background: "var(--paper)", border: "1.5px solid var(--line)",
            borderRadius: 18, overflow: "hidden",
          }}>
            {/* Table header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 130px 100px 130px 120px 48px",
              padding: "12px 24px",
              borderBottom: "1.5px solid var(--line)",
              fontFamily: "var(--font-geist-mono, monospace)",
              fontSize: 11, color: "var(--muted)",
              textTransform: "uppercase", letterSpacing: "0.08em",
            }}>
              <span>Action</span>
              <span style={{ textAlign: "right" }}>Prix</span>
              <span style={{ textAlign: "right" }}>Var. 1J</span>
              <span style={{ textAlign: "center" }}>Signal</span>
              <span style={{ textAlign: "right" }}>Note /100</span>
              <span />
            </div>

            {/* Skeleton rows */}
            {loading && Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 56, margin: "0", borderRadius: 0, borderBottom: "1.5px solid var(--line)" }} />
            ))}

            {/* Data rows */}
            {!loading && stocks.map((stock, i) => {
              const isPos = stock.changePercent >= 0;
              const priceFormatted = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2 }).format(stock.currentPrice);
              const inWatchlist = watchlistSymbols.includes(stock.symbol);
              return (
                <div
                  key={stock.symbol}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 130px 100px 130px 120px 48px",
                    padding: "14px 24px",
                    alignItems: "center",
                    borderBottom: i < stocks.length - 1 ? "1.5px solid var(--line)" : "none",
                    transition: "background 0.15s",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--paper-2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Name + symbol */}
                  <div>
                    <Link
                      href={`/stock/${stock.symbol}`}
                      style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)", textDecoration: "none" }}
                    >
                      {stock.name}
                    </Link>
                    <div style={{
                      fontFamily: "var(--font-geist-mono, monospace)", fontSize: 11,
                      color: "var(--muted)", marginTop: 2,
                    }}>
                      {stock.symbol}
                    </div>
                  </div>

                  {/* Price */}
                  <div style={{
                    textAlign: "right", fontFamily: "var(--font-geist-mono, monospace)",
                    fontSize: 14, fontWeight: 600, color: "var(--ink)",
                  }}>
                    {priceFormatted} {stock.currency}
                  </div>

                  {/* Change % */}
                  <div style={{
                    textAlign: "right", fontFamily: "var(--font-geist-mono, monospace)",
                    fontSize: 13, fontWeight: 600,
                    color: isPos ? "var(--signal-up)" : "var(--signal-down)",
                  }}>
                    {isPos ? "+" : ""}{stock.changePercent.toFixed(2)}%
                  </div>

                  {/* Signal */}
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <SignalBadge signal={stock.valuation?.signal} />
                  </div>

                  {/* Score */}
                  <div style={{ textAlign: "right" }}>
                    <ScoreCell score={stock.valuation?.score} />
                  </div>

                  {/* Star / unfollow */}
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <button
                      onClick={() => inWatchlist ? handleUnfollow(stock.symbol) : handleFollow(stock.symbol, stock.name)}
                      title={inWatchlist ? "Retirer de la liste" : "Ajouter à la liste"}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        padding: 4, display: "flex", alignItems: "center", justifyContent: "center",
                        color: inWatchlist ? "var(--accent)" : "var(--muted)",
                        transition: "color 0.15s",
                      }}
                    >
                      <Star
                        size={16}
                        strokeWidth={1.8}
                        fill={inWatchlist ? "var(--accent)" : "none"}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />

      {/* Search modal */}
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
