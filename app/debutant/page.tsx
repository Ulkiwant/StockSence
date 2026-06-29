"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import Footer from "@/components/Footer";

/* ══════════════════════════════════════════
   TYPES & DATA
══════════════════════════════════════════ */

type SituationKey = "never" | "savings" | "lost";
type GoalKey      = "grow" | "retire" | "capital" | "income";
type RiskKey      = "prudent" | "balanced" | "dynamic" | "aggressive";

interface Answers {
  situation?: SituationKey;
  goal?:      GoalKey;
  risk?:      RiskKey;
}

/* ── Profils finaux selon les réponses ── */
const PROFILES: Record<string, {
  label: string; badge: string; color: string; bg: string;
  portfolio: { pct: number; label: string; color: string }[];
  desc: string;
  tip: string;
}> = {
  prudent: {
    label: "Investisseur prudent", badge: "🌱", color: "#1F5C3E", bg: "#E9F0E5",
    portfolio: [
      { pct: 70, label: "ETF Monde", color: "#1F5C3E" },
      { pct: 20, label: "Obligations", color: "#6B7DB3" },
      { pct: 10, label: "Liquidités", color: "#C9A24E" },
    ],
    desc: "Tu privilégies la sécurité. Un portefeuille simple, très diversifié, avec peu de volatilité — parfait pour commencer sans stress.",
    tip: "L'ETF Monde réplique 1 500 entreprises mondiales. C'est l'outil parfait pour débuter : un seul achat, une diversification maximale.",
  },
  balanced: {
    label: "Investisseur équilibré", badge: "⚖️", color: "#2F7D52", bg: "#E3EFEC",
    portfolio: [
      { pct: 55, label: "ETF Monde", color: "#1F5C3E" },
      { pct: 30, label: "Actions qualité", color: "#2F7D52" },
      { pct: 15, label: "Obligations", color: "#6B7DB3" },
    ],
    desc: "Tu acceptes quelques hauts et bas pour viser un meilleur rendement. Un bon équilibre entre croissance et stabilité.",
    tip: "Les actions de qualité (Apple, LVMH, L'Oréal) complètent bien un ETF : elles apportent du rendement additionnel avec un risque maîtrisé.",
  },
  dynamic: {
    label: "Investisseur dynamique", badge: "🚀", color: "#B07D00", bg: "#FDF5E0",
    portfolio: [
      { pct: 50, label: "Actions directes", color: "#B07D00" },
      { pct: 35, label: "ETF sectoriels", color: "#1F5C3E" },
      { pct: 15, label: "Obligations", color: "#6B7DB3" },
    ],
    desc: "Tu vises la performance et tu peux absorber la volatilité. Un portefeuille plus offensif avec des positions directes sur des entreprises sélectionnées.",
    tip: "Avec un profil dynamique, Finazen t'aide à identifier les meilleures opportunités parmi +180 actions grâce à la note sur 100.",
  },
  aggressive: {
    label: "Investisseur offensif", badge: "⚡", color: "#7C3AED", bg: "#F3EFFE",
    portfolio: [
      { pct: 70, label: "Actions directes", color: "#7C3AED" },
      { pct: 20, label: "ETF croissance", color: "#1F5C3E" },
      { pct: 10, label: "Liquidités", color: "#C9A24E" },
    ],
    desc: "Tu recherches la performance maximale et tu comprends que cela implique des fluctuations importantes. Horizon long terme obligatoire.",
    tip: "Les investisseurs offensifs profitent particulièrement de l'analyse de valorisation : acheter une bonne entreprise à prix décoté est la clé.",
  },
};

/**
 * Logique de scoring — 3 questions contribuent au profil final.
 *
 * Score de base (risque déclaré) : 0 prudent · 1 balanced · 2 dynamic · 3 aggressive
 * Modificateur objectif :
 *   income  → -1 (revenus réguliers = besoin de stabilité)
 *   capital → +1 (construction capital long terme = peut prendre plus de risque)
 * Contrainte situation :
 *   never (jamais investi) → plafond à "balanced" (1) — un débutant absolu
 *   qui pense être agressif ne l'a jamais vécu en réalité ; on le protège.
 *
 * Matrice complète :
 *   never  + income     + prudent    = 0 - 1 → 0 → prudent
 *   never  + *          + balanced   = 1     → 1 → balanced  (plafonné)
 *   never  + *          + dynamic    = 2     → 1 → balanced  (plafonné)
 *   never  + *          + aggressive = 3     → 1 → balanced  (plafonné)
 *   savings/lost + income  + balanced = 0    → prudent
 *   savings/lost + income  + dynamic  = 1    → balanced
 *   savings/lost + capital + balanced = 2    → dynamic
 *   savings/lost + capital + dynamic  = 3    → aggressive
 */
