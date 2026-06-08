import Link from "next/link";
import SignalPill from "./SignalPill";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  currency: string;
  signal?: "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL";
  fairValue?: number;
  upside?: number;
  score?: number;
  sector?: string;
}

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
}

export default function StockCard({ symbol, name, currentPrice, change, changePercent, currency, signal, fairValue, upside, score }: Props) {
  const isUp = change >= 0;
  const scoreColor = score !== undefined
    ? score >= 65 ? "var(--signal-up)" : score >= 40 ? "var(--warning)" : "var(--signal-down)"
    : "var(--muted)";

  return (
    <Link href={`/stock/${symbol}`} style={{ display: "block" }}>
      <div style={{
        background: "var(--paper-2)",
        border: "1.5px solid var(--line)",
        borderRadius: 16,
        padding: "20px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        transition: "border-color 0.15s, box-shadow 0.15s, transform 0.12s",
      }}
        onMouseEnter={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = "var(--border-hover)"; el.style.boxShadow = "0 4px 16px rgba(10,22,40,0.08)"; el.style.transform = "translateY(-1px)"; }}
        onMouseLeave={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = "var(--line)"; el.style.boxShadow = "none"; el.style.transform = "translateY(0)"; }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 9,
              background: "var(--accent-soft)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 800, color: "var(--accent)",
              marginBottom: 8, letterSpacing: "-0.01em",
            }}>
              {symbol.slice(0, 3)}
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {name}
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{symbol}</div>
          </div>
          {signal && <SignalPill score={signal} size="sm" />}
        </div>

        {/* Price */}
        <div>
          <div style={{
            fontSize: 22, fontWeight: 700, letterSpacing: "-0.04em", color: "var(--ink)",
            fontFamily: "var(--font-geist-mono, monospace)", fontVariantNumeric: "tabular-nums",
          }}>
            {fmt(currentPrice, currency)}
          </div>
          <div style={{
            fontSize: 12, fontWeight: 600, marginTop: 3,
            color: isUp ? "var(--signal-up)" : "var(--signal-down)",
            display: "flex", alignItems: "center", gap: 4,
            fontFamily: "var(--font-geist-mono, monospace)", fontVariantNumeric: "tabular-nums",
          }}>
            {isUp ? <TrendingUp size={12} strokeWidth={2} /> : <TrendingDown size={12} strokeWidth={2} />}
            {isUp ? "+" : ""}{fmt(change, currency)} ({isUp ? "+" : ""}{(changePercent * 100).toFixed(2)}%)
          </div>
        </div>

        {/* Valuation */}
        {fairValue !== undefined && upside !== undefined && (
          <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 2, letterSpacing: "0.03em" }}>VALEUR CIBLE</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", fontFamily: "var(--font-geist-mono, monospace)", fontVariantNumeric: "tabular-nums" }}>
                {fmt(fairValue, currency)}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 2, letterSpacing: "0.03em" }}>POTENTIEL</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: upside > 0 ? "var(--signal-up)" : "var(--signal-down)", fontFamily: "var(--font-geist-mono, monospace)", fontVariantNumeric: "tabular-nums" }}>
                {upside > 0 ? "+" : ""}{upside.toFixed(1)}%
              </div>
            </div>
          </div>
        )}

        {/* Score bar */}
        {score !== undefined && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, alignItems: "center" }}>
              <span style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.03em" }}>SCORE</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: scoreColor, fontFamily: "var(--font-geist-mono, monospace)", fontVariantNumeric: "tabular-nums" }}>
                {score}/100
              </span>
            </div>
            <div style={{ height: 3, borderRadius: 2, background: "var(--line)", overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${score}%`, borderRadius: 2,
                background: scoreColor,
                transition: "width 0.7s ease",
              }} />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
