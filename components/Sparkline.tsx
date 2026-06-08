"use client";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  fill?: boolean;
}

export default function Sparkline({
  data,
  width = 80,
  height = 32,
  color = "var(--accent)",
  strokeWidth = 1.5,
  fill = true,
}: SparklineProps) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pad = 2;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * w;
    const y = pad + (1 - (v - min) / range) * h;
    return `${x},${y}`;
  });

  const polyline = points.join(" ");
  const lastPt = points[points.length - 1].split(",");

  // Fill path: close to bottom-right and bottom-left
  const fillPath = [
    `M ${points[0].replace(",", " ")}`,
    ...points.slice(1).map((p) => `L ${p.replace(",", " ")}`),
    `L ${lastPt[0]} ${height - pad}`,
    `L ${pad} ${height - pad}`,
    "Z",
  ].join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" aria-hidden="true">
      {fill && (
        <path
          d={fillPath}
          fill={color}
          fillOpacity={0.10}
        />
      )}
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point dot */}
      <circle
        cx={parseFloat(lastPt[0])}
        cy={parseFloat(lastPt[1])}
        r={2.2}
        fill={color}
      />
    </svg>
  );
}
