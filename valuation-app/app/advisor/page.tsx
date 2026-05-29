"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X, Briefcase, Lightbulb, RefreshCw, AlertTriangle, ExternalLink } from "lucide-react";
import ScenarioAnalysis from "@/components/ScenarioAnalysis";
import SignalPill from "@/components/SignalPill";

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

/* ── Per-question option descriptions ── */
const Q_OPTION_DESCS: Record<number, string[]> = {
  0: [
    "Horizon long — vous pouvez viser une forte croissance.",
    "Équilibre entre performance et constitution de capital.",
    "Transition vers une protection progressive du capital.",
    "Préservation du capital et revenus stables prioritaires.",
  ],
  1: [
    "Parfait — vous pouvez investir sereinement.",
    "Priorité : 3 à 6 mois de dépenses sur Livret A d'abord.",
  ],
  2: [
    "Revenus stables — base idéale pour investir régulièrement.",
    "Revenus variables — diversification et liquidité en priorité.",
    "Commencez tôt, même avec de petites sommes.",
    "Préservation du capital et revenus réguliers en priorité.",
  ],
  3: [
    "Disponibilité prioritaire — produits peu volatils conseillés.",
    "Horizon moyen — mix actions/obligations adapté.",
    "Horizon long — actions et ETF monde privilégiés.",
    "Très long terme — ignorez les krachs et visez la performance.",
  ],
  6: [
    "Profil défensif — des placements plus stables vous conviennent.",
    "Attitude fréquente — un profil équilibré est adapté.",
    "Bonne maîtrise émotionnelle — profil dynamique accessible.",
    "Comportement d'investisseur averti — profil dynamique.",
  ],
  7: [
    "Protection du capital — moins de gains, moins de risques.",
    "Le profil le plus courant — bon équilibre rendement/sécurité.",
    "Vous ciblez la performance — acceptez les variations importantes.",
  ],
  8: [
    "Faire croître un capital sur le long terme.",
    "Dividendes et coupons pour un complément de revenu.",
    "Optimiser pour la retraite — enveloppes fiscales adaptées.",
    "Se prémunir contre l'érosion monétaire via actifs réels.",
  ],
};

