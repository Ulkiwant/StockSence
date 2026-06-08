import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mes actions — Watchlist et suivi de portefeuille",
  description:
    "Suivez vos actions favorites, consultez les signaux IA en temps réel et découvrez les opportunités d'investissement du jour. Gratuit sur Finazen.",
  keywords: [
    "watchlist actions bourse",
    "suivre actions",
    "signal achat vente",
    "mes actions bourse",
    "idées investissement",
    "opportunités boursières",
  ],
  openGraph: {
    title: "Mes actions — Finazen",
    description: "Suivez vos actions, consultez les signaux IA et découvrez les opportunités du jour.",
    url: "https://finazen.fr/watchlist",
  },
  alternates: { canonical: "https://finazen.fr/watchlist" },
};

export default function WatchlistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
