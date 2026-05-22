"use client";

import { useState } from "react";
import { Check, X, Download, ChevronRight, Briefcase, Lightbulb, RefreshCw, Circle } from "lucide-react";
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
    subtitle: "L'enveloppe fiscale peut faire gagner beaucoup d'argent sur le long terme.",
    options: [
      "Je ne sais pas encore",
      "PEA (actions européennes, fiscalité avantageuse)",
      "CTO — Compte-Titres (tous actifs possibles)",
      "Assurance-vie",
    ],
  },
];

const STEP_LABELS = [
  "Votre âge",
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

/* ── Main component ── */

export default function AdvisorPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [capitalInput, setCapitalInput] = useState("");
  const [monthlyInput, setMonthlyInput] = useState("");
  const [result, setResult] = useState<PortfolioRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forced stocks state
  const [forcedStocks, setForcedStocks] = useState<ForcedStock[]>([]);
  const [forcedInput, setForcedInput] = useState("");
  const [forcedLoading, setForcedLoading] = useState(false);
  const [forcedError, setForcedError] = useState<string | null>(null);

  const currentQuestion = step < 9 ? QUESTIONS[step] : null;
  const currentAnswer = step < 9 ? answers[QUESTIONS[step]?.field ?? ""] ?? "" : "";
  const isCapitalStep = currentQuestion?.type === "input";
  const isMonthlyStep = currentQuestion?.type === "input-monthly";
  const hasAnswer = isCapitalStep
    ? capitalInput.trim() !== ""
    : isMonthlyStep
    ? true  // monthly is optional
    : currentAnswer !== "";

  const confirmedForced = forcedStocks.filter((s) => s.confirmed);

  const setAnswer = (val: string) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.field]: val }));
  };

  const handleNext = () => {
    if (step < 9) {
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
          taxWrapper: answers.taxWrapper ? [answers.taxWrapper] : [],
          favoriteSectors: [],
          excludedSectors: [],
          family: "Célibataire sans enfant",
          hasEmergencyFund: true,
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
        setStep(10);
      }
    } catch {
      setError("Erreur réseau. Vérifiez votre connexion et réessayez.");
    }
    setLoading(false);
  };

  // Result page
  if (result && step === 10) {
    const capitalNum = parseFloat(capitalInput || answers.capital) || 0;
    return (
      <div
        style={{
          maxWidth: 800,
          margin: "0 auto",
          padding: "48px 24px",
          background: "var(--paper)",
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

          <p style={{ fontSize: 11, color: "var(--muted)", textAlign: "center" }}>{result.disclaimer}</p>

          <button
            onClick={() => {
              setStep(0);
              setResult(null);
              setAnswers({});
              setCapitalInput("");
              setMonthlyInput("");
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

  /* ── Split-panel layout (questionnaire) ── */
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        height: "calc(100vh - 64px)", // subtract navbar height
        overflow: "hidden",
      }}
    >
      {/* ── LEFT PANEL ── */}
      <div
        style={{
          width: "44%",
          flexShrink: 0,
          background: "var(--ink)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Top section */}
        <div style={{ padding: 40 }}>
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 28,
            }}
          >
            <Circle size={13} color="rgba(255,255,255,0.55)" />
            <span
              style={{
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontSize: 11,
                color: "rgba(255,255,255,0.55)",
              }}
            >
              Conseiller Patrimonial · IA
            </span>
          </div>

          {/* Headline */}
          <h1
            style={{
              margin: "0 0 20px 0",
              lineHeight: 1.15,
            }}
          >
            <span
              style={{
                display: "block",
                color: "#fff",
                fontWeight: 800,
                fontSize: "clamp(28px, 4vw, 42px)",
                letterSpacing: "-0.03em",
              }}
            >
              Un portefeuille
            </span>
            <em
              style={{
                display: "block",
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontStyle: "italic",
                fontSize: "clamp(28px, 4vw, 42px)",
                color: "rgba(255,255,255,0.85)",
                fontWeight: 400,
              }}
            >
              fait pour vous.
            </em>
          </h1>

          {/* Description */}
          <p
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.50)",
              lineHeight: 1.7,
              maxWidth: 320,
              margin: 0,
            }}
          >
            Dix questions, trois minutes. Notre IA construit une allocation personnalisée selon votre profil, votre
            horizon et vos objectifs. Sans engagement, sans collecte de données financières sensibles.
          </p>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Bottom section */}
        <div style={{ padding: "40px 40px 48px" }}>
          {/* Step counter */}
          <div
            style={{
              textTransform: "uppercase",
              fontSize: 10,
              letterSpacing: "0.1em",
              color: "rgba(255,255,255,0.45)",
              marginBottom: 12,
            }}
          >
            ÉTAPE {step + 1} / 10
          </div>

          {/* Progress segments */}
          <div style={{ display: "flex", flexDirection: "row", gap: 4 }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 3,
                  borderRadius: 2,
                  background: i <= step ? "var(--accent)" : "rgba(255,255,255,0.15)",
                  transition: "background 0.3s",
                }}
              />
            ))}
          </div>

          {/* Checklist */}
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            {STEP_LABELS.slice(0, 5).map((label, i) => {
              const isPast = i < step;
              const isCurrent = i === step;
              const isFuture = i > step;

              return (
                <div key={i} style={{ display: "flex", flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
                  {/* Circle indicator */}
                  {isCurrent && (
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: "#fff",
                        color: "var(--ink)",
                        fontSize: 10,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      {i + 1}
                    </div>
                  )}
                  {isPast && (
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: "var(--accent-soft)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      <Check size={10} color="var(--accent)" />
                    </div>
                  )}
                  {isFuture && (
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.15)",
                        color: "rgba(255,255,255,0.30)",
                        fontSize: 10,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      {i + 1}
                    </div>
                  )}

                  {/* Label */}
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: isCurrent ? 500 : 400,
                      color: isCurrent
                        ? "#fff"
                        : isPast
                        ? "rgba(255,255,255,0.40)"
                        : "rgba(255,255,255,0.30)",
                      textDecoration: isPast ? "line-through" : "none",
                      lineHeight: 1.4,
                    }}
                  >
                    {label}
                  </span>
                </div>
              );
            })}

            {step >= 5 && (
              <span
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.30)",
                  marginLeft: 28,
                }}
              >
                + {10 - 5} questions supplémentaires
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div
        style={{
          flex: 1,
          background: "var(--paper-2)",
          display: "flex",
          flexDirection: "column",
          padding: "48px 56px",
          overflowY: "auto",
        }}
      >
        {/* Step 0–8: regular questions */}
        {step < 9 && currentQuestion && (
          <>
            {/* Question counter */}
            <div
              style={{
                textTransform: "uppercase",
                fontSize: 11,
                letterSpacing: "0.1em",
                color: "var(--muted)",
                marginBottom: 20,
              }}
            >
              QUESTION {step + 1} SUR 9
            </div>

            {/* Question title */}
            <h2
              style={{
                fontSize: "clamp(22px, 3vw, 32px)",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "var(--ink)",
                marginBottom: 8,
                lineHeight: 1.2,
              }}
            >
              {currentQuestion.title}
            </h2>

            {/* Subtitle */}
            <p
              style={{
                fontSize: 14,
                color: "var(--muted)",
                lineHeight: 1.6,
                marginBottom: 32,
              }}
            >
              {currentQuestion.subtitle}
            </p>

            {/* Options area */}
            <div style={{ flex: 1 }}>
              {isMonthlyStep ? (
                <div>
                  <CapitalInput value={monthlyInput} onChange={setMonthlyInput} placeholder="200 €/mois" />
                  <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 10 }}>
                    Laissez vide ou mettez 0 si vous n'investissez pas régulièrement.
                  </p>
                </div>
              ) : isCapitalStep ? (
                /* Input question */
                <CapitalInput value={capitalInput} onChange={setCapitalInput} />
              ) : (
                /* Radio options */
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {(currentQuestion.options ?? []).map((option) => (
                    <RadioOption
                      key={option}
                      label={option}
                      selected={currentAnswer === option}
                      onClick={() => setAnswer(option)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Next button */}
            <div style={{ marginTop: 32 }}>
              <button
                onClick={handleNext}
                disabled={!hasAnswer}
                style={{
                  padding: "14px",
                  borderRadius: 9999,
                  border: "none",
                  background: hasAnswer ? "var(--accent)" : "var(--paper-3)",
                  color: hasAnswer ? "#fff" : "var(--muted)",
                  cursor: hasAnswer ? "pointer" : "not-allowed",
                  fontSize: 15,
                  fontWeight: 700,
                  width: "100%",
                  maxWidth: 240,
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                Suivant
                <ChevronRight size={16} />
              </button>
            </div>
          </>
        )}

        {/* Step 9: final convictions step */}
        {step === 9 && (
          <>
            {/* Question counter */}
            <div
              style={{
                textTransform: "uppercase",
                fontSize: 11,
                letterSpacing: "0.1em",
                color: "var(--muted)",
                marginBottom: 20,
              }}
            >
              QUESTION 10 SUR 10
            </div>

            <h2
              style={{
                fontSize: "clamp(22px, 3vw, 32px)",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "var(--ink)",
                marginBottom: 8,
                lineHeight: 1.2,
              }}
            >
              Avez-vous des convictions ?
            </h2>
            <p
              style={{
                fontSize: 14,
                color: "var(--muted)",
                lineHeight: 1.6,
                marginBottom: 32,
              }}
            >
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
                  background: "#fff",
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
                    background: s.confirmed ? "var(--accent-soft)" : "#fff",
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 10,
                    }}
                  >
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
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      flexWrap: "wrap" as const,
                      marginBottom: 10,
                    }}
                  >
                    <SignalPill score={s.signal} size="sm" />
                    <span
                      style={{
                        fontSize: 13,
                        color: isPos ? "var(--signal-up)" : "var(--signal-down)",
                        fontWeight: 600,
                        fontFamily: "var(--font-geist-mono, monospace)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {isPos ? "+" : ""}
                      {s.upside.toFixed(1)}% vs valeur estimée
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--muted)",
                        fontFamily: "var(--font-geist-mono, monospace)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
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
              Vous pouvez passer cette étape sans ajouter d'action.
            </p>

            {error && <p style={{ color: "var(--signal-down)", fontSize: 14, marginBottom: 12 }}>{error}</p>}

            {/* Generate button */}
            <button
              onClick={submit}
              disabled={loading}
              style={{
                padding: "16px",
                borderRadius: 9999,
                border: "none",
                background: loading ? "var(--accent-soft)" : "var(--accent)",
                color: loading ? "var(--accent)" : "#fff",
                fontSize: 16,
                fontWeight: 700,
                width: "100%",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.15s",
              }}
            >
              {loading ? "Génération en cours…" : "Générer mon portefeuille"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function RadioOption({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "16px 20px",
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
        alignItems: "center",
      }}
    >
      {/* Radio circle */}
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          border: `2px solid ${selected ? "var(--accent)" : "var(--line)"}`,
          background: selected ? "var(--accent)" : "transparent",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s",
        }}
      >
        {selected && (
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#fff",
            }}
          />
        )}
      </div>

      {/* Label */}
      <span
        style={{
          fontSize: 15,
          color: selected ? "var(--accent)" : "var(--ink)",
          fontWeight: selected ? 600 : 400,
          transition: "all 0.15s",
        }}
      >
        {label}
      </span>
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
