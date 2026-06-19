import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Mentions légales | Finazen",
  description: "Mentions légales de Finazen — éditeur, hébergeur, responsabilité et avertissement financier.",
};

const SECTION_STYLE = {
  marginBottom: 36,
} as const;

const H2_STYLE = {
  fontSize: 16,
  fontWeight: 700,
  color: "var(--ink)",
  letterSpacing: "-0.2px",
  marginBottom: 10,
  paddingBottom: 8,
  borderBottom: "1px solid var(--line)",
} as const;

const P_STYLE = {
  fontSize: 14,
  color: "var(--muted)",
  lineHeight: 1.75,
  marginBottom: 8,
} as const;

export default function MentionsLegalesPage() {
  return (
    <div style={{ background: "var(--paper)", minHeight: "100vh" }}>
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 28px 64px" }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 28 }}>
          <Link href="/" style={{ color: "var(--muted)" }}>Accueil</Link>
          <span style={{ margin: "0 6px" }}>›</span>
          <span style={{ color: "var(--ink)", fontWeight: 600 }}>Mentions légales</span>
        </div>

        <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.5px", color: "var(--ink)", marginBottom: 8 }}>
          Mentions légales
        </h1>
        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 40 }}>
          Dernière mise à jour : mai 2026
        </p>

        {/* 1. Éditeur */}
        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>1. Éditeur du site</h2>
          <p style={P_STYLE}>
            Le site <strong style={{ color: "var(--ink)" }}>Finazen</strong> (accessible à l'adresse{" "}
            <a href="https://stock-sence-two.vercel.app" style={{ color: "var(--accent)" }}>
              stock-sence-two.vercel.app
            </a>
            ) est édité par :
          </p>
          <div style={{
            background: "var(--paper-2)", border: "1px solid var(--line)",
            borderRadius: 12, padding: "16px 20px",
            fontSize: 13, color: "var(--ink)", lineHeight: 1.8,
          }}>
            <strong>Finazen</strong><br />
            Éditeur individuel — projet pédagogique<br />
            Adresse email : <a href="mailto:contact@stocksense.fr" style={{ color: "var(--accent)" }}>contact@stocksense.fr</a>
          </div>
        </div>

        {/* 2. Hébergement */}
        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>2. Hébergement</h2>
          <p style={P_STYLE}>
            Le site est hébergé par <strong style={{ color: "var(--ink)" }}>Vercel Inc.</strong>,
            340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis.
          </p>
          <p style={P_STYLE}>
            Site : <a href="https://vercel.com" style={{ color: "var(--accent)" }}>vercel.com</a>
          </p>
          <p style={P_STYLE}>
            Les serveurs de Vercel utilisés pour ce projet sont localisés en Europe (région Frankfurt, Allemagne)
            conformément à la politique RGPD.
          </p>
        </div>

        {/* 3. Propriété intellectuelle */}
        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>3. Propriété intellectuelle</h2>
          <p style={P_STYLE}>
            L'ensemble du contenu présent sur Finazen (textes, analyses, code, interface, logo) est la
            propriété exclusive de l'éditeur, sauf mention contraire. Toute reproduction, représentation,
            modification ou adaptation, totale ou partielle, est interdite sans autorisation écrite préalable.
          </p>
          <p style={P_STYLE}>
            Les données financières sont fournies par <strong style={{ color: "var(--ink)" }}>Yahoo Finance</strong> via
            leur API publique, et sont soumises à leurs propres conditions d'utilisation.
          </p>
        </div>

        {/* 4. Avertissement financier */}
        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>4. Avertissement financier (AMF)</h2>
          <div style={{
            background: "rgba(184,74,58,0.06)", border: "1.5px solid rgba(184,74,58,0.25)",
            borderRadius: 12, padding: "16px 20px",
          }}>
            <p style={{ ...P_STYLE, marginBottom: 0 }}>
              Les informations, analyses et valorisations présentées sur Finazen sont fournies à titre
              purement <strong style={{ color: "var(--ink)" }}>pédagogique et informatif</strong>. Elles ne constituent
              pas des conseils en investissement au sens de la réglementation de l'Autorité des Marchés Financiers (AMF),
              ni une recommandation d'achat ou de vente de valeurs mobilières.
            </p>
            <p style={{ ...P_STYLE, marginTop: 8, marginBottom: 0 }}>
              Finazen n'est pas un conseiller en investissements financiers (CIF) au sens de l'article
              L.541-1 du Code monétaire et financier et n'est pas inscrit à l'ORIAS. Les profils-types et
              exemples de répartition proposés sont des contenus génériques à visée pédagogique, non
              adaptés à votre situation personnelle, et ne constituent pas une recommandation personnalisée.
            </p>
            <p style={{ ...P_STYLE, marginTop: 8, marginBottom: 0 }}>
              Tout investissement comporte des risques, y compris la perte totale du capital investi. Les
              performances passées ne préjugent pas des performances futures. Consultez un professionnel
              agréé (CIF inscrit à l'ORIAS) avant toute décision d'investissement.
            </p>
          </div>
        </div>

        {/* 5. Données personnelles */}
        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>5. Données personnelles</h2>
          <p style={P_STYLE}>
            La collecte et le traitement des données personnelles sont régis par notre{" "}
            <Link href="/confidentialite" style={{ color: "var(--accent)", fontWeight: 500 }}>
              politique de confidentialité
            </Link>
            , conformément au Règlement Général sur la Protection des Données (RGPD — UE 2016/679).
          </p>
        </div>

        {/* 6. Contact */}
        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>6. Contact</h2>
          <p style={P_STYLE}>
            Pour toute question relative aux présentes mentions légales, vous pouvez nous contacter à l'adresse :{" "}
            <a href="mailto:contact@stocksense.fr" style={{ color: "var(--accent)", fontWeight: 500 }}>
              contact@stocksense.fr
            </a>
          </p>
        </div>

      </main>
      <Footer />
    </div>
  );
}
