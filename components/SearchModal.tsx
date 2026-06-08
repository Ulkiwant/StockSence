"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Plus, Check, ChevronRight } from "lucide-react";
import CompanyLogo from "@/components/CompanyLogo";

interface SearchResult { symbol: string; name: string; exchange: string; }

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  watchlistSymbols: string[];
  onFollow: (symbol: string, name: string) => void;
  onUnfollow: (symbol: string) => void;
}

const POPULAR = [
  { symbol: "AAPL",    name: "Apple Inc." },
  { symbol: "MC.PA",   name: "LVMH Moët Hennessy Louis Vuitton" },
  { symbol: "MSFT",    name: "Microsoft Corporation" },
  { symbol: "NVDA",    name: "NVIDIA Corporation" },
  { symbol: "IWDA.AS", name: "iShares Core MSCI World UCITS ETF" },
  { symbol: "TTE.PA",  name: "TotalEnergies SE" },
];

export function SearchModal({ open, onClose, watchlistSymbols, onFollow, onUnfollow }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<SearchResult[]>([]);
  const [loading, setLoading]   = useState(false);
  const [pending, setPending]   = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setResults([]);
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const d = await r.json();
        setResults(Array.isArray(d) ? d : []);
      } finally { setLoading(false); }
    }, 280);
    return () => clearTimeout(t);
  }, [query]);

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const toggle = async (symbol: string, name: string) => {
    setPending(p => new Set(p).add(symbol));
    if (watchlistSymbols.includes(symbol)) await onUnfollow(symbol);
    else await onFollow(symbol, name);
    setPending(p => { const s = new Set(p); s.delete(symbol); return s; });
  };

  if (!open) return null;

  const displayed: SearchResult[] = query.trim()
    ? results
    : POPULAR.map(p => ({ ...p, exchange: "" }));

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(10,22,40,0.45)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "80px 24px 24px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "var(--paper)", border: "1.5px solid var(--line)", borderRadius: 20, width: "100%", maxWidth: 540, boxShadow: "0 24px 64px rgba(10,22,40,0.18)", overflow: "hidden" }}>
        {/* Search input */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: "1px solid var(--line)" }}>
          <Search size={18} strokeWidth={1.8} color="var(--muted)" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Nom de l'entreprise — Apple, LVMH, Airbus…"
            style={{ flex: 1, border: "none", outline: "none", color: "var(--ink)", fontSize: 16, background: "transparent", fontFamily: "inherit" }}
          />
          {loading && <span style={{ fontSize: 12, color: "var(--muted)" }}>…</span>}
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex", padding: 4 }}>
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Results */}
        <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
          {!query.trim() && (
            <div style={{ padding: "10px 18px 6px", fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Suggestions populaires
            </div>
          )}
          {displayed.length === 0 && query.trim() && !loading && (
            <div style={{ padding: "24px 18px", textAlign: "center", color: "var(--muted)", fontSize: 14 }}>
              Aucun résultat pour « {query} »
            </div>
          )}
          {displayed.map((r, i) => {
            const isIn  = watchlistSymbols.includes(r.symbol);
            const wait  = pending.has(r.symbol);
            return (
              <div key={r.symbol}
                onClick={() => { onClose(); router.push(`/stock/${r.symbol}`); }}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "13px 18px",
                  borderBottom: i < displayed.length - 1 ? "1px solid var(--line)" : "none",
                  transition: "background 0.12s", cursor: "pointer",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--paper-2)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                {/* Logo */}
                <CompanyLogo symbol={r.symbol} name={r.name} size={36} radius={9} />

                {/* Nom complet */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                  {r.exchange && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{r.exchange}</div>}
                </div>

                {/* Bouton Suivre — stopPropagation pour ne pas naviguer */}
                <button
                  onClick={e => { e.stopPropagation(); toggle(r.symbol, r.name); }}
                  disabled={wait}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9999,
                    border: `1.5px solid ${isIn ? "rgba(45,125,90,0.30)" : "var(--line)"}`,
                    background: isIn ? "var(--accent-soft)" : "transparent",
                    color: isIn ? "var(--accent)" : "var(--ink)",
                    fontSize: 12, fontWeight: 600, cursor: wait ? "wait" : "pointer", flexShrink: 0,
                    transition: "all 0.15s",
                  }}
                >
                  {isIn ? <Check size={12} strokeWidth={2.5} /> : <Plus size={12} strokeWidth={2.5} />}
                  {isIn ? "Suivi" : "Suivre"}
                </button>

                <ChevronRight size={14} color="var(--muted)" style={{ flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
