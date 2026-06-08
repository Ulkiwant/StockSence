import { GLOSSARY, GLOSSARY_CATEGORIES } from "@/lib/glossary";
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Glossaire financier | Finazen",
  description: "Définitions simples des termes financiers : PER, DCF, ETF, EV/EBITDA, PEG, marge nette... Comprendre la bourse sans jargon.",
};

export default function GlossairePage() {
  return (
    <div style={{ background: "var(--paper)", minHeight: "100vh" }}>
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 28px 64px" }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 28 }}>
          <Link href="/" style={{ color: "var(--muted)" }}>Accueil</Link>
          <span style={{ margin: "0 6px" }}>›</span>
          <span style={{ color: "var(--ink)", fontWeight: 600 }}>Glossaire</span>
        </div>

        <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.5px", color: "var(--ink)", marginBottom: 10 }}>
          Glossaire financier
        </h1>
        <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, maxWidth: 520, marginBottom: 40 }}>
          Tous les termes utilisés sur Finazen, expliqués simplement —
          sans supposer que vous avez fait une école de commerce.
        </p>

        {/* Catégories */}
        {GLOSSARY_CATEGORIES.map((cat) => (
          <section key={cat.title} style={{ marginBottom: 44 }}>
            <h2 style={{
              fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
              color: "var(--muted)", marginBottom: 14,
              fontWeight: 700,
            }}>
              {cat.title}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {cat.keys.map((key) => {
                const term = GLOSSARY[key];
                if (!term) return null;
                return (
                  <div key={key} id={key} className="glossary-card">
                    {/* Titre + tags */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 8 }}>
                      <div>
                        <h3 style={{
                          fontSize: 15, fontWeight: 700, color: "var(--accent)",
                          fontFamily: "var(--font-geist-mono, monospace)", fontVariantNumeric: "tabular-nums",
                        }}>
                          {term.name}
                        </h3>
                        <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{term.fullName}</p>
                      </div>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {term.tags.map((t) => (
                          <span key={t} style={{
                            fontSize: 9, padding: "2px 8px", borderRadius: 9999,
                            background: "var(--paper-3)", border: "1px solid var(--line)",
                            color: "var(--muted)", whiteSpace: "nowrap",
                          }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.75, marginBottom: 8 }}>
                      {term.definition}
                    </p>
                    <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7, marginBottom: 12 }}>
                      {term.howToRead}
                    </p>

                    <div style={{
                      background: "var(--accent-soft)",
                      border: "1px solid rgba(45,125,90,0.15)",
                      borderRadius: 9, padding: "10px 14px",
                    }}>
                      <p style={{ fontSize: 12, color: "var(--accent)", lineHeight: 1.75, whiteSpace: "pre-line" }}>
                        {term.example}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {/* CTA */}
        <div style={{
          background: "var(--paper-2)", border: "1.5px solid var(--line)",
          borderRadius: 16, padding: "24px", textAlign: "center",
        }}>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>
            Un terme manque dans ce glossaire ?
          </p>
          <Link href="/faq" className="btn-primary" style={{ display: "inline-flex" }}>
            Poser une question à l&apos;IA
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
