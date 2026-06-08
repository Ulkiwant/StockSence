"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import type { UserResponse } from "@supabase/supabase-js";
import { Star } from "lucide-react";

interface Props { symbol: string; name: string; }

export default function WatchlistButton({ symbol, name }: Props) {
  const [isWatched, setIsWatched] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [loggedIn, setLoggedIn]   = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then((res: UserResponse) => {
      if (res.data.user) {
        setLoggedIn(true);
        fetch("/api/watchlist").then((r) => r.json()).then((list) => {
          setIsWatched(list.some((w: { symbol: string }) => w.symbol === symbol));
        });
      } else {
        const saved = JSON.parse(localStorage.getItem("watchlist") ?? "[]") as string[];
        setIsWatched(saved.includes(symbol));
      }
    });
  }, [symbol]); // eslint-disable-line react-hooks/exhaustive-deps

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
      const saved = JSON.parse(localStorage.getItem("watchlist") ?? "[]") as string[];
      if (isWatched) {
        localStorage.setItem("watchlist", JSON.stringify(saved.filter((s) => s !== symbol)));
        localStorage.removeItem(`watchlist-name-${symbol}`);
      } else {
        localStorage.setItem("watchlist", JSON.stringify([...saved, symbol]));
        localStorage.setItem(`watchlist-name-${symbol}`, name); // ← nom sauvegardé
      }
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
        borderRadius: 9999, cursor: loading ? "wait" : "pointer",
        border: `1.5px solid ${isWatched ? "rgba(184,142,0,0.35)" : "var(--line)"}`,
        background: isWatched ? "rgba(251,191,36,0.10)" : "transparent",
        color: isWatched ? "#9a7700" : "var(--muted)",
        fontSize: 13, fontWeight: 500, transition: "all 0.15s",
      }}
      onMouseEnter={(e) => { if (!isWatched) { e.currentTarget.style.background = "var(--paper-3)"; e.currentTarget.style.color = "var(--ink)"; } }}
      onMouseLeave={(e) => { if (!isWatched) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted)"; } }}
    >
      <Star
        size={14} strokeWidth={1.8}
        fill={isWatched ? "#9a7700" : "none"}
        color={isWatched ? "#9a7700" : "currentColor"}
      />
      {isWatched ? "Suivi" : "Suivre"}
    </button>
  );
}
