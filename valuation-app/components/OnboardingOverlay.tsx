"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import Brand from "./Brand";

const STORAGE_KEY = "ss_onboarding_done";

export default function OnboardingOverlay() {
  const [visible, setVisible] = useState(false);
  const [query, setQuery]     = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router   = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  const analyze = () => {
    const ticker = query.trim().toUpperCase();
    if (!ticker) return;
    dismiss();
    router.push(`/stock/${ticker}`);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(10,22,40,0.55)",
      backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px",
      animation: "ob-fade-in 0.25s ease",
    }}>
      {/* Skip */}
      <button onClick={dismiss} style={{
        position: "absolute", top: 20, right: 20,
        background: "rgba(255,255,255,0.15)",
        border: "1px solid rgba(255,255,255,0.20)",
        color: "#fff", fontSize: 12, padding: "6px 12px",
        borderRadius: 9999, cursor: "pointer",
        display: "flex", alignItems: "center", gap: 6,
        transition: "background 0.15s",
      }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.22)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
      >
        <X size={12} /> Passer
      </button>

      {/* Card */}
      <div style={{
        background: "var(--paper-2)",
        border: "1.5px solid var(--line)",
        borderRadius: 20,
        padding: "40px 36px 32px",
        maxWidth: 460, width: "100%",
        boxShadow: "0 40px 80px rgba(10,22,40,0.35)",
        animation: "ob-slide-up 0.3s cubic-bezier(0.22,1,0.36,1)",
      }}>
        <div style={{ textAlign: "center" }}>
          {/* Brand */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <Brand size="lg" />
          </div>

          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px", color: "var(--ink)", marginBottom: 6 }}>
            Bienvenue sur StockSense
          </h1>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.65, marginBottom: 28 }}>
            Faites votre première analyse en 10 secondes.
          </p>

          {/* Search */}
          <div style={{
            background: "#fff", border: "1.5px solid var(--line)", borderRadius: 9999,
            display: "flex", alignItems: "center", padding: "4px 8px 4px 16px", gap: 8, marginBottom: 12,
            transition: "border-color 0.15s, box-shadow 0.15s",
          }}
            onFocusCapture={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(45,125,90,0.12)"; }}
            onBlurCapture={(e)  => { e.currentTarget.style.borderColor = "var(--line)";   e.currentTarget.style.boxShadow = "none"; }}
          >
            <Search size={15} strokeWidth={1.8} color="var(--muted)" style={{ flexShrink: 0 }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && analyze()}
              placeholder="Essayez Apple, LVMH ou Nvidia…"
              style={{
                flex: 1, height: 44, background: "transparent",
                border: "none", outline: "none",
                fontSize: 14, color: "var(--ink)", fontFamily: "inherit",
              }}
            />
            <button onClick={analyze} disabled={!query.trim()}
              style={{
                padding: "8px 18px", borderRadius: 9999,
                background: query.trim() ? "var(--accent)" : "var(--line)",
                border: "none", color: "#fff", fontSize: 13, fontWeight: 600,
                cursor: query.trim() ? "pointer" : "not-allowed",
                transition: "background 0.15s", flexShrink: 0,
              }}>
              Analyser
            </button>
          </div>

          {/* Explore */}
          <button onClick={dismiss} style={{
            background: "none", border: "none",
            fontSize: 12, color: "var(--muted)", cursor: "pointer",
            textDecoration: "underline", textUnderlineOffset: 3,
          }}>
            Explorer d&apos;abord le site
          </button>
        </div>
      </div>

      <style>{`
        @keyframes ob-fade-in  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ob-slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
