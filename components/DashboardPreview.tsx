"use client";
import { useEffect, useState } from "react";

// ─── Phases : search → analyzing → result → (loop) ───────────────────────────
type Phase = "search" | "analyzing" | "result";

const TYPED_TEXT = "Apple Inc.";
const PHASE_DURATIONS: Record<Phase, number> = {
  search:    1500,
  analyzing: 1800,
  result:    3200,
};

// Simple upward SVG price line for Apple
const PRICE_POINTS = [
  [0, 72], [8, 68], [16, 74], [24, 65], [32, 60], [40, 55],
  [48, 58], [56, 48], [64, 42], [72, 38], [80, 32], [88, 28], [96, 18], [104, 14], [112, 8],
];
const W = 112, H = 80;
const polyline = PRICE_POINTS.map(([x, y]) => `${x},${y}`).join(" ");
const fillPath = `M0,${H} ` + PRICE_POINTS.map(([x, y]) => `${x},${y}`).join(" ") + ` L${W},${H} Z`;

export default function DashboardPreview() {
  const [phase, setPhase] = useState<Phase>("search");
  const [typed, setTyped]   = useState("");
  const [dots, setDots]     = useState("");

  // Phase sequencer
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const advance = (p: Phase) => {
      t = setTimeout(() => {
        const next: Phase = p === "search" ? "analyzing" : p === "analyzing" ? "result" : "search";
        setPhase(next);
        if (next === "search") setTyped("");
        advance(next);
      }, PHASE_DURATIONS[p]);
    };
    advance(phase);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Typewriter during search phase
  useEffect(() => {
    if (phase !== "search") return;
    setTyped("");
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setTyped(TYPED_TEXT.slice(0, i));
      if (i >= TYPED_TEXT.length) clearInterval(iv);
    }, 120);
    return () => clearInterval(iv);
  }, [phase]);

  // Blinking dots during analyzing phase
  useEffect(() => {
    if (phase !== "analyzing") { setDots(""); return; }
    let n = 0;
    const iv = setInterval(() => { n = (n + 1) % 4; setDots(".".repeat(n)); }, 420);
    return () => clearInterval(iv);
  }, [phase]);

  return (
    <section style={{ padding: "0 24px 80px", position: "relative", zIndex: 10 }}>
      <div style={{
        maxWidth: 860,
        margin: "0 auto",
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.07)",
        background: "#1c1b1a",
        boxShadow: "0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
        overflow: "hidden",
      }}>
        {/* Browser chrome */}
        <div style={{
          padding: "14px 20px",
          background: "rgba(255,255,255,0.025)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{ display: "flex", gap: 6 }}>
            {["#ff5f57","#febc2e","#28c840"].map(c => (
              <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.7 }} />
            ))}
          </div>
          <div style={{
            flex: 1, maxWidth: 280, height: 24,
            background: "rgba(255,255,255,0.05)", borderRadius: 6,
            display: "flex", alignItems: "center", paddingLeft: 10,
            fontSize: 10, color: "var(--text-disabled)", fontFamily: "monospace",
          }}>
            stocksense.app/stock/AAPL
          </div>
        </div>

        {/* Content area */}
        <div style={{ padding: "32px 28px", minHeight: 280 }}>

          {/* ── Phase 1 : Search ── */}
          {phase === "search" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, paddingTop: 24 }}>
              <div style={{ fontSize: 14, color: "var(--text-muted)", letterSpacing: "0.04em" }}>
                Analysez n&apos;importe quelle action en quelques secondes
              </div>
              {/* Fake search bar */}
              <div style={{
                width: "100%", maxWidth: 440, height: 48,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(134,239,172,0.3)",
                borderRadius: 12,
                display: "flex", alignItems: "center",
                padding: "0 16px", gap: 10,
                boxShadow: "0 0 0 3px rgba(134,239,172,0.06)",
              }}>
                <span style={{ fontSize: 14, color: "var(--text-muted)" }}>🔍</span>
                <span style={{ fontSize: 14, color: "var(--text-primary)", fontFamily: "monospace", flex: 1 }}>
                  {typed}
                  <span style={{
                    display: "inline-block", width: 2, height: 14,
                    background: "var(--accent)", marginLeft: 1,
                    animation: "cursor-blink 1s step-end infinite",
                    verticalAlign: "middle",
                  }} />
                </span>
                {typed.length > 3 && (
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%",
                    border: "2px solid rgba(134,239,172,0.4)",
                    borderTopColor: "var(--accent)",
                    animation: "spin 0.7s linear infinite",
                  }} />
                )}
              </div>
              {/* Suggestions */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                {["AAPL — Apple Inc.", "NVDA — Nvidia", "MC.PA — LVMH"].map(s => (
                  <div key={s} style={{
                    fontSize: 11, padding: "4px 10px", borderRadius: 6,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    color: "var(--text-muted)",
                  }}>{s}</div>
                ))}
              </div>
            </div>
          )}

          {/* ── Phase 2 : Analyzing ── */}
          {phase === "analyzing" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%",
                  border: "2px solid rgba(134,239,172,0.3)",
                  borderTopColor: "var(--accent)",
                  animation: "spin 0.7s linear infinite",
                }} />
                <span style={{ fontSize: 13, color: "var(--accent)", fontWeight: 500 }}>
                  L&apos;IA analyse{dots}
                </span>
              </div>
              {/* Skeleton rows */}
              {[100, 75, 90, 60, 80].map((w, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="skeleton" style={{ width: 90, height: 12, borderRadius: 4, flexShrink: 0 }} />
                  <div className="skeleton" style={{ width: `${w}%`, height: 12, borderRadius: 4 }} />
                </div>
              ))}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 8 }}>
                {[1,2,3].map(i => (
                  <div key={i} className="skeleton" style={{ height: 56, borderRadius: 10 }} />
                ))}
              </div>
            </div>
          )}

          {/* ── Phase 3 : Result ── */}
          {phase === "result" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
              {/* Left — Signal + metrics */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: "rgba(59,123,255,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800, color: "#3b7bff",
                  }}>AAPL</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>Apple Inc.</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>NASDAQ · Technology</div>
                  </div>
                </div>

                {/* Signal badge */}
                <div style={{
                  padding: "10px 14px", borderRadius: 10,
                  background: "rgba(134,239,172,0.08)",
                  border: "1px solid rgba(134,239,172,0.22)",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>Signal IA</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#86efac", letterSpacing: "0.5px" }}>
                      STRONG BUY
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>Prix cible</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>242 $</div>
                  </div>
                </div>

                {/* Mini metrics */}
                {[
                  { label: "Prix actuel", value: "212,40 $", color: "var(--text-primary)" },
                  { label: "Potentiel", value: "+14,0 %", color: "#86efac" },
                  { label: "P/E ratio", value: "28,4×", color: "var(--text-primary)" },
                ].map(m => (
                  <div key={m.label} style={{
                    display: "flex", justifyContent: "space-between",
                    fontSize: 12, borderBottom: "1px solid rgba(255,255,255,0.05)",
                    paddingBottom: 8,
                  }}>
                    <span style={{ color: "var(--text-muted)" }}>{m.label}</span>
                    <span style={{ fontWeight: 600, color: m.color }}>{m.value}</span>
                  </div>
                ))}
              </div>

              {/* Right — Chart + score */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Price chart */}
                <div style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 12, padding: "12px 14px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Évolution 12 mois</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#86efac" }}>+38,2 %</span>
                  </div>
                  <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
                    <defs>
                      <linearGradient id="dpFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#86efac" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#86efac" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={fillPath} fill="url(#dpFill)" />
                    <polyline
                      points={polyline}
                      fill="none"
                      stroke="#86efac"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx={PRICE_POINTS[PRICE_POINTS.length-1][0]} cy={PRICE_POINTS[PRICE_POINTS.length-1][1]}
                      r="3" fill="#86efac" />
                  </svg>
                </div>

                {/* Score gauge */}
                <div style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 12, padding: "14px",
                  display: "flex", alignItems: "center", gap: 16,
                }}>
                  <div style={{ position: "relative", width: 64, height: 64, flexShrink: 0 }}>
                    <svg viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)", width: 64, height: 64 }}>
                      <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#86efac" strokeWidth="10"
                        strokeDasharray={`${0.72 * 251} 251`} strokeLinecap="round" />
                    </svg>
                    <div style={{
                      position: "absolute", inset: 0,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ fontSize: 15, fontWeight: 800, lineHeight: 1 }}>72</span>
                      <span style={{ fontSize: 8, color: "var(--text-muted)" }}>/100</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>
                      Score global
                    </div>
                    <div style={{ fontSize: 11, color: "#86efac" }}>Attractif</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                      Valorisation · Santé financière · Momentum
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer badge */}
        <div style={{
          padding: "8px 20px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          textAlign: "center",
          fontSize: 10, color: "var(--text-disabled)",
        }}>
          Données simulées à titre d&apos;illustration · Finazen
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes cursor-blink { 50% { opacity: 0; } }
      `}</style>
    </section>
  );
}
