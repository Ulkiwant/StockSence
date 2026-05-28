"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X, Briefcase, Lightbulb, RefreshCw, AlertTriangle, ExternalLink } from "lucide-react";
import ScenarioAnalysis from "@/components/ScenarioAnalysis";
import SignalPill from "@/components/SignalPill";
import Footer from "@/components/Footer";

/* ── Interfaces ── */

interface ForcedStock {
  symbol: string;
  name: string;
  signal: string;
  upside: number;
  fairValue: number;
  currentPrice: number;
  currency: string;
  confirmed: boolean;
}

interface Allocation {
  symbol: string;
  name: string;
  type: string;
  percentage: number;
  rationale: string;
  currency: string;
  dividendFrequency?: string;
}

interface PortfolioRecommendation {
  portfolioName: string;
  summary: string;
  expectedReturn: string;
  riskLevel: string;
  dividendYield?: string | null;
  taxAdvice?: string;
  allocations: Allocation[];
  strategy: string;
  rebalancing: string;
  tips: string[];
  disclaimer: string;
}

/* ── Constants ── */

const RISK_COLOR: Record<string, string> = {
  Faible: "var(--signal-up)",
  Modéré: "var(--signal-neutral)",
  Élevé: "var(--signal-down)",
};

const QUESTIONS = [
  {
    field: "age",
    title: "Quel est votre âge ?",
    subtitle: "Cela aide à calibrer votre horizon et les risques que vous pouvez prendre.",
    options: ["Moins de 30 ans", "30 — 45 ans", "45 — 60 ans", "Plus de 60 ans"],
  },
  {
    field: "hasEmergencyFund",
    title: "Avez-vous une épargne de précaution ?",
    subtitle: "3 à 6 mois de dépenses disponibles immédiatement sur un Livret A ou LDDS. C'est la base avant tout investissement.",
    options: ["Oui, j'ai une épargne de précaution", "Non, pas encore"],
  },
  {
    field: "situation",
    title: "Quelle est votre situation professionnelle ?",
    subtitle: "Votre stabilité de revenus influence la stratégie recommandée.",
    options: ["Salarié·e", "Indépendant·e / Freelance", "Étudiant·e", "Retraité·e"],
  },
  {
    field: "horizon",
    title: "Combien de temps pouvez-vous laisser cet argent investi ?",
    subtitle: "Plus vous attendez longtemps, plus vous pouvez accepter de variations.",
    options: ["Moins de 3 ans", "3 — 7 ans", "7 — 15 ans", "Plus de 15 ans"],
  },
  {
    field: "capital",
    title: "Quel montant voulez-vous investir maintenant ?",
    subtitle: "Le capital de départ que vous êtes prêt à placer aujourd'hui.",
    type: "input",
  },
  {
    field: "monthly",
    title: "Ajoutez-vous de l'argent chaque mois ?",
    subtitle: "Les versements réguliers sont très efficaces sur le long terme. Mettez 0 si vous n'en avez pas.",
    type: "input-monthly",
  },
  {
    field: "reactionToDrop",
    title: "Si votre portefeuille perdait 30 % en un mois, vous feriez quoi ?",
    subtitle: "Soyez honnête — il n'y a pas de mauvaise réponse.",
    options: [
      "Je vends tout — ça me panique",
      "J'attends en espérant une remontée",
      "Je reste calme et je maintiens",
      "Je rachète — c'est une opportunité",
    ],
  },
  {
    field: "riskTolerance",
    title: "Comment décririez-vous votre rapport au risque ?",
    subtitle: "Un portefeuille bien calibré vaut mieux qu'un portefeuille trop ambitieux.",
    options: [
      "Prudent — je préfère la sécurité",
      "Équilibré — un peu des deux",
      "Dynamique — je vise la croissance",
    ],
  },
  {
    field: "goal",
    title: "Quel est votre objectif principal ?",
    subtitle: "Ce que vous voulez accomplir oriente toute la stratégie.",
    options: [
      "Faire fructifier mon capital",
      "Toucher des revenus réguliers",
      "Préparer ma retraite",
      "Protéger mon argent de l'inflation",
    ],
  },
  {
    field: "taxWrapper",
    title: "Où allez-vous loger vos investissements ?",
    subtitle: "Vous pouvez en avoir plusieurs — cochez tout ce qui vous correspond.",
    type: "multi",
    options: [
      "Je ne sais pas encore",
      "PEA",
      "CTO — Compte-Titres",
      "Assurance-vie",
    ],
    descriptions: [
      "Pas de problème, on adaptera les recommandations à votre situation.",
      "Idéal si vous investissez en Europe. Après 5 ans, vos gains sont quasi exonérés d'impôts. Plafond : 150 000 €.",
      "Le plus flexible : actions du monde entier, ETF, obligations... Les gains sont taxés à 30 % (flat tax).",
      "Parfait pour transmettre un capital ou préparer la retraite. Avantages fiscaux importants après 8 ans.",
    ],
  },
];

const STEP_LABELS = [
  "Votre âge",
  "Épargne de précaution",
  "Votre situation professionnelle",
  "Votre horizon",
  "Capital initial",
  "Versement mensuel",
  "Réaction face à une baisse",
  "Profil de risque",
  "Objectif principal",
  "Enveloppe fiscale",
  "Vos convictions",
];

