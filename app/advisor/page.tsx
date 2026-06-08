"use client";

import { useState, useEffect } from "react";
import { useMobile } from "@/lib/useMobile";
import { createClient } from "@/lib/supabase";
import { useUserPlan } from "@/lib/useUserPlan";
import {
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Clock,
  ArrowRight,
  Home,
  Sparkles,
  TrendingDown,
  TrendingUp,
  BarChart2,
  Shield,
  Activity,
  PlusCircle,
  Plus,
  Search,
  User,
  GraduationCap,
  Coffee,
  Target,
  PiggyBank,
  Flame,
  RefreshCw,
  Lightbulb,
  Heart,
  Building2,
  Wallet,
  Package,
} from "lucide-react";
import ScenarioAnalysis from "@/components/ScenarioAnalysis";
import SignalPill from "@/components/SignalPill";
import CompanyLogo from "@/components/CompanyLogo";

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
  // Champs ajoutés par l'API
  isGuest?: boolean;
  userPlan?: string; // "free" | "investisseur" | "premium" | "admin" | "guest"
}

/* ── Questions definition ── */

interface AnswerOption {
  label: string;
  sublabel?: string;
  tag?: string;
  icon?: React.ReactNode;
}

interface Question {
  field: string;
  stepLabel: string;
  title: string;
  subtitle?: string;
  type?: "choice" | "input" | "input-optional" | "multi";
  options?: AnswerOption[];
}

const QUESTIONS: Question[] = [
  {
    field: "age",
    stepLabel: "Âge",
    title: "Quel est ton âge ?",
    type: "choice",
    options: [
      { label: "Moins de 30 ans", tag: "débutant motivé", icon: <Flame size={20} color="var(--accent)" /> },
      { label: "30 — 45 ans", tag: "dans la vie active", icon: <Briefcase size={20} color="var(--accent)" /> },
      { label: "45 — 60 ans", tag: "à mi-parcours", icon: <Target size={20} color="var(--accent)" /> },
      { label: "Plus de 60 ans", tag: "proche de la retraite", icon: <Coffee size={20} color="var(--accent)" /> },
    ],
  },
  {
    field: "familySituation",
    stepLabel: "Famille",
    title: "Quelle est ta situation familiale ?",
    subtitle: "Elle détermine le niveau de sécurité dont tu as besoin et ta capacité à prendre des risques.",
    type: "choice",
    options: [
      { label: "Célibataire, sans enfant", sublabel: "Tu peux prendre plus de risques — tu ne dépends que de toi.", tag: "Liberté maximale", icon: <User size={20} color="var(--accent)" /> },
      { label: "En couple, sans enfant", sublabel: "Deux revenus, projets communs à financer.", tag: "Projets partagés", icon: <Heart size={20} color="var(--accent)" /> },
      { label: "Avec enfants à charge", sublabel: "La sécurité et la constitution d'un patrimoine priment.", tag: "Sécurité importante", icon: <Home size={20} color="var(--accent)" /> },
      { label: "Parent isolé avec enfants", sublabel: "Prudence et liquidité sont essentielles — tu assures seul(e).", tag: "Prudence maximale", icon: <Shield size={20} color="var(--accent)" /> },
    ],
  },
  {
    field: "situation",
    stepLabel: "Situation pro",
    title: "Quelle est ta situation professionnelle ?",
    type: "choice",
    options: [
      { label: "Salarié(e)", tag: "revenus stables", icon: <Briefcase size={20} color="var(--accent)" /> },
      { label: "Indépendant(e) / Freelance", tag: "revenus variables", icon: <Activity size={20} color="var(--accent)" /> },
      { label: "Étudiant(e)", tag: "revenus limités", icon: <GraduationCap size={20} color="var(--accent)" /> },
      { label: "Retraité(e)", tag: "revenus fixes", icon: <User size={20} color="var(--accent)" /> },
    ],
  },
  {
    field: "horizon",
    stepLabel: "Horizon",
    title: "Pendant combien de temps peux-tu laisser ton argent investi ?",
    subtitle: "Plus ton horizon est long, plus tu peux supporter les baisses court terme — et plus on peut viser une performance élevée.",
    type: "choice",
    options: [
      { label: "Moins de 2 ans", sublabel: "Je veux pouvoir récupérer mon argent rapidement.", tag: "Profil prudent", icon: <Clock size={20} color="var(--accent)" /> },
      { label: "2 à 5 ans", sublabel: "J'ai un projet à moyen terme.", tag: "Profil modéré", icon: <ArrowRight size={20} color="var(--accent)" /> },
      { label: "5 à 10 ans", sublabel: "Je veux constituer un capital solide.", tag: "Profil équilibré · recommandé", icon: <Home size={20} color="var(--accent)" /> },
      { label: "Plus de 10 ans", sublabel: "J'investis sur le très long terme.", tag: "Profil dynamique", icon: <Sparkles size={20} color="var(--accent)" /> },
    ],
  },
  {
    field: "capital",
    stepLabel: "Capital initial",
    title: "Combien veux-tu investir pour commencer ?",
    subtitle: "Même 500 € c'est un bon début. Tu pourras toujours ajouter plus tard.",
    type: "input",
  },
  {
    field: "monthly",
    stepLabel: "Versement mensuel",
    title: "Souhaites-tu ajouter un versement mensuel ?",
    subtitle: "Optionnel — mais investir chaque mois, même peu, accélère vraiment les résultats.",
    type: "input-optional",
  },
  {
    field: "reactionToDrop",
    stepLabel: "Risque",
    title: "Si ton portefeuille perdait 30 % en un mois, tu ferais quoi ?",
    subtitle: "Sois honnête avec toi-même — la bonne réponse, c'est celle qui correspond à ce que tu ferais vraiment.",
    type: "choice",
    options: [
      { label: "Je vends tout — la perte me panique", tag: "Conservateur", icon: <TrendingDown size={20} color="var(--accent)" /> },
      { label: "J'attends que ça remonte", tag: "Prudent", icon: <Clock size={20} color="var(--accent)" /> },
      { label: "Je reste calme, ça va remonter", tag: "Équilibré", icon: <BarChart2 size={20} color="var(--accent)" /> },
      { label: "Je profite pour racheter +", tag: "Dynamique", icon: <TrendingUp size={20} color="var(--accent)" /> },
    ],
  },
  {
    field: "riskTolerance",
    stepLabel: "Profil",
    title: "Quel niveau de risque es-tu prêt à accepter ?",
    subtitle: "Plus de risque = plus de gains possibles, mais aussi plus de pertes possibles.",
    type: "choice",
    options: [
      { label: "Prudent — sécurité avant tout", sublabel: "Priorité à la préservation du capital.", tag: "Faible volatilité", icon: <Shield size={20} color="var(--accent)" /> },
      { label: "Équilibré — performance et sécurité", sublabel: "Le meilleur compromis pour la plupart des investisseurs.", tag: "Recommandé", icon: <BarChart2 size={20} color="var(--accent)" /> },
      { label: "Dynamique — croissance maximale", sublabel: "J'accepte des baisses importantes pour viser plus haut.", tag: "Forte croissance", icon: <Flame size={20} color="var(--accent)" /> },
    ],
  },
  {
    field: "goal",
    stepLabel: "Objectif",
    title: "Quel est ton objectif principal ?",
    type: "choice",
    options: [
      { label: "Faire fructifier mon capital", icon: <TrendingUp size={20} color="var(--accent)" /> },
      { label: "Générer des revenus réguliers", icon: <PiggyBank size={20} color="var(--accent)" /> },
      { label: "Préparer ma retraite", icon: <Coffee size={20} color="var(--accent)" /> },
      { label: "Protéger mon capital de l'inflation", icon: <Shield size={20} color="var(--accent)" /> },
    ],
  },
  {
    field: "existingAssets",
    stepLabel: "Actifs existants",
    title: "As-tu déjà des investissements ou des actifs ?",
    subtitle: "On s'adapte à ce que tu as déjà — plus question de te proposer ce que tu possèdes déjà.",
    type: "multi",
    options: [
      { label: "Immobilier (résidence ou locatif)", sublabel: "On réduira l'exposition aux actifs immobiliers dans ton portefeuille.", icon: <Building2 size={20} color="var(--accent)" /> },
      { label: "Livret A ou épargne de précaution", sublabel: "Bonne base — on construira par-dessus.", icon: <PiggyBank size={20} color="var(--accent)" /> },
      { label: "Assurance-vie déjà ouverte", sublabel: "On intégrera cet horizon dans la stratégie.", icon: <Shield size={20} color="var(--accent)" /> },
      { label: "Actions ou ETF (voir mon portefeuille)", sublabel: "Importer automatiquement pour éviter les doublons.", icon: <Wallet size={20} color="var(--accent)" /> },
      { label: "Je démarre de zéro", sublabel: "Parfait — on part d'une feuille blanche.", icon: <Package size={20} color="var(--accent)" /> },
    ],
  },
  {
    field: "taxWrapper",
    stepLabel: "Enveloppe",
    title: "Dans quelle enveloppe veux-tu investir ?",
    subtitle: "Si tu ne sais pas, choisis 'Je ne sais pas encore' — on t'expliquera.",
    type: "multi",
    options: [
      { label: "PEA", sublabel: "Fiscalité avantageuse après 5 ans, pour les actions européennes", icon: <Target size={20} color="var(--accent)" /> },
      { label: "CTO (Compte-Titres)", sublabel: "Flexible, accessible partout, imposé chaque année", icon: <Briefcase size={20} color="var(--accent)" /> },
      { label: "Assurance-vie", sublabel: "Transmission facilitée, fiscalité attractive sur le long terme", icon: <Shield size={20} color="var(--accent)" /> },
      { label: "Je ne sais pas encore", sublabel: "L'IA choisira l'enveloppe la plus adaptée à ton profil", icon: <Sparkles size={20} color="var(--accent)" /> },
    ],
  },
];

const STEP_LABELS = QUESTIONS.map((q) => q.stepLabel);
const TOTAL = QUESTIONS.length;

/* ── Hint card content per field ── */

interface HintContent {
  title: string;
  body: string;
}

