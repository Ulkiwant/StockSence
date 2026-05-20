"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "ss_onboarding_done";

export default function OnboardingOverlay() {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Show only once, only if user hasn't dismissed it
    if (typeof window !== "undefined" && !localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
      // Small delay so the page has time to render behind the overlay
      setTimeout(() => inputRef.current?.focus(), 300);
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
      background: "rgba(0,0,0,0.72)",
      backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px",
      animation: "ob-fade-in 0.3s ease",
    }}>
      {/* Skip button */}
      <button
        onClick={dismiss}
        style={{
          position: "absolute", top: 20, right: 24,
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.10)",
          color: "var(--text-secondary)",
          fontSize: 13, padding: "6px 14px", borderRadius: 8,
          cursor: "pointer", transition: "background 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
        onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
      >
        Passer ✕
      </button>

      {/* Card */}
      <div style={{
        background: "#1c1b1a",
        border: "1px solid rgba(134,239,172,0.18)",
        borderRadius: 20,
        padding: "44px 40px 36px",
        maxWidth: 480, width: "100%",
        boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
        animation: "ob-slide-up 0.35s cubic-bezier(0.22,1,0.36,1)",
        position: "relative",
      }}>
        {/* Glow */}
        <div style={{
          position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)",
          width: 240, height: 120,
          background: "radial-gradient(ellipse, rgba(134,239,172,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", textAlign: "center" }}>
          {/* Logo badge */}
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: "rgba(134,239,172,0.10)",
            border: "1px solid rgba(134,239,172,0.22)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, margin: "0 auto 20px",
          }}>
            📈
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.4px", marginBottom: 8 }}>
            Bienvenue sur StockSense 👋
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 32 }}>
            Faites votre première analyse en 10 secondes.
          </p>

          {/* Search input */}
          <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 12,
            display: "flex", alignItems: "center",
            padding: "0 14px", gap: 10, marginBottom: 12,
            transition: "border-color 0.2s",
          }}
            onFocusCapture={e => (e.currentTarget.style.borderColor = "rgba(134,239,172,0.35)")}
            onBlurCapture={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)")}
          >
            <span style={{ fontSize: 15, color: "var(--text-muted)" }}>🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && analyze()}
              placeholder="Essayez Apple, LVMH ou Nvidia…"
              style={{
                flex: 1, height: 48, background: "transparent",
                border: "none", outline: "none",
                fontSize: 14, color: "var(--text-primary)",
              }}
            />
          </div>

          {/* CTA */}
          <button
            onClick={analyze}
            disabled={!query.trim()}
            style={{
              width: "100%", padding: "13px",
              borderRadius: 12,
              background: query.trim() ? "var(--cta-bg)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${query.trim() ? "var(--cta-border)" : "rgba(255,255,255,0.08)"}`,
              color: query.trim() ? "var(--cta-text)" : "var(--text-disabled)",
              fontSize: 15, fontWeight: 700,
              cursor: query.trim() ? "pointer" : "not-allowed",
              transition: "all 0.18s",
              marginBottom: 14,
            }}
          >
            Analyser maintenant →
          </button>

          {/* Explore link */}
          <button
            onClick={dismiss}
            style={{
              background: "none", border: "none",
              fontSize: 13, color: "var(--text-muted)",
              cursor: "pointer", textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            Explorer d&apos;abord le site →
          </button>
        </div>
      </div>

      <style>{`
        @keyframes ob-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ob-slide-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
