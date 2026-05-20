"use client";

import Link from "next/link";
import Brand from "./Brand";

const COLS = [
  {
    title: "Produit",
    links: [
      { label: "Analyser une action", href: "/" },
      { label: "Mon portefeuille",    href: "/portfolio" },
      { label: "Ma watchlist",        href: "/watchlist" },
      { label: "Conseiller IA",       href: "/advisor" },
      { label: "Alertes email",       href: "/parametres/alertes" },
    ],
  },
  {
    title: "Ressources",
    links: [
      { label: "Glossaire",  href: "/glossaire" },
      { label: "FAQ",        href: "/faq" },
    ],
  },
  {
    title: "Société",
    links: [
      { label: "Mentions légales",  href: "#" },
      { label: "Confidentialité",   href: "#" },
      { label: "Contact",           href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <footer style={{
      borderTop: "1px solid var(--line)",
      background: "var(--paper-2)",
      padding: "48px 24px 32px",
    }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        {/* Top grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr 1fr",
          gap: 40,
          marginBottom: 48,
        }}>
          {/* Brand + disclaimer */}
          <div>
            <Brand size="md" />
            <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.7, marginTop: 16, maxWidth: 280 }}>
              StockSense est un outil d&apos;analyse pédagogique. Les informations présentées
              ne constituent pas des conseils en investissement au sens de l&apos;AMF.
              Investir comporte des risques de perte en capital.
            </p>
          </div>

          {/* Nav columns */}
          {COLS.map((col) => (
            <div key={col.title}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "var(--muted)", textTransform: "uppercase", marginBottom: 14 }}>
                {col.title}
              </p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 9 }}>
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} style={{ fontSize: 13, color: "var(--muted)", transition: "color 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: "1px solid var(--line)",
          paddingTop: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}>
          <p style={{ fontSize: 12, color: "var(--muted)" }}>
            © {new Date().getFullYear()} StockSense. Tous droits réservés.
          </p>
          <p style={{ fontSize: 12, color: "var(--muted)" }}>
            Données à titre indicatif — pas de conseil financier
          </p>
        </div>
      </div>
    </footer>
  );
}
