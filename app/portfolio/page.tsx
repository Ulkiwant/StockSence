"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { useMobile } from "@/lib/useMobile";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  ReferenceLine,
} from "recharts";
import { Download, Plus, Sparkles, TrendingUp, TrendingDown, Trash2, Check, Clock, AlertCircle } from "lucide-react";
import ScenarioAnalysis from "@/components/ScenarioAnalysis";
import CompanyLogo from "@/components/CompanyLogo";

/* ── Currency helpers ── */
const USD_TO_EUR = 0.92;

/** Taux de change vers EUR (approximatifs mais stables) */
const RATE_TO_EUR: Record<string, number> = {
  USD: 0.92,    // 1 USD → 0.92 EUR
  GBP: 1.17,    // 1 GBP → 1.17 EUR
  GBp: 0.0117,  // 1 pence → 0.0117 EUR
  CHF: 1.05,    // 1 CHF → 1.05 EUR
  JPY: 0.0062,  // 1 JPY → 0.0062 EUR
  CAD: 0.68,    // 1 CAD → 0.68 EUR
  EUR: 1.0,
};

/** Convertit un montant saisi en EUR vers la devise native de l'action */
function eurToNative(eur: number, nativeCurrency: string): number {
  const rate = RATE_TO_EUR[nativeCurrency] ?? 1;
  return rate === 1 ? eur : eur / rate;
}

function fmtEur(n: number, currency = "EUR"): string {
  const rate = RATE_TO_EUR[currency] ?? 1;
  const eur = n * rate;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(eur);
}
function fmt(n: number, currency = "EUR"): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
}
function fmtDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
function fmtShort(n: number) {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return n.toFixed(0);
}

/* ── Secteurs EN → FR ── */
const SECTOR_FR: Record<string, string> = {
  "Technology": "Technologie",
  "Healthcare": "Santé",
  "Health Care": "Santé",
  "Financial Services": "Services financiers",
  "Financials": "Finance",
  "Consumer Cyclical": "Consommation cyclique",
  "Consumer Discretionary": "Consommation discrétionnaire",
  "Consumer Defensive": "Consommation défensive",
  "Consumer Staples": "Produits de base",
  "Basic Materials": "Matières premières",
  "Materials": "Matériaux",
  "Industrials": "Industrie",
  "Energy": "Énergie",
  "Utilities": "Services aux collectivités",
  "Real Estate": "Immobilier",
  "Communication Services": "Télécommunications",
  "ETF": "ETF diversifié",
  "N/A": "—",
};
function sectorFr(s: string): string { return SECTOR_FR[s] ?? s; }

/* ── Signal badge ── */
const SIG_LABEL: Record<string, string> = {
  STRONG_BUY: "Achat fort", BUY: "Achat", HOLD: "Neutre",
  SELL: "À surveiller", STRONG_SELL: "Surévalué",
};
const SIG_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  STRONG_BUY: { bg: "#1F5C3E",             color: "#F6F2E8",            border: "#1F5C3E" },
  BUY:        { bg: "rgba(45,125,90,0.12)", color: "var(--signal-up)",   border: "rgba(45,125,90,0.30)" },
  HOLD:       { bg: "var(--paper-3)",       color: "var(--muted)",       border: "var(--line)" },
  SELL:       { bg: "rgba(176,125,0,0.10)", color: "#7A5A1F",            border: "rgba(176,125,0,0.30)" },
  STRONG_SELL:{ bg: "rgba(184,74,58,0.10)", color: "var(--signal-down)", border: "rgba(184,74,58,0.30)" },
};
function SignalBadge({ signal }: { signal: string }) {
  const s = SIG_STYLE[signal] ?? SIG_STYLE.HOLD;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 9999, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: "nowrap" }}>
      {(signal === "STRONG_BUY" || signal === "BUY") && <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.color, flexShrink: 0 }} />}
      {SIG_LABEL[signal] ?? signal}
    </span>
  );
}

/* ── Interfaces ── */
interface Holding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  avg_price: number;
  currency: string;
  asset_type: string;
}

interface EnrichedHolding extends Holding {
  currentPrice: number;
  pnl: number;
  pnlPct: number;
  marketValue: number;
  sector: string;
  signal?: string;
  sparkline?: number[];
  dividendYield?: number;
  dayChange?: number;       // variation du jour en €
  dayChangePct?: number;    // variation du jour en %
}

interface HistoryPoint { date: string; value: number; cost: number; }

interface PortfolioAnalysis {
  summary: string;
  globalScore: number;
  diversification: string;
  mainRisk: string;
  recommendations: { type: string; symbol: string; reason: string }[];
  missingExposures: string[];
  strengths: string[];
  disclaimer: string;
}

/* ── Assurance-Vie types ── */
type AVHoldingType = "fonds_euros" | "uc" | "scpi" | "structured";

interface AVHolding {
  id: string;
  type: AVHoldingType;
  name: string;
  quantity: number;
  pru: number;
}

interface AVContract {
  id: string;
  name: string;
  insurer: string;
  holdings: AVHolding[];
}

interface AVAnalysis {
  summary: string;
  allocationScore: number;
  fondsEurosPct: number;
  ucPct: number;
  mainRisk: string;
  recommendations: { type: string; target: string; reason: string }[];
  disclaimer: string;
}

/* ── AV helpers ── */
function avContractValue(contract: AVContract): number {
  return contract.holdings.reduce((s, h) => s + h.quantity * h.pru, 0);
}

function avTotalValue(contracts: AVContract[]): number {
  return contracts.reduce((s, c) => s + avContractValue(c), 0);
}

const AV_TYPE_LABEL: Record<AVHoldingType, string> = {
  fonds_euros: "Fonds Euros",
  uc: "Unité de Compte",
  scpi: "SCPI",
  structured: "Fonds Structuré",
};

const AV_TYPE_COLOR: Record<AVHoldingType, string> = {
  fonds_euros: "#2D7D5A",
  uc: "#C9A24E",
  scpi: "#5A7AB5",
  structured: "#8B5CF6",
};

/* ── Generate plausible sparkline ── */
function generateSparkline(pnlPct: number): number[] {
  const pts: number[] = [100];
  for (let i = 1; i < 12; i++) {
    const trend = pnlPct / 11;
    const noise = (Math.random() - 0.5) * Math.abs(pnlPct) * 0.3;
    pts.push(pts[i - 1] + trend + noise);
  }
  return pts;
}

/* ── Tiny inline sparkline ── */
function MiniSparkline({ data, up }: { data: number[]; up: boolean }) {
  if (!data || data.length < 2) return null;
  const w = 64, h = 28, pad = 2;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - min) / range) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const color = up ? "var(--signal-up)" : "var(--signal-down)";
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" aria-hidden="true">
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Signal styles ── */
const SIGNAL_LABELS: Record<string, string> = {
  STRONG_BUY: "Achat fort", BUY: "Achat", HOLD: "Neutre", SELL: "À surveiller", STRONG_SELL: "Surévalué",
};
const SIGNAL_COLORS: Record<string, { bg: string; color: string }> = {
  STRONG_BUY: { bg: "#1F5C3E",                    color: "#F6F2E8" },
  BUY:        { bg: "rgba(45,125,90,0.12)",        color: "var(--signal-up)" },
  HOLD:       { bg: "var(--paper-3)",              color: "var(--muted)" },
  SELL:       { bg: "rgba(176,125,0,0.10)",        color: "#7A5A1F" },
  STRONG_SELL:{ bg: "rgba(184,74,58,0.10)",        color: "var(--signal-down)" },
};

/* ── Chart/period constants ── */
const PERIODS = ["1d", "1wk", "1mo", "6mo", "1y", "max"] as const;
const PERIOD_LABELS: Record<string, string> = {
  "1d": "1J", "1wk": "1S", "1mo": "1M", "6mo": "6M", "1y": "1A", "max": "Tout",
};

const CHART_COLORS = [
  "#2d7d5a", "#4a9eff", "#b84a3a", "#8b7a5e", "#6b8f71",
  "#c17f3e", "#5b7fa8", "#a06b8f", "#7a9e6b", "#c09060",
];

const REC_COLORS: Record<string, string> = {
  RENFORCER: "var(--signal-up)", CONSERVER: "#8b7a5e",
  ALLÉGER: "#b84a3a", VENDRE: "var(--signal-down)",
};

/* ── Sector tab options ── */
const ALLOC_TABS = ["Secteur", "Actif", "Pays"] as const;

/* ── Détection géographique depuis le symbole et le nom ── */
function detectGeography(symbol: string, name: string, assetType: string): string {
  const sym = symbol.toUpperCase();
  const n   = (name || "").toLowerCase();
  if (assetType === "etf") {
    if (n.includes("world") || n.includes("monde") || n.includes("global") || n.includes("acwi") || n.includes("all world") || n.includes("all-world")) return "Mondial";
    if (n.includes("emerging") || n.includes("émergent") || n.includes("emergent")) return "Marchés émergents";
    if (n.includes("india") || n.includes("inde"))  return "Inde";
    if (n.includes("china") || n.includes("chine")) return "Chine";
    if (n.includes("japan") || n.includes("japon")) return "Japon";
    if (n.includes("asia") || n.includes("asie") || n.includes("pacific") || n.includes("pacifique")) return "Asie-Pacifique";
    if (n.includes("s&p 500") || n.includes("sp500") || n.includes("nasdaq") || n.includes("russell")) return "États-Unis";
    if (n.includes("europe") || n.includes("euro stoxx") || n.includes("stoxx")) return "Europe";
    if (n.includes("cac") || n.includes("france")) return "France";
    return "Mondial";
  }
  if (sym.endsWith(".PA") || sym.endsWith(".FR")) return "France";
  if (sym.endsWith(".DE") || sym.endsWith(".F") || sym.endsWith(".XETRA")) return "Allemagne";
  if (sym.endsWith(".AS") || sym.endsWith(".AMS")) return "Pays-Bas";
  if (sym.endsWith(".MI") || sym.endsWith(".IT"))  return "Italie";
  if (sym.endsWith(".MC") || sym.endsWith(".MAD")) return "Espagne";
  if (sym.endsWith(".L")  || sym.endsWith(".LON")) return "Royaume-Uni";
  if (sym.endsWith(".T")  || sym.endsWith(".TYO")) return "Japon";
  if (sym.endsWith(".HK"))  return "Hong Kong";
  if (sym.endsWith(".SS")  || sym.endsWith(".SZ")) return "Chine";
  if (sym.endsWith(".TO"))  return "Canada";
  if (sym.endsWith(".AX"))  return "Australie";
  if (sym.endsWith(".SW"))  return "Suisse";
  if (sym.endsWith(".BR"))  return "Belgique";
  if (sym.endsWith(".ST") || sym.endsWith(".LS") || sym.endsWith(".OL") || sym.endsWith(".HE") || sym.endsWith(".CO")) return "Europe du Nord";
  return "États-Unis";
}

/* ── Label lisible pour le type d'actif ── */
function assetLabel(t: string): string {
  if (t === "etf")    return "Fonds indiciels (ETF)";
  if (t === "crypto") return "Crypto-monnaies";
  return "Actions";
}

