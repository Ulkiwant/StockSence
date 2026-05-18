type Signal = "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL";

const CONFIG: Record<Signal, { label: string; color: string; bg: string }> = {
  STRONG_BUY: { label: "Fort achat", color: "#86efac", bg: "rgba(0,212,138,0.12)" },
  BUY:        { label: "Achat",      color: "#4ade80", bg: "rgba(74,222,128,0.1)" },
  HOLD:       { label: "Conserver",  color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
  SELL:       { label: "Vendre",     color: "#f97316", bg: "rgba(249,115,22,0.1)" },
  STRONG_SELL:{ label: "Vente forte",color: "#ff4757", bg: "rgba(255,71,87,0.12)" },
};

export default function SignalBadge({ signal, size = "md" }: { signal: Signal; size?: "sm" | "md" | "lg" }) {
  const c = CONFIG[signal] ?? CONFIG.HOLD;
  const fontSize = size === "sm" ? 11 : size === "lg" ? 15 : 13;
  const padding = size === "sm" ? "3px 8px" : size === "lg" ? "8px 18px" : "5px 12px";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding,
        borderRadius: 20,
        background: c.bg,
        color: c.color,
        fontSize,
        fontWeight: 600,
        letterSpacing: "0.2px",
      }}
    >
      <span
        style={{
          width: size === "sm" ? 5 : 6,
          height: size === "sm" ? 5 : 6,
          borderRadius: "50%",
          background: c.color,
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      {c.label}
    </span>
  );
}
