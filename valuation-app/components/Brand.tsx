import Link from "next/link";

interface BrandProps {
  size?: "sm" | "md" | "lg";
  href?: string;
}

/** Diamant taillé brut en currentColor */
function DiamondMark({ px }: { px: number }) {
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Facettes */}
      <path d="M6 14 L13 14 L20 4 Z"   fill="currentColor" fillOpacity="0.18" />
      <path d="M20 4 L27 14 L34 14 Z"  fill="currentColor" fillOpacity="0.40" />
      <path d="M27 14 L20 36 L13 14 Z" fill="currentColor" fillOpacity="0.10" />
      {/* Contour */}
      <path
        d="M20 4 L34 14 L20 36 L6 14 Z"
        stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none"
      />
      {/* Arêtes internes */}
      <path d="M6 14 L13 14 L20 4"    stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="none" />
      <path d="M20 4 L27 14 L34 14"   stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="none" />
      <path d="M13 14 L20 36"          stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path d="M27 14 L20 36"          stroke="currentColor" strokeWidth="1.4" fill="none" />
    </svg>
  );
}

export default function Brand({ size = "md", href = "/" }: BrandProps) {
  const cfg = {
    sm: { mark: 20, font: 13 },
    md: { mark: 26, font: 16 },
    lg: { mark: 34, font: 21 },
  }[size];

  const logoEl = (
    <span style={{ display: "inline-flex", alignItems: "center", gap: Math.round(cfg.mark * 0.3) }}>
      {/* Mark : couleur accent */}
      <span style={{ color: "var(--accent)", display: "inline-flex" }}>
        <DiamondMark px={cfg.mark} />
      </span>

      {/* Wordmark */}
      <span
        style={{
          fontWeight: 700,
          fontSize: cfg.font,
          letterSpacing: "-0.03em",
          color: "var(--ink)",
          lineHeight: 1,
        }}
      >
        Rend<span style={{ color: "var(--accent)" }}>ly</span>
      </span>
    </span>
  );

  if (!href) return logoEl;

  return (
    <Link href={href} style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
      {logoEl}
    </Link>
  );
}
