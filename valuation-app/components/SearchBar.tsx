"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
}

export default function SearchBar({ compact = false }: { compact?: boolean }) {
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);
  const router   = useRouter();
  const ref      = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res  = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query]);

  const go = (symbol: string) => {
    setQuery("");
    setOpen(false);
    router.push(`/stock/${symbol}`);
  };

  return (
    <div ref={ref} style={{ position: "relative", width: "100%", zIndex: 60 }}>
      {/* Input wrapper */}
      <div style={{
        display: "flex",
        alignItems: "center",
        background: "#fff",
        border: "1.5px solid var(--line)",
        borderRadius: 9999,
        padding: compact ? "7px 14px" : "12px 18px",
        gap: 8,
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
        onFocusCapture={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.borderColor = "var(--accent)";
          el.style.boxShadow   = "0 0 0 3px rgba(45,125,90,0.12)";
        }}
        onBlurCapture={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.borderColor = "var(--line)";
          el.style.boxShadow   = "none";
        }}
      >
        <Search size={15} strokeWidth={1.8} color="var(--muted)" style={{ flexShrink: 0 }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={compact ? "Rechercher une action..." : "Apple, Tesla, LVMH..."}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--ink)",
            fontSize: compact ? 13 : 15,
            fontFamily: "inherit",
          }}
        />
        {loading && <Loader2 size={14} strokeWidth={2} color="var(--muted)" style={{ flexShrink: 0, animation: "spin 0.7s linear infinite" }} />}
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          left: 0,
          right: 0,
          background: "#fff",
          border: "1.5px solid var(--line)",
          borderRadius: 14,
          overflow: "hidden",
          zIndex: 100,
          boxShadow: "0 8px 32px rgba(10,22,40,0.12)",
        }}>
          {results.map((r, i) => (
            <button
              key={r.symbol}
              onClick={() => go(r.symbol)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                background: "transparent",
                border: "none",
                borderBottom: i < results.length - 1 ? "1px solid var(--line)" : "none",
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--paper-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: "var(--accent-soft)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 800,
                color: "var(--accent)",
                flexShrink: 0,
                letterSpacing: "-0.01em",
              }}>
                {r.symbol.slice(0, 3)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)" }}>{r.symbol}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)", flexShrink: 0 }}>
                {r.exchange}
              </div>
            </button>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
