import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import OnboardingOverlay from "@/components/OnboardingOverlay";

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
    <html lang="fr">
      <body style={{ background: "var(--bg-primary)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <OnboardingOverlay />
        <main style={{ flex: 1 }}>{children}</main>
      </body>
    </html>
  );
}