/* ── Per-question option icons (SVG path data) ── */
const Q_OPTION_ICONS: Record<number, string[]> = {
  0: [
    "M13 2L3 14h9l-1 8 10-12h-9l1-8z",                                                   // lightning (jeune/dynamique)
    "M3 3v18h18 M7 14l4-4 4 3 5-7",                                                      // chart up
    "M12 8v4l3 2 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",                                // clock
    "M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z", // sun
  ],
  1: [
    "M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6Z M9 12l2 2 4-4",                      // shield-check
    "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01", // alert
  ],
  2: [
    "M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16", // briefcase
    "M20 3H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z M8 21h8 M12 17v4", // monitor
    "M22 10v6 M2 10l10-5 10 5-10 5z M6 12v5c3 3 9 3 12 0v-5",                           // graduation-cap
    "M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z", // sun
  ],
  3: [
    "M12 7v5l3 2 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",                                // clock
    "M3 12h18 M15 6l6 6-6 6",                                                             // arrow-right
    "M3 21h18 M5 21V8l7-5 7 5v13 M10 21v-6h4v6",                                        // home
    "M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z", // sun
  ],
  6: [
    "M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6",                                                 // trending-down
    "M10 15V9 M14 15V9 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",                         // pause-circle
    "M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6Z",                                    // shield
    "M12 5v14 M5 12h14",                                                                   // plus
  ],
  7: [
    "M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6Z",                                    // shield
    "M8 6h8 M6 12h12 M8 18h8",                                                            // menu/sliders (balance)
    "M3 3v18h18 M7 14l4-4 4 3 5-7",                                                      // chart up
  ],
  8: [
    "M3 3v18h18 M7 10h2 M7 14h2 M7 18h2 M13 3v18 M17 3v18",                            // bar-chart
    "M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",                     // dollar-sign
    "M3 21h18 M5 21V8l7-5 7 5v13 M10 21v-6h4v6",                                        // home
    "M23 12a11.05 11.05 0 0 0-22 0 M5 19a7 7 0 0 1 14 0",                               // umbrella
  ],
};

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
      <div style={{ background: "var(--paper-3)", minHeight: "100vh" }}>
        <div className="pg-pad" style={{ maxWidth: 800, margin: "0 auto" }}>
          <h1 style={{
            fontFamily: "var(--font-instrument, serif)", fontSize: 42,
            fontWeight: 400, color: "var(--ink)", marginBottom: 32, lineHeight: 1.1,
          }}>
            Votre portefeuille personnalisé.
          </h1>
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
            <div style={{
              background: "var(--paper)",
              border: "1.5px solid var(--line)",
              borderRadius: 18,
              padding: 24,
            }}>
              <p style={{ fontSize: 14, lineHeight: 1.75, color: "var(--muted)", marginBottom: 12 }}>{result.summary}</p>
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, marginBottom: result.taxAdvice ? 14 : 0 }}>
                {result.strategy}
              </p>
              {result.taxAdvice && (
                <div style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "var(--accent-soft)",
                  border: "1.5px solid rgba(45,125,90,0.2)",
                  fontSize: 13,
                  color: "var(--accent)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                }}>
                  <Briefcase size={14} style={{ marginTop: 1, flexShrink: 0 }} />
                  {result.taxAdvice}
                </div>
              )}
            </div>

            {/* Allocations */}
            <div style={{
              background: "var(--paper)",
              border: "1.5px solid var(--line)",
              borderRadius: 18,
              padding: 24,
            }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18, color: "var(--ink)" }}>
                Votre répartition
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {result.allocations.map((a, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
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
                        }}>
                          {a.symbol.slice(0, 4)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>
                            {a.name || a.symbol}
                            <span style={{
                              fontSize: 10,
                              color: "var(--muted)",
                              background: "var(--paper-3)",
                              padding: "1px 6px",
                              borderRadius: 4,
                              marginLeft: 6,
                              fontWeight: 500,
                            }}>
                              {a.symbol}
                            </span>
                            <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 4 }}>{a.type}</span>
                            {a.dividendFrequency && a.dividendFrequency !== "Capitalisant" && (
                              <span style={{
                                fontSize: 10,
                                marginLeft: 6,
                                color: "var(--signal-neutral)",
                                background: "rgba(139,122,94,0.12)",
                                padding: "1px 6px",
                                borderRadius: 4,
                              }}>
                                {a.dividendFrequency}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: "var(--ink)",
                        fontFamily: "var(--font-geist-mono, monospace)",
                        fontVariantNumeric: "tabular-nums",
                      }}>
                        {a.percentage}%
                      </span>
                    </div>
                    <div style={{
                      height: 5,
                      borderRadius: 3,
                      background: "var(--line)",
                      overflow: "hidden",
                      marginBottom: 4,
                    }}>
                      <div style={{
                        height: "100%",
                        width: `${a.percentage}%`,
                        borderRadius: 3,
                        background: "var(--accent)",
                        transition: "width 0.6s ease",
                      }} />
                    </div>
                    <p style={{ fontSize: 12, color: "var(--muted)" }}>{a.rationale}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            {result.tips?.length > 0 && (
              <div style={{
                background: "var(--paper)",
                border: "1.5px solid var(--line)",
                borderRadius: 18,
                padding: 24,
              }}>
                <h2 style={{
                  fontSize: 15,
                  fontWeight: 700,
                  marginBottom: 14,
                  color: "var(--ink)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}>
                  <Lightbulb size={16} color="var(--accent)" />
                  Ce que vous pouvez faire maintenant
                </h2>
                {result.tips.map((tip, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, fontSize: 13, color: "var(--muted)" }}>
                    <span style={{ color: "var(--accent)", fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                    {tip}
                  </div>
                ))}
                <div style={{
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
                }}>
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
      </div>
    );
  }

  /* ── Questionnaire layout ── */
  return (
    <div style={{ background: "var(--paper-3)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "64px 24px 80px" }}>

        {/* ── Hero section ── */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          {/* Pill badge */}
          <div style={{
            display: "inline-flex", alignItems: "center",
            padding: "6px 16px", borderRadius: 9999,
            background: "var(--paper)", border: "1.5px solid var(--line)",
            fontFamily: "var(--font-geist-mono, monospace)", fontSize: 11,
            color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em",
            marginBottom: 24,
          }}>
            CONSEILLER PATRIMONIAL · IA
          </div>

          {/* H1 */}
          <h1 style={{
            fontFamily: "var(--font-instrument, serif)", fontSize: "clamp(32px, 6vw, 52px)",
            fontWeight: 400, color: "var(--ink)", lineHeight: 1.15,
            margin: "0 auto 28px", maxWidth: 560,
          }}>
            Un portefeuille fait pour toi, en moins de 3 minutes.
          </h1>

          {/* 3 checkmarks */}
          <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
            {["100 % gratuit", "Sans inscription", "Résultat immédiat"].map((label) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%",
                  background: "var(--accent-soft)", border: "1.5px solid rgba(45,125,90,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Check size={10} color="var(--accent)" strokeWidth={2.5} />
                </div>
                <span style={{ fontSize: 13, color: "var(--muted)" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Stepper bar ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            fontFamily: "var(--font-geist-mono, monospace)", fontSize: 11,
            color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em",
            marginBottom: 10, textAlign: "center",
          }}>
            Question {step + 1} / 11
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {Array.from({ length: 11 }).map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 4, borderRadius: 2,
                background: i <= step ? "#1F5C3E" : "var(--paper-2)",
                transition: "background 0.3s",
              }} />
            ))}
          </div>
        </div>

        {/* ── Question card ── */}
        <div style={{
          background: "var(--paper)", border: "1.5px solid var(--line)",
          borderRadius: 24, padding: "48px",
        }}>

          {/* Step 0–9: regular questions */}
          {step < 10 && currentQuestion && (
            <>
              {/* Step label */}
              <div style={{
                fontFamily: "var(--font-geist-mono, monospace)", fontSize: 11,
                color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em",
                marginBottom: 16,
              }}>
                {STEP_LABELS[step]}
              </div>

              {/* Question title */}
              <h2 style={{
                fontFamily: "var(--font-instrument, serif)", fontSize: 32,
                fontWeight: 400, color: "var(--ink)",
                marginBottom: 12, lineHeight: 1.2,
              }}>
                {currentQuestion.title}
              </h2>

              {/* Subtitle / helper */}
              <p style={{
                fontSize: 14, color: "var(--muted)",
                lineHeight: 1.6, marginBottom: 32,
              }}>
                {currentQuestion.subtitle}
              </p>

              {/* Options area */}
              <div style={{ marginBottom: 40 }}>
                {isMonthlyStep ? (
                  <div>
                    <CapitalInput value={monthlyInput} onChange={setMonthlyInput} placeholder="200 €/mois" />
                    <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 10 }}>
                      Laissez vide ou mettez 0 si vous n&apos;investissez pas régulièrement.
                    </p>
                  </div>
                ) : isCapitalStep ? (
                  <CapitalInput value={capitalInput} onChange={setCapitalInput} />
                ) : isMultiStep ? (
                  /* Multi-select — 2×2 grid */
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {(currentQuestion.options ?? []).map((option, i) => (
                      <CheckboxOption
                        key={option}
                        label={option}
                        description={(currentQuestion as { descriptions?: string[] }).descriptions?.[i]}
                        selected={taxWrapperSelections.includes(option)}
                        onClick={() => toggleTaxWrapper(option)}
                      />
                    ))}
                  </div>
                ) : (
                  /* Radio options — 2×2 grid when 4 options, else column */
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: (currentQuestion.options ?? []).length === 4 ? "1fr 1fr" : "1fr",
                    gap: 14,
                  }}>
                    {(currentQuestion.options ?? []).map((option, optIdx) => (
                      <RadioOption
                        key={option}
                        label={option}
                        description={Q_OPTION_DESCS[step]?.[optIdx]}
                        iconPath={Q_OPTION_ICONS[step]?.[optIdx]}
                        selected={currentAnswer === option}
                        onClick={() => setAnswer(option)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Prev / Next buttons */}
              <div style={{ display: "flex", gap: 12, justifyContent: "space-between" }}>
                {step > 0 ? (
                  <button
                    onClick={() => setStep((s) => s - 1)}
                    style={{
                      padding: "13px 24px", borderRadius: 9999,
                      border: "1.5px solid var(--line)", background: "transparent",
                      color: "var(--muted)", fontSize: 14, cursor: "pointer",
                    }}
                  >
                    Précédent
                  </button>
                ) : <div />}
                <button
                  onClick={handleNext}
                  disabled={!hasAnswer}
                  style={{
                    padding: "13px 32px", borderRadius: 9999, border: "none",
                    background: hasAnswer ? "var(--accent)" : "var(--paper-3)",
                    color: hasAnswer ? "#fff" : "var(--muted)",
                    cursor: hasAnswer ? "pointer" : "not-allowed",
                    fontSize: 14, fontWeight: 600, transition: "all 0.15s",
                  }}
                >
                  Suivant
                </button>
              </div>
            </>
          )}

          {/* Step 10: final convictions step */}
          {step === 10 && (
            <>
              {/* Step label */}
              <div style={{
                fontFamily: "var(--font-geist-mono, monospace)", fontSize: 11,
                color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em",
                marginBottom: 16,
              }}>
                {STEP_LABELS[10]}
              </div>

              <h2 style={{
                fontFamily: "var(--font-instrument, serif)", fontSize: 32,
                fontWeight: 400, color: "var(--ink)",
                marginBottom: 12, lineHeight: 1.2,
              }}>
                Avez-vous des convictions ?
              </h2>
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, marginBottom: 32 }}>
                Ajoutez des actions ou ETF que vous souhaitez inclure. Nous les analyserons avant de les intégrer.
              </p>

              {/* Search row */}
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                <input
                  value={forcedInput}
                  onChange={(e) => setForcedInput(e.target.value.toUpperCase())}
                  placeholder="Symbole (ex: NVDA, MC.PA…)"
                  onKeyDown={(e) => e.key === "Enter" && handleAddForced()}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    borderRadius: 12,
                    background: "var(--paper-2)",
                    border: "1.5px solid var(--line)",
                    color: "var(--ink)",
                    fontSize: 15,
                    outline: "none",
                    boxSizing: "border-box" as const,
                  }}
                />
                <button
                  onClick={handleAddForced}
                  disabled={forcedLoading || !forcedInput}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 9999,
                    border: "none",
                    background: forcedLoading ? "var(--accent-soft)" : "var(--accent)",
                    color: "#fff",
                    fontWeight: 600,
                    cursor: forcedLoading || !forcedInput ? "not-allowed" : "pointer",
                    fontSize: 14,
                    whiteSpace: "nowrap" as const,
                  }}
                >
                  {forcedLoading ? "…" : "Analyser"}
                </button>
              </div>

              {forcedError && (
                <p style={{ color: "var(--signal-down)", fontSize: 13, marginBottom: 12 }}>{forcedError}</p>
              )}

              {/* Forced stocks list */}
              {forcedStocks.map((s, i) => {
                const isPos = s.upside >= 0;
                return (
                  <div
                    key={i}
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      border: `1.5px solid ${s.confirmed ? "var(--accent)" : "var(--line)"}`,
                      background: s.confirmed ? "var(--accent-soft)" : "var(--paper-2)",
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>{s.symbol}</span>
                        <span style={{ color: "var(--muted)", fontSize: 12, marginLeft: 8 }}>{s.name}</span>
                      </div>
                      <button
                        onClick={() => setForcedStocks((fs) => fs.filter((_, j) => j !== i))}
                        style={{
                          background: "rgba(184,74,58,0.08)",
                          border: "none",
                          color: "var(--signal-down)",
                          borderRadius: 6,
                          width: 24,
                          height: 24,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" as const, marginBottom: 10 }}>
                      <SignalPill score={s.signal} size="sm" />
                      <span style={{
                        fontSize: 13,
                        color: isPos ? "var(--signal-up)" : "var(--signal-down)",
                        fontWeight: 600,
                        fontFamily: "var(--font-geist-mono, monospace)",
                        fontVariantNumeric: "tabular-nums",
                      }}>
                        {isPos ? "+" : ""}{s.upside.toFixed(1)}% vs valeur estimée
                      </span>
                      <span style={{
                        fontSize: 12,
                        color: "var(--muted)",
                        fontFamily: "var(--font-geist-mono, monospace)",
                        fontVariantNumeric: "tabular-nums",
                      }}>
                        Valeur estimée : {s.fairValue.toFixed(2)} {s.currency} · Cours : {s.currentPrice.toFixed(2)}{" "}
                        {s.currency}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() =>
                          setForcedStocks((fs) => fs.map((x, j) => (j === i ? { ...x, confirmed: true } : x)))
                        }
                        disabled={s.confirmed}
                        style={{
                          flex: 1,
                          padding: "9px",
                          borderRadius: 9999,
                          border: `1.5px solid ${s.confirmed ? "var(--accent)" : "rgba(45,125,90,0.3)"}`,
                          background: s.confirmed ? "var(--accent-soft)" : "transparent",
                          color: "var(--accent)",
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: s.confirmed ? "default" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                        }}
                      >
                        <Check size={13} />
                        {s.confirmed ? "Inclus dans le portefeuille" : "Oui, l'inclure"}
                      </button>
                      {s.confirmed && (
                        <button
                          onClick={() =>
                            setForcedStocks((fs) => fs.map((x, j) => (j === i ? { ...x, confirmed: false } : x)))
                          }
                          style={{
                            padding: "9px 14px",
                            borderRadius: 9999,
                            border: "1.5px solid var(--line)",
                            background: "transparent",
                            color: "var(--muted)",
                            fontSize: 13,
                            cursor: "pointer",
                          }}
                        >
                          Retirer
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8, marginBottom: 20 }}>
                Vous pouvez passer cette étape sans ajouter d&apos;action.
              </p>

              {error && <p style={{ color: "var(--signal-down)", fontSize: 14, marginBottom: 12 }}>{error}</p>}

              {/* Prev / Generate buttons */}
              <div style={{ display: "flex", gap: 12, justifyContent: "space-between" }}>
                <button
                  onClick={() => setStep((s) => s - 1)}
                  style={{
                    padding: "13px 24px", borderRadius: 9999,
                    border: "1.5px solid var(--line)", background: "transparent",
                    color: "var(--muted)", fontSize: 14, cursor: "pointer",
                  }}
                >
                  Précédent
                </button>
                <button
                  onClick={submit}
                  disabled={loading}
                  style={{
                    padding: "13px 32px", borderRadius: 9999, border: "none",
                    background: loading ? "var(--accent-soft)" : "var(--accent)",
                    color: loading ? "var(--accent)" : "#fff",
                    fontSize: 14, fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {loading ? "Génération en cours…" : "Générer mon portefeuille"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function RadioOption({
  label,
  description,
  iconPath,
  selected,
  onClick,
}: {
  label: string;
  description?: string;
  iconPath?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "flex-start", gap: 16,
        background: selected ? "linear-gradient(180deg,#E9F0E5,#F4F1E2)" : "var(--paper-3)",
        border: `1.5px solid ${selected ? "#1F5C3E" : "var(--line)"}`,
        borderRadius: 16, padding: "18px 20px", cursor: "pointer",
        transition: "transform .15s, border-color .2s, background .2s",
        textAlign: "left", fontFamily: "inherit", color: "var(--ink)",
        position: "relative", width: "100%",
        boxShadow: selected ? "0 0 0 4px rgba(31,92,62,0.08)" : "none",
      }}
      onMouseEnter={(e) => { if (!selected) { e.currentTarget.style.borderColor = "var(--line-2, var(--border-hover))"; e.currentTarget.style.transform = "translateY(-2px)"; } }}
      onMouseLeave={(e) => { if (!selected) { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.transform = "translateY(0)"; } }}
    >
      {/* Selected checkmark */}
      {selected && (
        <div style={{
          position: "absolute", top: 16, right: 16,
          width: 22, height: 22, borderRadius: "50%",
          background: "#1F5C3E",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
            <path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}

      {/* Icon box */}
      {iconPath && (
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: selected ? "#F6F2E8" : "var(--paper)",
          border: `1px solid ${selected ? "#2F7D52" : "var(--line)"}`,
          display: "grid", placeItems: "center",
          color: selected ? "#1F5C3E" : "var(--signal-up)",
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {iconPath.split(" M").map((part, i) => (
              <path key={i} d={i === 0 ? part : "M" + part} />
            ))}
          </svg>
        </div>
      )}

      {/* Body */}
      <div style={{ flex: 1, paddingRight: selected ? 28 : 0 }}>
        <h4 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.005em" }}>
          {label}
        </h4>
        {description && (
          <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
            {description}
          </p>
        )}
      </div>
    </button>
  );
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
        border: `1.5px solid ${selected ? "#1F5C3E" : "var(--line)"}`,
        background: selected
          ? "linear-gradient(180deg,#E9F0E5,#F4F1E2)"
          : "var(--paper-3)",
        boxShadow: selected ? "0 0 0 4px rgba(47,125,82,0.1)" : "none",
        transition: "all 0.15s",
        display: "flex",
        flexDirection: "row",
        gap: 14,
        alignItems: "flex-start",
      }}
    >
      {/* Checkbox square */}
      <div style={{
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
      }}>
        {selected && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>

      {/* Label + description */}
      <div style={{ flex: 1 }}>
        <span style={{
          fontSize: 14,
          color: selected ? "var(--accent)" : "var(--ink)",
          fontWeight: selected ? 600 : 500,
          transition: "all 0.15s",
          display: "block",
        }}>
          {label}
        </span>
        {description && (
          <span style={{
            fontSize: 12,
            color: "var(--muted)",
            lineHeight: 1.55,
            display: "block",
            marginTop: 3,
          }}>
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
        background: "var(--paper-2)",
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
      background: "var(--paper)",
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
    <div style={{
      background: "var(--ink)",
      border: "1.5px solid var(--ink)",
      borderRadius: 16,
      padding: "16px 20px",
    }}>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>{label}</div>
      <div style={{
        fontSize: 18,
        fontWeight: 800,
        color,
        fontFamily: "var(--font-geist-mono, monospace)",
        fontVariantNumeric: "tabular-nums",
      }}>
        {value}
      </div>
    </div>
  );
}
