"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import type { UserResponse } from "@supabase/supabase-js";

interface Props {
  symbol: string;
  name: string;
}

export default function WatchlistButton({ symbol, name }: Props) {
  const [isWatched, setIsWatched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then((res: UserResponse) => {
      if (res.data.user) {
        setLoggedIn(true);
        fetch("/api/watchlist").then((r) => r.json()).then((list) => {
          setIsWatched(list.some((w: { symbol: string }) => w.symbol === symbol));
        });
      } else {
        // Fallback to localStorage for anonymous users
        const saved = JSON.parse(localStorage.getItem("watchlist") ?? "[]") as string[];
        setIsWatched(saved.includes(symbol));
      }
    });
  }, [symbol]);

  const toggle = async () => {
    setLoading(true);
    if (loggedIn) {
      if (isWatched) {
        await fetch("/api/watchlist", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ symbol }) });
      } else {
        await fetch("/api/watchlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ symbol, name }) });
      }
      setIsWatched(!isWatched);
    } else {
      // localStorage fallback
      const saved = JSON.parse(localStorage.getItem("watchlist") ?? "[]") as string[];
      const next = isWatched ? saved.filter((s) => s !== symbol) : [...saved, symbol];
      localStorage.setItem("watchlist", JSON.stringify(next));
      setIsWatched(!isWatched);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={isWatched ? "Retirer des favoris" : "Ajouter aux favoris"}
      style={{
        display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
        borderRadius: 10, cursor: loading ? "wait" : "pointer",
        border: `1px solid ${isWatched ? "rgba(251,191,36,0.4)" : "var(--border)"}`,
        background: isWatched ? "rgba(251,191,36,0.08)" : "var(--bg-card)",
        color: isWatched ? "#fbbf24" : "var(--text-secondary)",
        fontSize: 14, fontWeight: 500, transition: "all 0.2s",
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24"
        fill={isWatched ? "#fbbf24" : "none"} stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
      {isWatched ? "Suivi" : "Suivre"}
    </button>
  );
}
