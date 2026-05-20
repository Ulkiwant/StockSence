"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StockCard from "@/components/StockCard";
import { createClient } from "@/lib/supabase";
import { Star, ArrowRight } from "lucide-react";
import Footer from "@/components/Footer";

interface WatchItem { symbol: string; name: string; }
interface StockData {
  symbol: string; name: string; currentPrice: number;
  change: number; changePercent: number; currency: string;
  valuation?: { fairValue: number; upside: number; signal: "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL"; score: number; };
}

export default function WatchlistPage() {
  const [items, setItems]     = useState<WatchItem[]>([]);
  const [stocks, setStocks]   = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
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
    };
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ background: "var(--paper)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 28px 64px" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <Star size={20} strokeWidth={1.8} color="var(--accent)" />
            <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.4px", color: "var(--ink)" }}>
              Mes actions suivies
            </h1>
          </div>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>
            {items.length} action{items.length !== 1 ? "s" : ""}
            {!loggedIn && (
              <span style={{ marginLeft: 10 }}>
                ·{" "}
                <Link href="/auth/login" style={{ color: "var(--accent)", fontWeight: 500 }}>
                  Connectez-vous
                </Link>{" "}
                pour synchroniser sur tous vos appareils
              </span>
            )}
          </p>
        </div>

        {items.length === 0 ? (
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
              Aucune action suivie
            </h2>
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 24 }}>
              Recherchez une action et cliquez sur « Suivre » pour l&apos;ajouter ici.
            </p>
            <Link href="/" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "10px 22px", borderRadius: 9999,
              background: "var(--accent)", color: "#fff", fontWeight: 600, fontSize: 13,
            }}>
              Rechercher des actions <ArrowRight size={14} />
            </Link>
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
    </div>
  );
}
