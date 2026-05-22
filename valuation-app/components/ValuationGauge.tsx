"use client";

import { useEffect, useRef, useState } from "react";

interface ValuationGaugeProps {
  score: number;          // -100 to +100
  label?: string;         // optional subtitle
  size?: "sm" | "md" | "lg";
}

function getColor(score: number): string {
  if (score > 20)  return "var(--signal-up)";
  if (score < -20) return "var(--signal-down)";
  return "var(--signal-neutral)";
}

function getSignalLabel(score: number): string {
  if (score >= 40)  return "Achat fort";
  if (score >= 15)  return "Achat";
  if (score > -15)  return "Neutre";
  if (score > -40)  return "Vente";
  return "Vente forte";
}

export default function ValuationGauge({ score, label, size = "md" }: ValuationGaugeProps) {
  const [animScore, setAnimScore] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  const dims = { sm: 120, md: 180, lg: 240 };
  const dim = dims[size];
  const cx = dim / 2;
  const cy = dim / 2;
  const r  = dim * 0.38;
  const sw = dim * 0.055;  // stroke width

  // Demi-cercle: de 180° à 0° (gauche → droite)
  // On code l'arc comme stroke-dasharray sur un cercle
  const circumference = Math.PI * r; // demi-cercle
  const clampedScore  = Math.max(-100, Math.min(100, animScore));
  const fraction      = (clampedScore + 100) / 200;   // 0→1
  const dashOffset    = circumference * (1 - fraction);

  const color = getColor(animScore);
  const signalLabel = getSignalLabel(animScore);

  // Needle angle: 180° (gauche) → 360° (droite) en passant par 270° (haut)
  const needleAngle = 180 + fraction * 180;
  const needleLen   = r * 0.68;
  const needleRad   = (needleAngle * Math.PI) / 180;
  const nx1 = cx + Math.cos(needleRad) * needleLen;
  const ny1 = cy + Math.sin(needleRad) * needleLen;

  useEffect(() => {
    startRef.current = null;
    const target = score;
    const duration = 900;

    function step(ts: number) {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimScore(eased * target);
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    }

    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [score]);

  // Track arc (grey demi-circle, using SVG arc path)
  // Gauge: starts bottom-left (180°), ends bottom-right (0°), top at top
  const arcPath = (fromDeg: number, toDeg: number, radius: number) => {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const x1 = cx + Math.cos(toRad(fromDeg)) * radius;
    const y1 = cy + Math.sin(toRad(fromDeg)) * radius;
    const x2 = cx + Math.cos(toRad(toDeg)) * radius;
    const y2 = cy + Math.sin(toRad(toDeg)) * radius;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`;
  };

  const trackPath = arcPath(180, 0, r);

  const filledFraction = fraction;
  // Filled arc from 180° to 180° + filledFraction*180°
  const filledEndDeg   = 180 + filledFraction * 180;
  const filledPath     = arcPath(180, filledEndDeg > 360 ? filledEndDeg - 360 : filledEndDeg, r);

  const fontSize = size === "sm" ? 22 : size === "lg" ? 44 : 32;
  const subSize  = size === "sm" ? 10 : size === "lg" ? 15 : 12;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
      <svg width={dim} height={dim * 0.58} viewBox={`0 0 ${dim} ${dim * 0.58}`} overflow="visible">
        {/* Track */}
        <path d={trackPath} fill="none" stroke="var(--line)" strokeWidth={sw} strokeLinecap="round" />
        {/* Filled */}
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
          x1={cx}
          y1={cy}
          x2={nx1}
          y2={ny1}
          stroke={color}
          strokeWidth={sw * 0.45}
          strokeLinecap="round"
          style={{ transition: "stroke 0.3s ease" }}
        />
        <circle cx={cx} cy={cy} r={sw * 0.7} fill={color} style={{ transition: "fill 0.3s ease" }} />
      </svg>

      {/* Score + label displayed below the SVG so the needle never overlaps */}
      <div style={{ textAlign: "center", marginTop: -4 }}>
        <div style={{
          fontSize: fontSize,
          fontWeight: 700,
          color,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.03em",
          fontFamily: "var(--font-geist-mono, monospace)",
          lineHeight: 1.1,
          transition: "color 0.3s ease",
        }}>
          {animScore > 0 ? "+" : ""}{Math.round(animScore)}
        </div>
        <div style={{
          fontSize: subSize,
          fontWeight: 600,
          color,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginTop: 2,
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
