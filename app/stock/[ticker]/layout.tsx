import type { Metadata } from "next";

interface Props {
  params: Promise<{ ticker: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ticker } = await params;
  const symbol = ticker.toUpperCase();

  // On essaie de récupérer le nom de l'entreprise depuis l'API
  let companyName = symbol;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? "https://finazen.fr"}/api/stock/${symbol}`, {
      next: { revalidate: 3600 }, // Cache 1h
    });
    if (res.ok) {
      const data = await res.json();
      if (data.name) companyName = data.name;
    }
  } catch { /* fallback au ticker */ }

  const title = `${companyName} (${symbol}) — Analyse et valorisation boursière`;
  const description = `Analysez ${companyName} : juste valeur, signal achat/vente, fondamentaux financiers et recommandations IA. Gratuit sur Finazen.`;

  return {
    title,
    description,
    keywords: [
      `${companyName} analyse`,
      `${symbol} bourse`,
      `${companyName} valorisation`,
      `${symbol} signal achat`,
      `acheter ${companyName}`,
      "analyse action bourse",
      "valorisation fondamentale",
    ],
    openGraph: {
      title: `${companyName} — Analyse Finazen`,
      description,
      url: `https://finazen.fr/stock/${symbol}`,
    },
    alternates: { canonical: `https://finazen.fr/stock/${symbol}` },
  };
}

export default function StockLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