/* ── Hint content per question ── */
const HINT_MAP: Record<number, { title: string; body: string }> = {
  0:  { title: "Pourquoi l'âge change tout.", body: "À 30 ans, un investisseur peut placer <strong>en actions</strong> sans craindre une baisse de 30 % — il a le temps d'attendre. À 60 ans, on préfère la stabilité." },
  1:  { title: "L'épargne de précaution, c'est quoi ?", body: "3 à 6 mois de dépenses sur un Livret A ou LDDS. C'est ton <strong>filet de sécurité</strong> — sans ça, un imprévu t'obligerait à vendre tes actions au pire moment." },
  2:  { title: "Le statut pro influence le risque.", body: "Un indépendant a des revenus variables — il devrait avoir plus de liquidités. Un salarié en CDI peut se permettre un portefeuille plus <strong>dynamique</strong>." },
  3:  { title: "Pourquoi l'horizon change tout.", body: "Sur 1 an, la bourse peut perdre 30 %. Sur <strong>15 ans</strong>, le S&P 500 (l'indice des 500 plus grandes entreprises américaines) n'a jamais été en perte depuis 1950." },
  4:  { title: "Commencer petit, c'est bien.", body: "Même <strong>100 € par mois</strong> sur 20 ans peuvent devenir 50 000 € grâce aux intérêts composés — l'argent qui rapporte rapporte à son tour." },
  5:  { title: "La régularité bat la timing.", body: "Investir <strong>chaque mois</strong>, même un petit montant, est plus efficace que d'attendre \"le bon moment\". Les études montrent que les investisseurs réguliers surperforment de 2 à 3 %/an." },
  6:  { title: "Connais ta réaction au risque.", body: "Pas de bonne ou mauvaise réponse ici. Mais un portefeuille <strong>trop agressif pour toi</strong> mènera à la panique — et vendre en baisse est la principale source de perte." },
  7:  { title: "3 profils types.", body: "<strong>Prudent</strong> : fonds obligataires + monétaires. <strong>Équilibré</strong> : mix actions + obligations. <strong>Dynamique</strong> : actions mondiales, croissance long terme." },
  8:  { title: "L'objectif oriente tout.", body: "Préparer sa retraite → horizon long, capitalisation. Revenus réguliers → dividendes, obligations. Protéger de l'inflation → <strong>actions, immobilier, or</strong>." },
  9:  { title: "Le bon compte = moins d'impôts.", body: "<strong>PEA</strong> : zéro impôt sur les gains après 5 ans (sauf prélèvements sociaux). <strong>Assurance-vie</strong> : idéal pour la transmission. <strong>CTO</strong> : le plus flexible." },
  10: { title: "Tes convictions, c'est optionnel.", body: "Tu peux terminer sans ajouter aucune action. Le portefeuille généré sera complet. Les convictions ne font que <strong>personnaliser une partie</strong> de l'allocation." },
};

function guessProfile(answers: Record<string, string>): string {
  const horizon = answers.horizon ?? "";
  const risk    = answers.riskTolerance ?? "";
  const age     = answers.age ?? "";
  if (risk.toLowerCase().startsWith("prudent") || age === "Plus de 60 ans") return "Prudent";
  if (horizon === "Plus de 15 ans" && risk.toLowerCase().startsWith("dynamique")) return "Dynamique";
  if (horizon === "Plus de 15 ans" || horizon === "7 — 15 ans") return "Équilibré";
  return "Modéré";
}

/* ── Main component ── */

