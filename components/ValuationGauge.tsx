"use client";

import { useEffect, useRef, useState } from "react";

interface ValuationGaugeProps {
  score: number;          // -100 to +100
  label?: string;
  size?: "sm" | "md" | "lg";
  lightBg?: boolean;      // true = page claire (track gris), false = fond sombre (track blanc)
}

function getColor(score: number): string {
  if (score > 20)  return "var(--signal-up)";
  if (score < -20) return "var(--signal-down)";
  return "var(--signal-neutral)";
}

function getSignalLabel(score: number): string {
  if (score >= 40)  return "Forte décote";
  if (score >= 15)  return "Sous-évalué";
  if (score > -15)  return "Neutre";
  if (score > -40)  return "À surveiller";
  return "Surévalué";
}

export default function ValuationGauge({ score, label, size = "md", lightBg = false }: ValuationGaugeProps) {
  const [animScore, setAnimScore] = useState(0);
  const rafRef   = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  const dims = { sm: 120, md: 170, lg: 230 };
  const dim  = dims[size];
  const cx   = dim / 2;
  const cy   = dim / 2;
  const r    = dim * 0.38;
  const sw   = dim * 0.055;

  const clampedScore = Math.max(-100, Math.min(100, animScore));
  const fraction     = (clampedScore + 100) / 200;   // 0 → 1

  const color       = getColor(animScore);
  const signalLabel = getSignalLabel(animScore);

  // Needle: rotates from 180° (far left) → 360° (far right), passing through top (270°)
  const needleAngle = 180 + fraction * 180;
  const needleLen   = r * 0.72;
  const needleRad   = (needleAngle * Math.PI) / 180;
  const nx1 = cx + Math.cos(needleRad) * needleLen;
  const ny1 = cy + Math.sin(needleRad) * needleLen;

  // Animation
  useEffect(() => {
    startRef.current = null;
    const target   = score;
    const duration = 900;
    function step(ts: number) {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      setAnimScore(eased * target);
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [score]);

  // Arc paths (semi-circle from 180° → 0°)
  const arcPath = (fromDeg: number, toDeg: number, radius: number) => {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const x1 = cx + Math.cos(toRad(fromDeg)) * radius;
    const y1 = cy + Math.sin(toRad(fromDeg)) * radius;
    const x2 = cx + Math.cos(toRad(toDeg))   * radius;
    const y2 = cy + Math.sin(toRad(toDeg))   * radius;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`;
  };

  const trackPath  = arcPath(180, 0, r);
  const filledEnd  = 180 + fraction * 180;
  const filledPath = arcPath(180, filledEnd > 360 ? filledEnd - 360 : filledEnd, r);

  const fontSize = size === "sm" ? 22 : size === "lg" ? 44 : 32;
  const subSize  = size === "sm" ? 10 : size === "lg" ? 14 : 12;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
      {/* SVG — arc + needle only, NO text inside */}
      <svg
        width={dim}
        height={dim * 0.58}
        viewBox={`0 0 ${dim} ${dim * 0.58}`}
        overflow="visible"
      >
        {/* Track arc */}
        <path d={trackPath} fill="none" stroke={lightBg ? "var(--line)" : "rgba(255,255,255,0.18)"} strokeWidth={sw} strokeLinecap="round" />
        {/* Filled arc */}
        <path
          d={filledPath}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          style={{ transition: "stroke 0.3s ease" }}
        />
        {/* Needle */}
        <line
          x1={cx} y1={cy}
          x2={nx1} y2={ny1}
          stroke={color}
          strokeWidth={sw * 0.45}
          strokeLinecap="round"
          style={{ transition: "stroke 0.3s ease" }}
        />
        {/* Needle pivot */}
        <circle cx={cx} cy={cy} r={sw * 0.7} fill={color} style={{ transition: "fill 0.3s ease" }} />
      </svg>

      {/* Score + label in HTML — never overlapped by needle */}
      <div style={{ textAlign: "center", marginTop: 4 }}>
        <div style={{
          fontSize,
          fontWeight: 700,
          color,
          fontFamily: "var(--font-geist-mono, monospace)",
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.03em",
          lineHeight: 1,
          transition: "color 0.3s ease",
        }}>
          {animScore > 0 ? "+" : ""}{Math.round(animScore)}
        </div>
        <div style={{
          fontSize: subSize,
          fontWeight: 700,
          color,
          letterSpacing: "0.10em",
          textTransform: "uppercase",
          marginTop: 4,
          transition: "color 0.3s ease",
        }}>
          {signalLabel}
        </div>
      </div>

      {label && (
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{label}</p>
      )}
    </div>
  );
}