function getHint(field: string): HintContent {
  const map: Record<string, HintContent> = {
    age: {
      title: "Pourquoi l'âge compte.",
      body: "Plus tu commences tôt, plus les intérêts composés travaillent pour toi — même avec de petites sommes.",
    },
    familySituation: {
      title: "Pourquoi la famille change tout.",
      body: "Un parent isolé avec deux enfants à charge ne peut pas prendre les mêmes risques qu'un célibataire sans engagement. Ta situation détermine ton **filet de sécurité minimum** avant d'investir.",
    },
    situation: {
      title: "Ton statut impacte tes choix.",
      body: "Un salarié et un indépendant n'ont pas les mêmes enveloppes fiscales ni la même stabilité de revenus.",
    },
    existingAssets: {
      title: "On complète, on n'écrase pas.",
      body: "Si tu as déjà de l'immobilier, on n'a pas besoin de t'en rajouter. Si tu as un **Livret A** plein, on sait qu'il ne faut plus y mettre d'argent. L'IA propose ce qui **manque** à ton patrimoine, pas ce que tu as déjà.",
    },
    horizon: {
      title: "Pourquoi l'horizon change tout.",
      body: "Sur 1 an, la bourse peut perdre 30 %. Sur **15 ans**, le **S&P 500** (l'indice des 500 plus grandes entreprises américaines) n'a **jamais** été en perte depuis 1950.",
    },
    capital: {
      title: "Combien investir ?",
      body: "Investir régulièrement une petite somme est souvent plus efficace qu'un gros versement unique. Commencer avec **500 €** vaut mieux qu'attendre d'avoir **10 000 €**.",
    },
    monthly: {
      title: "L'investissement progressif.",
      body: "Verser chaque mois permet d'**acheter à des prix moyens** et de ne jamais investir au pire moment. C'est la méthode du DCA (Dollar Cost Averaging).",
    },
    reactionToDrop: {
      title: "Ta vraie tolérance au risque.",
      body: "La plupart des gens surestiment leur capacité à rester calmes. Répondre honnêtement ici te protège de décisions impulsives.",
    },
    riskTolerance: {
      title: "Quel profil te correspond ?",
      body: "Le profil **Équilibré** est le plus adapté à la majorité des investisseurs. Il offre un bon compromis entre performance à long terme et résistance aux crises.",
    },
    goal: {
      title: "L'objectif oriente tout.",
      body: "Un portefeuille pour la retraite dans 20 ans n'a rien à voir avec un portefeuille pour générer des revenus dans 2 ans.",
    },
    taxWrapper: {
      title: "L'enveloppe fiscale change tout.",
      body: "Un **PEA** (Plan d'Épargne en Actions) permet d'investir en bourse avec une fiscalité très avantageuse après 5 ans. Un **CTO** (Compte-Titres Ordinaire) est plus flexible mais imposé chaque année.",
    },
  };
  return map[field] ?? { title: "Bon à savoir.", body: "Chaque réponse permet à l'IA d'affiner ta recommandation." };
}

/* ── Profile guess ── */

function guessProfile(answers: Record<string, string | string[]>): string {
  const rt = answers.riskTolerance as string | undefined;
  if (rt?.includes("Prudent")) return "Prudent";
  if (rt?.includes("Équilibré")) return "Équilibré";
  if (rt?.includes("Dynamique")) return "Dynamique";
  const drop = answers.reactionToDrop as string | undefined;
  if (drop?.includes("renforce") || drop?.includes("racheter")) return "Dynamique";
  if (drop?.includes("vends")) return "Prudent";
  const horizon = answers.horizon as string | undefined;
  if (horizon?.includes("10 ans") || horizon?.includes("Plus de")) return "Équilibré tendance Dynamique";
  return "Équilibré";
}

/* ── Bold text renderer ── */

function BoldText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} style={{ color: "var(--ink)", fontWeight: 700 }}>
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

/* ── Preview donut ── */

