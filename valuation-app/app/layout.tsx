import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import OnboardingOverlay from "@/components/OnboardingOverlay";
import Providers from "@/components/Providers";

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

export const metadata: Metadata = {
  title: "StockSense — Valorisation d'Actions",
  description: "Découvrez si une action est surévaluée ou sous-évaluée en quelques secondes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${geist.variable} ${geistMono.variable} ${instrumentSerif.variable}`}>
      <body style={{ background: "var(--paper)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Providers>
          <Navbar />
          <OnboardingOverlay />
          <main style={{ flex: 1 }}>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