/* ── Logo color from symbol ── */
function symbolColor(sym: string): string {
  let hash = 0;
  for (let i = 0; i < sym.length; i++) hash = sym.charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 35%, 42%)`;
}

/* ── Donut chart ── */
function DonutChart({ data }: { data: { symbol: string; pct: number; color: string }[] }) {
  const size = 120;
  const r = 46;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  let cumulative = 0;
  const slices = data.map((d) => {
    const offset = circ * (1 - cumulative / 100);
    const dash = (d.pct / 100) * circ;
    cumulative += d.pct;
    return { ...d, offset, dash };
  });
  return (
    <svg width={size} height={size} style={{ display: "block", margin: "0 auto" }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="18" />
      {slices.map((s, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none"
          stroke={s.color} strokeWidth="18"
          strokeDasharray={`${s.dash} ${circ - s.dash}`}
          strokeDashoffset={s.offset}
          style={{ transform: "rotate(-90deg)", transformOrigin: `${cx}px ${cy}px`, transition: "stroke-dasharray 0.5s ease" }}
        />
      ))}
      <text x={cx} y={cy - 4} textAnchor="middle" style={{ fontSize: 11, fill: "rgba(255,255,255,0.45)" }}>Total</text>
      <text x={cx} y={cy + 12} textAnchor="middle" style={{ fontSize: 13, fontWeight: 700, fill: "#fff" }}>
        {data.length} pos.
      </text>
    </svg>
  );
}

/* ── Form styles ── */
const labelStyle: React.CSSProperties = { fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 5 };
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 12,
  background: "#fff", border: "1.5px solid var(--line)",
  color: "var(--ink)", fontSize: 14, outline: "none", boxSizing: "border-box",
};

/* ══════════════════════════════════════════════════════════════════════════
   PAGE COMPONENT
══════════════════════════════════════════════════════════════════════════ */
export default function PortfolioPage() {
  const isMobile = useMobile();
  /* ── State ── */
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [enriched, setEnriched] = useState<EnrichedHolding[]>([]);
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);

  // ── Vérifier un investissement ──
  const [checkQuery, setCheckQuery]       = useState("");
  const [checkResults, setCheckResults]   = useState<{symbol:string;name:string;exchange:string}[]>([]);
  const [checkSearching, setCheckSearching] = useState(false);
  const [checkSelected, setCheckSelected] = useState<{symbol:string;name:string}|null>(null);
  const [checkLoading, setCheckLoading]   = useState(false);
  const [checkResult, setCheckResult]     = useState<{analysis:Record<string,unknown>;stock:Record<string,unknown>}|null>(null);
  const [checkError, setCheckError]       = useState<string|null>(null);

  const [totals, setTotals] = useState({ value: 0, cost: 0, pnl: 0 });
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [period, setPeriod] = useState<typeof PERIODS[number]>("1mo");
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [allocTab, setAllocTab] = useState<typeof ALLOC_TABS[number]>("Secteur");

  /* Add form */
  const [addSymbol, setAddSymbol] = useState("");
  const [addName, setAddName] = useState("");
  const [addQty, setAddQty] = useState("");
  const [addPRU, setAddPRU] = useState("");
  const [addCurrency, setAddCurrency] = useState("USD");
  const [addType, setAddType] = useState("stock");
  const [addLoading, setAddLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  // Search-by-name state
  const [addQuery, setAddQuery]         = useState("");
  const [addResults, setAddResults]     = useState<{symbol:string;name:string;exchange:string}[]>([]);
  const [addSearching, setAddSearching] = useState(false);
  const [addStep, setAddStep]           = useState<"search"|"details">("search");

  /* ── Toggle vue ── */
  const [activeView, setActiveView] = useState<"patrimoine" | "boursier" | "av">("patrimoine");

  /* ── Assurance-vie ── */
  const [avContracts, setAvContracts] = useState<AVContract[]>([]);
  const [avAnalysis, setAvAnalysis] = useState<AVAnalysis | null>(null);
  const [avAnalyzing, setAvAnalyzing] = useState(false);
  const [avAnalysisError, setAvAnalysisError] = useState<string | null>(null);

  // Modal ajout contrat
  const [showAddContract, setShowAddContract] = useState(false);
  const [newContractName, setNewContractName] = useState("");
  const [newContractInsurer, setNewContractInsurer] = useState("");

  // Modal ajout ligne dans un contrat
  const [showAddHolding, setShowAddHolding] = useState<string | null>(null);
  const [addHType, setAddHType] = useState<AVHoldingType>("fonds_euros");
  const [addHName, setAddHName] = useState("");
  const [addHQty, setAddHQty] = useState("");
  const [addHPRU, setAddHPRU] = useState("");

  /* ── Data loading ── */
  const loadHoldings = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/portfolio");
    const data = await res.json();
    setHoldings(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  /* ── AV user email for localStorage ── */
  const [avUserEmail, setAvUserEmail] = useState<string | null>(null);

  useEffect(() => {
    loadHoldings();
    // Récupérer l'email utilisateur pour la clé localStorage AV
    const supabase = createClient();
    supabase.auth.getUser().then((resp: { data: { user: { email?: string } | null } }) => {
      if (resp.data?.user?.email) {
        setAvUserEmail(resp.data.user.email);
        try {
          const key = `finazen_av_${btoa(resp.data.user.email)}`;
          const saved = localStorage.getItem(key);
          if (saved) setAvContracts(JSON.parse(saved) as AVContract[]);
        } catch { /* ignore */ }
      }
    }).catch(() => {});
  }, [loadHoldings]);

  // Sauvegarder les contrats AV à chaque modification
  useEffect(() => {
    if (!avUserEmail) return;
    const key = `finazen_av_${btoa(avUserEmail)}`;
    localStorage.setItem(key, JSON.stringify(avContracts));
  }, [avContracts, avUserEmail]);

  /* Enrich with current prices */
  useEffect(() => {
    if (!holdings.length) { setEnriched([]); setTotals({ value: 0, cost: 0, pnl: 0 }); return; }
    Promise.allSettled(
      holdings.map(async (h) => {
        const res = await fetch(`/api/stock/${h.symbol}`);
        if (!res.ok) return {
          ...h, currentPrice: h.avg_price, pnl: 0, pnlPct: 0,
          marketValue: h.avg_price * h.quantity, sector: "N/A",
        };
        const d = await res.json();
        const cp = d.currentPrice ?? h.avg_price;
        const signal = d.valuation?.signal ?? undefined;
        const pnlPct = ((cp - h.avg_price) / h.avg_price) * 100;
        const sparkline = generateSparkline(pnlPct);
        const dividendYield = d.dividendYield ?? 0;
        const dayChangePct = d.changePercent ?? 0;           // % variation du jour
        const dayChange    = cp * h.quantity * dayChangePct;  // € variation du jour
        return {
          ...h, currentPrice: cp,
          pnl: (cp - h.avg_price) * h.quantity,
          pnlPct, marketValue: cp * h.quantity,
          sector: d.sector ?? "N/A", signal, sparkline, dividendYield,
          dayChange, dayChangePct,
        };
      })
    ).then((results) => {
      const ok = results
        .filter((r): r is PromiseFulfilledResult<EnrichedHolding> => r.status === "fulfilled")
        .map((r) => r.value);
      setEnriched(ok);
      setTotals({
        value: ok.reduce((s, p) => s + p.marketValue, 0),
        cost:  ok.reduce((s, p) => s + p.avg_price * p.quantity, 0),
        pnl:   ok.reduce((s, p) => s + p.pnl, 0),
      });
    });
  }, [holdings]);

  /* Load history chart */
  const loadHistory = useCallback(async (p: string) => {
    if (!holdings.length) return;
    setHistoryLoading(true);
    const res = await fetch("/api/portfolio/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        holdings: holdings.map((h) => ({
          symbol: h.symbol, quantity: h.quantity, avg_price: h.avg_price,
        })),
        period: p,
      }),
    });
    const data = await res.json();
    setHistory(Array.isArray(data) ? data : []);
    setHistoryLoading(false);
  }, [holdings]);

  useEffect(() => {
    if (holdings.length) loadHistory(period);
  }, [holdings, period, loadHistory]);

  /* Symbol resolver */
  const resolveSymbol = async (sym: string) => {
    if (!sym || sym.length < 1) return;
    setResolving(true);
    setResolveError(null);
    try {
      const res = await fetch(`/api/stock/${sym.toUpperCase()}`);
      if (!res.ok) { setResolveError("Symbole introuvable"); setResolving(false); return; }
      const d = await res.json();
      if (d.name) setAddName(d.name);
      if (d.currency) setAddCurrency(d.currency);
      if (d.quoteType) {
        const qt = String(d.quoteType).toUpperCase();
        if (qt === "ETF" || qt === "MUTUALFUND") setAddType("etf");
        else setAddType("stock");
      }
    } catch { setResolveError("Erreur de résolution"); }
    setResolving(false);
  };

  /* Add / delete / analyze */
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addSymbol || !addQty || !addPRU) return;
    setAddLoading(true);
    // L'utilisateur saisit toujours en EUR — on convertit vers la devise native avant de sauvegarder
    const pruEur = parseFloat(addPRU);
    const pruNative = eurToNative(pruEur, addCurrency);
    await fetch("/api/portfolio", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol: addSymbol.toUpperCase(), name: addName || addSymbol.toUpperCase(),
        quantity: parseFloat(addQty), avg_price: pruNative,
        currency: addCurrency, asset_type: addType,
      }),
    });
    setShowAdd(false);
    setAddSymbol(""); setAddName(""); setAddQty(""); setAddPRU("");
    setAddType("stock"); setAddCurrency("USD"); setResolveError(null);
    setAddStep("search"); setAddQuery("");
    setAddLoading(false); setAnalysis(null);
    loadHoldings();
  };

  const handleDelete = async (id: string) => {
    await fetch("/api/portfolio", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setAnalysis(null); loadHoldings();
  };

  const handleAnalyze = async () => {
    if (!enriched.length) return;
    setAnalyzing(true);
    const res = await fetch("/api/portfolio/analyze", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ holdings: enriched }),
    });
    const data = await res.json();
    if (data.analysis) setAnalysis(data.analysis);
    setAnalyzing(false);
  };

  /* ── Derived values ── */
  const totalPct = totals.cost > 0 ? (totals.pnl / totals.cost) * 100 : 0;
  const isUp = totals.pnl >= 0;

  const chartPerf = history.length >= 2
    ? ((history[history.length - 1].value - history[0].value) / history[0].value) * 100
    : null;
  const chartPerfUp = chartPerf == null || chartPerf >= 0;

  /* Annualized return (CAGR) — requires >= 2 history points */
  let annualizedReturn: number | null = null;
  let historyYears = 0;
  let livretAReturn: number | null = null; // Livret A sur la même période
  const LIVRET_A_RATE = 0.024; // 2.4 % / an (taux en vigueur)

  if (history.length >= 2) {
    const first = history[0];
    const last  = history[history.length - 1];
    historyYears = (new Date(last.date).getTime() - new Date(first.date).getTime()) / (365.25 * 24 * 3600 * 1000);
    if (historyYears > 0 && first.value > 0) {
      annualizedReturn = (Math.pow(last.value / first.value, 1 / historyYears) - 1) * 100;
      // Livret A sur la même période (taux journalier composé)
      livretAReturn = (Math.pow(1 + LIVRET_A_RATE, historyYears) - 1) * 100;
    }
  }

  /* Sector allocation */
  const totalVal = enriched.reduce((s, h) => s + h.marketValue, 0);
  const buildAllocData = (tab: typeof ALLOC_TABS[number]) => {
    const groupFn = (h: EnrichedHolding) => {
      if (tab === "Secteur") {
        if (h.asset_type === "etf") return "Fonds indiciel (ETF)";
        const s = h.sector;
        if (!s || s === "N/A" || s === "Unknown" || s === "unknown") return "Action";
        return sectorFr(s);
      }
      if (tab === "Actif") return assetLabel(h.asset_type || "stock");
      if (tab === "Pays")  return detectGeography(h.symbol, h.name, h.asset_type);
      return "Autre";
    };
    const map = enriched.reduce<Record<string, number>>((acc, h) => {
      const k = groupFn(h);
      acc[k] = (acc[k] ?? 0) + h.marketValue;
      return acc;
    }, {});
    return Object.entries(map)
      .map(([name, value], i) => ({
        symbol: name, name,
        pct: totalVal > 0 ? (value / totalVal) * 100 : 0,
        color: CHART_COLORS[i % CHART_COLORS.length],
        value, currency: "EUR",
      }))
      .sort((a, b) => b.pct - a.pct);
  };
  const allocData = buildAllocData(allocTab);

  /* Today's change (last vs second-to-last history point if 1d period) */
  /* Domaine Y zoomé sur les vraies valeurs — évite l'axe plat en partant de 0 */
  const chartYDomain = (() => {
    if (history.length < 2) return ["auto", "auto"] as [string, string];
    const vals   = history.map(p => p.value);
    const minVal = Math.min(...vals);
    const maxVal = Math.max(...vals);
    const padding = (maxVal - minVal) * 0.25 || maxVal * 0.05;
    return [Math.floor((minVal - padding) / 100) * 100, Math.ceil((maxVal + padding) / 100) * 100] as [number, number];
  })();

  const todayChange = history.length >= 2
    ? history[history.length - 1].value - history[history.length - 2].value
    : null;
  const todayChangePct = todayChange != null && history[history.length - 2]?.value > 0
    ? (todayChange / history[history.length - 2].value) * 100
    : null;

  /* Unique sector count for insight */
  const uniqueSectors = new Set(enriched.map(h => h.sector).filter(s => s && s !== "N/A")).size;

  /* Diversification score heuristic */
  const divScore = Math.min(100, Math.round((uniqueSectors / Math.max(1, enriched.length)) * 60 + enriched.length * 3));

  /* CAC 40 reference flat line for chart */
  const cac40Flat = history.length > 0 ? history[0].value : null;

  /* Dividendes */
  const dividendHoldings = enriched.filter(h => (h.dividendYield ?? 0) > 0);
  // Dividende annuel estimé = marketValue × dividendYield (décimal, ex: 0.018 = 1,8%)
  const totalAnnualDividend = dividendHoldings.reduce(
    (sum, h) => sum + (h.marketValue * (h.dividendYield ?? 0)), 0
  );
  // Dividende attendu d'ici fin d'année (prorata mois restants)
  const monthsLeft = 12 - new Date().getMonth(); // mois restants dans l'année
  const dividendToReceive = (totalAnnualDividend / 12) * monthsLeft;

  /* ══════════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>

      {/* ── Breadcrumb ── */}
      <div style={{
        fontFamily: "var(--font-geist-mono, monospace)", fontSize: 11,
        color: "var(--muted)", letterSpacing: "0.10em", textTransform: "uppercase",
        marginBottom: 18,
      }}>
        <Link href="/" style={{ color: "var(--muted)", textDecoration: "none" }}>Finazen</Link>
        {" / "}
        <span style={{ color: "var(--ink)" }}>MON PORTEFEUILLE</span>
      </div>

      {/* ── Toggle Vue ── */}
      <div style={{ display: "flex", background: "var(--paper-2)", border: "1.5px solid var(--line)", borderRadius: 9999, padding: 4, gap: 2, marginBottom: 28, width: "fit-content" }}>
        {([
          ["patrimoine", "Vue patrimoniale"],
          ["boursier", "PEA / CTO"],
          ["av", "Assurance-Vie"],
        ] as const).map(([key, label]) => (
          <button key={key} onClick={() => setActiveView(key)}
            style={{
              padding: "8px 18px", borderRadius: 9999, border: "none", fontSize: 13,
              fontWeight: activeView === key ? 700 : 500,
              background: activeView === key ? "var(--ink)" : "transparent",
              color: activeView === key ? "var(--paper)" : "var(--muted)",
              cursor: "pointer", whiteSpace: "nowrap",
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Vue Patrimoniale ── */}
      {activeView === "patrimoine" && (
        <div>
          {/* KPI cards */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
            {/* Valeur totale */}
            <div style={{ background: "linear-gradient(135deg, rgba(45,125,90,0.10) 0%, var(--paper-2) 70%)", border: "1.5px solid var(--line)", borderRadius: 18, padding: "24px 26px" }}>
              <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.10em", fontFamily: "var(--font-geist-mono, monospace)", marginBottom: 8, textTransform: "uppercase" }}>PATRIMOINE TOTAL</div>
              <div style={{ fontSize: 42, color: "var(--accent)", fontFamily: "var(--font-instrument, 'Instrument Serif', serif)", fontWeight: 400, lineHeight: 1, letterSpacing: "-0.02em", marginBottom: 6 }}>
                {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(totals.value + avTotalValue(avContracts))}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)" }}>PEA/CTO + Assurance-Vie</div>
            </div>
            {/* PEA/CTO */}
            <div style={{ background: "var(--paper-2)", border: "1.5px solid var(--line)", borderRadius: 18, padding: "24px 26px" }}>
              <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.10em", fontFamily: "var(--font-geist-mono, monospace)", marginBottom: 8, textTransform: "uppercase" }}>PEA / CTO</div>
              <div style={{ fontSize: 36, fontFamily: "var(--font-instrument, 'Instrument Serif', serif)", fontWeight: 400, lineHeight: 1, marginBottom: 6, color: "var(--ink)" }}>
                {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(totals.value)}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)" }}>
                {enriched.length} position{enriched.length !== 1 ? "s" : ""}
                {(totals.value + avTotalValue(avContracts)) > 0 && ` · ${((totals.value / (totals.value + avTotalValue(avContracts))) * 100).toFixed(1)} % du patrimoine`}
              </div>
            </div>
            {/* Assurance-Vie */}
            <div style={{ background: "var(--paper-2)", border: "1.5px solid var(--line)", borderRadius: 18, padding: "24px 26px" }}>
              <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.10em", fontFamily: "var(--font-geist-mono, monospace)", marginBottom: 8, textTransform: "uppercase" }}>ASSURANCE-VIE</div>
              <div style={{ fontSize: 36, fontFamily: "var(--font-instrument, 'Instrument Serif', serif)", fontWeight: 400, lineHeight: 1, marginBottom: 6, color: "var(--ink)" }}>
                {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(avTotalValue(avContracts))}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)" }}>
                {avContracts.length} contrat{avContracts.length !== 1 ? "s" : ""}
                {(totals.value + avTotalValue(avContracts)) > 0 && ` · ${((avTotalValue(avContracts) / (totals.value + avTotalValue(avContracts))) * 100).toFixed(1)} % du patrimoine`}
              </div>
            </div>
          </div>

          {/* Répartition enveloppes */}
          {(totals.value + avTotalValue(avContracts)) > 0 && (
            <div style={{ background: "var(--paper-2)", border: "1.5px solid var(--line)", borderRadius: 18, padding: "22px 26px", marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginBottom: 16, fontFamily: "var(--font-instrument, serif)" }}>Répartition des enveloppes</div>
              {[
                { label: "PEA / CTO", value: totals.value, color: "#2D7D5A" },
                { label: "Assurance-Vie", value: avTotalValue(avContracts), color: "#C9A24E" },
              ].map(env => {
                const total = totals.value + avTotalValue(avContracts);
                const pct = total > 0 ? (env.value / total) * 100 : 0;
                return (
                  <div key={env.label} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: env.color }} />
                        <span style={{ fontSize: 13, color: "var(--ink)" }}>{env.label}</span>
                      </div>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <span style={{ fontSize: 12, fontFamily: "var(--font-geist-mono, monospace)", color: "var(--ink)", fontWeight: 700 }}>
                          {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(env.value)}
                        </span>
                        <span style={{ fontSize: 11, fontFamily: "var(--font-geist-mono, monospace)", color: "var(--muted)" }}>{pct.toFixed(1)} %</span>
                      </div>
                    </div>
                    <div style={{ height: 6, background: "var(--line)", borderRadius: 9999, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: env.color, borderRadius: 9999, transition: "width 0.7s cubic-bezier(0.22,1,0.36,1)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bouton navigation */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button onClick={() => setActiveView("boursier")} style={{ padding: "12px 24px", borderRadius: 9999, border: "1.5px solid var(--line)", background: "transparent", color: "var(--ink)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              Voir mon PEA / CTO →
            </button>
            <button onClick={() => setActiveView("av")} style={{ padding: "12px 24px", borderRadius: 9999, border: "none", background: "var(--accent)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              Gérer mon Assurance-Vie →
            </button>
          </div>
        </div>
      )}

      {/* ── Vue PEA/CTO ── */}
      {activeView === "boursier" && (<>

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "flex-start",
        justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 32,
      }}>
        <div>
          <h1 style={{
            fontSize: 48, fontWeight: 400, letterSpacing: "-0.02em",
            fontFamily: "var(--font-instrument, 'Instrument Serif', serif)",
            color: "var(--ink)", marginBottom: 8, lineHeight: 1.1,
          }}>
            Mon{" "}
            <em style={{ fontStyle: "italic", color: "var(--accent)" }}>portefeuille</em>.
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)" }}>
            {holdings.length} ligne{holdings.length !== 1 ? "s" : ""} — positions diversifiées
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 9999,
            border: "1.5px solid var(--line)",
            background: "transparent", color: "var(--ink)",
            fontSize: 14, fontWeight: 500, cursor: "pointer",
          }}>
            <Download size={14} />Rapport mensuel
          </button>
          <button onClick={() => setShowAdd(true)} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 9999,
            border: "none", background: "var(--accent)",
            color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>
            <Plus size={14} />Ajouter une transaction
          </button>
        </div>
      </div>

      {/* ── KPI strip ── */}
      {enriched.length > 0 && (
        <div className="kpi-strip" style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          background: "var(--paper-2)", border: "1.5px solid var(--line)",
          borderRadius: 18, overflow: "hidden", marginBottom: 28,
        }}>
          {/* Cell 1 — Valeur totale (green gradient) */}
          <div style={{
            padding: "24px 26px",
            borderRight: "1px solid var(--line)",
            background: "linear-gradient(135deg, rgba(45,125,90,0.10) 0%, transparent 70%)",
          }}>
            <div style={{
              fontSize: 10, color: "var(--muted)", letterSpacing: "0.10em",
              fontFamily: "var(--font-geist-mono, monospace)", marginBottom: 8,
              textTransform: "uppercase",
            }}>VALEUR TOTALE</div>
            <div style={{
              fontSize: 52, color: "var(--accent)",
              fontFamily: "var(--font-instrument, 'Instrument Serif', serif)",
              fontWeight: 400, lineHeight: 1, letterSpacing: "-0.02em", marginBottom: 8,
            }}>
              {fmtEur(totals.value, "EUR")}
            </div>
            {todayChange != null && todayChangePct != null ? (
              <div style={{
                fontSize: 12, color: todayChange >= 0 ? "var(--signal-up)" : "var(--signal-down)",
                fontFamily: "var(--font-geist-mono, monospace)",
              }}>
                {todayChange >= 0 ? "▲" : "▼"} {todayChange >= 0 ? "+" : ""}{fmtEur(Math.abs(todayChange))} · {todayChangePct >= 0 ? "+" : ""}{todayChangePct.toFixed(2)} % aujourd'hui
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)" }}>— aujourd'hui</div>
            )}
          </div>

          {/* Cell 2 — Gain total */}
          <div style={{ padding: "24px 26px", borderRight: "1px solid var(--line)" }}>
            <div style={{
              fontSize: 10, color: "var(--muted)", letterSpacing: "0.10em",
              fontFamily: "var(--font-geist-mono, monospace)", marginBottom: 8, textTransform: "uppercase",
            }}>GAIN TOTAL</div>
            <div style={{
              fontSize: 36, fontFamily: "var(--font-instrument, 'Instrument Serif', serif)",
              fontWeight: 400, lineHeight: 1, marginBottom: 8,
              color: isUp ? "var(--signal-up)" : "var(--signal-down)",
            }}>
              {isUp ? "+" : ""}{fmtEur(totals.pnl)}
            </div>
            <div style={{
              fontSize: 12, color: isUp ? "var(--signal-up)" : "var(--signal-down)",
              fontFamily: "var(--font-geist-mono, monospace)",
            }}>
              {isUp ? "+" : ""}{totalPct.toFixed(2)} % depuis l'ouverture
            </div>
          </div>

          {/* Cell 3 — Annualisé */}
          <div style={{ padding: "24px 26px", borderRight: "1px solid var(--line)" }}>
            <div style={{
              fontSize: 10, color: "var(--muted)", letterSpacing: "0.10em",
              fontFamily: "var(--font-geist-mono, monospace)", marginBottom: 8, textTransform: "uppercase",
            }}>
              {historyYears > 0 && historyYears < 1 ? "PERF. CUMULÉE" : "ANNUALISÉ"}
            </div>
            <div style={{
              fontSize: 36, fontFamily: "var(--font-instrument, 'Instrument Serif', serif)",
              fontWeight: 400, lineHeight: 1, marginBottom: 4,
              color: annualizedReturn == null ? "var(--ink)" : annualizedReturn >= 0 ? "var(--signal-up)" : "var(--signal-down)",
            }}>
              {annualizedReturn != null
                ? `${annualizedReturn >= 0 ? "+" : ""}${annualizedReturn.toFixed(1)} %`
                : `${isUp ? "+" : ""}${totalPct.toFixed(1)} %`}
            </div>
            {/* Sous-titre : performance brute sur la période + jours */}
            {historyYears > 0 && historyYears < 1 && chartPerf != null && (
              <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 6, fontStyle: "italic" }}>
                ≈ {chartPerf >= 0 ? "+" : ""}{chartPerf.toFixed(1)} % brut sur {Math.round(historyYears * 365)} j
              </div>
            )}
            {/* Comparaison Livret A — montre CLAIREMENT l'avantage */}
            {livretAReturn != null && chartPerf != null ? (() => {
              const advantage = chartPerf - livretAReturn;
              const ratioX    = livretAReturn > 0 ? chartPerf / livretAReturn : null;
              return (
                <div style={{ fontSize: 11, lineHeight: 1.5 }}>
                  <div style={{ color: advantage >= 0 ? "var(--signal-up)" : "var(--signal-down)", fontWeight: 600 }}>
                    {advantage >= 0 ? "+" : ""}{advantage.toFixed(1)} % de plus que le Livret A
                  </div>
                  <div style={{ color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)", fontSize: 10 }}>
                    Livret A sur la période : +{livretAReturn.toFixed(2)} %
                    {ratioX != null && ratioX > 1 && ` · ×${ratioX.toFixed(0)} fois plus`}
                  </div>
                </div>
              );
            })() : (
              <div style={{ fontSize: 11, color: "var(--muted)" }}>vs Livret A 2,4 %/an</div>
            )}
          </div>

          {/* Cell 4 — Dividendes */}
          <div style={{ padding: "24px 26px" }}>
            <div style={{
              fontSize: 10, color: "var(--muted)", letterSpacing: "0.10em",
              fontFamily: "var(--font-geist-mono, monospace)", marginBottom: 8, textTransform: "uppercase",
            }}>DIVIDENDES ESTIMÉS / AN</div>
            <div style={{
              fontSize: 36, fontFamily: "var(--font-instrument, 'Instrument Serif', serif)",
              fontWeight: 400, lineHeight: 1, marginBottom: 8,
              color: totalAnnualDividend > 0 ? "var(--signal-up)" : "var(--ink)",
            }}>
              {totalAnnualDividend > 0 ? fmtEur(totalAnnualDividend) : "—"}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)" }}>
              {totalAnnualDividend > 0
                ? `≈ ${fmtEur(dividendToReceive)} d'ici fin ${new Date().getFullYear()}`
                : "Aucune action à dividende"
              }
            </div>
          </div>
        </div>
      )}

      {/* ── Charts row ── */}
      {enriched.length > 0 && (
        <div className="chart-row" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)", gap: 20, marginBottom: 28 }}>

          {/* Left — Performance card */}
          <div style={{
            background: "var(--paper-2)", border: "1.5px solid var(--line)",
            borderRadius: 16, padding: 24,
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  fontSize: 16, fontWeight: 600, color: "var(--ink)",
                  fontFamily: "var(--font-instrument, 'Instrument Serif', serif)",
                }}>Performance</span>
                {annualizedReturn != null && (
                  <span style={{
                    padding: "3px 10px", borderRadius: 9999,
                    background: annualizedReturn >= 0 ? "rgba(45,125,90,0.12)" : "rgba(184,74,58,0.10)",
                    color: annualizedReturn >= 0 ? "var(--signal-up)" : "var(--signal-down)",
                    fontSize: 12, fontWeight: 600,
                    fontFamily: "var(--font-geist-mono, monospace)",
                  }}>
                    {annualizedReturn >= 0 ? "+" : ""}{annualizedReturn.toFixed(1)} % annualisé
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {PERIODS.map((p) => (
                  <button key={p} onClick={() => setPeriod(p)} style={{
                    padding: "5px 10px", borderRadius: 9999, fontSize: 12, fontWeight: 600,
                    border: "none",
                    background: period === p ? "var(--ink)" : "transparent",
                    color: period === p ? "var(--paper)" : "var(--muted)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}>{PERIOD_LABELS[p]}</button>
                ))}
              </div>
            </div>

            {historyLoading ? (
              <div className="skeleton" style={{ height: 200, borderRadius: 8 }} />
            ) : history.length > 1 ? (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={history} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="valueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartPerfUp ? "var(--signal-up)" : "var(--signal-down)"} stopOpacity={0.18} />
                        <stop offset="95%" stopColor={chartPerfUp ? "var(--signal-up)" : "var(--signal-down)"} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={fmtDate}
                      tick={{ fontSize: 10, fill: "var(--muted)" }}
                      axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis
                      domain={chartYDomain}
                      tickFormatter={(v) => fmtShort(v)}
                      tick={{ fontSize: 10, fill: "var(--muted)" }}
                      axisLine={false} tickLine={false} width={48}
                      tickCount={5}
                    />
                    <Tooltip
                      contentStyle={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: "var(--muted)", marginBottom: 4 }}
                      labelFormatter={(label: unknown) => fmtDate(String(label))}
                      formatter={(value: unknown, name: unknown) => [
                        `${fmtShort(Number(value))} €`,
                        name === "value" ? "Mon portefeuille" : "Coût",
                      ]}
                    />
                    {cac40Flat != null && (
                      <ReferenceLine
                        y={cac40Flat}
                        stroke="#9CA3AF"
                        strokeDasharray="6 3"
                        strokeWidth={1.5}
                      />
                    )}
                    <Area type="monotone" dataKey="value"
                      stroke={chartPerfUp ? "var(--signal-up)" : "var(--signal-down)"}
                      strokeWidth={2} fill="url(#valueGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div style={{ display: "flex", gap: 20, marginTop: 12, fontSize: 12, color: "var(--muted)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 20, height: 2, background: "var(--signal-up)", borderRadius: 1 }} />
                    <span>Mon portefeuille</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{
                      width: 20, height: 2, borderTop: "2px dashed #9CA3AF",
                      background: "transparent",
                    }} />
                    <span>CAC 40 (référence)</span>
                  </div>
                </div>
              </>
            ) : (
              <div style={{
                height: 200, display: "flex", alignItems: "center",
                justifyContent: "center", color: "var(--muted)", fontSize: 13,
              }}>
                Données insuffisantes pour la période sélectionnée
              </div>
            )}
          </div>

          {/* Right — Répartition card */}
          <div style={{ background: "var(--paper-2)", border: "1.5px solid var(--line)", borderRadius: 16, padding: isMobile ? 14 : 22, minWidth: 0 }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-instrument, serif)" }}>Répartition</span>
              <div style={{ display: "flex", background: "var(--paper-3)", border: "1px solid var(--line)", borderRadius: 9999, padding: 3, gap: 2 }}>
                {ALLOC_TABS.map((tab) => (
                  <button key={tab} onClick={() => setAllocTab(tab)} style={{
                    padding: "4px 11px", borderRadius: 9999, fontSize: 11, fontWeight: 600,
                    border: "none", cursor: "pointer", transition: "all 0.15s",
                    background: allocTab === tab ? "var(--ink)" : "transparent",
                    color: allocTab === tab ? "var(--paper)" : "var(--muted)",
                  }}>{tab}</button>
                ))}
              </div>
            </div>

            {/* Donut + légende */}
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 16 }}>
              {/* Donut SVG épuré */}
              <div style={{ flexShrink: 0 }}>
                {(() => {
                  const size = 130;
                  const r = 48;
                  const sw = 16;
                  const cx = size / 2;
                  const cy = size / 2;
                  const circ = 2 * Math.PI * r;
                  let cumOffset = 0;
                  const slices = allocData.slice(0, 6);
                  return (
                    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                      {/* Track */}
                      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--line)" strokeWidth={sw} />
                      {/* Segments */}
                      {slices.map((d, i) => {
                        const dash = (d.pct / 100) * circ;
                        const rotation = (cumOffset / 100) * 360 - 90;
                        cumOffset += d.pct;
                        return (
                          <circle key={i} cx={cx} cy={cy} r={r}
                            fill="none" stroke={d.color} strokeWidth={sw}
                            strokeDasharray={`${dash} ${circ - dash}`}
                            transform={`rotate(${rotation} ${cx} ${cy})`}
                            strokeLinecap="butt"
                            style={{ transition: "stroke-dasharray 0.6s ease" }}
                          />
                        );
                      })}
                      {/* Centre blanc */}
                      <circle cx={cx} cy={cy} r={r - sw / 2 - 2} fill="var(--paper-2)" />
                      {/* Texte centre */}
                      <text x={cx} y={cy - 7} textAnchor="middle" fontSize={9} fill="var(--muted)" fontFamily="var(--font-geist-mono, monospace)" style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>TOTAL</text>
                      <text x={cx} y={cy + 8} textAnchor="middle" fontSize={11} fontWeight="700" fill="var(--ink)" fontFamily="var(--font-geist-mono, monospace)">{fmtEur(totalVal, "EUR").replace(" €", "")}</text>
                      <text x={cx} y={cy + 20} textAnchor="middle" fontSize={9} fill="var(--muted)" fontFamily="var(--font-geist-mono, monospace)">€</text>
                    </svg>
                  );
                })()}
              </div>

              {/* Légende */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 9, minWidth: 0 }}>
                {allocData.slice(0, 6).map((a, i) => (
                  <div key={a.symbol || i}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: a.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={a.name}>{a.name}</span>
                      </div>
                      <span style={{ fontSize: 11, fontFamily: "var(--font-geist-mono, monospace)", color: "var(--muted)", fontWeight: 700, flexShrink: 0, marginLeft: 6 }}>
                        {a.pct.toFixed(1)} %
                      </span>
                    </div>
                    <div style={{ height: 3, background: "var(--line)", borderRadius: 9999, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(a.pct, 100)}%`, background: a.color, borderRadius: 9999, transition: "width 0.7s cubic-bezier(0.22,1,0.36,1)" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{ paddingTop: 12, borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {allocData.length} catégorie{allocData.length !== 1 ? "s" : ""}
              </span>
              <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)" }}>
                {enriched.length} position{enriched.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Holdings table ── */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 68, borderRadius: 12 }} />)}
        </div>
      ) : holdings.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 24px", border: "1.5px dashed var(--line)", borderRadius: 20 }}>
          <TrendingUp size={48} style={{ color: "var(--muted)", marginBottom: 16 }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: "var(--ink)" }}>Portefeuille vide</h2>
          <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24 }}>
            Ajoutez vos premières positions pour suivre vos performances.
          </p>
          <button onClick={() => setShowAdd(true)} style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "12px 28px", borderRadius: 9999, border: "none",
            background: "var(--accent)", color: "#fff",
            fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>
            <Plus size={15} />Ajouter une position
          </button>
        </div>
      ) : (
        <div>

          {/* ── Table pleine largeur ── */}
          <div style={{ minWidth: 0 }}>
            {/* Table header */}
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between", marginBottom: 16,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>Lignes du portefeuille</span>
                <span style={{
                  padding: "3px 10px", borderRadius: 9999, fontSize: 12,
                  background: "var(--paper-3)", color: "var(--muted)",
                  fontFamily: "var(--font-geist-mono, monospace)",
                }}>{enriched.length} positions</span>
              </div>
              <span style={{ padding: "5px 14px", borderRadius: 9999, fontSize: 11, fontWeight: 600, background: "var(--ink)", color: "var(--paper)", border: "1px solid var(--ink)" }}>
                Trié par valeur
              </span>
            </div>

            {isMobile ? (
              /* ── Mobile card list ── */
              <div style={{ background: "var(--paper-2)", border: "1.5px solid var(--line)", borderRadius: 16, overflow: "hidden", marginBottom: 24 }}>
                {enriched.map((h, i) => {
                  const isPos = h.pnl >= 0;
                  const sig = h.signal as string | undefined;
                  const weight = totalVal > 0 ? (h.marketValue / totalVal) * 100 : 0;
                  const sectorLabel = (() => {
                    const raw = h.sector;
                    if (h.asset_type === "etf") return "Fonds indiciel (ETF)";
                    if (!raw || raw === "N/A" || raw === "Unknown" || raw === "unknown") return "Action";
                    return sectorFr(raw);
                  })();
                  return (
                    <div key={h.id}
                      onClick={() => window.location.href = `/stock/${h.symbol}`}
                      style={{ padding: "14px 16px", borderBottom: i < enriched.length - 1 ? "1px solid var(--line)" : "none", cursor: "pointer" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <CompanyLogo symbol={h.symbol} name={h.name} size={40} radius={10} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name || h.symbol}</div>
                          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{sectorLabel}</div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-geist-mono, monospace)", color: "var(--ink)" }}>{fmtEur(h.marketValue, h.currency)}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {/* Variation du jour */}
                            {h.dayChangePct !== undefined && (
                              <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--font-geist-mono, monospace)", color: (h.dayChangePct ?? 0) >= 0 ? "var(--signal-up)" : "var(--signal-down)", background: (h.dayChangePct ?? 0) >= 0 ? "rgba(45,125,90,0.08)" : "rgba(184,74,58,0.08)", padding: "2px 6px", borderRadius: 4 }}>
                                {(h.dayChangePct ?? 0) >= 0 ? "▲" : "▼"} {Math.abs((h.dayChangePct ?? 0) * 100).toFixed(2)} %
                              </span>
                            )}
                            <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "var(--font-geist-mono, monospace)", color: isPos ? "var(--signal-up)" : "var(--signal-down)" }}>
                              {isPos ? "+" : ""}{h.pnlPct.toFixed(1)} %
                            </span>
                            {sig && <SignalBadge signal={sig} />}
                          </div>
                        </div>
                      </div>
                      {/* Weight bar */}
                      <div style={{ height: 4, background: "var(--line)", borderRadius: 9999, overflow: "hidden", width: "100%" }}>
                        <div style={{ width: `${Math.min(100, weight)}%`, height: "100%", background: "var(--accent)", borderRadius: 9999 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{
                background: "var(--paper-2)", border: "1.5px solid var(--line)",
                borderRadius: 16, overflow: "hidden", marginBottom: 24,
                overflowX: "auto",
              }}>
              {/* Column headers */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "minmax(0,1.4fr) 62px 88px 96px 105px 72px 84px 120px 110px 28px",
                columnGap: 8,
                padding: "12px 20px", borderBottom: "1px solid var(--line)",
                fontSize: 10, color: "var(--muted)", fontWeight: 600,
                letterSpacing: "0.08em",
                fontFamily: "var(--font-geist-mono, monospace)", textTransform: "uppercase",
              }}>
                <span>ACTION</span>
                <span style={{ textAlign: "right" }}>QUANTITÉ</span>
                <span style={{ textAlign: "right" }}>PRIX MOYEN</span>
                <span style={{ textAlign: "right" }}>COURS ACTUEL</span>
                <span style={{ textAlign: "right" }}>VALEUR</span>
                <span style={{ textAlign: "right" }}>POIDS</span>
                <span style={{ textAlign: "right" }}>1 JOUR</span>
                <span style={{ textAlign: "right" }}>GAIN / PERTE</span>
                <span style={{ textAlign: "center" }}>SIGNAL</span>
                <span />
              </div>

              {enriched.map((h, i) => {
                const isPos = h.pnl >= 0;
                const sig = h.signal as string | undefined;
                const sigStyle = sig ? (SIGNAL_COLORS[sig] ?? SIGNAL_COLORS.HOLD) : SIGNAL_COLORS.HOLD;
                const sigLabel = sig ? (SIGNAL_LABELS[sig] ?? "—") : "—";
                const weight = totalVal > 0 ? (h.marketValue / totalVal) * 100 : 0;
                const logoColor = symbolColor(h.symbol);
                const initials = h.name
                  ? h.name.split(/\s+/).slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()
                  : h.symbol.slice(0, 2);

                return (
                  <div key={h.id} style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0,1.4fr) 62px 88px 96px 105px 72px 84px 120px 110px 28px",
                columnGap: 8,
                    padding: "16px 20px", alignItems: "center",
                    borderBottom: i < enriched.length - 1 ? "1px solid var(--line)" : "none",
                    transition: "background 0.12s",
                  }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--paper-3)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* ACTION — nom tronqué avec tooltip complet au survol */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, overflow: "hidden" }}>
                      <CompanyLogo symbol={h.symbol} name={h.name} size={32} radius={7} />
                      <div style={{ minWidth: 0, overflow: "hidden" }}>
                        <Link
                          href={`/stock/${h.symbol}`}
                          title={h.name || h.symbol}
                          style={{
                            fontWeight: 700, fontSize: 12, color: "var(--ink)",
                            textDecoration: "none", display: "block",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}
                        >
                          {/* Supprime les préfixes verbeux des ETF Amundi */}
                          {(h.name || h.symbol)
                            .replace(/^Amundi Index Solutions\s*[-–]\s*/i, "")
                            .replace(/^Amundi PEA\s+/i, "")
                          }
                        </Link>
                        {/* Secteur — libellé débutant, pas de "Unknown" */}
                        <div style={{
                          fontSize: 11, color: "var(--muted)", marginTop: 1,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {(() => {
                            const raw = h.sector;
                            const isEtf = h.asset_type === "etf";
                            if (isEtf) return "Fonds indiciel (ETF)";
                            if (!raw || raw === "N/A" || raw === "Unknown" || raw === "unknown") return "Action";
                            return sectorFr(raw);
                          })()}
                        </div>
                      </div>
                    </div>
                    {/* QUANTITÉ */}
                    <div style={{
                      textAlign: "right", fontSize: 13, color: "var(--ink)",
                      fontFamily: "var(--font-geist-mono, monospace)",
                    }}>{h.quantity}</div>
                    {/* PRIX MOYEN */}
                    <div style={{
                      textAlign: "right", fontSize: 13, color: "var(--muted)",
                      fontFamily: "var(--font-geist-mono, monospace)",
                    }}>{fmtEur(h.avg_price, h.currency)}</div>
                    {/* COURS ACTUEL */}
                    <div style={{
                      textAlign: "right", fontSize: 13, fontWeight: 600, color: "var(--ink)",
                      fontFamily: "var(--font-geist-mono, monospace)",
                    }}>{fmtEur(h.currentPrice, h.currency)}</div>
                    {/* VALEUR — Geist Mono */}
                    <div style={{
                      textAlign: "right",
                      fontSize: 15, fontWeight: 700,
                      fontFamily: "var(--font-geist-mono, monospace)",
                      fontVariantNumeric: "tabular-nums",
                      color: "var(--ink)", letterSpacing: "-0.02em",
                    }}>{fmtEur(h.marketValue, h.currency)}</div>
                    {/* POIDS — mini bar */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                      <div style={{
                        width: 60, height: 5, borderRadius: 3,
                        background: "var(--line)", overflow: "hidden",
                      }}>
                        <div style={{
                          width: `${Math.min(100, weight)}%`, height: "100%",
                          background: "var(--accent)", borderRadius: 3,
                        }} />
                      </div>
                      <span style={{
                        fontSize: 11, color: "var(--muted)",
                        fontFamily: "var(--font-geist-mono, monospace)",
                      }}>{weight.toFixed(1)} %</span>
                    </div>
                    {/* VARIATION DU JOUR */}
                    {(() => {
                      const dc    = h.dayChangePct ?? 0;
                      const dcUp  = dc >= 0;
                      const dcColor = dcUp ? "var(--signal-up)" : "var(--signal-down)";
                      return (
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: dcColor, fontFamily: "var(--font-geist-mono, monospace)" }}>
                            {dcUp ? "+" : ""}{(dc * 100).toFixed(2)} %
                          </div>
                          <div style={{ fontSize: 10, color: dcColor, fontFamily: "var(--font-geist-mono, monospace)" }}>
                            {dcUp ? "▲" : "▼"}
                          </div>
                        </div>
                      );
                    })()}
                    {/* GAIN / PERTE */}
                    <div style={{ textAlign: "right" }}>
                      <div style={{
                        fontSize: 12, fontWeight: 600,
                        color: isPos ? "var(--signal-up)" : "var(--signal-down)",
                        fontFamily: "var(--font-geist-mono, monospace)",
                      }}>
                        {isPos ? "+" : ""}{fmtEur(h.pnl, h.currency)}
                      </div>
                      <div style={{
                        fontSize: 11,
                        color: isPos ? "var(--signal-up)" : "var(--signal-down)",
                        fontFamily: "var(--font-geist-mono, monospace)",
                      }}>
                        {isPos ? "+" : ""}{h.pnlPct.toFixed(1)} %
                      </div>
                    </div>
                    {/* SIGNAL */}
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <span style={{
                        padding: "4px 9px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                        background: sigStyle.bg, color: sigStyle.color,
                        fontFamily: "var(--font-geist-mono, monospace)",
                        whiteSpace: "nowrap",
                      }}>{sigLabel}</span>
                    </div>
                    {/* Delete */}
                    <button onClick={() => handleDelete(h.id)} style={{
                      width: 26, height: 26, borderRadius: 6, border: "none",
                      background: "rgba(184,74,58,0.08)", color: "var(--signal-down)",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    }}><Trash2 size={13} /></button>
                  </div>
                );
              })}
            </div>
            )}

            {/* ── Rebalance banner ── */}
            {analysis && analysis.mainRisk && (
              <div style={{
                borderRadius: 16, padding: "24px 28px", marginBottom: 24,
                background: "linear-gradient(135deg, #1F5C3E, #14201A)",
                color: "#fff",
              }}>
                <h3 style={{
                  fontSize: 20, fontWeight: 400,
                  fontFamily: "var(--font-instrument, 'Instrument Serif', serif)",
                  marginBottom: 8, lineHeight: 1.3,
                }}>
                  Ton portefeuille a légèrement{" "}
                  <em style={{ fontStyle: "italic", color: "#A8D5B8" }}>dévié</em>.
                </h3>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.70)", marginBottom: 20, lineHeight: 1.6 }}>
                  {analysis.mainRisk}
                </p>
                <div style={{ display: "flex", gap: 10 }}>
                  <button style={{
                    padding: "10px 20px", borderRadius: 9999, border: "none",
                    background: "rgba(255,255,255,0.15)", color: "#fff",
                    fontSize: 14, fontWeight: 600, cursor: "pointer",
                  }}>Voir les suggestions →</button>
                  <button style={{
                    padding: "10px 20px", borderRadius: 9999,
                    border: "1.5px solid rgba(255,255,255,0.25)",
                    background: "transparent", color: "rgba(255,255,255,0.70)",
                    fontSize: 14, cursor: "pointer",
                  }}>Plus tard</button>
                </div>
              </div>
            )}

            {/* ── Insight cards ── */}
            {enriched.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
                {/* Card 1 — Force du portefeuille */}
                <div style={{
                  background: "var(--paper)", border: "1px solid var(--line)",
                  borderRadius: 16, padding: 20,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: "rgba(45,125,90,0.10)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <Check size={16} color="var(--accent)" />
                    </div>
                  </div>
                  <div style={{
                    fontSize: 10, color: "var(--muted)", letterSpacing: "0.10em",
                    fontFamily: "var(--font-geist-mono, monospace)", textTransform: "uppercase",
                    marginBottom: 6,
                  }}>FORCE DU PORTEFEUILLE</div>
                  <h4 style={{ fontSize: 22, fontWeight: 400, fontFamily: "var(--font-instrument, serif)", color: "var(--ink)", marginBottom: 6, lineHeight: 1.1 }}>Bien diversifié.</h4>
                  <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.55, margin: 0 }}>
                    Vos {enriched.length} positions couvrent {uniqueSectors} secteur{uniqueSectors !== 1 ? "s" : ""} différent{uniqueSectors !== 1 ? "s" : ""} — si l'un baisse, les autres peuvent compenser. Score de diversification : {divScore}/100.
                  </p>
                </div>

                {/* Card 2 — Point d'attention */}
                <div style={{
                  background: "var(--paper)", border: "1px solid var(--line)",
                  borderRadius: 16, padding: 20,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: "rgba(176,125,0,0.10)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <Clock size={16} color="#B07A00" />
                    </div>
                  </div>
                  <div style={{
                    fontSize: 10, color: "var(--muted)", letterSpacing: "0.10em",
                    fontFamily: "var(--font-geist-mono, monospace)", textTransform: "uppercase",
                    marginBottom: 6,
                  }}>POINT D'ATTENTION</div>
                  <h4 style={{ fontSize: 22, fontWeight: 400, fontFamily: "var(--font-instrument, serif)", color: "var(--ink)", marginBottom: 6, lineHeight: 1.1 }}>
                    {dividendHoldings.length === 0 ? "Peu de valeurs sûres." : "Quelques valeurs à dividende."}
                  </h4>
                  <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.55, margin: 0 }}>
                    {dividendHoldings.length === 0
                      ? "Aucune action à dividende détectée. Ajouter des valeurs défensives (obligations, grandes entreprises stables) peut réduire le risque global."
                      : `${dividendHoldings.length} action${dividendHoldings.length !== 1 ? "s" : ""} verse${dividendHoldings.length !== 1 ? "nt" : ""} un dividende régulier — ce sont des revenus versés même quand le cours ne monte pas.`}
                  </p>
                </div>

                {/* Card 3 — Risque mesuré */}
                <div style={{
                  background: "var(--paper)", border: "1px solid var(--line)",
                  borderRadius: 16, padding: 20,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: "rgba(184,74,58,0.10)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <AlertCircle size={16} color="var(--signal-down)" />
                    </div>
                  </div>
                  <div style={{
                    fontSize: 10, color: "var(--muted)", letterSpacing: "0.10em",
                    fontFamily: "var(--font-geist-mono, monospace)", textTransform: "uppercase",
                    marginBottom: 6,
                  }}>RISQUE MESURÉ</div>
                  <h4 style={{ fontSize: 22, fontWeight: 400, fontFamily: "var(--font-instrument, serif)", color: "var(--ink)", marginBottom: 6, lineHeight: 1.1 }}>Volatilité attendue.</h4>
                  <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.55, margin: 0 }}>
                    Des hausses et des baisses sont normales. Ce qui compte, c'est la tendance sur plusieurs années — pas les mouvements d'une semaine. Rester investi, c'est la clé.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ── Add modal ── */}
      {showAdd && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(10,22,40,0.40)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        }} onClick={(e) => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div style={{
            background: "var(--paper)", border: "1.5px solid var(--line)",
            borderRadius: 20, width: "100%", maxWidth: 460,
            boxShadow: "0 24px 64px rgba(10,22,40,0.18)",
            overflow: "hidden",
          }}>
            {/* Header */}
            <div style={{ padding: "22px 24px 18px", borderBottom: "1px solid var(--line)" }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", margin: 0 }}>
                Ajouter une position
              </h2>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0 0" }}>
                Recherche par nom d&apos;entreprise — Airbus, Apple, ETF Monde…
              </p>
            </div>

            <div style={{ padding: "20px 24px 24px" }}>
              {addStep === "search" ? (
                /* ── ÉTAPE 1: recherche par nom ── */
                <div>
                  {/* Search input */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: "var(--paper-2)", border: "1.5px solid var(--line)",
                    borderRadius: 12, padding: "11px 14px", marginBottom: 8,
                    transition: "border-color 0.15s",
                  }}
                    onFocusCapture={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                    onBlurCapture={e => (e.currentTarget.style.borderColor = "var(--line)")}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
                    <input
                      autoFocus
                      value={addQuery}
                      onChange={async (e) => {
                        const q = e.target.value;
                        setAddQuery(q);
                        if (!q.trim()) { setAddResults([]); return; }
                        setAddSearching(true);
                        try {
                          const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
                          const d = await r.json();
                          setAddResults(Array.isArray(d) ? d.slice(0, 6) : []);
                        } finally { setAddSearching(false); }
                      }}
                      placeholder="Tapez le nom d'une entreprise ou d'un ETF…"
                      style={{ flex: 1, border: "none", background: "transparent", outline: "none", color: "var(--ink)", fontSize: 14, fontFamily: "inherit" }}
                    />
                    {addSearching && <span style={{ fontSize: 11, color: "var(--muted)" }}>…</span>}
                  </div>

                  {/* Results */}
                  {addResults.length > 0 && (
                    <div style={{ border: "1.5px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
                      {addResults.map((r, i) => (
                        <button key={r.symbol} type="button"
                          onClick={async () => {
                            setAddQuery(r.name);
                            setAddName(r.name);
                            setAddSymbol(r.symbol);
                            setAddResults([]);
                            setResolving(true);
                            try {
                              const res = await fetch(`/api/stock/${r.symbol}`);
                              const d = await res.json();
                              if (d.currency) setAddCurrency(d.currency);
                              if (d.quoteType) {
                                const qt = String(d.quoteType).toUpperCase();
                                setAddType(qt === "ETF" || qt === "MUTUALFUND" ? "etf" : "stock");
                              }
                            } finally { setResolving(false); }
                            setAddStep("details");
                          }}
                          style={{
                            width: "100%", display: "flex", alignItems: "center", gap: 12,
                            padding: "12px 14px", background: "transparent", border: "none",
                            borderBottom: i < addResults.length - 1 ? "1px solid var(--line)" : "none",
                            cursor: "pointer", textAlign: "left",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = "var(--paper-2)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                          <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: `hsl(${(r.symbol.charCodeAt(0)*47)%360},40%,32%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff", fontFamily: "var(--font-geist-mono,monospace)" }}>
                            {r.symbol.slice(0,2)}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{r.name}</div>
                            {r.exchange && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{r.exchange}</div>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {addQuery.trim() && addResults.length === 0 && !addSearching && (
                    <div style={{ textAlign: "center", padding: "20px", color: "var(--muted)", fontSize: 13 }}>
                      Aucun résultat — essayez avec un autre terme.
                    </div>
                  )}

                  <button type="button" onClick={() => setShowAdd(false)} style={{
                    width: "100%", marginTop: 16, padding: "11px", borderRadius: 9999,
                    border: "1.5px solid var(--line)", background: "transparent",
                    color: "var(--muted)", fontSize: 13, cursor: "pointer",
                  }}>Annuler</button>
                </div>
              ) : (
                /* ── ÉTAPE 2: quantité + prix ── */
                <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Selected company recap */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "var(--accent-soft)", border: "1px solid rgba(45,125,90,0.22)", borderRadius: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: `hsl(${(addSymbol.charCodeAt(0)*47)%360},40%,32%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff", fontFamily: "var(--font-geist-mono,monospace)" }}>
                      {addSymbol.slice(0,2)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{addName}</div>
                      <div style={{ fontSize: 11, color: "var(--accent)" }}>{addType === "etf" ? "ETF" : "Action"}</div>
                    </div>
                    <button type="button" onClick={() => { setAddStep("search"); setAddQuery(addName); }} style={{ fontSize: 11, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>
                      Changer
                    </button>
                  </div>

                  {resolving && (
                    <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "center" }}>Chargement des données…</div>
                  )}

                  {/* Quantité */}
                  <div>
                    <label style={{ ...labelStyle, fontSize: 13, fontWeight: 600 }}>
                      Combien en avez-vous acheté ?
                    </label>
                    <input
                      type="number" value={addQty}
                      onChange={e => setAddQty(e.target.value)}
                      required placeholder="ex : 10" min="0" step="any"
                      style={{ ...inputStyle, fontSize: 15 }}
                    />
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                      Nombre de parts ou d&apos;actions achetées
                    </div>
                  </div>

                  {/* PRU */}
                  <div>
                    <label style={{ ...labelStyle, fontSize: 13, fontWeight: 600 }}>
                      À quel prix moyen avez-vous acheté ? (€)
                    </label>
                    <input
                      type="number" value={addPRU}
                      onChange={e => setAddPRU(e.target.value)}
                      required placeholder="ex : 82,50" min="0" step="any"
                      style={{ ...inputStyle, fontSize: 15 }}
                    />
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                      Prix en euros — la conversion est faite automatiquement
                    </div>
                  </div>

                  {/* Buttons */}
                  <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                    <button type="button" onClick={() => {
                      setShowAdd(false); setAddSymbol(""); setAddName(""); setAddQty(""); setAddPRU("");
                      setAddType("stock"); setAddCurrency("USD"); setResolveError(null);
                      setAddStep("search"); setAddQuery("");
                    }} style={{
                      flex: 1, padding: "13px", borderRadius: 9999,
                      border: "1.5px solid var(--line)", background: "transparent",
                      color: "var(--ink)", fontSize: 14, cursor: "pointer",
                    }}>Annuler</button>
                    <button type="submit" disabled={addLoading || !addQty || !addPRU} style={{
                      flex: 2, padding: "13px", borderRadius: 9999, border: "none",
                      background: "var(--accent)", color: "#fff",
                      fontSize: 14, fontWeight: 700, cursor: addLoading ? "wait" : "pointer",
                      opacity: !addQty || !addPRU ? 0.5 : 1,
                    }}>{addLoading ? "Ajout en cours…" : "Ajouter au portefeuille"}</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          ANALYSER UN INVESTISSEMENT
      ══════════════════════════════════════════════════════ */}
      {enriched.length > 0 && (
        <div style={{ background: "var(--paper-2)", border: "1.5px solid var(--line)", borderRadius: 18, padding: "24px 28px", marginBottom: 28 }}>
          {/* Header */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Sparkles size={18} strokeWidth={1.8} color="var(--accent)" />
              </div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", margin: 0 }}>
                Serait-ce une bonne idée d&apos;acheter… ?
              </h2>
            </div>
            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
              Entrez le nom d&apos;une action ou d&apos;un ETF et l&apos;IA analyse si c&apos;est pertinent <strong style={{ color: "var(--ink)" }}>au vu de votre portefeuille actuel</strong> — doublon, diversification, risque.
            </p>
          </div>

          {/* Étape 1 : recherche */}
          {!checkSelected ? (
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1.5px solid var(--line)", borderRadius: 12, padding: "11px 14px", transition: "border-color 0.15s" }}
                onFocusCapture={e => e.currentTarget.style.borderColor = "var(--accent)"}
                onBlurCapture={e => e.currentTarget.style.borderColor = "var(--line)"}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
                <input
                  autoFocus={false}
                  value={checkQuery}
                  onChange={async e => {
                    const q = e.target.value;
                    setCheckQuery(q);
                    setCheckError(null);
                    if (!q.trim()) { setCheckResults([]); return; }
                    setCheckSearching(true);
                    try {
                      const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
                      const d = await r.json();
                      setCheckResults(Array.isArray(d) ? d.slice(0, 6) : []);
                    } finally { setCheckSearching(false); }
                  }}
                  placeholder="Tapez le nom d'une entreprise ou d'un ETF — Apple, Amundi MSCI World…"
                  style={{ flex: 1, border: "none", background: "transparent", outline: "none", color: "var(--ink)", fontSize: 14, fontFamily: "inherit" }}
                />
                {checkSearching && <span style={{ fontSize: 11, color: "var(--muted)" }}>…</span>}
              </div>
              {checkResults.length > 0 && (
                <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#fff", border: "1.5px solid var(--line)", borderRadius: 12, overflow: "hidden", zIndex: 50, boxShadow: "0 8px 24px rgba(10,22,40,0.10)" }}>
                  {checkResults.map((r, i) => (
                    <button key={r.symbol} type="button"
                      onClick={() => { setCheckSelected({ symbol: r.symbol, name: r.name }); setCheckQuery(r.name); setCheckResults([]); setCheckResult(null); }}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "transparent", border: "none", borderBottom: i < checkResults.length - 1 ? "1px solid var(--line)" : "none", cursor: "pointer", textAlign: "left" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--paper-2)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <CompanyLogo symbol={r.symbol} name={r.name} size={32} radius={7} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{r.name}</div>
                        {r.exchange && <div style={{ fontSize: 11, color: "var(--muted)" }}>{r.exchange}</div>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Étape 2 : action sélectionnée + lancer l'analyse */
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "var(--accent-soft)", border: "1px solid rgba(45,125,90,0.22)", borderRadius: 12, marginBottom: 14 }}>
                <CompanyLogo symbol={checkSelected.symbol} name={checkSelected.name} size={36} radius={8} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{checkSelected.name}</div>
                  <div style={{ fontSize: 11, color: "var(--accent)" }}>Sélectionné — prêt pour l&apos;analyse</div>
                </div>
                <button onClick={() => { setCheckSelected(null); setCheckQuery(""); setCheckResult(null); setCheckError(null); }}
                  style={{ fontSize: 11, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>
                  Changer
                </button>
              </div>

              {!checkResult && !checkLoading && (
                <button
                  onClick={async () => {
                    if (!checkSelected) return;
                    setCheckLoading(true); setCheckError(null); setCheckResult(null);
                    try {
                      const portfolioData = enriched.map(h => ({
                        name: h.name, symbol: h.symbol,
                        sector: h.sector || "—",
                        pct: totals.value > 0 ? (h.marketValue / totals.value) * 100 : 0,
                        signal: h.signal,
                      }));
                      const res = await fetch("/api/portfolio/check", {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ symbol: checkSelected.symbol, portfolioHoldings: portfolioData }),
                      });
                      const d = await res.json();
                      if (d.error) setCheckError(d.error);
                      else setCheckResult(d);
                    } catch { setCheckError("Erreur inattendue. Réessayez."); }
                    finally { setCheckLoading(false); }
                  }}
                  style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: "var(--accent)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  <Sparkles size={16} /> Analyser avec l&apos;IA
                </button>
              )}

              {checkLoading && (
                <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted)", fontSize: 13 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid var(--line)", borderTopColor: "var(--accent)", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                  L&apos;IA analyse la pertinence de cet achat pour votre portefeuille…
                </div>
              )}

              {checkError && (
                <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(184,74,58,0.07)", border: "1px solid rgba(184,74,58,0.25)", fontSize: 13, color: "var(--signal-down)" }}>
                  {checkError}
                </div>
              )}

              {checkResult && (() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const a = checkResult.analysis as any;
                const verdictColor = a.verdict === "OUI" ? "var(--signal-up)" : a.verdict === "NON" ? "var(--signal-down)" : "#b07d00";
                const verdictBg    = a.verdict === "OUI" ? "rgba(45,125,90,0.08)" : a.verdict === "NON" ? "rgba(184,74,58,0.08)" : "rgba(176,125,0,0.08)";
                const verdictEmoji = a.verdict === "OUI" ? "✅" : a.verdict === "NON" ? "❌" : "⚠️";
                return (
                  <div>
                    {/* Verdict principal */}
                    <div style={{ background: verdictBg, border: `1.5px solid ${verdictColor}30`, borderRadius: 14, padding: "16px 20px", marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 20 }}>{verdictEmoji}</span>
                        <div>
                          <span style={{ fontSize: 14, fontWeight: 800, color: verdictColor, display: "block" }}>
                            {a.verdict === "OUI" ? "Bonne idée" : a.verdict === "NON" ? "Déconseillé" : "À étudier"}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{a.titre as string}</span>
                        </div>
                      </div>
                      <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.65, margin: 0 }}>{a.resume as string}</p>
                    </div>

                    {/* 2 colonnes : points positifs + points d'attention */}
                    {/* eslint-disable @typescript-eslint/no-explicit-any */}
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 16 }}>
                      {(a.points_positifs as string[])?.length > 0 && (
                        <div style={{ background: "rgba(45,125,90,0.05)", border: "1px solid rgba(45,125,90,0.20)", borderRadius: 12, padding: "14px 16px" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--signal-up)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Points positifs</div>
                          {(a.points_positifs as string[]).map((p, i) => (
                            <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: "var(--muted)", marginBottom: 5, lineHeight: 1.5 }}>
                              <span style={{ color: "var(--signal-up)", flexShrink: 0 }}>✓</span>{p}
                            </div>
                          ))}
                        </div>
                      )}
                      {(a.points_attention as string[])?.length > 0 && (
                        <div style={{ background: "rgba(176,125,0,0.05)", border: "1px solid rgba(176,125,0,0.20)", borderRadius: 12, padding: "14px 16px" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#b07d00", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Points d&apos;attention</div>
                          {(a.points_attention as string[]).map((p, i) => (
                            <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: "var(--muted)", marginBottom: 5, lineHeight: 1.5 }}>
                              <span style={{ color: "#b07d00", flexShrink: 0 }}>⚠</span>{p}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Doublon */}
                    {a.doublon && (
                      <div style={{ background: "rgba(184,74,58,0.06)", border: "1px solid rgba(184,74,58,0.22)", borderRadius: 12, padding: "12px 16px", marginBottom: 12, fontSize: 12, color: "var(--signal-down)", lineHeight: 1.55 }}>
                        <strong>⚠ Risque de doublon :</strong> {a.doublon_detail as string}
                      </div>
                    )}

                    {/* Diversification + allocation */}
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                      <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 12, padding: "12px 14px" }}>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-geist-mono, monospace)" }}>Diversification</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: a.diversification === "AMELIORE" ? "var(--signal-up)" : a.diversification === "REDUIT" ? "var(--signal-down)" : "var(--muted)", marginBottom: 4 }}>
                          {a.diversification === "AMELIORE" ? "✅ S'améliore" : a.diversification === "REDUIT" ? "❌ Se réduit" : "→ Neutre"}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>{a.diversification_detail as string}</div>
                      </div>
                      {(a.allocation_suggeree as string|null) && (
                        <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 12, padding: "12px 14px" }}>
                          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-geist-mono, monospace)" }}>Allocation suggérée</div>
                          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)", fontFamily: "var(--font-geist-mono, monospace)", marginBottom: 4 }}>
                            {a.allocation_suggeree as string}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>{a.allocation_detail as string}</div>
                        </div>
                      )}
                    </div>

                    {/* Nouvelle analyse */}
                    <button onClick={() => { setCheckResult(null); setCheckSelected(null); setCheckQuery(""); }}
                      style={{ marginTop: 14, fontSize: 12, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                      Analyser une autre action →
                    </button>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* ── Dividendes détail ── */}
      {dividendHoldings.length > 0 && (
        <div style={{ background: "var(--paper-2)", border: "1.5px solid var(--line)", borderRadius: 18, padding: "22px 24px", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", margin: "0 0 4px" }}>
                💰 Dividendes
              </h2>
              <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
                Revenus versés par vos actions, indépendamment de la hausse du cours
              </p>
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>Estimé / an</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--signal-up)", fontFamily: "var(--font-instrument, serif)" }}>{fmtEur(totalAnnualDividend)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>D'ici fin {new Date().getFullYear()}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--accent)", fontFamily: "var(--font-instrument, serif)" }}>{fmtEur(dividendToReceive)}</div>
              </div>
            </div>
          </div>

          {/* Tableau détail par action */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", borderBottom: "1px solid var(--line)", paddingBottom: 8, marginBottom: 4, fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            <span>Entreprise</span>
            <span style={{ textAlign: "right" }}>Rendement</span>
            <span style={{ textAlign: "right" }}>/ an (estimé)</span>
            <span style={{ textAlign: "right" }}>D'ici fin {new Date().getFullYear()}</span>
          </div>
          {dividendHoldings
            .sort((a, b) => (b.marketValue * (b.dividendYield ?? 0)) - (a.marketValue * (a.dividendYield ?? 0)))
            .map((h, i) => {
              const annual  = h.marketValue * (h.dividendYield ?? 0);
              const toYear  = (annual / 12) * monthsLeft;
              const yieldPct = ((h.dividendYield ?? 0) * 100).toFixed(2);
              return (
                <div key={h.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "10px 0", borderBottom: i < dividendHoldings.length - 1 ? "1px dashed var(--line)" : "none", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <CompanyLogo symbol={h.symbol} name={h.name} size={26} radius={6} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={h.name}>{h.name}</span>
                  </div>
                  <div style={{ textAlign: "right", fontSize: 12, fontFamily: "var(--font-geist-mono, monospace)", color: "var(--signal-up)", fontWeight: 600 }}>{yieldPct} %</div>
                  <div style={{ textAlign: "right", fontSize: 12, fontFamily: "var(--font-geist-mono, monospace)", color: "var(--ink)", fontWeight: 600 }}>{fmtEur(annual)}</div>
                  <div style={{ textAlign: "right", fontSize: 12, fontFamily: "var(--font-geist-mono, monospace)", color: "var(--accent)", fontWeight: 600 }}>{fmtEur(toYear)}</div>
                </div>
              );
            })}

          <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10, background: "var(--paper-3)", fontSize: 11, color: "var(--muted)", lineHeight: 1.6 }}>
            ℹ️ Les montants sont calculés à partir du rendement dividende des 12 derniers mois et de la valeur actuelle de vos positions. Ils peuvent varier selon les décisions des entreprises. Ces projections ne constituent pas une garantie.
          </div>
        </div>
      )}

      {/* ── Scenario Analysis ── */}
      {enriched.length > 0 && (
        <ScenarioAnalysis
          positions={enriched.map((h) => ({
            symbol: h.symbol,
            name: h.name,
            marketValue: h.marketValue,
            asset_type: h.asset_type,
            beta: undefined,
            sector: h.sector,
          }))}
          totalValue={totals.value}
          monthlyContribution={0}
        />
      )}

      {/* ── AI Analysis ── */}
      {analysis && (
        <div style={{
          background: "var(--paper-2)", border: "1.5px solid var(--line)",
          borderRadius: 16, padding: 28, marginTop: 24,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: "var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Sparkles size={16} color="#fff" />
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)" }}>Analyse IA du portefeuille</h2>
          </div>
          <div style={{
            display: "grid", gridTemplateColumns: "auto 1fr",
            gap: 20, marginBottom: 24, alignItems: "center",
          }}>
            <div style={{ position: "relative", width: 80, height: 80 }}>
              <svg viewBox="0 0 80 80" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="40" cy="40" r="32" fill="none" stroke="var(--line)" strokeWidth="7" />
                <circle cx="40" cy="40" r="32" fill="none"
                  stroke={analysis.globalScore >= 65 ? "var(--signal-up)" : analysis.globalScore >= 40 ? "var(--signal-neutral)" : "var(--signal-down)"}
                  strokeWidth="7" strokeDasharray={`${(analysis.globalScore / 100) * 201} 201`} strokeLinecap="round" />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)" }}>{analysis.globalScore}</span>
                <span style={{ fontSize: 9, color: "var(--muted)" }}>/100</span>
              </div>
            </div>
            <div>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--muted)", marginBottom: 8 }}>{analysis.summary}</p>
              <span style={{
                fontSize: 12, padding: "3px 10px", borderRadius: 20,
                background: "var(--accent-soft)", color: "var(--accent)",
                border: "1px solid rgba(45,125,90,0.2)",
              }}>
                Diversification : {analysis.diversification}
              </span>
            </div>
          </div>
          {analysis.recommendations?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h3 style={{
                fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 12,
                textTransform: "uppercase", letterSpacing: "0.5px",
              }}>Recommandations</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {analysis.recommendations.map((r, i) => {
                  const holding = enriched.find(h => h.symbol === r.symbol);
                  const displayName = holding?.name && holding.name !== r.symbol ? holding.name : r.symbol;
                  return (
                    <div key={i} style={{
                      display: "flex", alignItems: "flex-start", gap: 12,
                      padding: "12px 16px", borderRadius: 10,
                      background: "var(--paper-3)", border: "1.5px solid var(--line)",
                    }}>
                      <span style={{
                        padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                        background: `${REC_COLORS[r.type] ?? "#8b7a5e"}20`,
                        color: REC_COLORS[r.type] ?? "#8b7a5e", flexShrink: 0,
                      }}>{r.type}</span>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)" }}>{displayName}</span>
                        {holding?.name && holding.name !== r.symbol && (
                          <span style={{
                            fontSize: 11, color: "var(--muted)", background: "var(--paper-3)",
                            padding: "1px 5px", borderRadius: 4, marginLeft: 6,
                          }}>{r.symbol}</span>
                        )}
                        <span style={{ fontSize: 13, color: "var(--muted)", marginLeft: 6 }}>{r.reason}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {analysis.strengths?.length > 0 && (
              <div>
                <h3 style={{
                  fontSize: 12, fontWeight: 600, color: "var(--signal-up)", marginBottom: 8,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <TrendingUp size={13} />Points forts
                </h3>
                {analysis.strengths.map((s, i) => (
                  <div key={i} style={{ fontSize: 13, color: "var(--muted)", marginBottom: 5, display: "flex", gap: 6 }}>
                    <span style={{ color: "var(--signal-up)" }}>✓</span>{s}
                  </div>
                ))}
              </div>
            )}
            {analysis.missingExposures?.length > 0 && (
              <div>
                <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--signal-neutral)", marginBottom: 8 }}>
                  Expositions manquantes
                </h3>
                {analysis.missingExposures.map((s, i) => (
                  <div key={i} style={{ fontSize: 13, color: "var(--muted)", marginBottom: 5, display: "flex", gap: 6 }}>
                    <span style={{ color: "var(--signal-neutral)" }}>+</span>{s}
                  </div>
                ))}
              </div>
            )}
          </div>
          {analysis.mainRisk && (
            <div style={{
              marginTop: 16, padding: "12px 16px", borderRadius: 10,
              background: "rgba(184,74,58,0.05)", border: "1.5px solid rgba(184,74,58,0.18)",
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--signal-down)" }}>Risque principal : </span>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>{analysis.mainRisk}</span>
            </div>
          )}
          <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 16 }}>{analysis.disclaimer}</p>
        </div>
      )}

      </>)}

      {/* ══════════════════════════════════════════════════════
          VUE ASSURANCE-VIE
      ══════════════════════════════════════════════════════ */}
      {activeView === "av" && (
        <div>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14, marginBottom: 28 }}>
            <div>
              <h2 style={{ fontSize: 28, fontWeight: 400, fontFamily: "var(--font-instrument, 'Instrument Serif', serif)", color: "var(--ink)", marginBottom: 6, lineHeight: 1.1 }}>
                Mes <em style={{ fontStyle: "italic", color: "var(--accent)" }}>contrats</em>.
              </h2>
              <p style={{ fontSize: 13, color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)", margin: 0 }}>
                {avContracts.length} contrat{avContracts.length !== 1 ? "s" : ""} — valeur totale : {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(avTotalValue(avContracts))}
              </p>
            </div>
            <button onClick={() => setShowAddContract(true)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 9999, border: "none", background: "var(--accent)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={14} />Ajouter un contrat
            </button>
          </div>

          {/* Empty state */}
          {avContracts.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px 24px", border: "1.5px dashed var(--line)", borderRadius: 20, marginBottom: 24 }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🏦</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: "var(--ink)" }}>Aucun contrat</h3>
              <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24 }}>Ajoutez vos contrats d'assurance-vie pour les suivre et les analyser.</p>
              <button onClick={() => setShowAddContract(true)} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", borderRadius: 9999, border: "none", background: "var(--accent)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                <Plus size={15} />Ajouter un contrat
              </button>
            </div>
          )}

          {/* Liste des contrats */}
          {avContracts.map(contract => (
            <div key={contract.id} style={{ background: "var(--paper-2)", border: "1.5px solid var(--line)", borderRadius: 18, marginBottom: 20, overflow: "hidden" }}>
              {/* En-tête contrat */}
              <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", marginBottom: 2 }}>{contract.name}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)" }}>{contract.insurer}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>Valeur estimée</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "var(--accent)", fontFamily: "var(--font-instrument, serif)" }}>
                      {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(avContractValue(contract))}
                    </div>
                  </div>
                  <button onClick={() => setAvContracts(cs => cs.filter(c => c.id !== contract.id))} style={{ width: 30, height: 30, borderRadius: 7, border: "none", background: "rgba(184,74,58,0.08)", color: "var(--signal-down)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Tableau des lignes */}
              {contract.holdings.length > 0 && (
                <div style={{ overflowX: "auto" }}>
                  {/* Header */}
                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr 1fr 1fr 1fr 28px", columnGap: 8, padding: "10px 22px", fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)", textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: "1px solid var(--line)" }}>
                    <span>TYPE</span>
                    <span>NOM</span>
                    <span style={{ textAlign: "right" }}>QUANTITÉ</span>
                    <span style={{ textAlign: "right" }}>PRU (€)</span>
                    <span style={{ textAlign: "right" }}>VALEUR</span>
                    <span />
                  </div>
                  {contract.holdings.map((h, hi) => (
                    <div key={h.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr 1fr 1fr 1fr 28px", columnGap: 8, padding: "12px 22px", alignItems: "center", borderBottom: hi < contract.holdings.length - 1 ? "1px solid var(--line)" : "none" }}>
                      <div>
                        <span style={{ padding: "3px 8px", borderRadius: 5, fontSize: 10, fontWeight: 700, background: `${AV_TYPE_COLOR[h.type]}22`, color: AV_TYPE_COLOR[h.type] }}>
                          {AV_TYPE_LABEL[h.type]}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{h.name}</div>
                      <div style={{ textAlign: "right", fontSize: 13, fontFamily: "var(--font-geist-mono, monospace)", color: "var(--muted)" }}>{h.quantity}</div>
                      <div style={{ textAlign: "right", fontSize: 13, fontFamily: "var(--font-geist-mono, monospace)", color: "var(--muted)" }}>{h.pru.toFixed(2)} €</div>
                      <div style={{ textAlign: "right", fontSize: 13, fontWeight: 700, fontFamily: "var(--font-geist-mono, monospace)", color: "var(--ink)" }}>
                        {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(h.quantity * h.pru)}
                      </div>
                      <button onClick={() => setAvContracts(cs => cs.map(c => c.id === contract.id ? { ...c, holdings: c.holdings.filter(x => x.id !== h.id) } : c))} style={{ width: 24, height: 24, borderRadius: 5, border: "none", background: "rgba(184,74,58,0.07)", color: "var(--signal-down)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions contrat */}
              <div style={{ padding: "14px 22px", borderTop: contract.holdings.length > 0 ? "1px solid var(--line)" : "none", display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button onClick={() => { setShowAddHolding(contract.id); setAddHType("fonds_euros"); setAddHName(""); setAddHQty(""); setAddHPRU(""); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9999, border: "1.5px solid var(--line)", background: "transparent", color: "var(--ink)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  <Plus size={13} />Ajouter une ligne
                </button>
                <button
                  disabled={avAnalyzing || contract.holdings.length === 0}
                  onClick={async () => {
                    setAvAnalyzing(true);
                    setAvAnalysisError(null);
                    setAvAnalysis(null);
                    try {
                      const res = await fetch("/api/av/analyze", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ contracts: [contract] }),
                      });
                      const d = await res.json();
                      if (d.error) setAvAnalysisError(d.error);
                      else if (d.analysis) setAvAnalysis(d.analysis as AVAnalysis);
                    } catch { setAvAnalysisError("Erreur inattendue. Réessayez."); }
                    finally { setAvAnalyzing(false); }
                  }}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9999, border: "none", background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: avAnalyzing || contract.holdings.length === 0 ? "not-allowed" : "pointer", opacity: contract.holdings.length === 0 ? 0.5 : 1 }}>
                  <Sparkles size={13} />{avAnalyzing ? "Analyse en cours…" : "Analyser ce contrat (IA)"}
                </button>
              </div>
            </div>
          ))}

          {/* Résultat analyse IA */}
          {avAnalysisError && (
            <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(184,74,58,0.07)", border: "1px solid rgba(184,74,58,0.25)", fontSize: 13, color: "var(--signal-down)", marginBottom: 16 }}>
              {avAnalysisError}
            </div>
          )}

          {avAnalyzing && (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted)", fontSize: 13, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid var(--line)", borderTopColor: "var(--accent)", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
              L&apos;IA analyse votre contrat d&apos;assurance-vie…
            </div>
          )}

          {avAnalysis && (
            <div style={{ background: "var(--paper-2)", border: "1.5px solid var(--line)", borderRadius: 18, padding: "24px 28px", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Sparkles size={16} color="#fff" />
                </div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", margin: 0 }}>Analyse IA — Assurance-Vie</h2>
              </div>

              {/* Score + summary */}
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 20, marginBottom: 20, alignItems: "center" }}>
                <div style={{ position: "relative", width: 80, height: 80 }}>
                  <svg viewBox="0 0 80 80" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="40" cy="40" r="32" fill="none" stroke="var(--line)" strokeWidth="7" />
                    <circle cx="40" cy="40" r="32" fill="none"
                      stroke={avAnalysis.allocationScore >= 65 ? "var(--signal-up)" : avAnalysis.allocationScore >= 40 ? "#b07d00" : "var(--signal-down)"}
                      strokeWidth="7"
                      strokeDasharray={`${(avAnalysis.allocationScore / 100) * 201} 201`}
                      strokeLinecap="round" />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)" }}>{avAnalysis.allocationScore}</span>
                    <span style={{ fontSize: 9, color: "var(--muted)" }}>/100</span>
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--muted)", marginBottom: 8 }}>{avAnalysis.summary}</p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "var(--accent-soft)", color: "var(--accent)", border: "1px solid rgba(45,125,90,0.2)" }}>
                      Fonds €: {avAnalysis.fondsEurosPct.toFixed(0)} %
                    </span>
                    <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(201,162,78,0.10)", color: "#7A5A1F", border: "1px solid rgba(201,162,78,0.30)" }}>
                      UC: {avAnalysis.ucPct.toFixed(0)} %
                    </span>
                  </div>
                </div>
              </div>

              {/* Risque principal */}
              {avAnalysis.mainRisk && (
                <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(184,74,58,0.05)", border: "1.5px solid rgba(184,74,58,0.18)", marginBottom: 16 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--signal-down)" }}>Risque principal : </span>
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>{avAnalysis.mainRisk}</span>
                </div>
              )}

              {/* Recommandations */}
              {avAnalysis.recommendations?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>Recommandations</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {avAnalysis.recommendations.map((r, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", borderRadius: 10, background: "var(--paper-3)", border: "1.5px solid var(--line)" }}>
                        <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: "rgba(45,125,90,0.10)", color: "var(--accent)", flexShrink: 0 }}>{r.type}</span>
                        <div>
                          <span style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)" }}>{r.target}</span>
                          <span style={{ fontSize: 13, color: "var(--muted)", marginLeft: 6 }}>{r.reason}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 12 }}>{avAnalysis.disclaimer}</p>
            </div>
          )}

          {/* Modal ajout contrat */}
          {showAddContract && (
            <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,22,40,0.40)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
              onClick={e => { if (e.target === e.currentTarget) setShowAddContract(false); }}>
              <div style={{ background: "var(--paper)", border: "1.5px solid var(--line)", borderRadius: 20, width: "100%", maxWidth: 420, boxShadow: "0 24px 64px rgba(10,22,40,0.18)" }}>
                <div style={{ padding: "22px 24px 18px", borderBottom: "1px solid var(--line)" }}>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", margin: 0 }}>Nouveau contrat</h2>
                  <p style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0 0" }}>Linxea Avenir, Boursorama Vie…</p>
                </div>
                <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ ...labelStyle }}>Nom du contrat</label>
                    <input value={newContractName} onChange={e => setNewContractName(e.target.value)} placeholder="ex: Linxea Avenir 2" style={{ ...inputStyle }} />
                  </div>
                  <div>
                    <label style={{ ...labelStyle }}>Assureur</label>
                    <input value={newContractInsurer} onChange={e => setNewContractInsurer(e.target.value)} placeholder="ex: Spirica, Generali…" style={{ ...inputStyle }} />
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                    <button onClick={() => setShowAddContract(false)} style={{ flex: 1, padding: "12px", borderRadius: 9999, border: "1.5px solid var(--line)", background: "transparent", color: "var(--ink)", fontSize: 14, cursor: "pointer" }}>Annuler</button>
                    <button
                      disabled={!newContractName.trim()}
                      onClick={() => {
                        if (!newContractName.trim()) return;
                        setAvContracts(cs => [...cs, { id: crypto.randomUUID(), name: newContractName.trim(), insurer: newContractInsurer.trim(), holdings: [] }]);
                        setNewContractName(""); setNewContractInsurer(""); setShowAddContract(false);
                      }}
                      style={{ flex: 2, padding: "12px", borderRadius: 9999, border: "none", background: "var(--accent)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: !newContractName.trim() ? 0.5 : 1 }}>
                      Créer le contrat
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal ajout ligne dans un contrat */}
          {showAddHolding !== null && (
            <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,22,40,0.40)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
              onClick={e => { if (e.target === e.currentTarget) setShowAddHolding(null); }}>
              <div style={{ background: "var(--paper)", border: "1.5px solid var(--line)", borderRadius: 20, width: "100%", maxWidth: 420, boxShadow: "0 24px 64px rgba(10,22,40,0.18)" }}>
                <div style={{ padding: "22px 24px 18px", borderBottom: "1px solid var(--line)" }}>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", margin: 0 }}>Ajouter une ligne</h2>
                  <p style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0 0" }}>
                    {avContracts.find(c => c.id === showAddHolding)?.name}
                  </p>
                </div>
                <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ ...labelStyle }}>Type</label>
                    <select value={addHType} onChange={e => setAddHType(e.target.value as AVHoldingType)} style={{ ...inputStyle }}>
                      {(Object.entries(AV_TYPE_LABEL) as [AVHoldingType, string][]).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ ...labelStyle }}>Nom du fonds / support</label>
                    <input value={addHName} onChange={e => setAddHName(e.target.value)} placeholder="ex: Fonds euros Sécurité Pierre Plus" style={{ ...inputStyle }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ ...labelStyle }}>Quantité / parts</label>
                      <input type="number" value={addHQty} onChange={e => setAddHQty(e.target.value)} placeholder="ex: 100" min="0" step="any" style={{ ...inputStyle }} />
                    </div>
                    <div>
                      <label style={{ ...labelStyle }}>PRU (€)</label>
                      <input type="number" value={addHPRU} onChange={e => setAddHPRU(e.target.value)} placeholder="ex: 1.00" min="0" step="any" style={{ ...inputStyle }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>
                    Valeur estimée : {addHQty && addHPRU ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(parseFloat(addHQty) * parseFloat(addHPRU)) : "—"}
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                    <button onClick={() => setShowAddHolding(null)} style={{ flex: 1, padding: "12px", borderRadius: 9999, border: "1.5px solid var(--line)", background: "transparent", color: "var(--ink)", fontSize: 14, cursor: "pointer" }}>Annuler</button>
                    <button
                      disabled={!addHName.trim() || !addHQty || !addHPRU}
                      onClick={() => {
                        if (!addHName.trim() || !addHQty || !addHPRU) return;
                        const contractId = showAddHolding;
                        setAvContracts(cs => cs.map(c => c.id === contractId ? {
                          ...c,
                          holdings: [...c.holdings, { id: crypto.randomUUID(), type: addHType, name: addHName.trim(), quantity: parseFloat(addHQty), pru: parseFloat(addHPRU) }],
                        } : c));
                        setAddHName(""); setAddHQty(""); setAddHPRU(""); setShowAddHolding(null);
                      }}
                      style={{ flex: 2, padding: "12px", borderRadius: 9999, border: "none", background: "var(--accent)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: !addHName.trim() || !addHQty || !addHPRU ? 0.5 : 1 }}>
                      Ajouter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
