import { GLOSSARY, GLOSSARY_CATEGORIES } from "@/lib/glossary";
import Link from "next/link";

export const metadata = {
  title: "Glossaire financier | StockSense",
  description:
    "Définitions simples des termes financiers : P/E, DCF, ETF, EV/EBITDA, PEG, marge nette... Comprendre la bourse sans jargon.",
};

export default function GlossairePage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "64px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 48 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          fontSize: 11, color: "var(--text-disabled)", marginBottom: 16,
        }}>
          <Link href="/" style={{ color: "var(--text-muted)" }}>Accueil</Link>
          <span>/</span>
          <span>Glossaire</span>
        </div>

        <h1 style={{
          fontSize: 32, fontWeight: 800, letterSpacing: "-0.5px",
          color: "var(--text-primary)", marginBottom: 12,
        }}>
          Glossaire financier
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 520 }}>
          Tous les termes utilisés sur StockSense, expliqués simplement —
          sans supposer que vous avez fait une école de commerce.
        </p>
      </div>

      {/* Catégories */}
      {GLOSSARY_CATEGORIES.map((cat) => (
        <section key={cat.title} style={{ marginBottom: 48 }}>
          <h2 style={{
            fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase",
            color: "var(--text-disabled)", marginBottom: 16,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 14 }}>{cat.emoji}</span>
            {cat.title}
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {cat.keys.map((key) => {
              const term = GLOSSARY[key];
              if (!term) return null;
              return (
                <div key={key} id={key} className="glossary-card">
                  {/* Titre + tags */}
                  <div style={{
                    display: "flex", alignItems: "flex-start",
                    justifyContent: "space-between", gap: 16, marginBottom: 8,
                  }}>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--accent)", fontFamily: "monospace" }}>
                        {term.name}
                      </h3>
                      <p style={{ fontSize: 11, color: "var(--text-disabled)", marginTop: 2 }}>
                        {term.fullName}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {term.tags.map((t) => (
                        <span key={t} style={{
                          fontSize: 9, padding: "2px 8px", borderRadius: 999,
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.07)",
                          color: "var(--text-disabled)", whiteSpace: "nowrap",
                        }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Définition */}
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: 10 }}>
                    {term.definition}
                  </p>

                  {/* Comment lire */}
                  <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 12 }}>
                    {term.howToRead}
                  </p>

                  {/* Exemple */}
                  <div style={{
                    background: "rgba(134,239,172,0.05)",
                    border: "1px solid rgba(134,239,172,0.10)",
                    borderRadius: 10, padding: "10px 14px",
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

      {/* CTA bas de page */}
      <div style={{
        marginTop: 16, background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 16, padding: "28px 24px", textAlign: "center",
      }}>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 16 }}>
          Un terme manque dans ce glossaire ?
        </p>
        <Link href="/faq" className="btn-primary">
          Poser une question à l&apos;IA →
        </Link>
      </div>
    </main>
  );
}
