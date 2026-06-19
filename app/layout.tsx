import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import OnboardingOverlay from "@/components/OnboardingOverlay";
import SessionGuard from "@/components/SessionGuard";
import PwaRegister from "@/components/PwaRegister";
import InstallBanner from "@/components/InstallBanner";
import MobileTabBar from "@/components/MobileTabBar";
import StandaloneRedirect from "@/components/StandaloneRedirect";

const geist = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-instrument",
});

const SITE_URL = "https://finazen.fr";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Finazen — Investir en bourse sans jargon | Analyse d'actions et profils d'investisseur",
    template: "%s | Finazen",
  },
  description:
    "Finazen analyse vos actions, valorise votre portefeuille et vous guide dans vos investissements grâce à l'IA. Sans jargon, accessible aux débutants. Plan gratuit disponible, fonctionnalités avancées dès 9,99 €/mois.",
  keywords: [
    "finazen",
    "investir bourse débutant",
    "analyse action bourse",
    "valorisation action",
    "portefeuille investissement",
    "ETF investissement",
    "profil investisseur",
    "bourse sans jargon",
    "analyser action bourse",
    "signal achat vente action",
    "exemple de répartition de portefeuille",
    "PEA investissement",
    "LVMH analyse",
    "Apple valorisation",
    "investissement France",
    "débutant bourse",
  ],
  authors: [{ name: "Finazen", url: SITE_URL }],
  creator: "Finazen",
  publisher: "Finazen",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
    languages: { "fr-FR": SITE_URL },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: "Finazen",
    title: "Finazen — Investir en bourse sans jargon",
    description:
      "Analysez n'importe quelle action, suivez votre portefeuille et découvrez à quel profil d'investisseur vous correspondez. Plan gratuit disponible, sans carte bancaire.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Finazen — Investir en bourse sans jargon",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Finazen — Investir en bourse sans jargon",
    description:
      "Analysez vos actions, valorisez votre portefeuille et découvrez votre profil d'investisseur. Gratuit pour les débutants.",
    images: ["/og-image.png"],
    creator: "@finazen_fr",
  },
  verification: {
    google: "F1JYaMDq00FniUf4d4UYv3h3wMubnmecdAvzdA-28LM",
  },
  category: "finance",
  themeColor: "#0a1628",
  appleWebApp: {
    capable: true,
    title: "Finazen",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${geist.variable} ${geistMono.variable} ${instrumentSerif.variable}`}>
      <head>
        {/* Favicon supplémentaire pour compatibilité */}
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/favicon.ico" />
        {/* PWA — icône iOS (apple-touch-icon généré par app/apple-icon.tsx) */}
        <link rel="apple-touch-icon" href="/apple-icon" />
        {/* PWA — ces deux balises ne sont pas générées par l'API metadata de Next
            sur cette version, on les force explicitement : sans "capable", iOS ouvre
            le site ajouté à l'écran d'accueil dans Safari (avec barre d'adresse)
            au lieu du mode plein écran "standalone". */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0a1628" />
        {/* Préconnexion aux polices */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body style={{ background: "var(--paper)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <PwaRegister />
        <StandaloneRedirect />
        <Navbar />
        <OnboardingOverlay />
        <SessionGuard />
        <main style={{ flex: 1 }}>{children}</main>
        <InstallBanner />
        <MobileTabBar />
      </body>
    </html>
  );
}
