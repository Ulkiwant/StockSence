import * as React from "react";

type LogoProps = {
  /** Taille de la police (et de référence pour le mark). Défaut 28. */
  size?: number;
  /** "full" = mark + wordmark, "mark" = mark seule. Défaut "full". */
  variant?: "full" | "mark";
  /** Couleur CSS — utilise currentColor par défaut. */
  color?: string;
  className?: string;
};

/** Diamant taillé brut — marque StockSense */
function DiamondMark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Facettes remplies */}
      <path d="M6 14 L13 14 L20 4 Z"        fill="currentColor" fillOpacity="0.15" />
      <path d="M20 4 L27 14 L34 14 Z"        fill="currentColor" fillOpacity="0.35" />
      <path d="M27 14 L20 36 L13 14 Z"       fill="currentColor" fillOpacity="0.08" />
      {/* Contour extérieur */}
      <path
        d="M20 4 L34 14 L20 36 L6 14 Z"
        stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none"
      />
      {/* Arêtes internes */}
      <path d="M6 14 L13 14 L20 4"           stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="none" />
      <path d="M20 4 L27 14 L34 14"          stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="none" />
      <path d="M13 14 L20 36"                stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path d="M27 14 L20 36"                stroke="currentColor" strokeWidth="1.4" fill="none" />
    </svg>
  );
}

export function Logo({
  size = 28,
  variant = "full",
  color = "currentColor",
  className,
}: LogoProps) {
  if (variant === "mark") {
    return (
      <span
        className={className}
        style={{ display: "inline-flex", color }}
        aria-label="StockSense"
      >
        <DiamondMark size={size} />
      </span>
    );
  }

  const markSize  = Math.round(size * 1.35);
  const gap       = Math.round(size * 0.36);

  return (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "center", gap, color, lineHeight: 1 }}
      aria-label="StockSense"
    >
      <DiamondMark size={markSize} />
      <span
        style={{
          fontFamily:
            "Geist, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          fontSize: size,
          fontWeight: 600,
          letterSpacing: "-0.025em",
        }}
      >
        StockSense
      </span>
    </span>
  );
}
