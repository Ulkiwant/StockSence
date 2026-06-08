import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conseiller IA — Portefeuille personnalisé en 3 minutes",
  description:
    "Répondez à 9 questions simples. Notre IA construit un portefeuille d'investissement personnalisé selon votre profil, votre horizon et vos objectifs. Résultat complet avec un compte Investisseur ou Premium.",
  keywords: [
    "conseiller financier IA",
    "portefeuille investissement personnalisé",
    "simulation portefeuille bourse",
    "investir débutant France",
    "PEA ETF portefeuille",
    "allocation d'actifs",
    "profil investisseur",
  ],
  openGraph: {
    title: "Conseiller IA Finazen — Ton portefeuille en 3 minutes",
    description:
      "9 questions simples, un portefeuille sur mesure. Adapté à ton profil, ton horizon et tes objectifs. Résultat visible avec un compte.",
    url: "https://finazen.fr/advisor",
  },
  alternates: { canonical: "https://finazen.fr/advisor" },
};

export default function AdvisorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
