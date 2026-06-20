"use client";

export type SignalScore =
  | "STRONG_BUY"
  | "BUY"
  | "HOLD"
  | "SELL"
  | "STRONG_SELL"
  | string;

const SIGNAL_CONFIG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  STRONG_BUY: {
    label: "Très sous-évalué",
    bg: "rgba(45, 125, 90, 0.12)",
    color: "#2d7d5a",
    border: "rgba(45, 125, 90, 0.35)",
  },
  BUY: {
    label: "Sous-évalué",
    bg: "rgba(45, 125, 90, 0.08)",
    color: "#2d7d5a",
    border: "rgba(45, 125, 90, 0.25)",
  },
  HOLD: {
    label: "Neutre",
    bg: "rgba(139, 122, 94, 0.10)",
    color: "#8b7a5e",
    border: "rgba(139, 122, 94, 0.28)",
  },
  SELL: {
    label: "À surveiller",
    bg: "rgba(184, 74, 58, 0.08)",
    color: "#b84a3a",
    border: "rgba(184, 74, 58, 0.25)",
  },
  STRONG_SELL: {
    label: "Surévalué",
    bg: "rgba(184, 74, 58, 0.12)",
    color: "#b84a3a",
    border: "rgba(184, 74, 58, 0.35)",
  },
};

interface SignalPillProps {
  score: SignalScore;
  size?: "sm" | "md" | "lg";
}

export default function SignalPill({ score, size = "md" }: SignalPillProps) {
  const config = SIGNAL_CONFIG[score] ?? {
    label: score,
    bg: "rgba(139, 122, 94, 0.10)",
    color: "#8b7a5e",
    border: "rgba(139, 122, 94, 0.28)",
  };

  const fontSize = size === "sm" ? 11 : size === "lg" ? 15 : 12;
  const padding  = size === "sm" ? "3px 10px" : size === "lg" ? "6px 18px" : "4px 13px";
  const fontWeight = size === "lg" ? 700 : 600;

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      padding,
      borderRadius: 9999,
      background: config.bg,
      color: config.color,
      border: `1px solid ${config.border}`,
      fontSize,
      fontWeight,
      letterSpacing: "0.01em",
      whiteSpace: "nowrap",
    }}>
      {config.label}
    </span>
  );
}
