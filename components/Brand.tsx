import Link from "next/link";

interface BrandProps {
  size?: "sm" | "md" | "lg";
  href?: string;
}

export default function Brand({ size = "md", href = "/" }: BrandProps) {
  const cfg = {
    sm: { mark: 20, font: 13 },
    md: { mark: 26, font: 16 },
    lg: { mark: 34, font: 21 },
  }[size];

  const logoEl = (
    <span style={{ display: "flex", alignItems: "center", gap: Math.round(cfg.mark * 0.28) }}>
      {/* Diamond gem mark */}
      <svg
        width={Math.round(cfg.mark * 0.76)}
        height={Math.round(cfg.mark * 1.22)}
        viewBox="0 0 34 54"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Outer gem shape — viewBox rétréci à 34×54 */}
        <path
          d="M17 1 L29 16 L34 24 L17 53 L0 24 L5 16 Z"
          stroke="var(--ink)"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        {/* Girdle (horizontal equator) */}
        <line x1="0" y1="24" x2="34" y2="24" stroke="var(--ink)" strokeWidth="2.2" />
        {/* Crown facet lines */}
        <line x1="17" y1="1" x2="10" y2="24" stroke="var(--ink)" strokeWidth="1.6" />
        <line x1="17" y1="1" x2="24" y2="24" stroke="var(--ink)" strokeWidth="1.6" />
        <line x1="5"  y1="16" x2="10" y2="24" stroke="var(--ink)" strokeWidth="1.6" />
        <line x1="29" y1="16" x2="24" y2="24" stroke="var(--ink)" strokeWidth="1.6" />
        {/* Pavilion facet lines */}
        <line x1="10" y1="24" x2="17" y2="53" stroke="var(--ink)" strokeWidth="1.6" />
        <line x1="24" y1="24" x2="17" y2="53" stroke="var(--ink)" strokeWidth="1.6" />
        {/* Shaded shoulder facets for depth */}
        <path d="M5 16 L0 24 L10 24 Z"  fill="var(--ink)" fillOpacity="0.12" />
        <path d="M29 16 L34 24 L24 24 Z" fill="var(--ink)" fillOpacity="0.12" />
      </svg>

      {/* Wordmark */}
      <span style={{
        fontWeight: 700,
        fontSize: cfg.font,
        letterSpacing: "-0.3px",
        color: "var(--ink)",
        lineHeight: 1,
      }}>
        Finazen
      </span>
    </span>
  );

  if (!href) return logoEl;

  return (
    <Link href={href} style={{ display: "inline-flex", alignItems: "center" }}>
      {logoEl}
    </Link>
  );
}