function PreviewDonut() {
  const segments = [
    { pct: 45, color: "#1F5C3E" },
    { pct: 25, color: "#2F7D52" },
    { pct: 15, color: "#C9A24E" },
    { pct: 15, color: "#9C9583" },
  ];
  const r = 70;
  const cx = 90;
  const cy = 90;
  const stroke = 22;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={180} height={180} viewBox="0 0 180 180">
      {segments.map((s, i) => {
        const dash = (s.pct / 100) * circ;
        const gap = circ - dash;
        const rotate = (offset / 100) * 360 - 90;
        offset += s.pct;
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${gap}`}
            strokeLinecap="butt"
            transform={`rotate(${rotate} ${cx} ${cy})`}
          />
        );
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" fill="#fff" fontSize={22} fontWeight={800} fontFamily="var(--font-geist-mono, monospace)">
        6,8 %
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize={11} fontFamily="var(--font-geist-mono, monospace)">
        / AN
      </text>
    </svg>
  );
}

/* ── RISK COLOR ── */
const RISK_COLOR: Record<string, string> = {
  Faible: "var(--signal-up)",
  Modéré: "var(--signal-neutral)",
  Élevé: "var(--signal-down)",
};

/* ── Preview lines ── */

const PREVIEW_LINES = [
  { ticker: "CW8.PA", sym: "AM", name: "Amundi MSCI World — fonds indiciel mondial", pct: "45 %", color: "#1F5C3E" },
  { ticker: "MSFT",   sym: "MS", name: "Microsoft Corporation", pct: "10 %", color: "#2F7D52" },
  { ticker: "MC.PA",  sym: "LV", name: "LVMH Moët Hennessy Louis Vuitton", pct: "8 %", color: "#2F7D52" },
  { ticker: "OR.PA",  sym: "LO", name: "L'Oréal S.A.", pct: "7 %", color: "#2F7D52" },
  { ticker: "NVDA",   sym: "NV", name: "NVIDIA Corporation — intelligence artificielle", pct: "15 %", color: "#C9A24E" },
  { ticker: "IWDA.AS",sym: "IB", name: "iShares Global Government Bond — obligations", pct: "15 %", color: "#9C9583" },
];

/* ── Main component ── */

export default function AdvisorPage() {
  const isMobile = useMobile();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [capitalInput, setCapitalInput] = useState("");
  const [monthlyInput, setMonthlyInput] = useState("");
  const [result, setResult] = useState<PortfolioRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null); // null = chargement
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // isPaid dérivé de la RÉPONSE de génération (plus fiable que useUserPlan séparé)
  const resultIsPaid = result
    ? (result.userPlan === "investisseur" || result.userPlan === "premium" || result.userPlan === "admin")
    : false;
  // Alias rétro-compatible pour les conditions d'overlay
  const isPaid = resultIsPaid;
  const planLoading = false; // Plus besoin d'attendre un chargement séparé

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then((res: { data: { user: unknown } }) => {
      const u = res.data.user as { email?: string } | null;
      setIsLoggedIn(!!u);
      if (u?.email) setUserEmail(u.email);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_e: unknown, session: { user?: { email?: string } } | null) => {
        setIsLoggedIn(!!session?.user);
        if (session?.user?.email) setUserEmail(session.user.email);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  /* ── Persistance localStorage : charger le dernier portefeuille enregistré ── */
  useEffect(() => {
    if (!userEmail) return;
    const key = `finazen_advisor_${btoa(userEmail)}`;
    const saved = localStorage.getItem(key);
    if (saved && !result) {
      try {
        const parsed = JSON.parse(saved) as { result: PortfolioRecommendation; answers: Record<string, string | string[]>; capital: string; monthly: string };
        setResult(parsed.result);
        setAnswers(parsed.answers ?? {});
        setCapitalInput(parsed.capital ?? "");
        setMonthlyInput(parsed.monthly ?? "");
        setStep(TOTAL + 1);
      } catch { /* ignore invalid JSON */ }
    }
  }, [userEmail]); // eslint-disable-line

  // Portfolio import state
  const [portfolioHoldings, setPortfolioHoldings] = useState<{symbol:string;name:string;sector:string;value:number}[]>([]);
  const [portfolioImported, setPortfolioImported] = useState(false);

  // Load portfolio if user wants to import existing assets
  useEffect(() => {
    const existingAssets = answers.existingAssets as string[] | undefined;
    if (existingAssets?.includes("Actions ou ETF (voir mon portefeuille)") && !portfolioImported) {
      fetch("/api/portfolio").then(r => r.json()).then(async (holdings) => {
        if (!Array.isArray(holdings) || holdings.length === 0) return;
        const enriched = await Promise.allSettled(
          holdings.map(async (h: {symbol:string;name:string;quantity:number;avg_price:number;currency:string}) => {
            const res = await fetch(`/api/stock/${h.symbol}`);
            const d = await res.json();
            const isEtf = String(d.quoteType ?? "").toUpperCase() === "ETF" || String(d.quoteType ?? "").toUpperCase() === "MUTUALFUND";
            const sector = isEtf ? "ETF diversifié" : (d.sector || "Action");
            return { symbol: h.symbol, name: h.name || h.symbol, sector, value: h.quantity * h.avg_price };
          })
        );
        const data = enriched.filter((r): r is PromiseFulfilledResult<{symbol:string;name:string;sector:string;value:number}> => r.status === "fulfilled").map(r => r.value);
        setPortfolioHoldings(data);
        setPortfolioImported(true);
      }).catch(() => {});
    }
  }, [answers.existingAssets]); // eslint-disable-line

  // Forced stocks state
  const [forcedStocks, setForcedStocks] = useState<ForcedStock[]>([]);
  const [forcedInput, setForcedInput] = useState("");
  const [forcedLoading, setForcedLoading] = useState(false);
  const [forcedError, setForcedError] = useState<string | null>(null);
  // Recherche inline par nom ou ticker
  const [forcedSearch, setForcedSearch] = useState("");
  const [forcedDropdown, setForcedDropdown] = useState<{ symbol: string; name: string; exchange: string }[]>([]);
  const [forcedDropdownLoading, setForcedDropdownLoading] = useState(false);
  const [forcedDropdownOpen, setForcedDropdownOpen] = useState(false);

  // Recherche debounced par nom ou ticker
  useEffect(() => {
    if (!forcedSearch.trim()) { setForcedDropdown([]); setForcedDropdownOpen(false); return; }
    const t = setTimeout(async () => {
      setForcedDropdownLoading(true);
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(forcedSearch)}`);
        const d = await r.json();
        setForcedDropdown(Array.isArray(d) ? d.slice(0, 7) : []);
        setForcedDropdownOpen(true);
      } finally { setForcedDropdownLoading(false); }
    }, 280);
    return () => clearTimeout(t);
  }, [forcedSearch]);

  const currentQuestion = step < TOTAL ? QUESTIONS[step] : null;
  const isMulti = currentQuestion?.type === "multi";
  const isInput = currentQuestion?.type === "input";
  const isInputOptional = currentQuestion?.type === "input-optional";

  function getCurrentAnswer(): string | string[] {
    if (!currentQuestion) return "";
    return answers[currentQuestion.field] ?? (isMulti ? [] : "");
  }

  function hasAnswer(): boolean {
    if (isInput) return capitalInput.trim() !== "";
    if (isInputOptional) return true; // always can proceed (optional)
    const ans = getCurrentAnswer();
    if (isMulti) return (ans as string[]).length > 0;
    return (ans as string) !== "";
  }

  function setChoiceAnswer(val: string) {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.field]: val }));
  }

  function toggleMultiAnswer(val: string) {
    if (!currentQuestion) return;
    const prev = (answers[currentQuestion.field] as string[]) ?? [];
    const next = prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val];
    setAnswers((a) => ({ ...a, [currentQuestion.field]: next }));
  }

  const confirmedForced = forcedStocks.filter((s) => s.confirmed);

  const handleNext = () => {
    if (!currentQuestion) return;
    if (isInput) {
      setAnswers((prev) => ({ ...prev, capital: capitalInput }));
    } else if (isInputOptional) {
      if (monthlyInput.trim()) {
        setAnswers((prev) => ({ ...prev, monthly: monthlyInput }));
      }
    }
    setStep((s) => s + 1);
  };

  const handlePrev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleAddForced = async (symbolOverride?: string) => {
    const sym = (symbolOverride ?? forcedInput).trim().toUpperCase();
    if (!sym || forcedLoading) return;
    setForcedLoading(true);
    setForcedError(null);
    // Fermer le dropdown immédiatement
    setForcedDropdownOpen(false);
    setForcedSearch("");
    setForcedInput("");
    try {
      const res = await fetch(`/api/stock/${sym}`);
      if (!res.ok) {
        setForcedError(`"${sym}" introuvable sur Yahoo Finance.`);
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
    } catch {
      setForcedError("Erreur lors de la récupération des données.");
    }
    setForcedLoading(false);
  };

  const submit = async () => {
    setLoading(true);
    setError(null);
    const taxWrapperRaw = answers.taxWrapper ?? [];
    const taxWrapperArr = Array.isArray(taxWrapperRaw) ? taxWrapperRaw : [taxWrapperRaw];
    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: answers.age,
          horizon: answers.horizon,
          capital: capitalInput || answers.capital,
          reactionToDrop: answers.reactionToDrop,
          riskTolerance: answers.riskTolerance,
          goal: answers.goal,
          allocationMix: "70% ETF / 30% actions",
          monthly: monthlyInput ? parseFloat(monthlyInput) : 0,
          // Actifs existants — éviter les doublons
          existingAssets: (answers.existingAssets as string[] | undefined) ?? [],
          existingHoldings: portfolioHoldings.map(h => ({
            symbol: h.symbol, name: h.name, sector: h.sector,
          })),
          // Situation familiale
          family: answers.familySituation ?? "Célibataire sans enfant",
          forcedStocks: confirmedForced.map((s) => ({
            symbol: s.symbol, name: s.name, signal: s.signal, upside: s.upside,
          })),
          geography: "Mondial",
          esgInterest: "Non concerné",
          wantsDividends: "optionnel",
          taxWrapper: taxWrapperArr,
          favoriteSectors: [],
          excludedSectors: [],
          situation: answers.situation ?? "Salarié(e)",
          hasEmergencyFund: (answers.existingAssets as string[] | undefined)?.includes("Livret A ou épargne de précaution") ?? false,
          involvement: "Semi-actif — je consulte 1 fois par mois",
          alreadyInvested: !((answers.existingAssets as string[] | undefined)?.includes("Je démarre de zéro") ?? true),
          experience: "Débutant",
          firstName: "",
        }),
      });
      const data = await res.json();
      if (res.status === 403) setError("Accès non autorisé.");
      else if (data.error) setError("La génération a échoué. Réessaie dans quelques instants.");
      else {
        setResult(data);
        setStep(TOTAL + 1);
        // Sauvegarder dans localStorage pour retrouver le portefeuille après navigation
        if (userEmail) {
          const key = `finazen_advisor_${btoa(userEmail)}`;
          localStorage.setItem(key, JSON.stringify({
            result: data,
            answers,
            capital: capitalInput,
            monthly: monthlyInput,
            generatedAt: new Date().toISOString(),
          }));
        }
      }
    } catch {
      setError("Erreur réseau. Vérifie ta connexion et réessaie.");
    }
    setLoading(false);
  };

  const resetAll = () => {
    setStep(0);
    setResult(null);
    setAnswers({});
    setCapitalInput("");
    setMonthlyInput("");
    setError(null);
    setForcedStocks([]);
    setForcedInput("");
    setForcedError(null);
    // Effacer le portefeuille sauvegardé pour permettre d'en générer un nouveau
    if (userEmail) {
      localStorage.removeItem(`finazen_advisor_${btoa(userEmail)}`);
    }
  };

  // ── RESULT PAGE ──
  if (result && step === TOTAL + 1) {
    const capitalNum = parseFloat(capitalInput || (answers.capital as string)) || 0;
    const monthlyNum = monthlyInput ? parseFloat(monthlyInput) : 0;
    const taxWrapper = (answers.taxWrapper as string[] | undefined) ?? [];
    const risk = ((answers.riskTolerance as string) ?? "").toLowerCase();
    const familySit = (answers.familySituation as string) ?? "";
    const horizonAns = (answers.horizon as string) ?? "";
    const goalAns    = (answers.goal as string) ?? "";
    const ageAns     = (answers.age as string) ?? "";
    const CHART_COLORS_RES = ["#1F5C3E","#2F7D52","#C9A24E","#9C9583","#7D55C7","#5C3A21","#0078D4","#B84A3E"];

    /* Explication dynamique du profil */
    const profileColor   = risk.includes("dynamique") ? "#1F5C3E" : risk.includes("prudent") ? "#7A5A1F" : "#2F7D52";
    const profileBg      = risk.includes("dynamique") ? "rgba(45,125,90,0.08)" : risk.includes("prudent") ? "rgba(176,125,0,0.08)" : "rgba(45,125,90,0.06)";
    const profileTagline = risk.includes("dynamique")
      ? "Tu acceptes des fluctuations importantes pour maximiser la croissance sur le long terme."
      : risk.includes("prudent")
      ? "Tu privilégies la sécurité et la préservation de ton capital avant la performance."
      : "Tu cherches un bon équilibre entre croissance et stabilité — le profil le plus répandu.";

    const profileDetails: string[] = [];
    if (horizonAns.includes("10 ans") || horizonAns.includes("Plus de")) profileDetails.push("Ton horizon long permet d'investir dans des actifs plus performants et de traverser les crises sans vendre.");
    else if (horizonAns.includes("5")) profileDetails.push("Ton horizon de 5 à 10 ans autorise une prise de risque modérée avec un bon potentiel de rendement.");
    else profileDetails.push("Ton horizon court implique une allocation prudente pour pouvoir récupérer ton argent à temps.");
    if (familySit.includes("Parent isolé")) profileDetails.push("En tant que parent isolé, une poche de sécurité plus importante est intégrée dans ton allocation.");
    else if (familySit.includes("enfants")) profileDetails.push("Avec des enfants à charge, l'allocation intègre un niveau de sécurité adapté à tes responsabilités.");
    if (goalAns.includes("retraite")) profileDetails.push("Ton objectif retraite favorise une approche progressive sur le long terme.");
    else if (goalAns.includes("revenus")) profileDetails.push("Ton objectif de revenus réguliers est pris en compte via des actifs distributeurs.");
    if (monthlyNum > 0) profileDetails.push(`Tes versements mensuels de ${monthlyNum.toLocaleString("fr-FR")} € accélèrent la constitution de ton capital grâce à l'effet de régularité (DCA).`);

    // Brokers recommandés selon profil
    type Broker = { name: string; domain: string; desc: string; tags: string[]; link: string; best?: boolean };
    const brokers: Broker[] = [];
    if (taxWrapper.includes("PEA") || taxWrapper.includes("Je ne sais pas encore") || taxWrapper.length === 0) {
      brokers.push({ name: "Trade Republic", domain: "traderepublic.com", desc: "Le plus simple pour débuter. PEA gratuit, 0 € de commission, application mobile intuitive.", tags: ["PEA", "Gratuit", "Débutant"], link: "https://traderepublic.com/fr-fr", best: true });
      brokers.push({ name: "Fortuneo", domain: "fortuneo.fr", desc: "PEA et CTO sans frais de tenue. Bonus à l'ouverture régulièrement.", tags: ["PEA", "CTO", "Français"], link: "https://www.fortuneo.fr" });
    }
    if (taxWrapper.includes("CTO (Compte-Titres)") && !brokers.find(b => b.name === "Trade Republic")) {
      brokers.push({ name: "Trade Republic", domain: "traderepublic.com", desc: "0 € de commission sur actions et ETF. App simple et très bien conçue.", tags: ["CTO", "Gratuit", "Mobile"], link: "https://traderepublic.com/fr-fr", best: true });
      brokers.push({ name: "Degiro", domain: "degiro.fr", desc: "Frais parmi les plus bas d'Europe. Idéal pour les ETF et les actions internationales.", tags: ["CTO", "Frais bas"], link: "https://www.degiro.fr" });
    }
    if (taxWrapper.includes("Assurance-vie")) {
      brokers.push({ name: "Linxea Spirit", domain: "linxea.com", desc: "La meilleure assurance-vie en ligne. Frais de gestion 0,5 %/an, large choix d'ETF.", tags: ["Assurance-vie", "Recommandé"], link: "https://www.linxea.com", best: !brokers.length });
    }
    if (risk.includes("dynamique")) {
      brokers.push({ name: "Interactive Brokers", domain: "interactivebrokers.co.uk", desc: "Meilleurs frais pour les investisseurs actifs. Accès à tous les marchés mondiaux.", tags: ["CTO", "Pro", "Mondial"], link: "https://www.interactivebrokers.co.uk/fr" });
    }
    if (!brokers.length) {
      brokers.push({ name: "Trade Republic", domain: "traderepublic.com", desc: "0 € de commission, application mobile simple. Idéal pour débuter.", tags: ["PEA", "Gratuit", "Débutant"], link: "https://traderepublic.com/fr-fr", best: true });
      brokers.push({ name: "Fortuneo", domain: "fortuneo.fr", desc: "PEA et CTO français, sans frais de tenue.", tags: ["PEA", "CTO", "Français"], link: "https://www.fortuneo.fr" });
    }
    const topBrokers = brokers.slice(0, 3);

    return (
      <div style={{ background: "var(--paper)", minHeight: "100vh" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px 80px" }}>

          {/* ══════════════════════════════════════════
              1. TON PROFIL D'INVESTISSEUR
          ══════════════════════════════════════════ */}
          <div style={{ background: "var(--paper-2)", border: "1.5px solid var(--line)", borderRadius: 20, padding: "28px 32px", marginBottom: 24 }}>
            {/* Badge profil */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 9999, background: profileBg, border: `1px solid ${profileColor}40`, fontSize: 13, fontWeight: 700, color: profileColor }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: profileColor }} />
                Profil {result.riskLevel}
              </span>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>· {ageAns}</span>
            </div>

            {/* Titre + résumé IA */}
            <h1 style={{ fontFamily: "var(--font-instrument, serif)", fontWeight: 400, fontSize: "clamp(28px, 4vw, 40px)", letterSpacing: "-0.02em", lineHeight: 1.1, margin: "0 0 14px", color: "var(--ink)" }}>
              {result.portfolioName || "Ton portefeuille sur mesure"}.
            </h1>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: "var(--ink)", marginBottom: 20 }}>
              {profileTagline}
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--muted)", marginBottom: profileDetails.length ? 20 : 0 }}>
              {result.summary}
            </p>

            {/* Points clés dynamiques */}
            {profileDetails.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {profileDetails.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "var(--muted)", lineHeight: 1.55 }}>
                    <span style={{ color: "var(--accent)", flexShrink: 0, marginTop: 1 }}>✓</span> {d}
                  </div>
                ))}
              </div>
            )}

            {/* Métriques synthèse */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginTop: 22, paddingTop: 20, borderTop: "1px solid var(--line)" }}>
              {[
                { label: "Rendement attendu", value: result.expectedReturn, color: "var(--signal-up)" },
                { label: "Capital de départ", value: capitalNum > 0 ? `${capitalNum.toLocaleString("fr-FR")} €` : "—", color: "var(--ink)" },
                { label: "Versement mensuel", value: monthlyNum > 0 ? `${monthlyNum.toLocaleString("fr-FR")} €` : "—", color: "var(--ink)" },
                { label: "Horizon", value: horizonAns || "—", color: "var(--ink)" },
              ].map(m => (
                <div key={m.label} style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4, fontFamily: "var(--font-geist-mono, monospace)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{m.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: m.color, fontFamily: "var(--font-geist-mono, monospace)" }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ══════════════════════════════════════════
              2. TON ALLOCATION PERSONNALISÉE
              — Visible pour investisseur / premium / admin
              — Verrouillée pour guest et free
          ══════════════════════════════════════════ */}
          <div style={{ position: "relative", marginBottom: 24 }}>
            {/* ── Overlay — masqué pour les abonnés payants ── */}
            {(!isPaid && !planLoading) && <div style={{
              position: "absolute", inset: 0, zIndex: 10,
              background: "linear-gradient(180deg, transparent 0%, rgba(245,241,234,0.55) 20%, rgba(245,241,234,0.97) 52%, var(--paper) 100%)",
              borderRadius: 20, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "flex-end",
              padding: "0 24px 32px",
            }}>
              <div style={{ textAlign: "center", maxWidth: 460 }}>
                {isLoggedIn === false ? (
                  /* ── Visiteur non connecté ── */
                  <>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>🔓</div>
                    <h3 style={{ fontFamily: "var(--font-instrument, serif)", fontWeight: 400, fontSize: 24, color: "var(--ink)", margin: "0 0 10px" }}>
                      Ton allocation est prête !
                    </h3>
                    <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.65, margin: "0 0 22px" }}>
                      Crée un compte <strong style={{ color: "var(--ink)" }}>gratuit</strong> pour voir exactement quels ETF et actions acheter, dans quelles proportions — et sauvegarder ton portefeuille.
                    </p>
                    <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                      <a href="/auth/signup" style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        padding: "13px 26px", borderRadius: 9999,
                        background: "var(--accent)", color: "#fff",
                        fontWeight: 700, fontSize: 15, textDecoration: "none",
                        boxShadow: "0 2px 0 rgba(0,0,0,0.12)",
                      }}>
                        Créer mon compte gratuit →
                      </a>
                      <a href="/auth/login" style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        padding: "13px 22px", borderRadius: 9999,
                        border: "1.5px solid var(--line)", background: "transparent",
                        color: "var(--muted)", fontSize: 14, textDecoration: "none",
                      }}>
                        J&apos;ai déjà un compte
                      </a>
                    </div>
                    <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 14 }}>
                      ✅ Gratuit · Sans carte bancaire · En 30 secondes
                    </p>
                  </>
                ) : (
                  /* ── Connecté mais pas abonné ── */
                  <>
                    <div style={{ fontSize: 28, marginBottom: 12 }}>🔒</div>
                    <h3 style={{ fontFamily: "var(--font-instrument, serif)", fontWeight: 400, fontSize: 22, color: "var(--ink)", margin: "0 0 10px" }}>
                      Répartition réservée aux abonnés
                    </h3>
                    <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.65, margin: "0 0 20px" }}>
                      Ton profil a bien été analysé. Pour accéder à l&apos;allocation complète — quels ETF et actions acheter, dans quelle proportion — passe au plan <strong style={{ color: "var(--ink)" }}>Investisseur</strong> ou <strong style={{ color: "var(--ink)" }}>Premium</strong>.
                    </p>
                    <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                      <a href="/tarifs" style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        padding: "11px 22px", borderRadius: 9999,
                        background: "var(--accent)", color: "#fff",
                        fontWeight: 700, fontSize: 14, textDecoration: "none",
                      }}>
                        Voir les offres →
                      </a>
                      <button onClick={resetAll} style={{
                        padding: "11px 22px", borderRadius: 9999,
                        border: "1.5px solid var(--line)", background: "transparent",
                        color: "var(--muted)", fontSize: 13, cursor: "pointer",
                      }}>
                        Refaire le questionnaire
                      </button>
                    </div>
                    <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 12 }}>
                      ✅ Résultat visible dès la souscription
                    </p>
                  </>
                )}
              </div>
            </div>}

          <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 20, overflow: "hidden", boxShadow: "0 20px 60px -30px rgba(20,32,26,0.20)", pointerEvents: isPaid ? "auto" : "none", userSelect: isPaid ? "auto" : "none", filter: (!isPaid && isLoggedIn === false) ? "blur(6px)" : "none" }}>
            {/* Header sombre — layout propre */}
            <div style={{ background: "linear-gradient(135deg,#1F5C3E,#14201A)", padding: "22px 28px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", right: -60, top: -60, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(closest-side,rgba(45,125,90,0.30),transparent 70%)", pointerEvents: "none" }} />
              {/* Ligne 1: label + rendement */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 10, color: "#A8D0AF", fontFamily: "var(--font-geist-mono, monospace)", letterSpacing: "0.10em" }}>TON ALLOCATION PERSONNALISÉE</span>
                <span style={{ fontSize: 13, fontFamily: "var(--font-geist-mono, monospace)", color: "#A8D0AF", fontWeight: 700, flexShrink: 0 }}>
                  Rendement estimé : {result.expectedReturn}
                </span>
              </div>
              {/* Ligne 2: nom du portefeuille */}
              <div style={{ fontFamily: "var(--font-instrument, serif)", fontSize: "clamp(18px,3vw,26px)", color: "#F6F2E8", lineHeight: 1.2, marginBottom: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {result.portfolioName || "Ton portefeuille"}
              </div>
              {/* Ligne 3: enveloppes + conseil fiscal (tronqué) */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "nowrap", overflow: "hidden" }}>
                {taxWrapper.filter(t => t !== "Je ne sais pas encore").map(t => (
                  <span key={t} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 9999, background: "rgba(255,255,255,0.14)", color: "#A8D0AF", fontFamily: "var(--font-geist-mono, monospace)", fontWeight: 600, flexShrink: 0 }}>{t}</span>
                ))}
                {result.taxAdvice && (
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", gap: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <Briefcase size={10} style={{ flexShrink: 0 }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{result.taxAdvice}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Corps : répartitions + positions */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0,1fr) minmax(0,1fr)" }}>
              {/* Colonne gauche : donut + répartitions utiles */}
              <div style={{ padding: "22px 24px", borderRight: isMobile ? "none" : "1px solid var(--line)", borderBottom: isMobile ? "1px solid var(--line)" : "none" }}>
                <p style={{ fontSize: 10, letterSpacing: "0.12em", color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)", marginBottom: 14 }}>VUE D'ENSEMBLE</p>
                {(() => {
                  const total   = result.allocations.reduce((s, a) => s + a.percentage, 0) || 100;
                  const r = 40, cx = 48, cy = 48, circ = 2 * Math.PI * r, sw = 13;
                  let cum = 0;

                  // Répartition ETF / Actions
                  const etfPct    = Math.round(result.allocations.filter(a => a.type?.toUpperCase() === "ETF").reduce((s, a) => s + a.percentage, 0));
                  const actionPct = 100 - etfPct;

                  // Répartition géographique approximative depuis les noms
                  const geoMap: Record<string, number> = {};
                  result.allocations.forEach(a => {
                    const n = (a.name || "").toLowerCase();
                    let geo = "Autre";
                    if (n.includes("world") || n.includes("monde") || n.includes("global") || n.includes("acwi") || n.includes("all world")) geo = "Mondial";
                    else if (n.includes("emerging") || n.includes("émerg")) geo = "Marchés émergents";
                    else if (n.includes("europe") || n.includes("euro stoxx") || n.includes("european") || n.includes("stoxx")) geo = "Europe";
                    else if (n.includes("s&p 500") || n.includes("sp500") || n.includes("nasdaq") || n.includes("us equity")) geo = "États-Unis";
                    else if (n.includes("asia") || n.includes("pacific") || n.includes("japan") || n.includes("india") || n.includes("china")) geo = "Asie";
                    else if (a.symbol?.endsWith(".PA") || a.symbol?.endsWith(".DE") || a.symbol?.endsWith(".AS") || a.symbol?.endsWith(".MI") || a.symbol?.endsWith(".L")) geo = "Europe";
                    else if (!a.symbol?.includes(".") && a.type?.toUpperCase() !== "ETF") geo = "États-Unis";
                    geoMap[geo] = (geoMap[geo] ?? 0) + a.percentage;
                  });
                  const geoEntries = Object.entries(geoMap).sort((a, b) => b[1] - a[1]);
                  const geoColors  = ["#1F5C3E","#2F7D52","#C9A24E","#7D55C7","#9C9583","#0078D4"];

                  return (
                    <div>
                      {/* Donut central */}
                      <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
                        <svg width={96} height={96} viewBox="0 0 96 96">
                          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--line)" strokeWidth={sw} />
                          {result.allocations.slice(0, 8).map((a, i) => {
                            const dash = (a.percentage / total) * circ;
                            const rot  = (cum / total) * 360 - 90;
                            cum += a.percentage;
                            return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={CHART_COLORS_RES[i % CHART_COLORS_RES.length]} strokeWidth={sw} strokeDasharray={`${dash} ${circ - dash}`} transform={`rotate(${rot} ${cx} ${cy})`} strokeLinecap="butt" />;
                          })}
                          <circle cx={cx} cy={cy} r={r - sw / 2 - 1} fill="#fff" />
                          <text x={cx} y={cx - 3} textAnchor="middle" fontSize={7} fill="var(--muted)" fontFamily="var(--font-geist-mono, monospace)">rendement</text>
                          <text x={cx} y={cx + 9} textAnchor="middle" fontSize={10} fontWeight="700" fill="var(--accent)" fontFamily="var(--font-geist-mono, monospace)">{result.expectedReturn}</text>
                        </svg>
                      </div>

                      {/* Répartition ETF / Actions */}
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)", letterSpacing: "0.08em", marginBottom: 8 }}>PAR CLASSE D'ACTIF</div>
                        {[
                          { label: "Fonds indiciels (ETF)", pct: etfPct, color: "#1F5C3E", desc: "Diversification automatique" },
                          { label: "Actions individuelles", pct: actionPct, color: "#C9A24E", desc: "Convictions ciblées" },
                        ].filter(x => x.pct > 0).map(x => (
                          <div key={x.label} style={{ marginBottom: 8 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                              <span style={{ fontSize: 11, color: "var(--ink)", fontWeight: 600 }}>{x.label}</span>
                              <span style={{ fontSize: 11, fontFamily: "var(--font-geist-mono, monospace)", color: "var(--muted)", fontWeight: 700 }}>{x.pct} %</span>
                            </div>
                            <div style={{ height: 4, background: "var(--line)", borderRadius: 9999, overflow: "hidden" }}>
                              <div style={{ width: `${x.pct}%`, height: "100%", background: x.color, borderRadius: 9999 }} />
                            </div>
                            <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{x.desc}</div>
                          </div>
                        ))}
                      </div>

                      {/* Répartition géographique */}
                      <div>
                        <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)", letterSpacing: "0.08em", marginBottom: 8 }}>EXPOSITION GÉOGRAPHIQUE</div>
                        {geoEntries.map(([geo, pct], i) => (
                          <div key={geo} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                            <span style={{ width: 8, height: 8, borderRadius: 2, background: geoColors[i % geoColors.length], flexShrink: 0 }} />
                            <span style={{ flex: 1, fontSize: 11, color: "var(--ink)" }}>{geo}</span>
                            <span style={{ fontSize: 11, fontFamily: "var(--font-geist-mono, monospace)", color: "var(--muted)", fontWeight: 700 }}>{Math.round(pct)} %</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Positions */}
              <div style={{ padding: "24px 28px" }}>
                <p style={{ fontSize: 10, letterSpacing: "0.12em", color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)", marginBottom: 16 }}>LIGNES SUGGÉRÉES</p>
                <div>
                  {result.allocations.map((a, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: i < result.allocations.length - 1 ? "1px dashed var(--line)" : "none" }}>
                      <CompanyLogo symbol={a.symbol} name={a.name} size={28} radius={6} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div title={a.name || a.symbol} style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name || a.symbol}</div>
                        <div style={{ fontSize: 10, color: "var(--muted)" }}>{a.type} · {a.rationale?.split(".")[0]}</div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--font-geist-mono, monospace)", color: "var(--ink)", flexShrink: 0 }}>{a.percentage} %</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stratégie */}
            <div style={{ borderTop: "1px solid var(--line)", padding: "14px 28px", background: "var(--paper-2)", fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
              <strong style={{ color: "var(--ink)" }}>Stratégie :</strong> {result.strategy}
            </div>
          </div>
          </div>{/* fin wrapper overlay */}

          {/* ══════════════════════════════════════════
              3. OÙ OUVRIR TON COMPTE
          ══════════════════════════════════════════ */}
          <div style={{ background: "var(--paper-2)", border: "1.5px solid var(--line)", borderRadius: 20, padding: "24px 28px", marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", margin: "0 0 16px" }}>Où ouvrir ton compte ?</h2>
            <div style={{ filter: (!isPaid && isLoggedIn === false) ? "blur(5px)" : "none", userSelect: (!isPaid && isLoggedIn === false) ? "none" : "auto", pointerEvents: (!isPaid && isLoggedIn === false) ? "none" : "auto" }}>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>
                Sélectionné selon ton profil <strong style={{ color: "var(--ink)" }}>{result.riskLevel}</strong>
                {taxWrapper.length > 0 && taxWrapper[0] !== "Je ne sais pas encore" && ` et ton enveloppe ${taxWrapper[0]}`}.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              {topBrokers.map((b) => (
                <a key={b.name} href={b.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                  <div style={{ background: b.best ? "linear-gradient(180deg,rgba(45,125,90,0.07),#fff)" : "#fff", border: `1.5px solid ${b.best ? "rgba(45,125,90,0.30)" : "var(--line)"}`, borderRadius: 14, padding: "16px 18px", transition: "transform 0.15s", cursor: "pointer", height: "100%" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "none"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <CompanyLogo symbol={b.name} name={b.name} size={32} radius={8} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "var(--ink)" }}>{b.name}</div>
                        {b.best && <div style={{ fontSize: 10, color: "var(--accent)", fontWeight: 600 }}>✓ Recommandé pour toi</div>}
                      </div>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.55, margin: "0 0 10px" }}>{b.desc}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {b.tags.map(tag => <span key={tag} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 9999, background: "var(--paper-3)", color: "var(--muted)", fontWeight: 600 }}>{tag}</span>)}
                    </div>
                  </div>
                </a>
              ))}
            </div>
            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 14, lineHeight: 1.5 }}>
              ⚠️ Finazen ne perçoit aucune commission. Liste à titre indicatif — vérifie toujours les conditions en vigueur.
            </p>
            </div>{/* fin blur brokers */}
          </div>

          {/* ══════════════════════════════════════════
              4. CONSEILS PRATIQUES
          ══════════════════════════════════════════ */}
          {result.tips?.length > 0 && (
            <div style={{ background: "var(--paper-2)", border: "1.5px solid var(--line)", borderRadius: 16, padding: "22px 24px", marginBottom: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: "var(--ink)", display: "flex", alignItems: "center", gap: 8 }}>
                <Lightbulb size={16} color="var(--accent)" /> Conseils pratiques
              </h2>
              <div style={{ filter: (!isPaid && isLoggedIn === false) ? "blur(5px)" : "none", userSelect: (!isPaid && isLoggedIn === false) ? "none" : "auto", pointerEvents: (!isPaid && isLoggedIn === false) ? "none" : "auto" }}>
                {result.tips.map((tip, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
                    <span style={{ color: "var(--accent)", fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>{tip}
                  </div>
                ))}
                <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "var(--paper-3)", fontSize: 13, color: "var(--muted)", display: "flex", alignItems: "center", gap: 8 }}>
                  <RefreshCw size={13} color="var(--accent)" />
                  Rééquilibrage recommandé : <strong style={{ color: "var(--ink)" }}>{result.rebalancing}</strong>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════
              5. ANALYSE DE SCÉNARIOS
          ══════════════════════════════════════════ */}
          <div style={{ position: "relative" }}>
            {isLoggedIn === false && (
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 2, padding: "18px 24px 0" }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", margin: 0 }}>Analyse de scénarios</h2>
              </div>
            )}
            <div style={{ filter: (!isPaid && isLoggedIn === false) ? "blur(5px)" : "none", userSelect: (!isPaid && isLoggedIn === false) ? "none" : "auto", pointerEvents: (!isPaid && isLoggedIn === false) ? "none" : "auto", marginTop: isLoggedIn === false ? 0 : 0 }}>
              <ScenarioAnalysis
                positions={result.allocations.map((a: Allocation) => ({
                  symbol: a.symbol, name: a.name,
                  marketValue: (capitalNum * a.percentage) / 100,
                  asset_type: a.type?.toLowerCase() === "etf" ? "etf" : "stock",
                  sector: undefined,
                }))}
                totalValue={capitalNum}
                monthlyContribution={monthlyNum}
                riskLabel={(answers.riskTolerance as string) ?? ""}
              />
            </div>
          </div>

          <p style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", marginTop: 8, marginBottom: 24, lineHeight: 1.6 }}>{result.disclaimer}</p>
          <button onClick={resetAll} style={{ display: "block", width: "100%", maxWidth: 280, margin: "0 auto", padding: "13px", borderRadius: 9999, border: "1.5px solid var(--line)", background: "transparent", color: "var(--muted)", fontSize: 14, cursor: "pointer" }}>
            Refaire le questionnaire
          </button>
        </div>
      </div>
    );
  }

  // ── LOADING STATE ──
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--paper)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          padding: 24,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            border: "3px solid var(--line)",
            borderTopColor: "var(--accent)",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ fontSize: 17, color: "var(--ink)", fontWeight: 600 }}>Construction de ton portefeuille en cours…</p>
        <p style={{ fontSize: 14, color: "var(--muted)", maxWidth: 360, textAlign: "center" }}>
          Analyse de ton profil, sélection des actifs, calibration du risque. Ça prend 10-15 secondes.
        </p>
      </div>
    );
  }

  /* ── QUESTIONNAIRE ── */

  const hint = currentQuestion ? getHint(currentQuestion.field) : getHint("default");
  const guessedProfile = guessProfile(answers);
  const currentAnswer = getCurrentAnswer();
  const minutesLeft = Math.max(1, Math.ceil(((TOTAL - step) * 20) / 60));

  return (
    <div style={{ background: "var(--paper)", minHeight: "100vh" }}>

      {/* ── HERO ── */}
      <section
        style={{
          textAlign: "center",
          padding: "80px 24px 64px",
          maxWidth: 700,
          margin: "0 auto",
        }}
      >
        {/* Eyebrow pill */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 16px",
            borderRadius: 9999,
            background: "rgba(45,125,90,0.12)",
            marginBottom: 28,
          }}
        >
          <span style={{ color: "var(--accent)", fontSize: 8 }}>●</span>
          <span
            style={{
              fontSize: 11,
              letterSpacing: "0.12em",
              color: "var(--accent)",
              fontFamily: "var(--font-geist-mono, monospace)",
              fontWeight: 600,
            }}
          >
            CONSEILLER PATRIMONIAL · IA
          </span>
        </div>

        {/* H1 */}
        <h1
          style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: "clamp(40px, 6vw, 68px)",
            fontWeight: 400,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            color: "var(--ink)",
            margin: "0 0 20px",
          }}
        >
          Un portefeuille{" "}
          <em style={{ fontStyle: "italic", color: "var(--accent)" }}>fait pour toi,</em>
          <br />
          en moins de 3 minutes.
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 17,
            color: "var(--muted)",
            lineHeight: 1.65,
            maxWidth: 580,
            margin: "0 auto 28px",
          }}
        >
          Neuf questions. Notre IA construit une allocation personnalisée selon ton profil, ton horizon et tes objectifs. Sans engagement, sans données bancaires.
        </p>

        {/* Trust badges */}
        <div
          style={{
            display: "flex",
            gap: 20,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {["✓ Plan gratuit disponible", "✓ Sans carte bancaire", "✓ Résultat immédiat"].map((badge) => (
            <span
              key={badge}
              style={{
                fontSize: 13,
                color: "var(--muted)",
                fontWeight: 500,
              }}
            >
              {badge}
            </span>
          ))}
        </div>
      </section>

      {/* ── STEPPER BAR ── */}
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 24px 0" }}>
        <div
          style={{
            background: "var(--paper-2)",
            border: "1.5px solid var(--line)",
            borderRadius: 18,
            padding: isMobile ? "14px 18px" : "20px 24px",
            marginBottom: 32,
          }}
        >
          {isMobile ? (
            /* Mobile stepper: text + single progress bar */
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 12, letterSpacing: "0.1em", color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)", fontWeight: 700 }}>
                  QUESTION {Math.min(step + 1, TOTAL)} / {TOTAL}
                </span>
                <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)" }}>
                  ~ {minutesLeft} MIN
                </span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: "var(--line)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${((step + 0.5) / TOTAL) * 100}%`, borderRadius: 2, background: "var(--accent)", transition: "width 0.4s ease" }} />
              </div>
            </div>
          ) : (
            <>
              {/* Top row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 11, letterSpacing: "0.1em", color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)", fontWeight: 600 }}>
                  QUESTION {Math.min(step + 1, TOTAL)} SUR {TOTAL}
                </span>
                <span style={{ fontSize: 11, letterSpacing: "0.1em", color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)" }}>
                  ~ {minutesLeft} MIN RESTANTE{minutesLeft > 1 ? "S" : ""}
                </span>
              </div>

              {/* Bars + labels */}
              <div style={{ display: "flex", gap: 4 }}>
                {STEP_LABELS.map((label, i) => {
                  const isDone = i < step;
                  const isCurrent = i === step;
                  return (
                    <div key={i} style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ height: 4, borderRadius: 2, background: "var(--line)", overflow: "hidden", marginBottom: 6 }}>
                        <div style={{ height: "100%", width: isDone ? "100%" : isCurrent ? "50%" : "0%", borderRadius: 2, background: "var(--accent)", transition: "width 0.4s ease", boxShadow: isCurrent ? "0 0 6px rgba(45,125,90,0.5)" : "none" }} />
                      </div>
                      <p style={{ fontSize: 10, fontFamily: "var(--font-geist-mono, monospace)", color: isDone || isCurrent ? "var(--accent)" : "var(--muted)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: isCurrent ? 700 : 400 }}>
                        {label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── QUESTION GRID ── */}
      {step < TOTAL && currentQuestion && (
        <div
          style={{
            maxWidth: 1080,
            margin: "0 auto",
            padding: isMobile ? "0 16px 60px" : "0 24px 80px",
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 320px",
            gap: 32,
            alignItems: "start",
          }}
        >
          {/* LEFT — Question card */}
          <div
            style={{
              background: "#fff",
              border: "1.5px solid var(--line)",
              borderRadius: 24,
              padding: isMobile ? "24px" : "48px",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "var(--accent)",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontFamily: "var(--font-geist-mono, monospace)",
                }}
              >
                {step + 1}
              </div>
              <span
                style={{
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  color: "var(--muted)",
                  fontFamily: "var(--font-geist-mono, monospace)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                {currentQuestion.stepLabel}
              </span>
            </div>

            {/* Question H2 */}
            <h2
              style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: "clamp(28px, 4vw, 48px)",
                fontWeight: 400,
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
                color: "var(--ink)",
                margin: "0 0 16px",
              }}
            >
              {currentQuestion.title}
            </h2>

            {currentQuestion.subtitle && (
              <p
                style={{
                  fontSize: 16,
                  color: "var(--muted)",
                  lineHeight: 1.6,
                  margin: "0 0 36px",
                }}
              >
                {currentQuestion.subtitle}
              </p>
            )}

            {/* ── OPTIONS ── */}
            {(isInput || isInputOptional) ? (
              /* Big input */
              <div style={{ marginBottom: 12 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    border: "1.5px solid var(--line)",
                    borderRadius: 9999,
                    padding: "16px 28px",
                    background: "var(--paper-2)",
                    maxWidth: 320,
                    margin: "0 auto 8px",
                  }}
                >
                  <span style={{ fontSize: 22, color: "var(--muted)", fontWeight: 400 }}>€</span>
                  <input
                    type="text"
                    value={isInput ? capitalInput : monthlyInput}
                    onChange={(e) => isInput ? setCapitalInput(e.target.value) : setMonthlyInput(e.target.value)}
                    placeholder={isInput ? "10 000" : "200"}
                    style={{
                      flex: 1,
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      fontSize: 24,
                      fontWeight: 700,
                      color: "var(--ink)",
                      fontFamily: "var(--font-geist-mono, monospace)",
                      fontVariantNumeric: "tabular-nums",
                      minWidth: 0,
                    }}
                  />
                </div>
                {isInputOptional && (
                  <p style={{ textAlign: "center", fontSize: 13, color: "var(--muted)", margin: "8px 0 0" }}>
                    Optionnel — laisse vide si tu préfères ne pas investir chaque mois.
                  </p>
                )}
              </div>
            ) : (
              /* Choice / multi grid */
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : (currentQuestion.options && currentQuestion.options.length > 3 ? "1fr 1fr" : "1fr"),
                  gap: 14,
                  marginBottom: 8,
                }}
              >
                {(currentQuestion.options ?? []).map((opt) => {
                  const isSelected = isMulti
                    ? (currentAnswer as string[]).includes(opt.label)
                    : currentAnswer === opt.label;
                  return (
                    <AnswerButton
                      key={opt.label}
                      opt={opt}
                      selected={isSelected}
                      onClick={() =>
                        isMulti ? toggleMultiAnswer(opt.label) : setChoiceAnswer(opt.label)
                      }
                    />
                  );
                })}
              </div>
            )}

            {/* Portfolio import panel — shown when "Actions ou ETF" is selected */}
            {currentQuestion?.field === "existingAssets" &&
             (answers.existingAssets as string[] | undefined)?.includes("Actions ou ETF (voir mon portefeuille)") && (
              <div style={{ marginTop: 16, background: "var(--accent-soft)", border: "1px solid rgba(45,125,90,0.22)", borderRadius: 14, padding: "16px 18px" }}>
                {portfolioHoldings.length > 0 ? (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                      ✓ {portfolioHoldings.length} position{portfolioHoldings.length > 1 ? "s" : ""} importée{portfolioHoldings.length > 1 ? "s" : ""} depuis ton portefeuille
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {portfolioHoldings.map(h => (
                        <div key={h.symbol} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: "var(--ink)" }}>
                          <span style={{ fontWeight: 600 }}>{h.name}</span>
                          <span style={{ color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)" }}>{h.sector !== "—" ? h.sector : "Action"}</span>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: 11, color: "var(--muted)", margin: "10px 0 0", lineHeight: 1.5 }}>
                      L'IA en tiendra compte pour ne pas créer de doublons et proposer ce qui complète le mieux ton portefeuille actuel.
                    </p>
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>
                    {portfolioImported ? "Aucune position trouvée dans ton portefeuille." : "Chargement de ton portefeuille…"}
                  </div>
                )}
              </div>
            )}

            {/* Footer nav */}
            <div
              style={{
                borderTop: "1.5px solid var(--line)",
                marginTop: 40,
                paddingTop: 24,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {/* Prev */}
              {step > 0 ? (
                <button
                  onClick={handlePrev}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "10px 18px",
                    borderRadius: 9999,
                    border: "1.5px solid var(--line)",
                    background: "transparent",
                    color: "var(--muted)",
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  <ChevronLeft size={15} />
                  Précédent
                </button>
              ) : (
                <div />
              )}

              {/* Next / Submit */}
              {step < TOTAL - 1 ? (
                <button
                  onClick={handleNext}
                  disabled={!hasAnswer()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "12px 28px",
                    borderRadius: 9999,
                    border: "none",
                    background: hasAnswer() ? "var(--accent)" : "var(--line)",
                    color: hasAnswer() ? "#fff" : "var(--muted)",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: hasAnswer() ? "pointer" : "not-allowed",
                    transition: "all 0.15s",
                  }}
                >
                  Question suivante
                  <ChevronRight size={16} />
                </button>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                  {error && (
                    <p style={{ color: "var(--signal-down)", fontSize: 13, margin: 0 }}>{error}</p>
                  )}
                  <button
                    onClick={submit}
                    disabled={!hasAnswer()}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "14px 32px",
                      borderRadius: 9999,
                      border: "none",
                      background: hasAnswer() ? "var(--accent)" : "var(--line)",
                      color: hasAnswer() ? "#fff" : "var(--muted)",
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: hasAnswer() ? "pointer" : "not-allowed",
                      transition: "all 0.15s",
                    }}
                  >
                    Générer mon portefeuille
                    <Sparkles size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Optional skip for monthly */}
            {isInputOptional && (
              <div style={{ textAlign: "center", marginTop: 12 }}>
                <button
                  onClick={handleNext}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--muted)",
                    fontSize: 13,
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Passer — pas de versement régulier
                </button>
              </div>
            )}
          </div>

          {/* RIGHT — Hint card (hidden on mobile) */}
          {!isMobile && <div
            style={{
              position: "sticky",
              top: 80,
              background: "var(--paper-2)",
              border: "1.5px solid var(--line)",
              borderRadius: 18,
              padding: 24,
            }}
          >
            {/* Label */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
              <span style={{ color: "var(--accent)", fontSize: 8 }}>●</span>
              <span
                style={{
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  color: "var(--accent)",
                  fontFamily: "var(--font-geist-mono, monospace)",
                  fontWeight: 700,
                }}
              >
                BON À SAVOIR
              </span>
            </div>

            {/* Title */}
            <h3
              style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: 22,
                fontWeight: 400,
                color: "var(--ink)",
                lineHeight: 1.2,
                margin: "0 0 10px",
              }}
            >
              {hint.title}
            </h3>

            {/* Body */}
            <p
              style={{
                fontSize: 14,
                color: "var(--muted)",
                lineHeight: 1.55,
                margin: "0 0 18px",
              }}
            >
              <BoldText text={hint.body} />
            </p>

            {/* Divider */}
            <div style={{ height: 1, background: "var(--line)", marginBottom: 18 }} />

            {/* Summary of answers */}
            {Object.keys(answers).length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>
                  Tes réponses jusqu'ici
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {Object.entries(answers)
                    .filter(([, v]) => v && (Array.isArray(v) ? v.length > 0 : v !== ""))
                    .slice(-4)
                    .map(([k, v]) => (
                      <div key={k} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500, flexShrink: 0, textTransform: "capitalize" }}>
                          {k}:
                        </span>
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>
                          {Array.isArray(v) ? v.join(", ") : v}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Profile guess */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", margin: 0 }}>Profil pressenti</p>
              <span
                style={{
                  fontSize: 13,
                  color: "var(--accent)",
                  fontWeight: 700,
                  background: "rgba(45,125,90,0.1)",
                  padding: "3px 10px",
                  borderRadius: 9999,
                }}
              >
                {guessedProfile}
              </span>
            </div>
          </div>}
        </div>
      )}

      {/* ── CONVICTIONS STEP (after all questions done) ── */}
      {step === TOTAL && (
        <div
          style={{
            maxWidth: 1080,
            margin: "0 auto",
            padding: isMobile ? "0 16px 60px" : "0 24px 80px",
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 320px",
            gap: 32,
            alignItems: "start",
          }}
        >
          <div
            style={{
              background: "#fff",
              border: "1.5px solid var(--line)",
              borderRadius: 24,
              padding: isMobile ? 24 : 48,
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "var(--accent)",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-geist-mono, monospace)",
                }}
              >
                ★
              </div>
              <span style={{ fontSize: 11, letterSpacing: "0.12em", color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)", fontWeight: 600, textTransform: "uppercase" }}>
                Convictions personnelles
              </span>
            </div>

            <h2
              style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: "clamp(28px, 4vw, 44px)",
                fontWeight: 400,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                color: "var(--ink)",
                margin: "0 0 14px",
              }}
            >
              As-tu des convictions ?
            </h2>
            <p style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.6, marginBottom: 32 }}>
              Ajoute des actions ou ETF que tu souhaites inclure. On les analysera avant de les intégrer. Tu peux passer cette étape.
            </p>

            {/* Recherche inline par nom ou ticker */}
            <div style={{ position: "relative", marginBottom: forcedError ? 8 : 20 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
                borderRadius: 14, background: "var(--paper-2)",
                border: "1.5px solid var(--line)", transition: "border-color 0.15s",
              }}>
                {forcedLoading
                  ? <RefreshCw size={16} color="var(--muted)" style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />
                  : <Search size={16} color="var(--muted)" style={{ flexShrink: 0 }} />
                }
                <input
                  value={forcedSearch}
                  onChange={(e) => { setForcedSearch(e.target.value); setForcedDropdownOpen(true); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && forcedSearch.trim()) handleAddForced(forcedSearch.trim());
                    if (e.key === "Escape") { setForcedDropdownOpen(false); setForcedSearch(""); }
                  }}
                  onFocus={() => forcedDropdown.length > 0 && setForcedDropdownOpen(true)}
                  placeholder="Recherche par nom ou ticker — Apple, NVDA, MC.PA…"
                  disabled={forcedLoading}
                  style={{
                    flex: 1, border: "none", outline: "none",
                    background: "transparent", color: "var(--ink)",
                    fontSize: 15, fontFamily: "inherit",
                    opacity: forcedLoading ? 0.5 : 1,
                  }}
                />
                {forcedDropdownLoading && <span style={{ fontSize: 12, color: "var(--muted)", flexShrink: 0 }}>…</span>}
                {forcedSearch && !forcedLoading && (
                  <button
                    onClick={() => { setForcedSearch(""); setForcedDropdown([]); setForcedDropdownOpen(false); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex", padding: 2, flexShrink: 0 }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Dropdown résultats */}
              {forcedDropdownOpen && forcedDropdown.length > 0 && (
                <div style={{
                  position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
                  background: "var(--paper)", border: "1.5px solid var(--line)", borderRadius: 14,
                  zIndex: 60, overflow: "hidden",
                  boxShadow: "0 12px 40px rgba(10,22,40,0.14)",
                }}>
                  <div style={{ padding: "7px 12px 5px", fontSize: 10, color: "var(--muted)", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--font-geist-mono, monospace)" }}>
                    {forcedDropdown.length} résultat{forcedDropdown.length > 1 ? "s" : ""}
                  </div>
                  {forcedDropdown.map((r, idx) => {
                    const alreadyAdded = forcedStocks.some(s => s.symbol === r.symbol);
                    return (
                      <div
                        key={r.symbol}
                        onClick={() => !alreadyAdded && handleAddForced(r.symbol)}
                        style={{
                          display: "flex", alignItems: "center", gap: 10, padding: "11px 14px",
                          cursor: alreadyAdded ? "default" : "pointer",
                          borderTop: idx === 0 ? "none" : "1px solid var(--line)",
                          opacity: alreadyAdded ? 0.5 : 1,
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={e => { if (!alreadyAdded) e.currentTarget.style.background = "var(--paper-2)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <CompanyLogo symbol={r.symbol} name={r.name} size={32} radius={8} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>
                            {r.symbol}{r.exchange ? ` · ${r.exchange}` : ""}
                          </div>
                        </div>
                        {alreadyAdded
                          ? <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600 }}>Déjà ajoutée</span>
                          : <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 9999, background: "var(--accent-soft)", color: "var(--accent)", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                              <Plus size={11} strokeWidth={2.5} /> Ajouter
                            </div>
                        }
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Click outside → fermer */}
              {forcedDropdownOpen && (
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 59 }}
                  onClick={() => setForcedDropdownOpen(false)}
                />
              )}
            </div>

            {forcedLoading && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "var(--paper-2)", marginBottom: 14, fontSize: 13, color: "var(--muted)" }}>
                <RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} />
                Récupération des données de valorisation…
              </div>
            )}

            {forcedError && <p style={{ color: "var(--signal-down)", fontSize: 13, marginBottom: 14 }}>{forcedError}</p>}

            {/* Actions favorites ajoutées */}
            {forcedStocks.map((s, i) => {
              const isPos  = s.upside >= 0;
              const isOver = s.upside < -15; // surévalué significativement
              return (
                <div
                  key={i}
                  style={{
                    borderRadius: 16,
                    border: `1.5px solid ${s.confirmed ? "var(--accent)" : "var(--line)"}`,
                    background: s.confirmed ? "var(--accent-soft)" : "var(--paper-2)",
                    marginBottom: 12,
                    overflow: "hidden",
                  }}
                >
                  {/* En-tête : logo + nom + supprimer */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px 10px" }}>
                    <CompanyLogo symbol={s.symbol} name={s.name} size={36} radius={9} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)", marginTop: 1 }}>{s.symbol}</div>
                    </div>
                    <button
                      onClick={() => setForcedStocks((fs) => fs.filter((_, j) => j !== i))}
                      style={{ background: "rgba(184,74,58,0.08)", border: "none", color: "var(--signal-down)", borderRadius: 8, width: 26, height: 26, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                    >
                      <X size={12} />
                    </button>
                  </div>

                  {/* Bloc valorisation — rappel théorique */}
                  <div style={{
                    margin: "0 14px 12px",
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: isOver
                      ? "rgba(184,74,58,0.07)"
                      : isPos
                        ? "rgba(45,125,90,0.07)"
                        : "rgba(176,125,0,0.07)",
                    border: `1px solid ${isOver ? "rgba(184,74,58,0.2)" : isPos ? "rgba(45,125,90,0.2)" : "rgba(176,125,0,0.2)"}`,
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)", marginBottom: 8 }}>
                      Valorisation estimée par Finazen
                    </div>
                    <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" as const }}>
                      {/* Prix actuel */}
                      <div>
                        <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 2 }}>Cours actuel</div>
                        <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--font-geist-mono, monospace)", color: "var(--ink)" }}>
                          {s.currentPrice.toFixed(2)} <span style={{ fontSize: 11, fontWeight: 400 }}>{s.currency}</span>
                        </div>
                      </div>
                      {/* Séparateur */}
                      <div style={{ width: 1, height: 32, background: "var(--line)", flexShrink: 0 }} />
                      {/* Valeur estimée */}
                      <div>
                        <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 2 }}>Valeur théorique</div>
                        <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--font-geist-mono, monospace)", color: "var(--ink)" }}>
                          {s.fairValue.toFixed(2)} <span style={{ fontSize: 11, fontWeight: 400 }}>{s.currency}</span>
                        </div>
                      </div>
                      {/* Séparateur */}
                      <div style={{ width: 1, height: 32, background: "var(--line)", flexShrink: 0 }} />
                      {/* Potentiel */}
                      <div>
                        <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 2 }}>Potentiel</div>
                        <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--font-geist-mono, monospace)", color: isOver ? "var(--signal-down)" : isPos ? "var(--signal-up)" : "#b07d00" }}>
                          {isPos ? "+" : ""}{s.upside.toFixed(1)} %
                        </div>
                      </div>
                      {/* Signal */}
                      <div style={{ marginLeft: "auto" }}>
                        <SignalPill score={s.signal} size="sm" />
                      </div>
                    </div>
                    {/* Avertissement si surévalué */}
                    {isOver && (
                      <div style={{ marginTop: 8, fontSize: 12, color: "var(--signal-down)", display: "flex", alignItems: "center", gap: 5 }}>
                        <TrendingDown size={12} /> Cette action semble surévaluée selon notre modèle — l'IA en tiendra compte.
                      </div>
                    )}
                  </div>

                  {/* Boutons confirmer / retirer */}
                  <div style={{ display: "flex", gap: 8, padding: "0 14px 14px" }}>
                    <button
                      onClick={() => setForcedStocks((fs) => fs.map((x, j) => (j === i ? { ...x, confirmed: true } : x)))}
                      disabled={s.confirmed}
                      style={{
                        flex: 1, padding: "9px",
                        borderRadius: 9999,
                        border: `1.5px solid ${s.confirmed ? "var(--accent)" : "rgba(45,125,90,0.3)"}`,
                        background: s.confirmed ? "var(--accent-soft)" : "transparent",
                        color: "var(--accent)", fontWeight: 600, fontSize: 13,
                        cursor: s.confirmed ? "default" : "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      }}
                    >
                      <Check size={13} />
                      {s.confirmed ? "Incluse dans le portefeuille" : "Oui, l'inclure"}
                    </button>
                    {s.confirmed && (
                      <button
                        onClick={() => setForcedStocks((fs) => fs.map((x, j) => (j === i ? { ...x, confirmed: false } : x)))}
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

            {/* Footer */}
            <div
              style={{
                borderTop: "1.5px solid var(--line)",
                marginTop: 32,
                paddingTop: 24,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <button
                onClick={handlePrev}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 18px",
                  borderRadius: 9999,
                  border: "1.5px solid var(--line)",
                  background: "transparent",
                  color: "var(--muted)",
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                <ChevronLeft size={15} />
                Précédent
              </button>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                {error && <p style={{ color: "var(--signal-down)", fontSize: 13, margin: 0 }}>{error}</p>}
                <button
                  onClick={submit}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "14px 32px",
                    borderRadius: 9999,
                    border: "none",
                    background: "var(--accent)",
                    color: "#fff",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  Générer mon portefeuille
                  <Sparkles size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Hint card — hidden on mobile */}
          {!isMobile && <div
            style={{
              position: "sticky",
              top: 80,
              background: "var(--paper-2)",
              border: "1.5px solid var(--line)",
              borderRadius: 18,
              padding: 24,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
              <span style={{ color: "var(--accent)", fontSize: 8 }}>●</span>
              <span style={{ fontSize: 10, letterSpacing: "0.12em", color: "var(--accent)", fontFamily: "var(--font-geist-mono, monospace)", fontWeight: 700 }}>
                PRESQUE FINI
              </span>
            </div>
            <h3 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 22, fontWeight: 400, color: "var(--ink)", margin: "0 0 10px" }}>
              Facultatif mais utile.
            </h3>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.55, margin: "0 0 18px" }}>
              Si tu as déjà une conviction sur une action — ex: LVMH, NVIDIA — indique-la ici.
              On l'analysera pour voir si elle correspond à ton profil avant de l'intégrer.
            </p>
            <div style={{ height: 1, background: "var(--line)", marginBottom: 18 }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", margin: 0 }}>Profil pressenti</p>
              <span style={{ fontSize: 13, color: "var(--accent)", fontWeight: 700, background: "rgba(45,125,90,0.1)", padding: "3px 10px", borderRadius: 9999 }}>
                {guessedProfile}
              </span>
            </div>
          </div>}
        </div>
      )}

      {/* ── RESULT PREVIEW (always visible) ── */}
      <section
        style={{
          background: "linear-gradient(180deg, var(--paper-2), var(--paper))",
          paddingTop: 96,
          paddingBottom: 80,
        }}
      >
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 24px" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 16px",
                borderRadius: 9999,
                background: "rgba(45,125,90,0.12)",
                marginBottom: 20,
              }}
            >
              <span style={{ color: "var(--accent)", fontSize: 8 }}>●</span>
              <span style={{ fontSize: 11, letterSpacing: "0.12em", color: "var(--accent)", fontFamily: "var(--font-geist-mono, monospace)", fontWeight: 600 }}>
                CE QUE TU OBTIENDRAS À LA FIN
              </span>
            </div>
            <h2
              style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: "clamp(32px, 4vw, 52px)",
                fontWeight: 400,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                color: "var(--ink)",
                margin: "0 0 14px",
              }}
            >
              Un portefeuille{" "}
              <em style={{ fontStyle: "italic", color: "var(--accent)" }}>complet,</em>
              {" "}prêt à investir.
            </h2>
            <p style={{ fontSize: 16, color: "var(--muted)", maxWidth: 520, margin: "0 auto" }}>
              Allocation par classe d'actif, sélection de lignes précises, et explication ligne par ligne.
            </p>
          </div>

          {/* Result preview card */}
          <div
            style={{
              background: "#fff",
              border: "1.5px solid var(--line)",
              borderRadius: 24,
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
            }}
          >
            {/* Dark top */}
            <div
              style={{
                background: "linear-gradient(135deg, #1F5C3E, #14201A)",
                padding: "36px 40px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap" as const,
                gap: 24,
              }}
            >
              <div>
                <div
                  style={{
                    display: "inline-flex",
                    padding: "4px 12px",
                    borderRadius: 9999,
                    background: "rgba(255,255,255,0.1)",
                    marginBottom: 14,
                  }}
                >
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", letterSpacing: "0.1em", fontFamily: "var(--font-geist-mono, monospace)" }}>
                    APERÇU — EXEMPLE PROFIL ÉQUILIBRÉ
                  </span>
                </div>
                <h3
                  style={{
                    fontFamily: "'Instrument Serif', Georgia, serif",
                    fontSize: 46,
                    fontWeight: 400,
                    color: "#fff",
                    margin: 0,
                    lineHeight: 1.05,
                  }}
                >
                  Ton portefeuille{" "}
                  <em style={{ fontStyle: "italic", color: "#A8D0AF" }}>Équilibré.</em>
                </h3>
              </div>

              {/* Summary rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Capital initial", value: "10 000 €", highlight: false },
                  { label: "Versement mensuel", value: "250 €", highlight: false },
                  { label: "Horizon", value: "5 — 10 ans", highlight: false },
                  { label: "Rendement attendu", value: "~ 6,8 % / an", highlight: true },
                  { label: "Projection à 10 ans", value: "~ 56 400 €", highlight: true },
                ].map((row) => (
                  <div key={row.label} style={{ display: "flex", gap: 24, justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{row.label}</span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: row.highlight ? "#A8D0AF" : "#fff",
                        fontFamily: "var(--font-geist-mono, monospace)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 0,
              }}
            >
              {/* Donut */}
              <div style={{ padding: "32px 40px", borderRight: "1.5px solid var(--line)" }}>
                <p
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.12em",
                    color: "var(--muted)",
                    fontFamily: "var(--font-geist-mono, monospace)",
                    fontWeight: 600,
                    marginBottom: 20,
                  }}
                >
                  ALLOCATION CIBLE
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <PreviewDonut />
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      { label: "Panier de 1 500 entreprises mondiales", pct: "45 %", color: "#1F5C3E" },
                      { label: "Entreprises rentables et reconnues", pct: "25 %", color: "#2F7D52" },
                      { label: "Secteurs à fort potentiel", pct: "15 %", color: "#C9A24E" },
                      { label: "Protection contre les crises", pct: "15 %", color: "#9C9583" },
                    ].map((leg) => (
                      <div key={leg.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: leg.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: "var(--muted)" }}>{leg.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-geist-mono, monospace)", marginLeft: "auto", paddingLeft: 12 }}>{leg.pct}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Lines */}
              <div style={{ padding: "32px 40px" }}>
                <p style={{ fontSize: 10, letterSpacing: "0.12em", color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)", fontWeight: 600, marginBottom: 20 }}>
                  LIGNES SUGGÉRÉES
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {PREVIEW_LINES.map((line) => (
                    <div key={line.sym} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px dashed var(--line)" }}>
                      <CompanyLogo symbol={line.ticker} name={line.name} size={32} radius={8} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {line.name}
                        </p>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-geist-mono, monospace)", flexShrink: 0 }}>
                        {line.pct}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA footer */}
            <div
              style={{
                borderTop: "1.5px solid var(--line)",
                padding: "20px 40px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap" as const,
                gap: 12,
              }}
            >
              <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
                À la fin du questionnaire, tu reçois ce livrable + les liens d'achat.
              </p>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 24px",
                  borderRadius: 9999,
                  border: "none",
                  background: "var(--accent)",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Continuer le questionnaire
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── REASSURANCE ── */}
      <section
        style={{
          background: "var(--paper)",
          padding: "60px 0 80px",
        }}
      >
        <div
          style={{
            maxWidth: 1080,
            margin: "0 auto",
            padding: "0 24px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {[
            {
              icon: <Shield size={22} color="var(--accent)" />,
              title: "Tes données restent chez toi.",
              body: "On ne demande aucune information bancaire, aucun RIB, aucun accès courtier.",
            },
            {
              icon: <Activity size={22} color="var(--accent)" />,
              title: "Calibré sur 30 ans de marché.",
              body: "Nos modèles s'appuient sur l'historique du S&P 500, du CAC 40 et des grands indices obligataires depuis 1995.",
            },
            {
              icon: <PlusCircle size={22} color="var(--accent)" />,
              title: "Tu restes maître à bord.",
              body: "Le portefeuille suggéré est une proposition, pas un engagement. Tu passes tes ordres chez ton courtier habituel, à ton rythme.",
            },
          ].map((card) => (
            <div
              key={card.title}
              style={{
                background: "var(--paper-2)",
                border: "1.5px solid var(--line)",
                borderRadius: 18,
                padding: "28px 28px",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "rgba(45,125,90,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                {card.icon}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", margin: "0 0 8px" }}>{card.title}</h3>
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        style={{
          borderTop: "1.5px solid var(--line)",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
          Aucune information bancaire collectée · Pas de frais · Pas d'engagement
        </p>
      </footer>
    </div>
  );
}

/* ── Sub-components ── */

function AnswerButton({
  opt,
  selected,
  onClick,
}: {
  opt: AnswerOption;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "relative",
        padding: "20px 22px",
        borderRadius: 16,
        border: `1.5px solid ${selected ? "var(--accent)" : "var(--line)"}`,
        background: selected
          ? "linear-gradient(135deg, #E9F0E5, #F4F1E2)"
          : "#fff",
        textAlign: "left",
        cursor: "pointer",
        display: "flex",
        gap: 18,
        alignItems: "flex-start",
        boxShadow: selected ? "0 0 0 4px rgba(45,125,90,0.15)" : "none",
        transform: selected ? "translateY(-1px)" : "none",
        transition: "all 0.15s ease",
        width: "100%",
      }}
    >
      {/* Icon square */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: "var(--paper-2)",
          border: `1.5px solid ${selected ? "var(--accent)" : "var(--line)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {opt.icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 17, fontWeight: 600, color: "var(--ink)", margin: "0 0 4px", lineHeight: 1.2 }}>
          {opt.label}
        </p>
        {opt.sublabel && (
          <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 6px", lineHeight: 1.4 }}>
            {opt.sublabel}
          </p>
        )}
        {opt.tag && (
          <span
            style={{
              fontSize: 11,
              fontFamily: "var(--font-geist-mono, monospace)",
              color: "var(--muted)",
              fontStyle: "italic",
            }}
          >
            {opt.tag}
          </span>
        )}
      </div>

      {/* Checkmark when selected */}
      {selected && (
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Check size={12} color="#fff" strokeWidth={3} />
        </div>
      )}
    </button>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        background: "var(--ink)",
        border: "1.5px solid var(--ink)",
        borderRadius: 16,
        padding: "18px 22px",
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
