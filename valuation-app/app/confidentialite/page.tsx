import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Politique de confidentialité | Rently",
  description: "Politique de confidentialité de Rently — données collectées, cookies, droits RGPD.",
};

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

const SECTION = { marginBottom: 36 } as const;

export default function ConfidentialitePage() {
  return (
    <div style={{ background: "var(--paper)", minHeight: "100vh" }}>
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 28px 64px" }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 28 }}>
          <Link href="/" style={{ color: "var(--muted)" }}>Accueil</Link>
          <span style={{ margin: "0 6px" }}>›</span>
          <span style={{ color: "var(--ink)", fontWeight: 600 }}>Politique de confidentialité</span>
        </div>

        <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.5px", color: "var(--ink)", marginBottom: 8 }}>
          Politique de confidentialité
        </h1>
        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 40 }}>
          Dernière mise à jour : mai 2026 — Conforme au RGPD (UE 2016/679)
        </p>

        {/* Intro */}
        <div style={{
          background: "var(--accent-soft)", border: "1px solid rgba(45,125,90,0.20)",
          borderRadius: 12, padding: "16px 20px", marginBottom: 36,
          fontSize: 13, color: "var(--muted)", lineHeight: 1.7,
        }}>
          Rently s'engage à protéger votre vie privée. Cette politique explique quelles données nous
          collectons, pourquoi, et comment nous les protégeons. <strong style={{ color: "var(--ink)" }}>
          Nous ne vendons aucune donnée personnelle à des tiers.</strong>
        </div>

        {/* 1. Données collectées */}
        <div style={SECTION}>
          <h2 style={H2_STYLE}>1. Données collectées</h2>
          <p style={P_STYLE}>Nous collectons uniquement les données nécessaires au fonctionnement du service :</p>
          <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
            {[
              "Adresse email (lors de la création de compte via Supabase Auth)",
              "Données de watchlist et de portefeuille simulé (action, quantité, prix d'achat)",
              "Préférences d'alertes email (seuils de variation, signaux)",
              "Profil investisseur du Conseiller IA (horizon, tolérance au risque — non lié à votre identité)",
              "Logs de connexion anonymisés (adresse IP, navigateur) à des fins de sécurité",
            ].map((item) => (
              <li key={item} style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.65 }}>{item}</li>
            ))}
          </ul>
          <p style={P_STYLE}>
            <strong style={{ color: "var(--ink)" }}>Nous ne collectons pas</strong> : numéros de carte bancaire,
            données biométriques, données de navigation hors Rently, ni données sensibles au sens du RGPD.
          </p>
        </div>

        {/* 2. Finalités */}
        <div style={SECTION}>
          <h2 style={H2_STYLE}>2. Finalités du traitement</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { title: "Fourniture du service", desc: "Afficher votre watchlist, portefeuille et alertes personnalisés." },
              { title: "Envoi d'alertes email", desc: "Notifier les changements de signal ou de prix que vous avez configurés." },
              { title: "Amélioration du service", desc: "Analyser l'usage agrégé et anonymisé pour améliorer les fonctionnalités." },
              { title: "Sécurité", desc: "Détecter et prévenir les accès frauduleux ou abusifs." },
            ].map((item) => (
              <div key={item.title} style={{
                background: "var(--paper-2)", border: "1px solid var(--line)",
                borderRadius: 10, padding: "14px 16px",
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Hébergement & transfert */}
        <div style={SECTION}>
          <h2 style={H2_STYLE}>3. Hébergement et localisation des données</h2>
          <p style={P_STYLE}>
            Les données sont hébergées sur l'infrastructure de{" "}
            <strong style={{ color: "var(--ink)" }}>Supabase</strong> (base de données et authentification)
            et <strong style={{ color: "var(--ink)" }}>Vercel</strong> (application).
          </p>
          <p style={P_STYLE}>
            Les serveurs utilisés sont localisés en <strong style={{ color: "var(--ink)" }}>Europe (Frankfurt, Allemagne)</strong>,
            garantissant un traitement conforme au RGPD. Aucun transfert de données vers des pays tiers
            n'est effectué sans garanties adéquates.
          </p>
        </div>

        {/* 4. Cookies */}
        <div style={SECTION}>
          <h2 style={H2_STYLE}>4. Cookies et traceurs</h2>
          <p style={P_STYLE}>
            Rently utilise uniquement des cookies <strong style={{ color: "var(--ink)" }}>strictement nécessaires</strong> au fonctionnement :
          </p>
          <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
            <li style={{ fontSize: 14, color: "var(--muted)" }}><strong style={{ color: "var(--ink)" }}>Session d'authentification</strong> — cookie Supabase pour maintenir votre connexion</li>
            <li style={{ fontSize: 14, color: "var(--muted)" }}><strong style={{ color: "var(--ink)" }}>Préférences locales</strong> — stockage local (localStorage) pour les paramètres d'affichage</li>
          </ul>
          <p style={P_STYLE}>
            <strong style={{ color: "var(--ink)" }}>Aucun cookie publicitaire</strong>, aucun traceur tiers (Google Analytics, Facebook Pixel, etc.)
            n'est utilisé sur ce site.
          </p>
        </div>

        {/* 5. Conservation */}
        <div style={SECTION}>
          <h2 style={H2_STYLE}>5. Durée de conservation</h2>
          <p style={P_STYLE}>
            Vos données sont conservées pendant la durée d'activité de votre compte, plus un délai légal
            de 3 ans après la suppression. Vous pouvez demander la suppression immédiate de votre compte
            et de toutes vos données en nous contactant à{" "}
            <a href="mailto:contact@rently.fr" style={{ color: "var(--accent)" }}>contact@rently.fr</a>.
          </p>
        </div>

        {/* 6. Droits */}
        <div style={SECTION}>
          <h2 style={H2_STYLE}>6. Vos droits (RGPD)</h2>
          <p style={P_STYLE}>Conformément au RGPD, vous disposez des droits suivants :</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { droit: "Droit d'accès", desc: "Obtenir une copie de vos données personnelles." },
              { droit: "Droit de rectification", desc: "Corriger des données inexactes." },
              { droit: "Droit à l'effacement", desc: "Demander la suppression de vos données (« droit à l'oubli »)." },
              { droit: "Droit d'opposition", desc: "Vous opposer au traitement de vos données." },
              { droit: "Droit à la portabilité", desc: "Recevoir vos données dans un format structuré et lisible." },
            ].map((item) => (
              <div key={item.droit} style={{
                display: "flex", gap: 12, padding: "10px 0",
                borderBottom: "1px solid var(--line)",
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", minWidth: 180, flexShrink: 0 }}>{item.droit}</span>
                <span style={{ fontSize: 13, color: "var(--muted)" }}>{item.desc}</span>
              </div>
            ))}
          </div>
          <p style={{ ...P_STYLE, marginTop: 16 }}>
            Pour exercer ces droits, contactez-nous :{" "}
            <a href="mailto:contact@rently.fr" style={{ color: "var(--accent)", fontWeight: 500 }}>
              contact@rently.fr
            </a>. Vous disposez également du droit d'introduire une réclamation auprès de la{" "}
            <strong style={{ color: "var(--ink)" }}>CNIL</strong> (Commission Nationale de l'Informatique et des Libertés).
          </p>
        </div>

      </main>
      <Footer />
    </div>
  );
}
