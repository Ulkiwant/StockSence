"use client";

import Link from "next/link";
import { Check, X, Zap, Star, ArrowRight, Loader } from "lucide-react";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { STRIPE_PRICES } from "@/lib/stripe-prices"; // ← client-safe, pas de Node.js SDK

const PLANS = [
  {
    id: "gratuit",
    name: "Gratuit",
    desc: "Pour découvrir Finazen",
    monthlyPrice: 0,
    annualPrice: 0,
    cta: "Commencer gratuitement",
    ctaHref: "/auth/signup",
    highlight: false,
    badge: null,
    color: "var(--ink)",
    features: [
      { label: "Recherche d'entreprises", value: "1 analyse / jour" },
      { label: "Graphique, métriques et score /100", value: true },
      { label: "Analyse IA (synthèse, forces, risques)", value: false },
      { label: "Watchlist", value: "3 actions max" },
      { label: "Portefeuille", value: "3 positions max" },
      { label: "Profils d'investisseur", value: "1× tous les 3 mois" },
      { label: "Idées du jour", value: "3 idées sur 15" },
      { label: "Alertes email", value: false },
      { label: "« Bonne idée d'acheter ? »", value: false },
      { label: "Analyse IA du portefeuille", value: false },
      { label: "Export CSV", value: false },
    ],
  },
  {
    id: "investisseur",
    name: "Investisseur",
    desc: "Pour l'investisseur régulier",
    monthlyPrice: 9.99,
    annualPrice: 79.99,
    cta: "Choisir Investisseur",
    ctaHref: "/auth/signup?plan=investisseur",
    highlight: false,
    badge: null,
    color: "#2F7D52",
    features: [
      { label: "Recherche d'entreprises", value: "5 analyses / jour" },
      { label: "Graphique, métriques et score /100", value: true },
      { label: "Analyse IA (synthèse, forces, risques)", value: "10 / jour" },
      { label: "Watchlist", value: "15 actions + alertes email" },
      { label: "Portefeuille", value: "15 positions" },
      { label: "Profils d'investisseur", value: "3× / mois" },
      { label: "Idées du jour", value: "10 idées sur 15" },
      { label: "Alertes email (changement de signal)", value: true },
      { label: "« Bonne idée d'acheter ? »", value: "5× / mois" },
      { label: "Analyse IA du portefeuille", value: "1× / mois" },
      { label: "Export CSV", value: true },
      { label: "Multi-portefeuilles", value: false },
      { label: "Rapport mensuel PDF", value: false },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    desc: "Pour l'investisseur sérieux",
    monthlyPrice: 14.99,
    annualPrice: 119.99,
    cta: "Choisir Premium",
    ctaHref: "/auth/signup?plan=premium",
    highlight: true,
    badge: "Le plus complet",
    color: "#1F5C3E",
    features: [
      { label: "Recherche d'entreprises", value: "Illimité" },
      { label: "Graphique, métriques et score /100", value: true },
      { label: "Analyse IA (synthèse, forces, risques)", value: "Illimité" },
      { label: "Watchlist", value: "Illimité" },
      { label: "Portefeuille", value: "Illimité" },
      { label: "Profils d'investisseur", value: "Illimité" },
      { label: "15 idées du jour complètes", value: true },
      { label: "Alertes email + alertes prix en temps réel", value: true },
      { label: "« Bonne idée d'acheter ? »", value: "Illimité" },
      { label: "Analyse IA du portefeuille", value: "Illimité" },
      { label: "Export CSV", value: true },
      { label: "Multi-portefeuilles (PEA, CTO, AV…)", value: true },
      { label: "Rapport mensuel PDF automatique", value: true },
      { label: "Support prioritaire (réponse sous 24h)", value: true },
    ],
  },
];

export default function TarifsPage() {
  const [annual, setAnnual]     = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }: { data: { user: unknown } }) => setLoggedIn(!!data.user));
  }, []);

  // Déclenche le checkout Stripe ou redirige vers inscription
  const handleSubscribe = async (planId: "investisseur" | "premium") => {
    const priceKey = `${planId}_${annual ? "annuel" : "mensuel"}` as keyof typeof STRIPE_PRICES;
    const priceId  = STRIPE_PRICES[priceKey];

    if (!loggedIn) {
      window.location.href = `/auth/signup?plan=${planId}&period=${annual ? "annuel" : "mensuel"}&redirect=/tarifs`;
      return;
    }

    setLoadingPlan(planId);
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(`Erreur Stripe : ${data.error ?? "Inconnue"}. Contactez le support.`);
    } catch (e) {
      alert(`Erreur : ${e instanceof Error ? e.message : "Inconnue"}`);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div style={{ background: "var(--paper)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 24px 80px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 9999, background: "var(--accent-soft)", border: "1px solid rgba(45,125,90,0.25)", marginBottom: 20 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
            <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>Annulez à tout moment · Aucun engagement</span>
          </div>
          <h1 style={{ fontFamily: "var(--font-instrument, serif)", fontWeight: 400, fontSize: "clamp(36px,5vw,58px)", letterSpacing: "-0.02em", lineHeight: 1.05, margin: "0 0 16px", color: "var(--ink)" }}>
            Des offres simples,<br /><em style={{ fontStyle: "italic", color: "var(--accent)" }}>sans surprise</em>.
          </h1>
          <p style={{ fontSize: 17, color: "var(--muted)", maxWidth: 480, margin: "0 auto 32px", lineHeight: 1.65 }}>
            Commencez gratuitement. Passez à l'offre supérieure quand vous êtes prêt. Annulez à tout moment.
          </p>

          {/* Toggle mensuel / annuel */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "var(--paper-2)", border: "1.5px solid var(--line)", borderRadius: 9999, padding: "6px 6px 6px 16px" }}>
            <span style={{ fontSize: 13, color: annual ? "var(--muted)" : "var(--ink)", fontWeight: annual ? 400 : 600 }}>Mensuel</span>
            <button onClick={() => setAnnual(a => !a)} style={{
              width: 44, height: 24, borderRadius: 9999, padding: 3,
              background: annual ? "var(--accent)" : "var(--line)",
              border: "none", cursor: "pointer", transition: "background 0.2s",
              display: "flex", alignItems: "center",
            }}>
              <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", display: "block", transform: annual ? "translateX(20px)" : "translateX(0)", transition: "transform 0.2s" }} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, color: annual ? "var(--ink)" : "var(--muted)", fontWeight: annual ? 600 : 400 }}>Annuel</span>
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 9999, background: annual ? "var(--accent)" : "var(--paper-3)", color: annual ? "#fff" : "var(--muted)", fontWeight: 700, transition: "all 0.2s" }}>
                -33 %
              </span>
            </div>
          </div>
        </div>

        {/* Plans grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 20, marginBottom: 64 }}>
          {PLANS.map(plan => (
            <div key={plan.id} style={{
              background: plan.highlight ? "linear-gradient(180deg,rgba(45,125,90,0.04),var(--paper))" : "var(--paper-2)",
              border: `${plan.highlight ? "2px" : "1.5px"} solid ${plan.highlight ? "rgba(45,125,90,0.35)" : "var(--line)"}`,
              borderRadius: 20, padding: "28px 24px",
              position: "relative",
              boxShadow: plan.highlight ? "0 8px 32px rgba(45,125,90,0.12)" : "none",
            }}>
              {plan.badge && (
                <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "var(--accent)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 14px", borderRadius: 9999, whiteSpace: "nowrap" }}>
                  {plan.badge}
                </div>
              )}

              {/* Plan header */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  {plan.id === "gratuit" && <Zap size={16} color="var(--muted)" />}
                  {plan.id === "investisseur" && <Star size={16} color="#2F7D52" />}
                  {plan.id === "premium" && <Star size={16} fill="#1F5C3E" color="#1F5C3E" />}
                  <span style={{ fontSize: 14, fontWeight: 700, color: plan.color }}>{plan.name}</span>
                </div>
                <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 16px" }}>{plan.desc}</p>

                {/* Prix */}
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  {plan.monthlyPrice === 0 ? (
                    <span style={{ fontFamily: "var(--font-instrument, serif)", fontSize: 44, color: "var(--ink)", fontWeight: 400 }}>Gratuit</span>
                  ) : (
                    <>
                      <span style={{ fontFamily: "var(--font-instrument, serif)", fontSize: 44, color: "var(--ink)", fontWeight: 400 }}>
                        {annual ? (plan.annualPrice / 12).toFixed(2).replace(".", ",") : plan.monthlyPrice.toString().replace(".", ",")} €
                      </span>
                      <span style={{ fontSize: 13, color: "var(--muted)" }}>/mois</span>
                    </>
                  )}
                </div>
                {annual && plan.monthlyPrice > 0 && (
                  <div style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600, marginTop: 4 }}>
                    soit {plan.annualPrice.toString().replace(".", ",")} €/an · 2 mois offerts
                  </div>
                )}
                {!annual && plan.monthlyPrice > 0 && (
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                    ou {plan.annualPrice.toString().replace(".", ",")} €/an (-33 %)
                  </div>
                )}
              </div>

              {/* CTA */}
              {plan.monthlyPrice === 0 ? (
                <Link href="/auth/signup" style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "12px", borderRadius: 12, marginBottom: 24,
                  background: "var(--ink)", color: "var(--paper)",
                  border: "1.5px solid var(--ink)",
                  fontWeight: 700, fontSize: 14, textDecoration: "none",
                }}>
                  {plan.cta} <ArrowRight size={14} />
                </Link>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan.id as "investisseur" | "premium")}
                  disabled={loadingPlan === plan.id}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    padding: "12px", borderRadius: 12, marginBottom: 24,
                    background: plan.highlight ? "var(--accent)" : "transparent",
                    color: plan.highlight ? "#fff" : "var(--ink)",
                    border: `1.5px solid ${plan.highlight ? "var(--accent)" : "var(--line)"}`,
                    fontWeight: 700, fontSize: 14, cursor: loadingPlan === plan.id ? "wait" : "pointer",
                    opacity: loadingPlan === plan.id ? 0.7 : 1,
                    transition: "all 0.15s",
                  }}
                >
                  {loadingPlan === plan.id
                    ? <><Loader size={14} style={{ animation: "spin 0.8s linear infinite" }} /> Redirection…</>
                    : <>{plan.cta} <ArrowRight size={14} /></>
                  }
                </button>
              )}

              {/* Features */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 12 }}>
                    {f.value === false ? (
                      <X size={14} strokeWidth={2.5} color="var(--muted)" style={{ flexShrink: 0, marginTop: 1 }} />
                    ) : (
                      <Check size={14} strokeWidth={2.5} color="var(--accent)" style={{ flexShrink: 0, marginTop: 1 }} />
                    )}
                    <span style={{ color: f.value === false ? "var(--muted)" : "var(--ink)" }}>
                      {f.label}
                      {typeof f.value === "string" && (
                        <span style={{ marginLeft: 4, fontWeight: 600, color: f.value === "Illimité" ? "var(--accent)" : "var(--ink)" }}>
                          — {f.value}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ tarifs */}
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-instrument, serif)", fontWeight: 400, fontSize: 28, letterSpacing: "-0.01em", textAlign: "center", marginBottom: 32, color: "var(--ink)" }}>
            Questions fréquentes
          </h2>
          {[
            { q: "Puis-je annuler à tout moment ?", a: "Oui. Aucun engagement minimum. L'annulation prend effet à la fin de la période de facturation en cours." },
            { q: "Les abonnements annuels sont-ils remboursables ?", a: "En cas d'annulation dans les 14 jours suivant la souscription, un remboursement complet est effectué." },
            { q: "Puis-je passer d'un plan à l'autre ?", a: "Oui, à tout moment. Le passage à un plan supérieur est immédiat. Le retour à un plan inférieur prend effet au prochain renouvellement." },
            { q: "Y a-t-il un engagement de durée ?", a: "Non. Vous pouvez annuler à tout moment depuis votre espace compte. L'annulation prend effet à la fin de la période en cours, sans frais supplémentaires." },
            { q: "Finazen est-il un conseiller financier agréé ?", a: "Non. Finazen est un outil d'aide à la décision pédagogique. Les informations ne constituent pas un conseil en investissement. Investir comporte des risques de perte en capital." },
          ].map(({ q, a }) => (
            <details key={q} style={{ borderBottom: "1px solid var(--line)", padding: "16px 0" }}>
              <summary style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", cursor: "pointer", listStyle: "none", display: "flex", justifyContent: "space-between" }}>
                {q} <span style={{ color: "var(--muted)", fontWeight: 400 }}>+</span>
              </summary>
              <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.65, margin: "10px 0 0" }}>{a}</p>
            </details>
          ))}
        </div>

        {/* Note légale */}
        <div style={{ marginTop: 48, textAlign: "center", background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 16, padding: "20px 24px" }}>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: 0, lineHeight: 1.65 }}>
            Les abonnements sont facturés en euros TTC. Finazen est un outil d'aide à la décision — les analyses ne constituent pas un conseil en investissement. Investir comporte un risque de perte en capital.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
