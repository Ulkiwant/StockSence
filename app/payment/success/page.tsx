"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { useEffect } from "react";

export default function PaymentSuccessPage() {
  useEffect(() => {
    // Invalider le cache du plan utilisateur
    fetch("/api/user/plan").catch(() => {});
  }, []);

  return (
    <div style={{ background: "var(--paper)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <CheckCircle size={36} strokeWidth={1.8} color="var(--accent)" />
        </div>

        <h1 style={{ fontFamily: "var(--font-instrument, serif)", fontWeight: 400, fontSize: 36, letterSpacing: "-0.02em", color: "var(--ink)", margin: "0 0 12px" }}>
          Bienvenue dans Finazen !
        </h1>
        <p style={{ fontSize: 16, color: "var(--muted)", lineHeight: 1.65, margin: "0 0 32px" }}>
          Votre abonnement est actif. Toutes les fonctionnalités sont maintenant disponibles.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/portfolio" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 9999, background: "var(--accent)", color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
            Accéder à mon portefeuille →
          </Link>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 9999, border: "1.5px solid var(--line)", color: "var(--ink)", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
// redeploy Thu Jun  4 16:40:16 CEST 2026
