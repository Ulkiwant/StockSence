import Link from "next/link";

interface BrandProps {
  size?: "sm" | "md" | "lg";
  href?: string;
}

export default function Brand({ size = "md", href = "/" }: BrandProps) {
  const scales = { sm: 0.75, md: 1, lg: 1.3 };
  const s = scales[size];

  const logoEl = (
    <span style={{ display: "flex", alignItems: "center", gap: Math.round(8 * s) }}>
      {/* Logo SVG — trait montant qui s'arrête sur un point */}
      <svg
        width={Math.round(28 * s)}
        height={Math.round(28 * s)}
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="28" height="28" rx="8" fill="var(--accent)" />
        {/* Trait montant (sparkline) */}
        <polyline
          points="5,20 9,15 13,17 18,9"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Point terminal */}
        <circle cx="18" cy="9" r="2.2" fill="white" />
      </svg>

      {/* Wordmark */}
      <span style={{
        fontWeight: 700,
        fontSize: Math.round(16 * s),
        letterSpacing: "-0.35px",
        color: "var(--ink)",
        lineHeight: 1,
      }}>
        Stock<span style={{ color: "var(--accent)" }}>Sense</span>
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
