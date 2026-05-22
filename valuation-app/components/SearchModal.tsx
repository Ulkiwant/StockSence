"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Plus, Check, TrendingUp } from "lucide-react";

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  quoteType: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  watchlistSymbols: string[];
  onFollow: (symbol: string, name: string) => Promise<void>;
  onUnfollow: (symbol: string) => Promise<void>;
}

const POPULAR: SearchResult[] = [
  { symbol: "AAPL",  name: "Apple Inc.",       exchange: "NASDAQ", quoteType: "EQUITY" },
  { symbol: "NVDA",  name: "Nvidia",            exchange: "NASDAQ", quoteType: "EQUITY" },
  { symbol: "MC.PA", name: "LVMH",              exchange: "EPA",    quoteType: "EQUITY" },
  { symbol: "MSFT",  name: "Microsoft",         exchange: "NASDAQ", quoteType: "EQUITY" },
  { symbol: "IWDA.AS", name: "iShares MSCI World ETF", exchange: "AMS", quoteType: "ETF" },
  { symbol: "TTE.PA", name: "TotalEnergies",   exchange: "EPA",    quoteType: "EQUITY" },
];

export function SearchModal({ open, onClose, watchlistSymbols, onFollow, onUnfollow }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingSymbols, setPendingSymbols] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus + reset on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 60);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim()) { setResults([]); setLoading(false); return; }

    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query]);

  const handleFollow = useCallback(async (symbol: string, name: string) => {
    setPendingSymbols((s) => new Set(s).add(symbol));
    await onFollow(symbol, name);
    setPendingSymbols((s) => { const n = new Set(s); n.delete(symbol); return n; });
  }, [onFollow]);

  const handleUnfollow = useCallback(async (symbol: string) => {
    setPendingSymbols((s) => new Set(s).add(symbol));
    await onUnfollow(symbol);
    setPendingSymbols((s) => { const n = new Set(s); n.delete(symbol); return n; });
  }, [onUnfollow]);

  const goToStock = (symbol: string) => {
    onClose();
    router.push(`/stock/${symbol}`);
  };

  const displayed = query.trim() ? results : POPULAR;
  const sectionLabel = query.trim()
    ? loading ? "Recherche…" : `${results.length} résultat${results.length !== 1 ? "s" : ""}`
    : "Populaires en ce moment";

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(10,22,40,0.45)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          zIndex: 200,
        }}
      />

      {/* Modal */}
      <div style={{
        position: "fixed",
        top: "12%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 580,
        padding: "0 16px",
        zIndex: 201,
      }}>
        <div style={{
          background: "var(--paper)",
          border: "1.5px solid var(--line)",
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(10,22,40,0.18)",
        }}>

          {/* Search input */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 18px",
            borderBottom: "1px solid var(--line)",
          }}>
            <Search size={16} strokeWidth={1.8} color="var(--muted)" style={{ flexShrink: 0 }} />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher — Apple, LVMH, NVDA, ETF World…"
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: 14,
                color: "var(--ink)",
                fontFamily: "inherit",
              }}
            />
            <button
              onClick={onClose}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 26, height: 26, borderRadius: 6,
                background: "var(--paper-2)", border: "1px solid var(--line)",
                cursor: "pointer", flexShrink: 0, color: "var(--muted)",
              }}
            >
              <X size={12} strokeWidth={2} />
            </button>
          </div>

          {/* Results */}
          <div style={{ maxHeight: 400, overflowY: "auto" }}>

            {/* Section label */}
            <div style={{
              padding: "10px 18px 6px",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--muted)",
            }}>
              {sectionLabel}
            </div>

            {/* Empty search state */}
            {query.trim() && !loading && results.length === 0 && (
              <div style={{
                padding: "40px 24px",
                textAlign: "center",
                fontSize: 13,
                color: "var(--muted)",
              }}>
                Aucune action trouvée pour « {query} »
              </div>
            )}

            {/* Result rows */}
            {displayed.map((r) => {
              const followed = watchlistSymbols.includes(r.symbol);
              const pending = pendingSymbols.has(r.symbol);
              const isETF = r.quoteType === "ETF";

              return (
                <div
                  key={r.symbol}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 18px",
                    cursor: "pointer",
                    transition: "background 0.12s",
                    borderTop: "1px solid var(--line)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--paper-2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Icon */}
                  <div
                    onClick={() => goToStock(r.symbol)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 9,
                      background: isETF ? "rgba(45,125,90,0.12)" : "var(--paper-2)",
                      border: "1px solid var(--line)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 800,
                      color: "var(--accent)",
                      flexShrink: 0,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {r.symbol.replace(".PA", "").replace(".AS", "").slice(0, 3)}
                  </div>

                  {/* Name + meta */}
                  <div
                    style={{ flex: 1, minWidth: 0 }}
                    onClick={() => goToStock(r.symbol)}
                  >
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 2,
                    }}>
                      <span style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--ink)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {r.name}
                      </span>
                      {isETF && (
                        <span style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: "1px 5px",
                          borderRadius: 4,
                          background: "rgba(45,125,90,0.12)",
                          color: "var(--accent)",
                          flexShrink: 0,
                        }}>
                          ETF
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: 11,
                      color: "var(--muted)",
                      fontFamily: "var(--font-geist-mono, monospace)",
                    }}>
                      {r.symbol} · {r.exchange}
                    </div>
                  </div>

                  {/* Analyse link */}
                  <button
                    onClick={() => goToStock(r.symbol)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "6px 10px",
                      borderRadius: 7,
                      border: "1px solid var(--line)",
                      background: "transparent",
                      color: "var(--muted)",
                      fontSize: 11,
                      fontWeight: 500,
                      cursor: "pointer",
                      flexShrink: 0,
                      transition: "all 0.12s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--ink)"; e.currentTarget.style.borderColor = "var(--ink)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.borderColor = "var(--line)"; }}
                  >
                    <TrendingUp size={11} strokeWidth={2} />
                    Analyser
                  </button>

                  {/* Follow button */}
                  <button
                    disabled={pending}
                    onClick={(e) => {
                      e.stopPropagation();
                      followed ? handleUnfollow(r.symbol) : handleFollow(r.symbol, r.name);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "6px 12px",
                      borderRadius: 7,
                      border: `1.5px solid ${followed ? "rgba(45,125,90,0.35)" : "rgba(45,125,90,0.3)"}`,
                      background: followed ? "var(--accent-soft)" : "transparent",
                      color: followed ? "var(--accent)" : "var(--accent)",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: pending ? "wait" : "pointer",
                      flexShrink: 0,
                      transition: "all 0.15s",
                      opacity: pending ? 0.6 : 1,
                    }}
                  >
                    {followed
                      ? <><Check size={11} strokeWidth={2.5} /> Suivi</>
                      : <><Plus size={11} strokeWidth={2.5} /> Suivre</>
                    }
                  </button>
                </div>
              );
            })}
          </div>

          {/* Footer hints */}
          <div style={{
            display: "flex",
            gap: 16,
            padding: "10px 18px",
            borderTop: "1px solid var(--line)",
            background: "var(--paper-2)",
          }}>
            {[["↵", "Analyser"], ["ESC", "Fermer"]].map(([k, v]) => (
              <span key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "var(--muted)" }}>
                <kbd style={{
                  background: "var(--paper)",
                  border: "1px solid var(--line)",
                  borderRadius: 4,
                  padding: "1px 5px",
                  fontSize: 9,
                  fontFamily: "var(--font-geist-mono, monospace)",
                }}>{k}</kbd>
                {v}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