function getProfile(answers: Answers): string {
  const { situation, goal, risk } = answers;

  // Score de base selon la tolérance au risque déclarée
  const base: Record<RiskKey, number> = {
    prudent: 0, balanced: 1, dynamic: 2, aggressive: 3,
  };
  let score = base[risk ?? "balanced"];

  // Modificateur objectif
  if (goal === "income")  score -= 1; // revenus → stabilité avant tout
  if (goal === "capital") score += 1; // capital long terme → peut prendre plus de risque

  // Plafond pour les vrais débutants : peu importe leur déclaration de risque,
  // ils n'ont jamais subi une vraie baisse → on ne dépasse pas "équilibré"
  if (situation === "never") score = Math.min(score, 1);

  // Garde-fous généraux
  score = Math.max(0, Math.min(3, score));

  return (["prudent", "balanced", "dynamic", "aggressive"] as const)[score];
}

/** Explication courte de pourquoi l'utilisateur a reçu ce profil */
function getProfileReason(answers: Answers): string {
  const { situation, goal, risk } = answers;
  const parts: string[] = [];

  if (risk === "prudent" || risk === "balanced") {
    parts.push("ta prudence face aux baisses");
  } else {
    parts.push("ta tolérance aux fluctuations");
  }

  if (situation === "never") {
    parts.push("ton statut de débutant (on te protège)");
  }

  if (goal === "income") {
    parts.push("ton objectif de revenus réguliers");
  } else if (goal === "capital") {
    parts.push("ton ambition de construction de capital");
  } else if (goal === "retire") {
    parts.push("ton horizon retraite long terme");
  }

  return "Basé sur " + parts.join(", ") + ".";
}

/* ══════════════════════════════════════════
   COMPOSANTS UI
══════════════════════════════════════════ */

function ChoiceCard({
  icon, label, sublabel, selected, onClick,
}: { icon: string; label: string; sublabel?: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: "100%", textAlign: "left",
      padding: "18px 20px",
      borderRadius: 16,
      border: `2px solid ${selected ? "var(--accent)" : "var(--line)"}`,
      background: selected ? "var(--accent-soft)" : "#fff",
      cursor: "pointer",
      display: "flex", alignItems: "center", gap: 16,
      transition: "border-color 0.15s, background 0.15s, transform 0.1s",
      transform: selected ? "none" : undefined,
      boxShadow: selected ? "0 0 0 4px rgba(45,125,90,0.1)" : "none",
    }}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.borderColor = "var(--border-hover)"; }}
      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.borderColor = "var(--line)"; }}
    >
      <span style={{ fontSize: 28, flexShrink: 0, lineHeight: 1 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", marginBottom: sublabel ? 2 : 0 }}>{label}</div>
        {sublabel && <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.45 }}>{sublabel}</div>}
      </div>
      <div style={{
        width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
        border: `2px solid ${selected ? "var(--accent)" : "var(--line)"}`,
        background: selected ? "var(--accent)" : "transparent",
        display: "grid", placeItems: "center",
        transition: "all 0.15s",
      }}>
        {selected && <Check size={11} color="#fff" strokeWidth={3} />}
      </div>
    </button>
  );
}

function StepDot({ active, done, n }: { active: boolean; done: boolean; n: number }) {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: "50%",
      background: done ? "var(--accent)" : active ? "var(--ink)" : "var(--paper-3)",
      border: `2px solid ${done ? "var(--accent)" : active ? "var(--ink)" : "var(--line)"}`,
      display: "grid", placeItems: "center",
      transition: "all 0.2s",
      flexShrink: 0,
    }}>
      {done
        ? <Check size={12} color="#fff" strokeWidth={3} />
        : <span style={{ fontSize: 11, fontWeight: 700, color: active ? "#fff" : "var(--muted)" }}>{n}</span>
      }
    </div>
  );
}

/* ══════════════════════════════════════════
   PAGE
══════════════════════════════════════════ */

