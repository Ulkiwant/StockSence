import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ma watchlist — Suivi d'actions boursières",
  description:
    "Suivez vos actions favorites, consultez leur niveau de valorisation et découvrez les opportunités du jour. Gratuit sur Finazen.",
  keywords: [
    "watchlist actions bourse",
    "suivre actions",
    "signal valorisation action",
    "watchlist bourse",
    "idées investissement",
    "opportunités boursières",
  ],
  openGraph: {
    title: "Ma watchlist — Finazen",
    description: "Suivez vos actions, consultez leur valorisation et découvrez les opportunités du jour.",
    url: "https://finazen.fr/watchlist",
  },
  alternates: { canonical: "https://finazen.fr/watchlist" },
};

export default function WatchlistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
