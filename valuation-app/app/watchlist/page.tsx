"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import StockCard from "@/components/StockCard";
import { SearchModal } from "@/components/SearchModal";
import { createClient } from "@/lib/supabase";
import { Star, Plus } from "lucide-react";
import Footer from "@/components/Footer";
import { useSettings } from "@/lib/settings";

interface WatchItem { symbol: string; name: string; }
interface StockData {
  symbol: string; name: string; currentPrice: number;
  change: number; changePercent: number; currency: string;
  valuation?: { fairValue: number; upside: number; signal: "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL"; score: number; };
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
    <div style={{ background: "var(--paper)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 28px 64px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <Star size={20} strokeWidth={1.8} color="var(--accent)" />
              <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.4px", color: "var(--ink)" }}>
                {t("watchlist.title")}
              </h1>
            </div>
            <p style={{ fontSize: 13, color: "var(--muted)" }}>
              {items.length} action{items.length !== 1 ? "s" : ""}
              {!loggedIn && (
                <span style={{ marginLeft: 10 }}>
                  ·{" "}
                  <Link href="/auth/login" style={{ color: "var(--accent)", fontWeight: 500 }}>
                    {t("nav.login")}
                  </Link>{" "}
                  {t("common.sign_in_sync")}
                </span>
              )}
            </p>
          </div>

          {/* Bouton "Ajouter" — visible même quand la liste n'est pas vide */}
          <button
            onClick={() => setSearchOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 18px",
              borderRadius: 9999,
              border: "1.5px solid var(--line)",
              background: "var(--paper-2)",
              color: "var(--ink)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--ink)"; }}
          >
            <Plus size={14} strokeWidth={2.5} />
            {t("watchlist.add_btn")}
          </button>
        </div>

        {items.length === 0 ? (
          /* Empty state */
          <div style={{
            textAlign: "center", padding: "80px 24px",
            border: "1.5px dashed var(--line)", borderRadius: 18,
            background: "var(--paper-2)",
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
              <Plus size={14} strokeWidth={2.5} />
              {t("watchlist.add_btn")}
            </button>
          </div>
        ) : loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {items.map((w) => <div key={w.symbol} className="skeleton" style={{ height: 200, borderRadius: 14 }} />)}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {stocks.map((stock) => (
              <StockCard key={stock.symbol} symbol={stock.symbol} name={stock.name}
                currentPrice={stock.currentPrice} change={stock.change}
                changePercent={stock.changePercent} currency={stock.currency}
                signal={stock.valuation?.signal} fairValue={stock.valuation?.fairValue}
                upside={stock.valuation?.upside} score={stock.valuation?.score} />
            ))}
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