export default function DebutantPage() {
  const [step,    setStep]    = useState(0);   // 0=accueil, 1=situation, 2=objectif, 3=risque, 4=résultat
  const [answers, setAnswers] = useState<Answers>({});

  const currentQ   = step - 1; // 0-based pour les dots

  const pick = <K extends keyof Answers>(key: K, val: Answers[K]) => {
    setAnswers((a) => ({ ...a, [key]: val }));
  };

  const canNext = () => {
    if (step === 1) return !!answers.situation;
    if (step === 2) return !!answers.goal;
    if (step === 3) return !!answers.risk;
    return true;
  };

  const next = () => {
    if (step < 4) setStep((s) => s + 1);
  };
  const back = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const profile = step === 4 ? PROFILES[getProfile(answers)] : null;

  /* ── Layout commun (étapes 1-4) ── */
  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div style={{ minHeight: "100vh", background: "var(--paper)", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ borderBottom: "1px solid var(--line)", padding: "0 24px", height: 60, display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={back} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 14 }}>
          <ArrowLeft size={15} strokeWidth={2} /> Retour
        </button>
        {step > 0 && step < 4 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
            {[1, 2, 3].map((n) => (
              <div key={n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <StepDot n={n} active={currentQ + 1 === n} done={currentQ + 1 > n} />
                {n < 3 && <div style={{ width: 24, height: 2, background: currentQ + 1 > n ? "var(--accent)" : "var(--line)", borderRadius: 1, transition: "background 0.3s" }} />}
              </div>
            ))}
          </div>
        )}
        <Link href="/" style={{ marginLeft: step >= 4 ? "auto" : undefined, fontSize: 12, color: "var(--muted)" }}>Quitter</Link>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 24px 64px", maxWidth: 640, margin: "0 auto", width: "100%" }}>
        {children}
      </div>
    </div>
  );

  /* ══════════════
     ÉTAPE 0 — Accueil
  ══════════════ */
  if (step === 0) return (
    <div style={{ minHeight: "100vh", background: "var(--paper)", display: "flex", flexDirection: "column" }}>
      {/* Nav */}
      <div style={{ borderBottom: "1px solid var(--line)", padding: "0 24px", height: 60, display: "flex", alignItems: "center" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--muted)", fontSize: 14 }}>
          <ArrowLeft size={15} strokeWidth={2} /> Retour à l'accueil
        </Link>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", textAlign: "center" }}>
        {/* Badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 9999, border: "1px solid rgba(45,125,90,0.28)", background: "var(--accent-soft)", marginBottom: 28 }}>
          <span style={{ fontSize: 14 }}>🌱</span>
          <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>Guide débutant · 3 minutes</span>
        </div>

        <h1 style={{ fontFamily: "var(--font-instrument, serif)", fontWeight: 400, fontSize: "clamp(38px, 5vw, 64px)", lineHeight: 1.08, letterSpacing: "-0.02em", margin: "0 0 20px", maxWidth: 600 }}>
          Par où commencer<br />
          <em style={{ fontStyle: "italic", color: "var(--accent)" }}>quand on débute ?</em>
        </h1>

        <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.7, maxWidth: 480, margin: "0 auto 36px" }}>
          Ce guide te pose <strong style={{ color: "var(--ink)" }}>3 questions simples</strong> et te donne un plan d'action clair — sans jargon, sans pression.
        </p>

        {/* 3 étapes visuelles */}
        <div style={{ display: "flex", gap: 12, marginBottom: 40, flexWrap: "wrap", justifyContent: "center" }}>
          {[
            { n: "01", label: "Ta situation" },
            { n: "02", label: "Ton objectif" },
            { n: "03", label: "Ton profil" },
          ].map(({ n, label }) => (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid var(--line)", borderRadius: 10, padding: "8px 14px", fontSize: 13 }}>
              <span style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 11, color: "var(--accent)", fontWeight: 700 }}>{n}</span>
              <span style={{ color: "var(--ink)", fontWeight: 600 }}>{label}</span>
            </div>
          ))}
        </div>

        <button onClick={() => setStep(1)} style={{
          display: "inline-flex", alignItems: "center", gap: 12,
          padding: "15px 32px", borderRadius: 9999,
          background: "var(--accent)", color: "#F6F2E8",
          fontWeight: 700, fontSize: 16, border: "none", cursor: "pointer",
          boxShadow: "0 2px 0 rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.12)",
          transition: "transform 0.12s, background 0.15s",
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-hover)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.transform = "none"; }}
        >
          Je commence <ArrowRight size={16} strokeWidth={2.5} />
        </button>

        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 16 }}>Sans inscription · Résultat immédiat</p>
      </div>

      {/* ── Les bases en 1 minute ── */}
      <div style={{ background: "var(--paper-2)", borderTop: "1px solid var(--line)", padding: "56px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ fontSize: 12, color: "var(--accent)", fontFamily: "var(--font-geist-mono, monospace)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>
              Avant de commencer
            </div>
            <h2 style={{ fontFamily: "var(--font-instrument, serif)", fontWeight: 400, fontSize: "clamp(26px, 3.2vw, 36px)", letterSpacing: "-0.015em", margin: 0 }}>
              Les bases, <em style={{ fontStyle: "italic", color: "var(--accent)" }}>en clair</em>.
            </h2>
            <p style={{ fontSize: 14.5, color: "var(--muted)", marginTop: 10, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
              5 mots que tu vas croiser partout. Pas besoin de les retenir par cœur — juste de savoir à quoi ils correspondent.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            {[
              { icon: "🏢", term: "Action", def: "Une toute petite part d'une entreprise cotée en bourse. En acheter une te rend (un peu) propriétaire de cette entreprise." },
              { icon: "📦", term: "ETF", def: "Un panier qui regroupe des centaines d'actions en un seul achat. La façon la plus simple de ne pas tout miser sur une seule entreprise." },
              { icon: "📉", term: "Risque", def: "Le prix d'une action bouge chaque jour, parfois fort. Plus ça bouge, plus le gain potentiel est grand — mais la perte aussi." },
              { icon: "🧩", term: "Diversification", def: "Répartir son argent entre plusieurs actions ou secteurs plutôt que tout miser sur un seul, pour limiter les dégâts si l'un baisse." },
              { icon: "⏳", term: "Horizon", def: "Le temps que tu peux laisser ton argent investi sans y toucher. Plus il est long, plus tu peux viser un meilleur rendement." },
            ].map(({ icon, term, def }) => (
              <div key={term} style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 14, padding: "18px 18px" }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
                <div style={{ fontWeight: 700, fontSize: 14.5, color: "var(--ink)", marginBottom: 6 }}>{term}</div>
                <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.55, margin: 0 }}>{def}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Et Finazen, ça sert à quoi concrètement ? ── */}
      <div style={{ background: "var(--paper)", borderTop: "1px solid var(--line)", padding: "56px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <h2 style={{ fontFamily: "var(--font-instrument, serif)", fontWeight: 400, fontSize: "clamp(26px, 3.2vw, 36px)", letterSpacing: "-0.015em", margin: 0 }}>
              Et Finazen, ça sert à quoi <em style={{ fontStyle: "italic", color: "var(--accent)" }}>concrètement</em> ?
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              {
                icon: "🔍", title: "Tu tapes le nom d'une entreprise, on te dit si son prix est cohérent",
                desc: "Une note sur 100 et un signal de valorisation (sous-évalué, neutre, surévalué…), basés sur ses chiffres réels — pas une opinion.",
              },
              {
                icon: "🎯", title: "Tu réponds à 3 questions, on situe ton profil d'investisseur",
                desc: "Prudent, équilibré, dynamique ou offensif — pour comprendre quel type de répartition correspond à ta situation.",
              },
              {
                icon: "💼", title: "Tu suis tes actions et ton portefeuille au même endroit",
                desc: "Performance, dividendes, répartition — sans avoir à ouvrir dix onglets différents pour comprendre où tu en es.",
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{ display: "flex", gap: 16, alignItems: "flex-start", background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 14, padding: "16px 18px" }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: "var(--ink)", marginBottom: 4, lineHeight: 1.4 }}>{title}</div>
                  <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.55, margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", marginTop: 24, lineHeight: 1.6 }}>
            Finazen reste un outil pédagogique, pas un conseiller en investissement — il t&apos;aide à comprendre, la décision finale reste toujours la tienne.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );

  /* ══════════════
     ÉTAPE 1 — Situation
  ══════════════ */
  if (step === 1) return (
    <Shell>
      <div style={{ width: "100%", marginBottom: 8 }}>
        <div style={{ fontSize: 12, color: "var(--accent)", fontFamily: "var(--font-geist-mono, monospace)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>Question 1 sur 3</div>
        <h2 style={{ fontFamily: "var(--font-instrument, serif)", fontWeight: 400, fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.1, letterSpacing: "-0.015em", margin: "0 0 8px" }}>
          Quelle est ta situation <em style={{ fontStyle: "italic", color: "var(--accent)" }}>aujourd'hui</em> ?
        </h2>
        <p style={{ fontSize: 15, color: "var(--muted)", margin: "0 0 28px" }}>On adapte le guide à ton niveau de départ.</p>
      </div>

      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
        <ChoiceCard icon="🌱" label="Je n'ai jamais investi" sublabel="L'univers de la bourse est un grand mystère pour moi" selected={answers.situation === "never"} onClick={() => pick("situation", "never")} />
        <ChoiceCard icon="💰" label="J'ai de l'épargne mais je ne sais pas quoi en faire" sublabel="J'ai un peu d'argent de côté et j'aimerais le faire fructifier" selected={answers.situation === "savings"} onClick={() => pick("situation", "savings")} />
        <ChoiceCard icon="🧭" label="J'ai déjà essayé mais je me suis perdu" sublabel="J'ai tenté de m'y mettre mais les plateformes sont complexes" selected={answers.situation === "lost"} onClick={() => pick("situation", "lost")} />
      </div>

      <button onClick={next} disabled={!canNext()} style={{
        width: "100%", padding: "14px", borderRadius: 9999,
        background: canNext() ? "var(--accent)" : "var(--paper-3)",
        color: canNext() ? "#F6F2E8" : "var(--muted)",
        fontWeight: 600, fontSize: 15, border: "none",
        cursor: canNext() ? "pointer" : "not-allowed",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        transition: "background 0.15s",
      }}>
        Continuer <ArrowRight size={15} strokeWidth={2.5} />
      </button>
    </Shell>
  );

  /* ══════════════
     ÉTAPE 2 — Objectif
  ══════════════ */
  if (step === 2) return (
    <Shell>
      <div style={{ width: "100%", marginBottom: 8 }}>
        <div style={{ fontSize: 12, color: "var(--accent)", fontFamily: "var(--font-geist-mono, monospace)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>Question 2 sur 3</div>
        <h2 style={{ fontFamily: "var(--font-instrument, serif)", fontWeight: 400, fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.1, letterSpacing: "-0.015em", margin: "0 0 8px" }}>
          Qu'est-ce que tu veux <em style={{ fontStyle: "italic", color: "var(--accent)" }}>accomplir</em> ?
        </h2>
        <p style={{ fontSize: 15, color: "var(--muted)", margin: "0 0 28px" }}>Ton objectif oriente le type d'investissement recommandé.</p>
      </div>

      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
        <ChoiceCard icon="📈" label="Faire travailler mon épargne" sublabel="Obtenir un meilleur rendement que le Livret A" selected={answers.goal === "grow"} onClick={() => pick("goal", "grow")} />
        <ChoiceCard icon="🏖️" label="Préparer ma retraite" sublabel="Construire un capital sur 15-30 ans pour assurer mon avenir" selected={answers.goal === "retire"} onClick={() => pick("goal", "retire")} />
        <ChoiceCard icon="🏛️" label="Me construire un capital" sublabel="Accumuler un patrimoine sur le long terme (achat immobilier, projets...)" selected={answers.goal === "capital"} onClick={() => pick("goal", "capital")} />
        <ChoiceCard icon="💸" label="Générer des revenus complémentaires" sublabel="Toucher des dividendes réguliers pour compléter mes revenus" selected={answers.goal === "income"} onClick={() => pick("goal", "income")} />
      </div>

      <button onClick={next} disabled={!canNext()} style={{
        width: "100%", padding: "14px", borderRadius: 9999,
        background: canNext() ? "var(--accent)" : "var(--paper-3)",
        color: canNext() ? "#F6F2E8" : "var(--muted)",
        fontWeight: 600, fontSize: 15, border: "none",
        cursor: canNext() ? "pointer" : "not-allowed",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        transition: "background 0.15s",
      }}>
        Continuer <ArrowRight size={15} strokeWidth={2.5} />
      </button>
    </Shell>
  );

  /* ══════════════
     ÉTAPE 3 — Risque
  ══════════════ */
  if (step === 3) return (
    <Shell>
      <div style={{ width: "100%", marginBottom: 8 }}>
        <div style={{ fontSize: 12, color: "var(--accent)", fontFamily: "var(--font-geist-mono, monospace)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>Question 3 sur 3</div>
        <h2 style={{ fontFamily: "var(--font-instrument, serif)", fontWeight: 400, fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.1, letterSpacing: "-0.015em", margin: "0 0 8px" }}>
          Ton investissement perd <em style={{ fontStyle: "italic", color: "var(--accent)" }}>-20 %</em> en un mois.
        </h2>
        <p style={{ fontSize: 15, color: "var(--muted)", margin: "0 0 28px" }}>Pas de bonne ou mauvaise réponse — l'honnêteté donne les meilleurs résultats.</p>
      </div>

      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
        <ChoiceCard icon="😰" label="Je vends immédiatement" sublabel="Je ne peux pas me permettre de perdre, je sors du marché" selected={answers.risk === "prudent"} onClick={() => pick("risk", "prudent")} />
        <ChoiceCard icon="😟" label="Je suis inquiet mais j'attends" sublabel="C'est stressant, je surveille de près et j'espère un rebond" selected={answers.risk === "balanced"} onClick={() => pick("risk", "balanced")} />
        <ChoiceCard icon="😌" label="Je reste calme, c'est du long terme" sublabel="Les baisses font partie du jeu, je ne change rien" selected={answers.risk === "dynamic"} onClick={() => pick("risk", "dynamic")} />
        <ChoiceCard icon="😄" label="J'en rachète, les prix sont moins chers !" sublabel="Une baisse est une opportunité, j'investis davantage" selected={answers.risk === "aggressive"} onClick={() => pick("risk", "aggressive")} />
      </div>

      <button onClick={next} disabled={!canNext()} style={{
        width: "100%", padding: "14px", borderRadius: 9999,
        background: canNext() ? "var(--accent)" : "var(--paper-3)",
        color: canNext() ? "#F6F2E8" : "var(--muted)",
        fontWeight: 600, fontSize: 15, border: "none",
        cursor: canNext() ? "pointer" : "not-allowed",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        transition: "background 0.15s",
      }}>
        Voir mon plan personnalisé <ArrowRight size={15} strokeWidth={2.5} />
      </button>
    </Shell>
  );

  /* ══════════════
     ÉTAPE 4 — Résultat
  ══════════════ */
  if (!profile) return null;

  const STEPS_PLAN = [
    {
      n: "01", time: "2 min",
      title: "Découvre ton profil d'investisseur",
      desc: "Réponds à quelques questions pour situer ton profil parmi 4 profils-types et voir un exemple de répartition associé.",
      cta: "Découvrir les profils →",
      href: "/advisor",
      accent: true,
    },
    {
      n: "02", time: "5 min",
      title: "Comprends comment on note les actions",
      desc: "Avant d'analyser une action, apprends ce que signifie la note sur 100 — et quels critères comptent vraiment.",
      cta: "Lire la méthodologie →",
      href: "/methodologie",
      accent: false,
    },
    {
      n: "03", time: "5 min",
      title: "Analyse ta première action",
      desc: "Tape le nom d'une entreprise que tu connais (Apple, LVMH, Sanofi...) et lis son analyse complète.",
      cta: "Analyser une action →",
      href: "/",
      accent: false,
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)", display: "flex", flexDirection: "column" }}>
      {/* Nav */}
      <div style={{ borderBottom: "1px solid var(--line)", padding: "0 24px", height: 60, display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={back} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 14 }}>
          <ArrowLeft size={15} strokeWidth={2} /> Retour
        </button>
        <Link href="/" style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)" }}>Quitter</Link>
      </div>

      <div style={{ flex: 1, maxWidth: 720, margin: "0 auto", width: "100%", padding: "48px 24px 80px" }}>

        {/* Profil badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: profile.bg, border: `1.5px solid ${profile.color}30`, display: "grid", placeItems: "center", fontSize: 24, flexShrink: 0 }}>
            {profile.badge}
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 2 }}>Ton profil</div>
            <div style={{ fontWeight: 700, fontSize: 18, color: "var(--ink)" }}>{profile.label}</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {Object.entries(answers).map(([k, v]) => (
              <span key={k} style={{ fontSize: 11, background: "var(--accent-soft)", color: "var(--accent)", borderRadius: 9999, padding: "3px 9px", fontWeight: 600 }}>
                {k === "situation" ? { never: "Débutant", savings: "Épargnant", lost: "En reprise" }[v as string] :
                 k === "goal"      ? { grow: "Épargne", retire: "Retraite", capital: "Capital", income: "Revenus" }[v as string] :
                 k === "risk"      ? { prudent: "Prudent", balanced: "Équilibré", dynamic: "Dynamique", aggressive: "Offensif" }[v as string] : v}
              </span>
            ))}
          </div>
        </div>

        <h1 style={{ fontFamily: "var(--font-instrument, serif)", fontWeight: 400, fontSize: "clamp(32px, 4vw, 48px)", lineHeight: 1.08, letterSpacing: "-0.02em", margin: "0 0 16px" }}>
          Voilà par où <em style={{ fontStyle: "italic", color: "var(--accent)" }}>commencer</em>.
        </h1>
        <p style={{ fontSize: 16, color: "var(--muted)", lineHeight: 1.65, maxWidth: 540, margin: "0 0 12px" }}>
          {profile.desc}
        </p>
        <p style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic", margin: "0 0 32px" }}>
          {getProfileReason(answers)}
        </p>

        {/* Allocation visuelle */}
        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 16, padding: "20px 22px", marginBottom: 36 }}>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>Exemple de répartition pour ce profil-type</div>
          <div style={{ height: 10, borderRadius: 9999, overflow: "hidden", display: "flex", marginBottom: 12 }}>
            {profile.portfolio.map((p) => (
              <div key={p.label} style={{ width: `${p.pct}%`, background: p.color, transition: "width 0.4s ease" }} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {profile.portfolio.map((p) => (
              <span key={p.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color, flexShrink: 0 }} />
                <span style={{ color: "var(--ink)", fontWeight: 600 }}>{p.label}</span>
                <span style={{ color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)" }}>{p.pct} %</span>
              </span>
            ))}
          </div>
        </div>

        {/* Conseil du profil */}
        <div style={{ background: "var(--accent-soft)", border: "1px solid rgba(45,125,90,0.2)", borderRadius: 12, padding: "14px 18px", display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 40 }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
          <p style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.6, margin: 0 }}>{profile.tip}</p>
        </div>

        {/* Plan d'action 3 étapes */}
        <div style={{ fontSize: 12, color: "var(--accent)", fontFamily: "var(--font-geist-mono, monospace)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 18 }}>Ton plan en 3 étapes</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 48 }}>
          {STEPS_PLAN.map(({ n, time, title, desc, cta, href, accent }, i) => (
            <div key={n} style={{
              background: "#fff",
              border: `1.5px solid ${accent ? "rgba(45,125,90,0.3)" : "var(--line)"}`,
              borderRadius: 16, overflow: "hidden",
              boxShadow: accent ? "0 4px 20px -6px rgba(45,125,90,0.2)" : "none",
            }}>
              <div style={{ padding: "20px 22px", display: "flex", gap: 16, alignItems: "flex-start" }}>
                {/* Numéro */}
                <div style={{ width: 36, height: 36, borderRadius: 10, background: accent ? "var(--accent)" : "var(--paper-2)", border: `1.5px solid ${accent ? "var(--accent)" : "var(--line)"}`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <span style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 12, fontWeight: 700, color: accent ? "#fff" : "var(--muted)" }}>{n}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>{title}</span>
                    <span style={{ fontSize: 11, color: "var(--muted)", background: "var(--paper-2)", borderRadius: 9999, padding: "1px 7px" }}>{time}</span>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>{desc}</p>
                </div>
              </div>
              <div style={{ borderTop: "1px solid var(--line)", padding: "12px 22px", background: accent ? "var(--accent-soft)" : "var(--paper-2)" }}>
                <Link href={href} style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  fontSize: 13, fontWeight: 600,
                  color: accent ? "var(--accent)" : "var(--muted)",
                  textDecoration: "none",
                }}>
                  {cta}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* CTA principal */}
        <div style={{ textAlign: "center" }}>
          <Link href="/advisor" style={{
            display: "inline-flex", alignItems: "center", gap: 12,
            padding: "16px 40px", borderRadius: 9999,
            background: "var(--accent)", color: "#F6F2E8",
            fontWeight: 700, fontSize: 16, border: "none",
            boxShadow: "0 2px 0 rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.12)",
            transition: "transform 0.12s, background 0.15s",
            marginBottom: 12,
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-hover)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.transform = "none"; }}
          >
            Découvrir mon profil d&apos;investisseur
            <ArrowRight size={16} strokeWidth={2.5} />
          </Link>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>2 minutes · Sans inscription · Gratuit</div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
