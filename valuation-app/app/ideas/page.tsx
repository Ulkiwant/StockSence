"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";

interface IdeaStock {
  symbol: string;
  name: string;
  currentPrice?: number;
  changePercent?: number;
  currency?: string;
  sector?: string;
  signal?: "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL";
  score?: number;
}

const SIGNAL_MAP: Record<string, { bg: string; color: string; label: string }> = {
  STRONG_BUY: { bg: "#1F5C3E", color: "#F6F2E8", label: "Achat fort" },
  BUY:        { bg: "#D6E4D6", color: "#1F5C3E", label: "Achat" },
  HOLD:       { bg: "#E8E0CE", color: "#3A3E33", label: "Neutre" },
  SELL:       { bg: "#EBD7D2", color: "#B84A3E", label: "Vendre" },
  STRONG_SELL:{ bg: "#EBD7D2", color: "#B84A3E", label: "Surévalué" },
};

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("").slice(0, 2);
}

function avatarBg(name: string) {
  const palette = ["#1F5C3E","#2d5e7e","#7e3d2d","#5e2d7e","#7e6b2d","#2d7e5e","#3d2d7e","#7e2d5e","#2d6e7e","#5e7e2d"];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0x7fffffff;
  return palette[h % palette.length];
}

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<IdeaStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "STRONG_BUY" | "BUY" | "HOLD">("all");

  const loadIdeas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/trending");
      const data = await res.json();
      const candidates: { symbol: string; name: string }[] = Array.isArray(data)
        ? (data as Record<string, unknown>[]).map((d) => ({ symbol: String(d.symbol ?? ""), name: String(d.name ?? d.symbol ?? "") })).filter((d) => d.symbol)
        : [];

      const dayOffset = Math.floor(Date.now() / 86_400_000) % Math.max(candidates.length, 1);
      const rotated = [...candidates.slice(dayOffset), ...candidates.slice(0, dayOffset)];

      const enriched = await Promise.allSettled(
        rotated.slice(0, 12).map(async (c) => {
          const r = await fetch(`/api/stock/${c.symbol}`);
          if (!r.ok) return { symbol: c.symbol, name: c.name } as IdeaStock;
          const d = await r.json();
          return {
            symbol: c.symbol,
            name: d.name ?? c.name,
            currentPrice: d.currentPrice,
            changePercent: d.changePercent,
            currency: d.currency,
            sector: d.sector,
            signal: d.valuation?.signal,
            score: d.valuation?.score,
          } as IdeaStock;
        })
      );
      setIdeas(enriched.filter((r) => r.status === "fulfilled").map((r) => (r as PromiseFulfilledResult<IdeaStock>).value));
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadIdeas(); }, [loadIdeas]);

  const filtered = ideas.filter((s) => {
    if (filter === "all") return true;
    return s.signal === filter;
  });

  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div style={{ background: "var(--paper-3)", minHeight: "100vh" }}>
      <div className="pg-pad" style={{ maxWidth: 1240, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="/" style={{ color: "var(--muted)" }}>Rently</Link>
            <span style={{ opacity: 0.4 }}>/</span>
            <Link href="/watchlist" style={{ color: "var(--muted)" }}>Mes actions</Link>
            <span style={{ opacity: 0.4 }}>/</span>
            <span>Idées du jour</span>
          </div>
          <h1 style={{ fontFamily: "var(--font-instrument, serif)", fontSize: "clamp(40px,4.4vw,56px)", fontWeight: 400, color: "var(--ink)", margin: "0 0 10px", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
            Idées du <em style={{ fontStyle: "italic", color: "var(--signal-up)" }}>jour</em>.
          </h1>
          <p style={{ fontSize: 15, color: "var(--muted)", margin: 0, maxWidth: 580, lineHeight: 1.6 }}>
            Une sélection renouvelée chaque jour — au-delà des grandes valeurs connues. Aujourd&apos;hui : <strong style={{ color: "var(--ink)" }}>{today}</strong>.
          </p>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
          {([
            { key: "all",       label: "Toutes", count: ideas.length },
            { key: "STRONG_BUY",label: "Achat fort", count: ideas.filter((s) => s.signal === "STRONG_BUY").length },
            { key: "BUY",       label: "Achat", count: ideas.filter((s) => s.signal === "BUY").length },
            { key: "HOLD",      label: "Neutre", count: ideas.filter((s) => s.signal === "HOLD").length },
          ] as { key: typeof filter; label: string; count: number }[]).map(({ key, label, count }) => (
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

        {/* Cards grid */}
        {loading ? (
          <div className="grid-3col">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 180, borderRadius: 18 }} />
            ))}
          </div>
        ) : (
          <div className="grid-3col" style={{ marginBottom: 40 }}>
            {filtered.map((idea) => {
              const bg = avatarBg(idea.name);
              const sig = idea.signal ? SIGNAL_MAP[idea.signal] : null;
              const isPos = (idea.changePercent ?? 0) >= 0;
              const priceDisplay = idea.currentPrice != null
                ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(idea.currentPrice)
                : null;
              return (
                <div key={idea.symbol} style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 18, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: bg, display: "grid", placeItems: "center", fontSize: 14, fontWeight: 700, color: "#F6F2E8", flexShrink: 0 }}>
                        {initials(idea.name)}
                      </div>
                      <div>
                        <Link href={`/stock/${idea.symbol}`} style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", textDecoration: "none", display: "block" }}>
                          {idea.name}
                        </Link>
                        {idea.sector && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{idea.sector}</div>}
                      </div>
                    </div>
                    {sig && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 9999, background: sig.bg, color: sig.color, fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                        <span style={{ width: 4, height: 4, borderRadius: "50%", background: "currentColor", opacity: 0.7 }} />
                        {sig.label}
                      </span>
                    )}
                  </div>

                  {idea.score != null && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1, height: 4, background: "var(--paper-3)", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${idea.score}%`, background: idea.score >= 70 ? "var(--signal-up)" : idea.score >= 50 ? "#C9A24E" : "var(--signal-down)", borderRadius: 999 }} />
                      </div>
                      <span style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 12, color: "var(--ink)", fontWeight: 600, flexShrink: 0 }}>{idea.score}<span style={{ color: "var(--muted)", fontWeight: 400 }}>/100</span></span>
                    </div>
                  )}

                  <div style={{ borderTop: "1px dashed var(--line)", paddingTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 13 }}>
                      {priceDisplay != null ? (
                        <>
                          <span style={{ color: "var(--ink)", fontWeight: 600 }}>{priceDisplay}</span>
                          {idea.changePercent != null && (
                            <span style={{ color: isPos ? "var(--signal-up)" : "var(--signal-down)", marginLeft: 8 }}>
                              {isPos ? "+" : ""}{idea.changePercent.toFixed(2)} %
                            </span>
                          )}
                        </>
                      ) : <span style={{ color: "var(--muted)" }}>—</span>}
                    </div>
                    <Link href={`/stock/${idea.symbol}`} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 9999, border: "none", background: "var(--ink)", color: "var(--paper)", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>
                      Analyser →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 24px", color: "var(--muted)", fontSize: 14 }}>
            Aucune idée dans cette catégorie aujourd&apos;hui.
          </div>
        )}

        <div style={{ textAlign: "center", padding: "32px 0 0", borderTop: "1px solid var(--line)" }}>
          <Link href="/watchlist" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 24px", borderRadius: 9999, border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>
            ← Retour à mes actions
          </Link>
        </div>
      </div>

      <div style={{ marginTop: 64 }}>
        <Footer />
      </div>
    </div>
  );
}
