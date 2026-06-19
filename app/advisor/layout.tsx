import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profils d'investisseur — Quel profil te correspond ?",
  description:
    "Répondez à quelques questions simples pour situer votre profil parmi 4 profils-types (Prudent, Équilibré, Dynamique, Offensif) et découvrir un exemple de répartition pour ce profil. Contenu pédagogique, sans recommandation personnalisée.",
  keywords: [
    "profil investisseur",
    "profil d'investissement",
    "exemple de répartition de portefeuille",
    "simulation portefeuille bourse",
    "investir débutant France",
    "PEA ETF portefeuille",
    "allocation d'actifs",
  ],
  openGraph: {
    title: "Profils d'investisseur — Finazen",
    description:
      "Quelques questions simples pour situer ton profil parmi 4 profils-types et découvrir un exemple de répartition pédagogique pour ce profil.",
    url: "https://finazen.fr/advisor",
  },
  alternates: { canonical: "https://finazen.fr/advisor" },
};

export default function AdvisorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
