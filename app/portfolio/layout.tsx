import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mon portefeuille — Performance et analyse",
  description:
    "Visualisez la performance de votre portefeuille boursier et analysez sa répartition sectorielle et géographique.",
  keywords: [
    "portefeuille boursier",
    "suivi performance portefeuille",
    "analyse portefeuille actions",
    "répartition sectorielle",
    "performance investissement",
    "optimiser portefeuille",
  ],
  openGraph: {
    title: "Mon portefeuille — Finazen",
    description: "Suivez vos performances, analysez votre allocation et optimisez vos investissements.",
    url: "https://finazen.fr/portfolio",
  },
  alternates: { canonical: "https://finazen.fr/portfolio" },
};

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
