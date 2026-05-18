import Link from "next/link";
import SignalBadge from "./SignalBadge";

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
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(n);
}

export default function StockCard({
  symbol,
  name,
  currentPrice,
  change,
  changePercent,
  currency,
  signal,
  fairValue,
  upside,
  score,
  sector,
}: Props) {
  const isUp = change >= 0;

  return (
    <Link href={`/stock/${symbol}`}>
      <div
        className="card"
        style={{
          padding: "20px",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow accent */}
        <div
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: isUp
              ? "radial-gradient(circle, rgba(134,239,172,0.06) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(252,165,165,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "linear-gradient(135deg, rgba(59,123,255,0.15), rgba(123,90,255,0.15))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                color: "var(--accent-blue)",
                marginBottom: 10,
              }}
            >
              {symbol.slice(0, 3)}
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>
              {name}
              <span style={{ fontSize: 11, color: "var(--text-muted)", background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: 4, marginLeft: 6, fontWeight: 500 }}>{symbol}</span>
            </div>
          </div>

          {signal && <SignalBadge signal={signal} size="sm" />}
        </div>

        {/* Price */}
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px" }}>
            {fmt(currentPrice, currency)}
          </div>
          <div
            style={{
              fontSize: 13,
              color: isUp ? "var(--accent-green)" : "var(--accent-red)",
              fontWeight: 500,
              marginTop: 2,
            }}
          >
            {isUp ? "+" : ""}
            {fmt(change, currency)} ({isUp ? "+" : ""}
            {(changePercent * 100).toFixed(2)}%)
          </div>
        </div>

        {/* Valuation */}
        {fairValue !== undefined && upside !== undefined && (
          <div
            style={{
              borderTop: "1px solid var(--border)",
              paddingTop: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>
                Valeur cible
              </div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{fmt(fairValue, currency)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>
                Potentiel
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: upside > 0 ? "var(--accent-green)" : "var(--accent-red)",
                }}
              >
                {upside > 0 ? "+" : ""}
                {upside.toFixed(1)}%
              </div>
            </div>
          </div>
        )}

        {/* Score bar */}
        {score !== undefined && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Score</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>
                {score}/100
              </span>
            </div>
            <div
              style={{
                height: 4,
                borderRadius: 2,
                background: "rgba(255,255,255,0.06)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${score}%`,
                  borderRadius: 2,
                  background:
                    score >= 65
                      ? "linear-gradient(90deg, #86efac, #4ade80)"
                      : score >= 40
                      ? "linear-gradient(90deg, #fcd34d, #f97316)"
                      : "linear-gradient(90deg, #fca5a5, #f97316)",
                  transition: "width 0.8s ease",
                }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
