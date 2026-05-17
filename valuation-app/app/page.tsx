"use client";

import { useEffect, useState } from "react";
import SearchBar from "@/components/SearchBar";
import StockCard from "@/components/StockCard";

interface TrendingStock {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  currency: string;
}

export default function HomePage() {
  const [trending, setTrending] = useState<TrendingStock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/trending")
      .then((r) => r.json())
      .then((d) => { setTrending(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px" }}>
      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "6px 14px", borderRadius: 20,
          border: "1px solid rgba(59,123,255,0.25)", background: "rgba(59,123,255,0.08)",
          marginBottom: 20,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%", background: "var(--accent-green)",
            display: "inline-block", animation: "pulse 2s ease-in-out infinite",
          }} />
          <span style={{ fontSize: 13, color: "var(--accent-blue)", fontWeight: 500 }}>
            Données en temps réel
          </span>
        </div>

        <h1 style={{
          fontSize: "clamp(32px, 6vw, 56px)", fontWeight: 800,
          letterSpacing: "-1.5px", lineHeight: 1.1, marginBottom: 16,
        }}>
          Découvrez si une action
          <br />
          <span className="gradient-text">vaut ce qu'elle coûte</span>
        </h1>

        <p style={{
          fontSize: 18, color: "var(--text-secondary)",
          maxWidth: 480, margin: "0 auto 36px", lineHeight: 1.6,
        }}>
          Valorisation instantanée par l'IA. Sans jargon. Pour tout le monde.
        </p>

        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <SearchBar />
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
          {["Apple", "Tesla", "LVMH", "Nvidia", "Amazon"].map((name) => (
            <span key={name} style={{
              fontSize: 12, color: "var(--text-muted)",
              padding: "3px 10px", borderRadius: 6, border: "1px solid var(--border)",
            }}>{name}</span>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div style={{ marginBottom: 56 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {[
            { emoji: "🔍", title: "Recherchez", desc: "Entrez le nom d'une entreprise" },
            { emoji: "⚡", title: "Analyse instant", desc: "Notre IA calcule la valeur réelle" },
            { emoji: "📊", title: "Décidez", desc: "Achat, conservation ou vente" },
          ].map((step) => (
            <div key={step.title} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "16px 20px", background: "var(--bg-card)",
              borderRadius: 12, border: "1px solid var(--border)",
            }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>{step.emoji}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{step.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trending */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px" }}>Actions du jour</h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
              Sélection mise à jour chaque jour
            </p>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </div>
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 200, borderRadius: 16 }} />
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {trending.map((stock) => (
              <StockCard key={stock.symbol} {...stock} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.9); }
        }
      `}</style>
    </div>
  );
}
