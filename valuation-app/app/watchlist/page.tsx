"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StockCard from "@/components/StockCard";
import { createClient } from "@/lib/supabase";

interface WatchItem { symbol: string; name: string; }
interface StockData {
  symbol: string; name: string; currentPrice: number;
  change: number; changePercent: number; currency: string;
  valuation?: { fairValue: number; upside: number; signal: "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL"; score: number; };
}

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [stocks, setStocks] = useState<StockData[]>([]);
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
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 8 }}>Mes actions suivies</h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          {items.length} action{items.length !== 1 ? "s" : ""}
          {!loggedIn && <span style={{ marginLeft: 8, color: "var(--accent-blue)", fontSize: 13 }}>
            · <Link href="/auth/login" style={{ color: "var(--accent-blue)" }}>Connectez-vous</Link> pour synchroniser sur tous vos appareils
          </span>}
        </p>
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 24px", border: "1px dashed var(--border)", borderRadius: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Aucune action suivie</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>
            Recherchez une action et cliquez sur « Suivre » pour l'ajouter ici.
          </p>
          <Link href="/" style={{
            display: "inline-flex", padding: "10px 24px", borderRadius: 10,
            background: "linear-gradient(135deg, #3b7bff, #7b5aff)",
            color: "#fff", fontWeight: 600, fontSize: 14,
          }}>Rechercher des actions</Link>
        </div>
      ) : loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {items.map((w) => <div key={w.symbol} className="skeleton" style={{ height: 220, borderRadius: 16 }} />)}
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
  );
}
