"use client";

import Link from "next/link";
import Brand from "./Brand";
import { useSettings } from "@/lib/settings";

export default function Footer() {
  const { t } = useSettings();

  const COLS = [
    {
      titleKey: "footer.product",
      links: [
        { labelKey: "footer.analyze", href: "/" },
        { labelKey: "footer.portfolio", href: "/portfolio" },
        { labelKey: "footer.watchlist", href: "/watchlist" },
        { labelKey: "footer.advisor",   href: "/advisor" },
        { labelKey: "footer.alerts",    href: "/parametres/alertes" },
      ],
    },
    {
      titleKey: "footer.resources",
      links: [
        { labelKey: "footer.glossary", href: "/glossaire" },
        { labelKey: "footer.faq",      href: "/faq" },
      ],
    },
    {
      titleKey: "footer.company",
      links: [
        { labelKey: "footer.legal",   href: "/mentions-legales" },
        { labelKey: "footer.privacy", href: "/confidentialite" },
        { labelKey: "footer.contact", href: "/contact" },
      ],
    },
  ];

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
              {t("footer.disclaimer")}
            </p>
          </div>

          {/* Nav columns */}
          {COLS.map((col) => (
            <div key={col.titleKey}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "var(--muted)", textTransform: "uppercase", marginBottom: 14 }}>
                {t(col.titleKey)}
              </p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 9 }}>
                {col.links.map((l) => (
                  <li key={l.labelKey}>
                    <Link href={l.href} style={{ fontSize: 13, color: "var(--muted)", transition: "color 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
                    >
                      {t(l.labelKey)}
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
            © {new Date().getFullYear()} StockSense. {t("footer.copyright")}
          </p>
          <p style={{ fontSize: 12, color: "var(--muted)" }}>
            {t("footer.indicative")}
          </p>
        </div>
      </div>
    </footer>
  );
}