export default function AdvisorPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [capitalInput, setCapitalInput] = useState("");
  const [monthlyInput, setMonthlyInput] = useState("");
  const [taxWrapperSelections, setTaxWrapperSelections] = useState<string[]>([]);
  const [result, setResult] = useState<PortfolioRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forced stocks state
  const [forcedStocks, setForcedStocks] = useState<ForcedStock[]>([]);
  const [forcedInput, setForcedInput] = useState("");
  const [forcedLoading, setForcedLoading] = useState(false);
  const [forcedError, setForcedError] = useState<string | null>(null);

  const currentQuestion = step < 10 ? QUESTIONS[step] : null;
  const currentAnswer = step < 10 ? answers[QUESTIONS[step]?.field ?? ""] ?? "" : "";
  const isCapitalStep = currentQuestion?.type === "input";
  const isMonthlyStep = currentQuestion?.type === "input-monthly";
  const isMultiStep = currentQuestion?.type === "multi";
  const hasAnswer = isCapitalStep
    ? capitalInput.trim() !== ""
    : isMonthlyStep || isMultiStep
    ? true  // optional steps
    : currentAnswer !== "";

  const confirmedForced = forcedStocks.filter((s) => s.confirmed);

  const setAnswer = (val: string) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.field]: val }));
  };

  const toggleTaxWrapper = (val: string) => {
    const EXCLUSIVE = "Je ne sais pas encore";
    setTaxWrapperSelections((prev) => {
      if (val === EXCLUSIVE) return prev.includes(EXCLUSIVE) ? [] : [EXCLUSIVE];
      const without = prev.filter((v) => v !== EXCLUSIVE);
      return without.includes(val) ? without.filter((v) => v !== val) : [...without, val];
    });
  };

  const handleNext = () => {
    if (step < 10) {
      if (isCapitalStep) {
        setAnswers((prev) => ({ ...prev, capital: capitalInput }));
      }
      if (isMonthlyStep) {
        setAnswers((prev) => ({ ...prev, monthly: monthlyInput || "0" }));
      }
      setStep((s) => s + 1);
    }
  };

  const handleAddForced = async () => {
    if (!forcedInput || forcedLoading) return;
    setForcedLoading(true);
    setForcedError(null);
    try {
      const res = await fetch(`/api/stock/${forcedInput}`);
      if (!res.ok) {
        setForcedError(`"${forcedInput}" introuvable sur Yahoo Finance.`);
        setForcedLoading(false);
        return;
      }
      const d = await res.json();
      if (forcedStocks.find((s) => s.symbol === d.symbol)) {
        setForcedError("Cette action est déjà dans la liste.");
        setForcedLoading(false);
        return;
      }
      setForcedStocks((fs) => [
        ...fs,
        {
          symbol: d.symbol,
          name: d.name,
          signal: d.valuation?.signal ?? "HOLD",
          upside: d.valuation?.upside ?? 0,
          fairValue: d.valuation?.fairValue ?? d.currentPrice,
          currentPrice: d.currentPrice,
          currency: d.currency,
          confirmed: false,
        },
      ]);
      setForcedInput("");
    } catch {
      setForcedError("Erreur lors de la récupération des données.");
    }
    setForcedLoading(false);
  };

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: answers.age,
          situation: answers.situation,
          horizon: answers.horizon,
          capital: capitalInput || answers.capital,
          monthly: parseFloat(monthlyInput || answers.monthly) || 0,
          reactionToDrop: answers.reactionToDrop,
          riskTolerance: answers.riskTolerance,
          goal: answers.goal,
          existingHoldings: [],
          forcedStocks: confirmedForced.map((s) => ({
            symbol: s.symbol,
            name: s.name,
            signal: s.signal,
            upside: s.upside,
          })),
          geography: "Mondial",
          esgInterest: "Non concerné",
          wantsDividends: "optionnel",
          taxWrapper: taxWrapperSelections.filter((v) => v !== "Je ne sais pas encore"),
          favoriteSectors: [],
          excludedSectors: [],
          family: "Célibataire sans enfant",
          hasEmergencyFund: answers.hasEmergencyFund !== "Non, pas encore",
          involvement: "Semi-actif — je consulte 1 fois par mois",
          alreadyInvested: true,
          experience: "Intermédiaire",
          firstName: "",
        }),
      });
      const data = await res.json();
      if (res.status === 401) setError("Vous devez être connecté pour générer un portefeuille.");
      else if (res.status === 403) setError("Accès non autorisé.");
      else if (data.error) setError("La génération a échoué. Réessayez dans quelques instants.");
      else {
        setResult(data);
        setStep(11);
      }
    } catch {
      setError("Erreur réseau. Vérifiez votre connexion et réessayez.");
    }
    setLoading(false);
  };

  // Result page
  if (result && step === 11) {
    const capitalNum = parseFloat(capitalInput || answers.capital) || 0;
    return (
      <div
        style={{
          maxWidth: 800,
          margin: "0 auto",
          padding: "48px 24px 80px",
          background: "var(--paper-3)",
          minHeight: "100vh",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
            <MetricCard label="Gain estimé par an" value={result.expectedReturn} color="var(--signal-up)" />
            <MetricCard
              label="Niveau de risque"
              value={`Risque ${result.riskLevel}`}
              color={RISK_COLOR[result.riskLevel] ?? "var(--muted)"}
            />
            {result.dividendYield && result.dividendYield !== "null" && (
              <MetricCard label="Revenus annuels estimés" value={result.dividendYield} color="var(--signal-neutral)" />
            )}
          </div>

          {/* Summary */}
          <div
            style={{
              background: "var(--paper-2)",
              border: "1.5px solid var(--line)",
              borderRadius: 16,
              padding: 24,
            }}
          >
            <p style={{ fontSize: 14, lineHeight: 1.75, color: "var(--muted)", marginBottom: 12 }}>{result.summary}</p>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, marginBottom: result.taxAdvice ? 14 : 0 }}>
              {result.strategy}
            </p>
            {result.taxAdvice && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "var(--accent-soft)",
                  border: "1.5px solid rgba(45,125,90,0.2)",
                  fontSize: 13,
                  color: "var(--accent)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                }}
              >
                <Briefcase size={14} style={{ marginTop: 1, flexShrink: 0 }} />
                {result.taxAdvice}
              </div>
            )}
          </div>

          {/* Allocations */}
          <div
            style={{
              background: "var(--paper-2)",
              border: "1.5px solid var(--line)",
              borderRadius: 16,
              padding: 24,
            }}
          >
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18, color: "var(--ink)" }}>
              Votre répartition
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {result.allocations.map((a, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          flexShrink: 0,
                          background: a.type === "ETF" ? "rgba(45,125,90,0.12)" : "var(--accent-soft)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 9,
                          fontWeight: 700,
                          color: "var(--accent)",
                        }}
                      >
                        {a.symbol.slice(0, 4)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>
                          {a.name || a.symbol}
                          <span
                            style={{
                              fontSize: 10,
                              color: "var(--muted)",
                              background: "var(--paper-3)",
                              padding: "1px 6px",
                              borderRadius: 4,
                              marginLeft: 6,
                              fontWeight: 500,
                            }}
                          >
                            {a.symbol}
                          </span>
                          <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 4 }}>{a.type}</span>
                          {a.dividendFrequency && a.dividendFrequency !== "Capitalisant" && (
                            <span
                              style={{
                                fontSize: 10,
                                marginLeft: 6,
                                color: "var(--signal-neutral)",
                                background: "rgba(139,122,94,0.12)",
                                padding: "1px 6px",
                                borderRadius: 4,
                              }}
                            >
                              {a.dividendFrequency}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: "var(--ink)",
                        fontFamily: "var(--font-geist-mono, monospace)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {a.percentage}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: 5,
                      borderRadius: 3,
                      background: "var(--line)",
                      overflow: "hidden",
                      marginBottom: 4,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${a.percentage}%`,
                        borderRadius: 3,
                        background: "var(--accent)",
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                  <p style={{ fontSize: 12, color: "var(--muted)" }}>{a.rationale}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          {result.tips?.length > 0 && (
            <div
              style={{
                background: "var(--paper-2)",
                border: "1.5px solid var(--line)",
                borderRadius: 16,
                padding: 24,
              }}
            >
              <h2
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  marginBottom: 14,
                  color: "var(--ink)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Lightbulb size={16} color="var(--accent)" />
                Ce que vous pouvez faire maintenant
              </h2>
              {result.tips.map((tip, i) => (
                <div
                  key={i}
                  style={{ display: "flex", gap: 10, marginBottom: 10, fontSize: 13, color: "var(--muted)" }}
                >
                  <span style={{ color: "var(--accent)", fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                  {tip}
                </div>
              ))}
              <div
                style={{
                  marginTop: 14,
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "var(--paper-3)",
                  border: "1.5px solid var(--line)",
                  fontSize: 13,
                  color: "var(--muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <RefreshCw size={13} color="var(--accent)" />
                Quand vérifier :{" "}
                <strong style={{ color: "var(--ink)" }}>{result.rebalancing}</strong>
              </div>
            </div>
          )}

          {/* Scenario Analysis */}
          <ScenarioAnalysis
            positions={result.allocations.map((a: Allocation) => ({
              symbol: a.symbol,
              name: a.name,
              marketValue: (capitalNum * a.percentage) / 100,
              asset_type: a.type?.toLowerCase() === "etf" ? "etf" : "stock",
              sector: undefined,
            }))}
            totalValue={capitalNum}
            monthlyContribution={parseFloat(monthlyInput || answers.monthly) || 0}
            riskLabel={answers.riskTolerance ?? ""}
          />

          {/* ── Et maintenant ? ── */}
          <NextStepsBlock answers={answers} />

          <p style={{ fontSize: 11, color: "var(--muted)", textAlign: "center" }}>{result.disclaimer}</p>

          <button
            onClick={() => {
              setStep(0);
              setResult(null);
              setAnswers({});
              setCapitalInput("");
              setMonthlyInput("");
              setTaxWrapperSelections([]);
              setError(null);
              setForcedStocks([]);
              setForcedInput("");
              setForcedError(null);
            }}
            style={{
              padding: "12px",
              borderRadius: 9999,
              border: "1.5px solid var(--line)",
              background: "transparent",
              color: "var(--muted)",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Refaire le questionnaire
          </button>
        </div>
      </div>
    );
  }

  /* ── New centered layout ── */
  return (
    <>
    <div style={{ background: "var(--paper-3)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 28px 80px" }}>

        {/* Hero */}
        <div style={{ textAlign: "center", maxWidth: 880, margin: "0 auto 48px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 16px", borderRadius: 9999, background: "#D6E4D6", border: "1.5px solid rgba(31,92,62,0.2)", marginBottom: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#1F5C3E", flexShrink: 0 }} />
            <span style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 11, color: "#1F5C3E", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600 }}>CONSEILLER PATRIMONIAL · IA</span>
          </div>
          <h1 style={{ fontFamily: "var(--font-instrument,serif)", fontSize: "clamp(40px,5vw,68px)", fontWeight: 400, color: "var(--ink)", lineHeight: 1.1, marginBottom: 16 }}>
            Un portefeuille <em>fait pour toi</em>,<br />en moins de 3 minutes.
          </h1>
          <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.65, maxWidth: 580, margin: "0 auto 20px" }}>
            Quelques questions sur ta situation, et notre IA compose une allocation personnalisée selon ton profil, ton horizon et tes objectifs.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
            {["100 % gratuit", "Sans inscription", "Résultat immédiat"].map((item) => (
              <span key={item} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 14, color: "var(--muted)" }}>
                <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#D6E4D6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="#1F5C3E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Stepper */}
        <div style={{ background: "var(--paper)", border: "1.5px solid var(--line)", borderRadius: 16, padding: "18px 22px", marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Question <strong style={{ color: "var(--ink)" }}>{Math.min(step + 1, 11)}</strong> sur <strong style={{ color: "var(--ink)" }}>11</strong>
            </span>
            <span style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 11, color: "var(--muted)" }}>
              ~ {Math.max(0, (10 - step) * 18)} sec restantes
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(11,1fr)", gap: 4 }}>
            {STEP_LABELS.map((lab, i) => (
              <div key={i} title={lab} style={{ height: 5, borderRadius: 9999, background: i < step ? "#1F5C3E" : i === step ? "#2F7D52" : "var(--paper-2)", boxShadow: i === step ? "0 0 0 3px rgba(47,125,82,0.15)" : "none", transition: "all 0.2s" }} />
            ))}
          </div>
        </div>

        {/* Question + Hint */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>

          {/* Question card */}
          <div style={{ background: "var(--paper)", border: "1.5px solid var(--line)", borderRadius: 24, padding: "48px", boxShadow: "0 24px 60px -30px rgba(20,32,26,0.18)" }}>

            {step < 10 && currentQuestion && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#1F5C3E", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 11, fontWeight: 700, color: "#fff" }}>{step + 1}</span>
                  </div>
                  <span style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 11, color: "#1F5C3E", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{STEP_LABELS[step]}</span>
                </div>

                <h2 style={{ fontFamily: "var(--font-instrument,serif)", fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 400, color: "var(--ink)", lineHeight: 1.1, marginBottom: 10 }}>
                  {currentQuestion.title}
                </h2>
                <p style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.6, marginBottom: 28, maxWidth: 580 }}>
                  {currentQuestion.subtitle}
                </p>

                <div style={{ marginBottom: 32 }}>
                  {isMonthlyStep ? (
                    <div>
                      <CapitalInput value={monthlyInput} onChange={setMonthlyInput} placeholder="200 €/mois" />
                      <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 10 }}>Laissez vide ou mettez 0 si vous n'investissez pas régulièrement.</p>
                    </div>
                  ) : isCapitalStep ? (
                    <CapitalInput value={capitalInput} onChange={setCapitalInput} />
                  ) : isMultiStep ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {(currentQuestion.options ?? []).map((option, i) => (
                        <CheckboxOption key={option} label={option} description={(currentQuestion as { descriptions?: string[] }).descriptions?.[i]} selected={taxWrapperSelections.includes(option)} onClick={() => toggleTaxWrapper(option)} />
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      {(currentQuestion.options ?? []).map((option) => (
                        <AnsButton key={option} label={option} selected={currentAnswer === option} onClick={() => setAnswer(option)} />
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {step > 0 ? (
                    <button onClick={() => setStep((s) => s - 1)} style={{ padding: "10px 20px", borderRadius: 9999, border: "1.5px solid var(--line)", background: "transparent", color: "var(--muted)", fontSize: 14, cursor: "pointer" }}>
                      ← Précédent
                    </button>
                  ) : <span />}
                  <button onClick={handleNext} disabled={!hasAnswer} style={{ padding: "12px 28px", borderRadius: 9999, border: "none", background: hasAnswer ? "#1F5C3E" : "var(--paper-3)", color: hasAnswer ? "#F6F2E8" : "var(--muted)", fontSize: 14, fontWeight: 600, cursor: hasAnswer ? "pointer" : "not-allowed", transition: "all 0.15s" }}>
                    Question suivante →
                  </button>
                </div>
              </>
            )}

            {step === 10 && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#1F5C3E", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 11, fontWeight: 700, color: "#fff" }}>11</span>
                  </div>
                  <span style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 11, color: "#1F5C3E", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Vos convictions</span>
                </div>
                <h2 style={{ fontFamily: "var(--font-instrument,serif)", fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 400, color: "var(--ink)", lineHeight: 1.1, marginBottom: 10 }}>Avez-vous des convictions ?</h2>
                <p style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.6, marginBottom: 28 }}>Ajoutez des actions ou ETF que vous souhaitez inclure. Nous les analyserons avant de les intégrer.</p>

                <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                  <input value={forcedInput} onChange={(e) => setForcedInput(e.target.value.toUpperCase())} placeholder="Symbole (ex: NVDA, MC.PA…)" onKeyDown={(e) => e.key === "Enter" && handleAddForced()} style={{ flex: 1, padding: "12px 16px", borderRadius: 12, background: "#fff", border: "1.5px solid var(--line)", color: "var(--ink)", fontSize: 15, outline: "none", boxSizing: "border-box" as const }} />
                  <button onClick={handleAddForced} disabled={forcedLoading || !forcedInput} style={{ padding: "10px 18px", borderRadius: 9999, border: "none", background: forcedLoading ? "var(--accent-soft)" : "#1F5C3E", color: "#fff", fontWeight: 600, cursor: forcedLoading || !forcedInput ? "not-allowed" : "pointer", fontSize: 14, whiteSpace: "nowrap" as const }}>
                    {forcedLoading ? "…" : "Analyser"}
                  </button>
                </div>

                {forcedError && <p style={{ color: "var(--signal-down)", fontSize: 13, marginBottom: 12 }}>{forcedError}</p>}

                {forcedStocks.map((s, i) => {
                  const isPos = s.upside >= 0;
                  return (
                    <div key={i} style={{ padding: 16, borderRadius: 12, border: `1.5px solid ${s.confirmed ? "#1F5C3E" : "var(--line)"}`, background: s.confirmed ? "#E9F0E5" : "#fff", marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>{s.symbol}</span>
                          <span style={{ color: "var(--muted)", fontSize: 12, marginLeft: 8 }}>{s.name}</span>
                        </div>
                        <button onClick={() => setForcedStocks((fs) => fs.filter((_, j) => j !== i))} style={{ background: "rgba(184,74,58,0.08)", border: "none", color: "var(--signal-down)", borderRadius: 6, width: 24, height: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <X size={12} />
                        </button>
                      </div>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" as const, marginBottom: 10 }}>
                        <SignalPill score={s.signal} size="sm" />
                        <span style={{ fontSize: 13, color: isPos ? "var(--signal-up)" : "var(--signal-down)", fontWeight: 600, fontFamily: "var(--font-geist-mono,monospace)", fontVariantNumeric: "tabular-nums" }}>{isPos ? "+" : ""}{s.upside.toFixed(1)}% vs valeur estimée</span>
                        <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-geist-mono,monospace)" }}>Val. estimée : {s.fairValue.toFixed(2)} {s.currency} · Cours : {s.currentPrice.toFixed(2)} {s.currency}</span>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => setForcedStocks((fs) => fs.map((x, j) => (j === i ? { ...x, confirmed: true } : x)))} disabled={s.confirmed} style={{ flex: 1, padding: "9px", borderRadius: 9999, border: `1.5px solid ${s.confirmed ? "#1F5C3E" : "rgba(31,92,62,0.3)"}`, background: s.confirmed ? "var(--accent-soft)" : "transparent", color: "var(--accent)", fontWeight: 600, fontSize: 13, cursor: s.confirmed ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                          <Check size={13} />
                          {s.confirmed ? "Inclus dans le portefeuille" : "Oui, l'inclure"}
                        </button>
                        {s.confirmed && <button onClick={() => setForcedStocks((fs) => fs.map((x, j) => (j === i ? { ...x, confirmed: false } : x)))} style={{ padding: "9px 14px", borderRadius: 9999, border: "1.5px solid var(--line)", background: "transparent", color: "var(--muted)", fontSize: 13, cursor: "pointer" }}>Retirer</button>}
                      </div>
                    </div>
                  );
                })}

                <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8, marginBottom: 20 }}>Vous pouvez passer cette étape sans ajouter d'action.</p>
                {error && <p style={{ color: "var(--signal-down)", fontSize: 14, marginBottom: 12 }}>{error}</p>}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button onClick={() => setStep((s) => s - 1)} style={{ padding: "10px 20px", borderRadius: 9999, border: "1.5px solid var(--line)", background: "transparent", color: "var(--muted)", fontSize: 14, cursor: "pointer" }}>← Précédent</button>
                  <button onClick={submit} disabled={loading} style={{ padding: "14px 28px", borderRadius: 9999, border: "none", background: loading ? "var(--accent-soft)" : "#1F5C3E", color: loading ? "var(--accent)" : "#F6F2E8", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", transition: "all 0.15s" }}>
                    {loading ? "Génération en cours…" : "Générer mon portefeuille →"}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Hint card */}
          <div style={{ position: "sticky", top: 80, background: "var(--paper)", border: "1.5px solid var(--line)", borderRadius: 16, padding: 24 }}>
            <p style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 11, color: "#1F5C3E", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>● BON À SAVOIR</p>
            <h3 style={{ fontFamily: "var(--font-instrument,serif)", fontSize: 20, fontWeight: 400, color: "var(--ink)", marginBottom: 10 }}>
              {HINT_MAP[step]?.title ?? "À chaque profil son allocation."}
            </h3>
            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.65, marginBottom: 16 }} dangerouslySetInnerHTML={{ __html: HINT_MAP[step]?.body ?? "Tes réponses permettent de calibrer un portefeuille qui correspond vraiment à ta situation." }} />
            {step > 0 && Object.keys(answers).length > 0 && (
              <>
                <div style={{ height: 1, background: "var(--line)", marginBottom: 14 }} />
                <p style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontWeight: 700 }}>TES RÉPONSES JUSQU'ICI</p>
                <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.55, marginBottom: 12 }}>
                  {[answers.age, answers.situation, answers.horizon].filter(Boolean).join(" · ")}
                </p>
                <p style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, fontWeight: 700 }}>PROFIL PRESSENTI</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#1F5C3E" }}>{guessProfile(answers)}</p>
              </>
            )}
          </div>
        </div>

        {/* Preview section */}
        <div style={{ marginTop: 96, background: "linear-gradient(180deg,var(--paper-3),var(--paper-2))", borderRadius: 18, padding: "60px 40px" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <p style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>APERÇU DU LIVRABLE</p>
            <h2 style={{ fontFamily: "var(--font-instrument,serif)", fontSize: "clamp(28px,3.5vw,46px)", fontWeight: 400, color: "var(--ink)", lineHeight: 1.1, marginBottom: 12 }}>
              Un portefeuille <em>complet</em>, prêt à investir.
            </h2>
            <p style={{ fontSize: 16, color: "var(--muted)", maxWidth: 500, margin: "0 auto" }}>
              À la fin du questionnaire, tu reçois une allocation personnalisée avec des explications claires.
            </p>
          </div>

          <div style={{ maxWidth: 900, margin: "0 auto", borderRadius: 24, overflow: "hidden", boxShadow: "0 40px 90px -50px rgba(20,32,26,0.4)" }}>
            <div style={{ position: "relative", overflow: "hidden", background: "linear-gradient(135deg,#1F5C3E,#14201A)", padding: "40px 44px", display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 40 }}>
              <div style={{ position: "absolute", bottom: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,rgba(47,125,82,0.3) 0%,transparent 70%)", pointerEvents: "none" }} />
              <div>
                <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 6, background: "rgba(255,255,255,0.1)", fontFamily: "var(--font-geist-mono,monospace)", fontSize: 10, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>APERÇU — EXEMPLE PROFIL ÉQUILIBRÉ</span>
                <h3 style={{ fontFamily: "var(--font-instrument,serif)", fontSize: 38, fontWeight: 400, color: "#F6F2E8", lineHeight: 1.1 }}>
                  Ton portefeuille <em style={{ color: "#86B89A" }}>Équilibré.</em>
                </h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {([ ["Capital initial","10 000 €",false],["Versement mensuel","250 €",false],["Horizon","5 — 10 ans",false],["Rendement attendu","~ 6,8 % / an",true],["Projection à 10 ans","~ 56 400 €",true] ] as [string,string,boolean][]).map(([lab,val,green],i,arr) => (
                  <div key={lab} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px dashed rgba(255,255,255,0.1)" : "none" }}>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>{lab}</span>
                    <span style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 13, fontWeight: 600, color: green ? "#86B89A" : "#F6F2E8" }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: "var(--paper)", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              <div style={{ padding: "28px", borderRight: "1px solid var(--line)" }}>
                <p style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>ALLOCATION CIBLE</p>
                {([ ["ETF Monde",45,"#1F5C3E"],["Actions qualité",25,"#2F7D52"],["Thématique (IA, santé)",15,"#C9A24E"],["Obligations",15,"#9C9583"] ] as [string,number,string][]).map(([n,p,c]) => (
                  <div key={n} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: c, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 12, color: "var(--ink)" }}>{n}</span>
                    <span style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>{p} %</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: "28px" }}>
                <p style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>LIGNES SUGGÉRÉES</p>
                {([ ["CW8","Amundi MSCI World","45 %"],["MSFT","Microsoft Corporation","10 %"],["MC.PA","LVMH Moët Hennessy","8 %"],["OR.PA","L'Oréal S.A.","7 %"],["NVDA","NVIDIA Corporation","15 %"],["IBGL","iShares Govt Bonds","15 %"] ] as [string,string,string][]).map(([sym,name,pct],i,arr) => (
                  <div key={sym} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: i < arr.length - 1 ? "1px dashed var(--line)" : "none" }}>
                    <span style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>{sym} <span style={{ fontWeight: 400, color: "var(--muted)", fontFamily: "inherit", fontSize: 11 }}>{name}</span></span>
                    <span style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 12, color: "var(--muted)" }}>{pct}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: "var(--paper-2)", padding: "18px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--line)", flexWrap: "wrap", gap: 12 }}>
              <p style={{ fontSize: 13, color: "var(--muted)", maxWidth: 420 }}>
                <strong style={{ color: "var(--ink)" }}>À la fin du questionnaire</strong>, tu reçois ce livrable + un PDF + les liens d'achat chez ton courtier.
              </p>
              <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ padding: "9px 18px", borderRadius: 9999, border: "none", background: "#1F5C3E", color: "#F6F2E8", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>Continuer le questionnaire →</button>
            </div>
          </div>
        </div>

        {/* Reassurance */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24, maxWidth: 900, margin: "48px auto 0" }}>
          {[
            { icon: "🔒", title: "Tes données restent chez toi.", desc: "On ne demande aucune information bancaire. Tes réponses sont stockées en France, chiffrées au repos." },
            { icon: "📊", title: "Calibré sur 30 ans de marché.", desc: "Nos modèles s'appuient sur l'historique du S&P 500, du CAC 40 et des grands indices obligataires depuis 1995." },
            { icon: "🎯", title: "Tu restes maître à bord.", desc: "Le portefeuille suggéré est une proposition, pas un engagement. Tu passes tes ordres chez ton courtier, à ton rythme." },
          ].map((r, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "#D6E4D6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 18 }}>{r.icon}</div>
              <h4 style={{ fontFamily: "var(--font-instrument,serif)", fontSize: 22, fontWeight: 400, color: "var(--ink)", marginBottom: 8 }}>{r.title}</h4>
              <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>{r.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
    <Footer />
    </>
  );
}

/* ── Sub-components ── */

function AnsButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      style={{
        padding: "20px 22px",
        borderRadius: 16,
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        border: `1.5px solid ${selected ? "#1F5C3E" : "var(--line)"}`,
        background: selected ? "linear-gradient(180deg,#E9F0E5,#F4F1E2)" : "var(--paper-3)",
        boxShadow: selected ? "0 0 0 4px rgba(47,125,82,0.1)" : "none",
        transition: "all 0.15s",
        position: "relative",
      }}
      onMouseEnter={(e) => { if (!selected) { e.currentTarget.style.borderColor = "var(--border-hover,#c5bcac)"; e.currentTarget.style.background = "rgba(255,255,255,0.4)"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
      onMouseLeave={(e) => { if (!selected) { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.background = "var(--paper-3)"; e.currentTarget.style.transform = "none"; } }}
    >
      {selected && (
        <span style={{ position: "absolute", top: 10, right: 12, width: 18, height: 18, borderRadius: "50%", background: "#1F5C3E", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </span>
      )}
      <span style={{ fontSize: 15, fontWeight: 600, color: selected ? "#1F5C3E" : "var(--ink)", display: "block", lineHeight: 1.3 }}>{label}</span>
    </button>
  );
}

function RadioOption({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return <AnsButton label={label} selected={selected} onClick={onClick} />;
}

function CheckboxOption({
  label,
  description,
  selected,
  onClick,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "14px 18px",
        borderRadius: 12,
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        border: `1.5px solid ${selected ? "var(--accent)" : "var(--line)"}`,
        background: selected ? "var(--accent-soft)" : "#fff",
        transition: "all 0.15s",
        display: "flex",
        flexDirection: "row",
        gap: 14,
        alignItems: "flex-start",
      }}
    >
      {/* Checkbox square */}
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: 5,
          border: `2px solid ${selected ? "var(--accent)" : "var(--line)"}`,
          background: selected ? "var(--accent)" : "transparent",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s",
          marginTop: 1,
        }}
      >
        {selected && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>

      {/* Label + description */}
      <div style={{ flex: 1 }}>
        <span
          style={{
            fontSize: 15,
            color: selected ? "var(--accent)" : "var(--ink)",
            fontWeight: selected ? 600 : 500,
            transition: "all 0.15s",
            display: "block",
          }}
        >
          {label}
        </span>
        {description && (
          <span
            style={{
              fontSize: 12,
              color: "var(--muted)",
              lineHeight: 1.55,
              display: "block",
              marginTop: 3,
            }}
          >
            {description}
          </span>
        )}
      </div>
    </button>
  );
}

function CapitalInput({
  value,
  onChange,
  placeholder = "10 000 €",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%",
        padding: "14px 20px",
        borderRadius: 12,
        background: "#fff",
        border: `1.5px solid ${focused ? "var(--accent)" : "var(--line)"}`,
        color: "var(--ink)",
        fontSize: 18,
        fontWeight: 600,
        outline: "none",
        boxSizing: "border-box" as const,
        transition: "border-color 0.2s",
      }}
    />
  );
}

/* ── Enveloppe fiscale recommendation ── */

const BROKER_LINKS: Record<string, string> = {
  "Boursorama":          "https://www.boursorama.com",
  "Trade Republic":      "https://www.traderepublic.com/fr-fr",
  "Fortuneo":            "https://www.fortuneo.fr",
  "Bourse Direct":       "https://www.boursedirect.fr",
  "Linxea":              "https://www.linxea.com",
  "Boursorama Vie":      "https://www.boursorama.com/assurance-vie",
  "Fortuneo Vie":        "https://www.fortuneo.fr/assurance-vie",
  "Placement-direct":    "https://www.placement-direct.fr",
  "Interactive Brokers": "https://www.interactivebrokers.co.uk/fr",
  "Degiro":              "https://www.degiro.fr",
};

function getEnveloppeReco(answers: Record<string, string>): {
  enveloppe: string | null;
  badge: string;
  message: string;
  brokers: string[];
  isAlert: boolean;
} {
  const age           = answers.age ?? "";
  const horizon       = answers.horizon ?? "";
  const riskTolerance = answers.riskTolerance ?? "";

  // Collecté à l'étape 1 du questionnaire
  const hasEmergencyFund = answers.hasEmergencyFund !== "Non, pas encore";

  // Helpers
  const ageUnder55   = age === "Moins de 30 ans" || age === "30 — 45 ans" || age === "45 — 60 ans";
  const ageOver45    = age === "45 — 60 ans" || age === "Plus de 60 ans";
  const horizonOver5 = horizon !== "Moins de 3 ans";
  const riskIsPrudent = riskTolerance.toLowerCase().startsWith("prudent");

  // Condition 0 — Épargne de précaution absente (priorité absolue)
  if (!hasEmergencyFund) {
    return {
      enveloppe: null,
      badge: "⚠️ Étape préalable",
      message: "Avant d'investir, constitue d'abord une épargne de précaution de 3 à 6 mois de dépenses sur un Livret A ou LDDS. C'est ton filet de sécurité.",
      brokers: [],
      isAlert: true,
    };
  }

  // Condition 1 — PEA recommandé
  if (ageUnder55 && horizonOver5 && !riskIsPrudent) {
    return {
      enveloppe: "PEA",
      badge: "✅ PEA recommandé",
      message: "Le PEA est l'enveloppe idéale pour toi : tu n'as pas besoin de l'argent avant 5 ans et ton profil supporte un investissement en actions européennes. Après 5 ans, tes gains ne sont taxés qu'à 17,2 % au lieu de 30 %.",
      brokers: ["Boursorama", "Trade Republic", "Fortuneo", "Bourse Direct"],
      isAlert: false,
    };
  }

  // Condition 2 — Assurance-vie recommandée
  if (ageOver45 || !horizonOver5 || riskIsPrudent) {
    return {
      enveloppe: "Assurance-vie",
      badge: "✅ Assurance-vie recommandée",
      message: "L'assurance-vie correspond mieux à ton profil : elle offre plus de flexibilité sur la durée, un accès à des fonds sécurisés, et des avantages fiscaux importants après 8 ans — notamment pour la transmission.",
      brokers: ["Linxea", "Boursorama Vie", "Fortuneo Vie", "Placement-direct"],
      isAlert: false,
    };
  }

  // Condition 3 — CTO (cas non couverts)
  return {
    enveloppe: "Compte-Titres Ordinaire",
    badge: "✅ Compte-Titres recommandé",
    message: "Un compte-titres te donne accès à toutes les bourses mondiales sans restriction. C'est la solution la plus flexible, idéale si tu veux investir sur des actions américaines ou si ton PEA est déjà ouvert.",
    brokers: ["Interactive Brokers", "Degiro", "Boursorama", "Trade Republic"],
    isAlert: false,
  };
}

function NextStepsBlock({ answers }: { answers: Record<string, string> }) {
  const reco = getEnveloppeReco(answers);

  return (
    <div style={{
      background: "var(--paper-2)",
      border: "1.5px solid var(--line)",
      borderRadius: 16,
      padding: 24,
      borderTop: "3px solid var(--accent)",
    }}>
      {/* Titre */}
      <h2 style={{
        fontSize: 15, fontWeight: 700, color: "var(--ink)",
        marginBottom: 4, display: "flex", alignItems: "center", gap: 8,
      }}>
        <ExternalLink size={16} color="var(--accent)" />
        Et maintenant ? Voici comment passer à l&apos;action
      </h2>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>
        Basé sur ton profil, voici l&apos;enveloppe fiscale la plus adaptée :
      </p>

      {/* Badge enveloppe ou alerte */}
      {reco.isAlert ? (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          padding: "12px 16px", borderRadius: 10,
          background: "rgba(245,158,11,0.10)",
          border: "1.5px solid rgba(245,158,11,0.30)",
          marginBottom: 20,
        }}>
          <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#92400e", marginBottom: 4 }}>
              {reco.badge}
            </div>
            <p style={{ fontSize: 13, color: "#92400e", lineHeight: 1.65, margin: 0 }}>
              {reco.message}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 14px", borderRadius: 9999,
            background: "var(--accent-soft)",
            border: "1.5px solid rgba(45,125,90,0.25)",
            marginBottom: 14,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>
              {reco.badge}
            </span>
          </div>

          {/* Message explicatif */}
          <p style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.7, marginBottom: 14 }}>
            {reco.message}
          </p>

          {/* Lien glossaire */}
          <Link
            href="/glossaire#enveloppes-fiscales"
            style={{
              fontSize: 12, color: "var(--accent)", fontWeight: 600,
              textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4,
              marginBottom: 24,
            }}
          >
            En savoir plus sur les enveloppes fiscales →
          </Link>

          {/* Courtiers */}
          {reco.brokers.length > 0 && (
            <div>
              <p style={{
                fontSize: 11, fontWeight: 700, color: "var(--muted)",
                textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12,
              }}>
                Où ouvrir ton compte ?
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {reco.brokers.map((broker) => (
                  <a
                    key={broker}
                    href={BROKER_LINKS[broker]}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "8px 14px", borderRadius: 9999,
                      border: "1.5px solid var(--line)",
                      background: "var(--paper)",
                      color: "var(--ink)", fontSize: 13, fontWeight: 500,
                      textDecoration: "none", cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
                      (e.currentTarget as HTMLElement).style.color = "var(--accent)";
                      (e.currentTarget as HTMLElement).style.background = "var(--accent-soft)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--line)";
                      (e.currentTarget as HTMLElement).style.color = "var(--ink)";
                      (e.currentTarget as HTMLElement).style.background = "var(--paper)";
                    }}
                  >
                    {broker}
                    <ExternalLink size={11} />
                  </a>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Disclaimer */}
      <p style={{
        fontSize: 11, color: "var(--muted)", lineHeight: 1.55,
        borderTop: "1px solid var(--line)", paddingTop: 12, marginTop: 4,
      }}>
        Rently ne perçoit aucune commission. Ces courtiers sont mentionnés à titre indicatif.
      </p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      style={{
        background: "var(--ink)",
        border: "1.5px solid var(--ink)",
        borderRadius: 16,
        padding: "16px 20px",
      }}
    >
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>{label}</div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 800,
          color,
          fontFamily: "var(--font-geist-mono, monospace)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
    </div>
  );
}
