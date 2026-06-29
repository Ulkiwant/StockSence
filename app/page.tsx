"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, Check, ChevronRight, Clock, BarChart2, Shield } from "lucide-react";
import Footer from "@/components/Footer";
import CompanyLogo from "@/components/CompanyLogo";

/* ── Livret A calculation (taux actuel 2,4 %) ── */
const LIVRET_A_RATE = 0.024;
const PORTFOLIO_RATE = 0.07;
const livretAmt  = Math.round(1000 * Math.pow(1 + LIVRET_A_RATE, 10)); // 1 268 €
const portfolioAmt = Math.round(1000 * Math.pow(1 + PORTFOLIO_RATE, 10)); // 1 967 €

/* ── Demo chips — noms complets ── */
const CHIPS = [
  { name: "Apple", gain: "+8,2 %" },
  { name: "LVMH", gain: "+6,4 %" },
  { name: "ETF Monde", gain: "+7,1 %" },
  { name: "Sanofi", gain: "+4,9 %" },
  { name: "L'Oréal", gain: "+5,6 %" },
];

/* ── Demo portfolio holdings — noms complets, €  ── */
const HOLDINGS = [
  { abbr: "W",  bg: "#1F5C3E", sym: "CW8.PA",  name: "Amundi MSCI World",  price: "512,30 €",  chg: "+1,84 %", up: true  },
  { abbr: "M",  bg: "#5C3A21", sym: "MC.PA",   name: "LVMH Moët Hennessy", price: "768,10 €",  chg: "−0,91 %", up: false },
  { abbr: "O",  bg: "#1A1A1A", sym: "OR.PA",   name: "L'Oréal S.A.",       price: "412,30 €",  chg: "+0,55 %", up: true  },
  { abbr: "A",  bg: "#111",    sym: "AAPL",    name: "Apple Inc.",          price: "192,40 €",  chg: "+0,62 %", up: true  },
];

/* ── Step mini-cards ── */
const STEP_CARDS = [
  { rows: [["Horizon","10 ans"],["Montant initial","1 000 €"],["Profil le plus proche","Équilibré"]] },
  { rows: [["ETF Monde","45 %"],["Actions de qualité","35 %"],["Obligations","20 %"]] },
  { rows: [["Apple · décote estimée","12 %"],["Sanofi · à surveiller","−4 %"],["Écarts vs cibles","2 lignes"]] },
];

/* ── Analysis demo scores ── */
const SCORES = [
  { label: "Solidité financière", value: 86, color: "var(--accent)" },
  { label: "Croissance",          value: 72, color: "var(--accent)" },
  { label: "Valorisation",        value: 58, color: "#b07d00"       },
  { label: "Élan de marché",      value: 78, color: "var(--accent)" },
];

/* ── FAQ ── */
const FAQ = [
  { q: "Est-ce que Finazen gère mon argent ?",    a: "Non. Finazen est un outil d'analyse et d'aide à la décision pédagogique. Tu gardes le contrôle total et tu passes tes ordres chez ton courtier habituel (Boursorama, Trade Republic, Degiro, etc.)." },
  { q: "Combien faut-il pour commencer ?",        a: "À partir de 50 € grâce aux ETF fractionnés. Nos simulations partent souvent de 1 000 € car c'est un montant illustratif — mais le service marche à toute échelle." },
  { q: "D'où viennent vos données ?",             a: "Des bourses (Euronext, Nasdaq, NYSE) via des fournisseurs officiels. Les analyses sont produites par nos modèles, calibrés sur 30 ans d'historique." },
  { q: "Est-ce que c'est risqué ?",               a: "Investir comporte des risques de perte en capital. Les profils-types proposés par Finazen présentent des exemples d'allocations diversifiées, mais aucun rendement n'est garanti." },
  { q: "Qu'est-ce que le plan gratuit inclut vraiment ?",    a: "Le plan gratuit inclut 1 analyse de cours par jour, le score /100, la watchlist jusqu'à 3 actions, un portefeuille jusqu'à 3 positions, et 3 idées du jour. Les fonctionnalités avancées (Analyse IA, alertes, Profils d'investisseur illimité) sont réservées aux plans Investisseur et Premium." },
  { q: "Mes données sont-elles en sécurité ?",    a: "On ne te demande aucune information sensible (pas de RIB, pas d'accès courtier). Les emails sont chiffrés au repos, hébergés en France, conformément au RGPD." },
];

/* ── Demo chart data per period ── */
const DEMO_RANGES = {
  "1J": {
    path:   "M0,78 C30,72 55,88 95,80 S160,68 205,75 S265,62 315,70 S385,54 435,58 S510,48 560,44 S592,42 600,40",
    area:   "M0,78 C30,72 55,88 95,80 S160,68 205,75 S265,62 315,70 S385,54 435,58 S510,48 560,44 S592,42 600,40 L600,160 L0,160 Z",
    labels: ["9h", "11h", "13h", "15h", "17h", "Clôt"],
    chg: "+0,62 %", up: true,
  },
  "5J": {
    path:   "M0,105 C40,98 75,118 120,92 S195,68 240,82 S308,56 362,70 S432,44 482,52 S558,36 600,30",
    area:   "M0,105 C40,98 75,118 120,92 S195,68 240,82 S308,56 362,70 S432,44 482,52 S558,36 600,30 L600,160 L0,160 Z",
    labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", ""],
    chg: "+2,14 %", up: true,
  },
  "1M": {
    path:   "M0,122 C35,116 65,134 108,106 S175,82 222,98 S292,72 344,88 S405,58 452,48 S528,32 572,25 S596,20 600,18",
    area:   "M0,122 C35,116 65,134 108,106 S175,82 222,98 S292,72 344,88 S405,58 452,48 S528,32 572,25 S596,20 600,18 L600,160 L0,160 Z",
    labels: ["5 Jan", "12 Jan", "19 Jan", "26 Jan", "2 Fév", "9 Fév"],
    chg: "+5,82 %", up: true,
  },
  "6M": {
    path:   "M0,130 C50,120 80,140 120,110 S200,70 250,90 S330,50 380,70 S470,40 520,30 S590,20 600,18",
    area:   "M0,130 C50,120 80,140 120,110 S200,70 250,90 S330,50 380,70 S470,40 520,30 S590,20 600,18 L600,160 L0,160 Z",
    labels: ["Déc", "Jan", "Fév", "Mar", "Avr", "Mai"],
    chg: "+12,40 %", up: true,
  },
  "1A": {
    path:   "M0,88 C42,80 72,102 125,96 S185,114 235,108 S295,124 345,102 S403,68 452,48 S522,28 562,22 S592,16 600,14",
    area:   "M0,88 C42,80 72,102 125,96 S185,114 235,108 S295,124 345,102 S403,68 452,48 S522,28 562,22 S592,16 600,14 L600,160 L0,160 Z",
    labels: ["Juin", "Août", "Oct", "Déc", "Fév", "Avr"],
    chg: "+18,60 %", up: true,
  },
  "5A": {
    path:   "M0,142 C52,136 92,148 142,132 S215,118 262,124 S334,104 382,92 S444,68 492,44 S552,24 582,16 S596,12 600,10",
    area:   "M0,142 C52,136 92,148 142,132 S215,118 262,124 S334,104 382,92 S444,68 492,44 S552,24 582,16 S596,12 600,10 L600,160 L0,160 Z",
    labels: ["2020", "2021", "2022", "2023", "2024", "2025"],
    chg: "+142,8 %", up: true,
  },
} as const;
type DemoRange = keyof typeof DEMO_RANGES;

/* ── Live search hook ── */
function useLiveSearch() {
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<{ symbol: string; name: string; exchange: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const d = await r.json();
        setResults(Array.isArray(d) ? d : []);
        setOpen(true);
      } finally { setLoading(false); }
    }, 280);
    return () => clearTimeout(t);
  }, [query]);

  return { query, setQuery, results, loading, open, setOpen };
}

/* ── Simple donut SVG ── */
function DonutChart() {
  const segments = [
    { pct: 45, color: "#1F5C3E" },
    { pct: 35, color: "#2F7D52" },
    { pct: 20, color: "#C9A24E" },
  ];
  const r = 60, cx = 70, cy = 70, circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={140} height={140} viewBox="0 0 140 140">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--line)" strokeWidth="16" />
      {segments.map((s, i) => {
        const dash = (s.pct / 100) * circ;
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth="16"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-offset}
            style={{ transform: "rotate(-90deg)", transformOrigin: `${cx}px ${cy}px` }}
          />
        );
        offset += dash;
        return el;
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" style={{ fontSize: 20, fill: "var(--accent)", fontFamily: "var(--font-instrument, serif)", fontWeight: 400 }}>6,8 %</text>
      <text x={cx} y={cy + 12} textAnchor="middle" style={{ fontSize: 9, fill: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)", textTransform: "uppercase", letterSpacing: "0.06em" }}>rendement/an</text>
    </svg>
  );
}

/* ════════════════════════════════════════════
   PAGE
════════════════════════════════════════════ */
export default function HomePage() {
  const router  = useRouter();
  const search  = useLiveSearch();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [simHorizon, setSimHorizon] = useState<10|20>(10);
  const [demoRange, setDemoRange] = useState<DemoRange>("6M");
  const demoData = DEMO_RANGES[demoRange];
  const simLivret   = Math.round(1000 * Math.pow(1 + LIVRET_A_RATE, simHorizon));
  const simPortfolio = Math.round(1000 * Math.pow(1 + PORTFOLIO_RATE, simHorizon));

  /* ── Simulateur interactif ── */
  const [simAmount,  setSimAmount]  = useState(5000);
  const [simMonthly, setSimMonthly] = useState(200);
  const [simYears,   setSimYears]   = useState(15);

  function calcSim(rate: number) {
    // Montant initial capitalisé + versements mensuels capitalisés
    const r = rate / 12;
    const n = simYears * 12;
    const futureInitial  = simAmount  * Math.pow(1 + r, n);
    const futureMonthly  = simMonthly * ((Math.pow(1 + r, n) - 1) / r);
    const total          = Math.round(futureInitial + futureMonthly);
    const invested       = simAmount + simMonthly * n;
    return { total, invested: Math.round(invested), gain: total - Math.round(invested) };
  }
  const simPrudent    = calcSim(0.04);
  const simMoyen      = calcSim(0.07);
  const simOptimiste  = calcSim(0.10);

  const handleSearchGo = (symbol: string) => {
    search.setQuery(""); search.setOpen(false);
    router.push(`/stock/${symbol}`);
  };

  const scrollToSearch = () => {
    searchRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => inputRef.current?.focus(), 400);
  };

  return (
    <div style={{ background: "var(--paper)" }}>

      {/* ── JSON-LD Structured Data (SEO) ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": "https://finazen.fr/#website",
              "url": "https://finazen.fr",
              "name": "Finazen",
              "description": "Investir en bourse sans jargon — Analyse d'actions, suivi de portefeuille et profils d'investisseur. Plan gratuit disponible.",
              "inLanguage": "fr-FR",
              "potentialAction": {
                "@type": "SearchAction",
                "target": { "@type": "EntryPoint", "urlTemplate": "https://finazen.fr/stock/{search_term_string}" },
                "query-input": "required name=search_term_string"
              }
            },
            {
              "@type": "Organization",
              "@id": "https://finazen.fr/#organization",
              "name": "Finazen",
              "url": "https://finazen.fr",
              "logo": { "@type": "ImageObject", "url": "https://finazen.fr/icon.svg" },
              "description": "Finazen est une plateforme d'investissement en bourse accessible aux débutants. Analyse d'actions par IA, suivi de portefeuille, watchlist et profils d'investisseur.",
              "foundingDate": "2024",
              "areaServed": "FR",
              "knowsLanguage": "fr"
            },
            {
              "@type": "SoftwareApplication",
              "name": "Finazen",
              "applicationCategory": "FinanceApplication",
              "operatingSystem": "Web, iOS (PWA), Android (PWA)",
              "offers": { "@type": "Offer", "price": "0", "priceCurrency": "EUR", "description": "Plan gratuit disponible — fonctionnalités avancées à partir de 9,99 €/mois" },
              "description": "Application web d'analyse boursière et de gestion de portefeuille. Valorisation d'actions par IA, signal achat/vente, profils d'investisseur.",
              "url": "https://finazen.fr",
              "screenshot": "https://finazen.fr/og-image.png",
              "featureList": [
                "Analyse de valorisation d'actions par IA",
                "Signal achat / neutre / vente",
                "Suivi de portefeuille d'investissement",
                "Watchlist d'actions",
                "Profils d'investisseur (exemples de répartition)",
                "Alertes email sur les signaux",
                "Analyse de scénarios",
                "Idées d'investissement quotidiennes"
              ]
            },
            {
              "@type": "FAQPage",
              "mainEntity": [
                { "@type": "Question", "name": "Est-ce que Finazen gère mon argent ?", "acceptedAnswer": { "@type": "Answer", "text": "Non. Finazen est un outil d'analyse et d'aide à la décision pédagogique. Vous gardez le contrôle total et passez vos ordres chez votre courtier habituel." } },
                { "@type": "Question", "name": "Finazen est-il gratuit ?", "acceptedAnswer": { "@type": "Answer", "text": "Finazen propose un plan gratuit incluant 1 analyse par jour, le score /100, une watchlist de 3 actions et un portefeuille de 3 positions. Les fonctionnalités avancées sont disponibles à partir de 9,99 €/mois." } },
                { "@type": "Question", "name": "Comment Finazen analyse-t-il les actions ?", "acceptedAnswer": { "@type": "Answer", "text": "Finazen utilise des modèles de valorisation fondamentale (DCF, P/E, comparables sectoriels) combinés à l'intelligence artificielle pour calculer une juste valeur et générer un signal d'investissement." } }
              ]
            }
          ]
        })}}
      />

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="hero-grid" style={{ maxWidth: 1240, margin: "0 auto", padding: "80px 32px 64px", display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 64, alignItems: "center" }}>

        {/* Left */}
        <div>
          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 9999, border: "1px solid rgba(45,125,90,0.28)", background: "var(--accent-soft)", marginBottom: 32 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
            <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>Gratuit pour débuter · Sans carte bancaire</span>
          </div>

          {/* H1 */}
          <h1 style={{ margin: "0 0 24px", lineHeight: 1.08, letterSpacing: "-0.02em" }}>
            <span style={{
              display: "block",
              fontSize: "clamp(36px, 5vw, 68px)",
              fontFamily: "var(--font-instrument, 'Instrument Serif', serif)",
              fontWeight: 400, fontStyle: "italic",
              color: "#9C9583", position: "relative",
            }}>
              1 000 € en livret
              <span style={{ position: "absolute", left: 0, right: 0, top: "52%", height: 3, background: "#9C958399", borderRadius: 2 }} />
            </span>
            <span style={{ display: "block", fontSize: "clamp(36px, 5vw, 68px)", fontFamily: "var(--font-instrument, 'Instrument Serif', serif)", fontWeight: 400, color: "var(--ink)" }}>
              ou{" "}
              <em style={{ fontStyle: "italic", color: "var(--accent)" }}>{portfolioAmt.toLocaleString("fr-FR")} €</em>{" "}investis
            </span>
            <span style={{ display: "block", fontSize: "clamp(36px, 5vw, 68px)", fontFamily: "var(--font-instrument, 'Instrument Serif', serif)", fontWeight: 400, color: "var(--ink)" }}>
              intelligemment.
            </span>
          </h1>

          <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.65, maxWidth: 520, marginBottom: 36 }}>
            Finazen t&apos;aide, <strong style={{ color: "var(--ink)", fontWeight: 600 }}>en deux minutes et sans jargon</strong>, à
            comprendre les marchés et à situer ton profil d&apos;investisseur parmi 4 profils-types.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
            <Link href="/advisor" style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              padding: "13px 22px", borderRadius: 9999,
              background: "var(--accent)", color: "#F6F2E8",
              fontWeight: 600, fontSize: 15, border: "none", cursor: "pointer",
              boxShadow: "0 1px 0 rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.12)",
              transition: "background 0.15s, transform 0.12s",
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--accent-hover)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--accent)"; (e.currentTarget as HTMLElement).style.transform = "none"; }}
            >
              Découvrir les profils types
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.20)", display: "grid", placeItems: "center" }}>
                <ArrowRight size={12} strokeWidth={2.5} />
              </span>
            </Link>
            <button onClick={scrollToSearch} style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              padding: "13px 22px", borderRadius: 9999,
              background: "transparent", color: "var(--ink)",
              fontWeight: 600, fontSize: 15, border: "1.5px solid var(--line)", cursor: "pointer",
              transition: "background 0.15s",
            }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--paper-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              Analyser une action
            </button>
          </div>

          {/* Débutant CTA */}
          <div style={{ marginBottom: 20 }}>
            <Link href="/debutant" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--muted)", fontWeight: 500, padding: "7px 14px", border: "1px dashed var(--line)", borderRadius: 9999, background: "transparent", transition: "background 0.15s, color 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--paper-2)"; e.currentTarget.style.color = "var(--ink)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted)"; }}
            >
              🌱 Je débute — par où commencer ?
            </Link>
          </div>

          {/* Trust */}
          <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 13, color: "var(--muted)", flexWrap: "wrap" }}>
            {["Plan gratuit disponible", "Sans carte bancaire", "Annulable à tout moment"].map((t, i) => (
              <span key={t} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {i > 0 && <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--line)" }} />}
                <Check size={13} strokeWidth={2.5} color="var(--accent)" /> {t}
              </span>
            ))}
          </div>
        </div>

        {/* Right — showcase card */}
        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 20, padding: 22, boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset, 0 24px 60px -30px rgba(20,32,26,0.18)" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: "var(--accent)", background: "var(--accent-soft)", padding: "3px 8px", borderRadius: 9999, fontWeight: 600 }}>Simulation</span>
              1 000 € · horizon {simHorizon} ans
            </div>
            <div style={{ display: "flex", background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 9999, padding: 3, fontSize: 12 }}>
              {([10, 20] as const).map((v) => (
                <button key={v} onClick={() => setSimHorizon(v)} style={{ padding: "4px 10px", borderRadius: 9999, border: "none", cursor: "pointer", background: simHorizon === v ? "var(--ink)" : "transparent", color: simHorizon === v ? "var(--paper)" : "var(--muted)", fontFamily: "inherit", fontWeight: simHorizon === v ? 600 : 400, transition: "all 0.15s" }}>{v} ans</button>
              ))}
            </div>
          </div>

          {/* Comparison */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            {/* Livret A */}
            <div style={{ border: "1px solid var(--line)", borderRadius: 12, padding: "14px 16px", background: "rgba(255,255,255,0.5)" }}>
              <div style={{ fontSize: 11, color: "var(--muted)", display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                <span>🏦</span> Livret A · {(LIVRET_A_RATE * 100).toLocaleString("fr-FR", { minimumFractionDigits: 1 })} %/an
              </div>
              <div style={{ fontFamily: "var(--font-instrument, serif)", fontSize: 28, color: "var(--ink)", lineHeight: 1.1, marginBottom: 4 }}>
                {simLivret.toLocaleString("fr-FR")} €
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>+{(simLivret - 1000).toLocaleString("fr-FR")} € · gain limité à l'inflation</div>
            </div>
            {/* Portfolio */}
            <div style={{ border: "1px solid rgba(45,125,90,0.25)", borderRadius: 12, padding: "14px 16px", background: "linear-gradient(180deg, #E9F0E5 0%, #F2F4E8 100%)" }}>
              <div style={{ fontSize: 11, color: "var(--accent)", display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                <span>↗</span> Portefeuille Finazen · ~7 %/an
              </div>
              <div style={{ fontFamily: "var(--font-instrument, serif)", fontSize: 28, color: "var(--accent)", lineHeight: 1.1, marginBottom: 4 }}>
                {simPortfolio.toLocaleString("fr-FR")} €
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>+{(simPortfolio - 1000).toLocaleString("fr-FR")} € · soit <strong style={{ color: "var(--accent)" }}>×{(simPortfolio / 1000).toFixed(1)}</strong> sur le capital</div>
            </div>
          </div>

          {/* Sparkline SVG */}
          <svg viewBox="0 0 460 54" preserveAspectRatio="none" style={{ width: "100%", height: 54, marginBottom: 12 }}>
            <defs>
              <linearGradient id="sparkGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Portfolio line */}
            <path d="M0,48 L40,46 L80,44 L120,40 L160,38 L200,34 L240,28 L280,26 L320,20 L360,16 L400,10 L460,4" fill="none" stroke="var(--accent)" strokeWidth="2.2" />
            <path d="M0,48 L40,46 L80,44 L120,40 L160,38 L200,34 L240,28 L280,26 L320,20 L360,16 L400,10 L460,4 L460,54 L0,54 Z" fill="url(#sparkGrad)" />
            {/* Livret A (flat dashed) */}
            <path d="M0,50 L460,48" fill="none" stroke="#9C9583" strokeWidth="1.5" strokeDasharray="3 4" />
            <text x="6" y="47" fontFamily="var(--font-geist-mono, monospace)" fontSize="8" fill="#7A7768">Livret A</text>
          </svg>

          {/* Company chips — noms complets */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {CHIPS.map((c) => (
              <span key={c.name} style={{ fontSize: 11, background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 9999, padding: "4px 9px", color: "var(--ink-2)", display: "inline-flex", alignItems: "center", gap: 5 }}>
                {c.name} <span style={{ color: "var(--accent)", fontWeight: 600 }}>{c.gain}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SEARCH SECTION (cible du bouton "Analyser")
      ══════════════════════════════════════════ */}
      <section ref={searchRef} className="home-search-section" style={{ borderTop: "1px solid var(--line)", padding: "48px 32px 40px", background: "var(--paper-2)" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <p style={{ fontSize: 13, color: "var(--muted)", textAlign: "center", marginBottom: 16, fontWeight: 500 }}>
            Analysez n'importe quelle entreprise — entrez son nom et obtenez une analyse automatisée basée sur les données financières réelles.
          </p>
          <div style={{ position: "relative" }}>
            <div className="home-search-bar" style={{
              display: "flex", alignItems: "center",
              background: "#fff", border: "1.5px solid var(--line)",
              borderRadius: 9999, padding: "12px 18px", gap: 10,
              boxShadow: "0 2px 12px rgba(10,22,40,0.06)",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
              onFocusCapture={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(45,125,90,0.12)"; }}
              onBlurCapture={(e)  => { e.currentTarget.style.borderColor = "var(--line)";   e.currentTarget.style.boxShadow = "0 2px 12px rgba(10,22,40,0.06)"; }}
            >
              <Search size={17} strokeWidth={1.8} color="var(--muted)" style={{ flexShrink: 0 }} />
              <input
                ref={inputRef}
                type="text"
                value={search.query}
                onChange={(e) => search.setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && search.results[0]) handleSearchGo(search.results[0].symbol); }}
                placeholder="Apple, LVMH, Sanofi, L'Oréal, Airbus…"
                style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: "var(--ink)", fontSize: 15, fontFamily: "inherit" }}
              />
              <button
                onClick={() => { if (search.results[0]) handleSearchGo(search.results[0].symbol); }}
                style={{ padding: "8px 20px", borderRadius: 9999, background: "var(--accent)", color: "#fff", fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer", flexShrink: 0 }}
              >
                Analyser
              </button>
            </div>

            {/* Dropdown — nom complet en avant */}
            {search.open && search.results.length > 0 && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#fff", border: "1.5px solid var(--line)", borderRadius: 14, overflow: "hidden", zIndex: 100, boxShadow: "0 8px 32px rgba(10,22,40,0.12)" }}>
                {search.results.slice(0, 7).map((r, i) => (
                  <button key={r.symbol} onClick={() => handleSearchGo(r.symbol)} style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 12,
                    padding: "11px 16px", background: "transparent", border: "none",
                    borderBottom: i < Math.min(search.results.length, 7) - 1 ? "1px solid var(--line)" : "none",
                    cursor: "pointer", textAlign: "left",
                  }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--paper-2)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--paper-3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-geist-mono, monospace)", flexShrink: 0 }}>
                      {r.symbol.slice(0, 2)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Nom en premier, gros */}
                      <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>{r.exchange}</div>
                    </div>
                    <ChevronRight size={14} color="var(--muted)" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS STRIP — Instrument Serif
      ══════════════════════════════════════════ */}
      <section style={{ borderTop: "1px solid var(--line)", padding: "72px 32px" }}>
        <div className="stats-strip" style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32 }}>
          {[
            { value: "2 400", sup: "+", label: "Analyses réalisées par nos algorithmes" },
            { value: "180",  sup: "+", label: "Actions couvertes — CAC 40, S&P 500, Nasdaq" },
            { value: "2 min", sup: "",  label: "Pour obtenir un premier portefeuille" },
            { value: "100",  sup: "%", label: "Sans engagement — annulable à tout moment" },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontFamily: "var(--font-instrument, serif)", fontWeight: 400, fontSize: "clamp(42px, 5vw, 58px)", lineHeight: 1, letterSpacing: "-0.02em", color: "var(--ink)" }}>
                {s.value}<sup style={{ fontSize: "0.42em", color: "var(--accent)", verticalAlign: "top", marginLeft: 2 }}>{s.sup}</sup>
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 8, lineHeight: 1.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STEPS — Trois étapes, zéro jargon
      ══════════════════════════════════════════ */}
      <section style={{ borderTop: "1px solid var(--line)", padding: "96px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 40, marginBottom: 56, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--accent)", fontFamily: "var(--font-geist-mono, monospace)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>Comment ça marche</div>
              <h2 style={{ fontFamily: "var(--font-instrument, serif)", fontWeight: 400, fontSize: "clamp(36px, 4.5vw, 58px)", lineHeight: 1.05, letterSpacing: "-0.015em", margin: 0 }}>
                Trois étapes, <em style={{ fontStyle: "italic", color: "var(--accent)" }}>zéro jargon</em>.
              </h2>
            </div>
            <p style={{ fontSize: 16, color: "var(--muted)", maxWidth: 400, lineHeight: 1.6, margin: 0 }}>
              Pas besoin de comprendre les ratios PER ou les bandes de Bollinger. On traduit la finance en français — et en décisions.
            </p>
          </div>

          {/* 3 cards */}
          <div className="steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[
              { n: 1, step: "Profil",         title: "Dis-nous ce que tu veux faire de ton argent.",      desc: "Quelques questions claires — durée, montant, tolérance au risque — pour situer ton profil d'investisseur." },
              { n: 2, step: "Exemple",        title: "Découvre à quoi ressemble ton profil.",             desc: "Un exemple de répartition entre actions et ETF, avec des explications en clair et une performance attendue à titre indicatif." },
              { n: 3, step: "Suivi",          title: "On t'alerte quand quelque chose bouge.",            desc: "Variations notables, opportunités, rééquilibrages : tu reçois une notification simple, lisible, sans bruit inutile." },
            ].map(({ n, step, title, desc }, i) => (
              <div key={n} style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 18, padding: 28, display: "flex", flexDirection: "column", gap: 14, transition: "transform 0.2s, border-color 0.2s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "none"; (e.currentTarget as HTMLElement).style.borderColor = "var(--line)"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--accent)", color: "#F6F2E8", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700 }}>{n}</span>
                  <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)" }}>{step}</span>
                </div>
                <h3 style={{ fontFamily: "var(--font-instrument, serif)", fontWeight: 400, fontSize: 28, lineHeight: 1.1, letterSpacing: "-0.01em", margin: 0 }}>{title}</h3>
                <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>{desc}</p>
                {/* Mini card */}
                <div style={{ marginTop: "auto", background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 10, padding: "12px 14px", fontSize: 13 }}>
                  {STEP_CARDS[i].rows.map(([l, v], j) => (
                    <div key={l} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: j > 0 ? 8 : 0, marginTop: j > 0 ? 8 : 0, borderTop: j > 0 ? "1px dashed var(--line)" : "none" }}>
                      <span style={{ color: "var(--muted)" }}>{l}</span>
                      <span style={{ fontFamily: "var(--font-geist-mono, monospace)", color: v === "Équilibré" || v.startsWith("+") ? "var(--accent)" : v.startsWith("−") ? "var(--signal-down)" : "var(--ink)", fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          DÉBUTANT — invitation chaleureuse vers /debutant
      ══════════════════════════════════════════ */}
      <section style={{ borderTop: "1px solid var(--line)", padding: "72px 32px", background: "var(--paper)" }}>
        <div style={{
          maxWidth: 1020, margin: "0 auto",
          background: "#0a1628", borderRadius: 28,
          padding: "56px 44px",
          display: "flex", flexWrap: "wrap", gap: 40,
          alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ maxWidth: 540 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "5px 14px", borderRadius: 9999,
              background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
              fontSize: 12, color: "#9fd9b8", fontWeight: 600, marginBottom: 22,
            }}>
              🌱 Pour les vrais débutants
            </div>
            <h2 style={{
              fontFamily: "var(--font-instrument, serif)", fontWeight: 400,
              fontSize: "clamp(28px, 3.4vw, 42px)", lineHeight: 1.12,
              letterSpacing: "-0.015em", color: "#F6F2E8", margin: "0 0 16px",
            }}>
              Tu ne comprends rien à la bourse ?{" "}
              <em style={{ fontStyle: "italic", color: "#9fd9b8" }}>C&apos;est normal, et c&apos;est pour ça qu&apos;on est là.</em>
            </h2>
            <p style={{ fontSize: 15.5, color: "rgba(246,242,232,0.75)", lineHeight: 1.7, margin: "0 0 28px" }}>
              Action, ETF, risque, diversification, profil d&apos;investisseur… Si ces mots ne veulent encore rien dire pour toi, commence par notre parcours <strong style={{ color: "#F6F2E8" }}>Débuter</strong> : les bases en clair, sans jargon, puis un plan d&apos;action simple pour faire tes premiers pas avec Finazen.
            </p>
            <Link href="/debutant" style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              padding: "13px 24px", borderRadius: 9999,
              background: "#F6F2E8", color: "#0a1628",
              fontWeight: 700, fontSize: 15, border: "none",
              transition: "transform 0.12s",
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "none"; }}
            >
              Suivre le parcours Débuter
              <ArrowRight size={15} strokeWidth={2.5} />
            </Link>
          </div>

          {/* 3 repères visuels */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 240 }}>
            {[
              { n: "01", label: "Les bases en clair", desc: "Action, ETF, risque… expliqués sans jargon" },
              { n: "02", label: "Ton profil", desc: "3 questions pour savoir par où commencer" },
              { n: "03", label: "Ton premier pas", desc: "Un plan d'action concret avec Finazen" },
            ].map(({ n, label, desc }) => (
              <div key={n} style={{
                display: "flex", alignItems: "flex-start", gap: 14,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 14, padding: "14px 16px",
              }}>
                <span style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 12, color: "#9fd9b8", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{n}</span>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "#F6F2E8", marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 12, color: "rgba(246,242,232,0.6)", lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TRUST SECTION
      ══════════════════════════════════════════ */}
      <section style={{ borderTop: "1px solid var(--line)", padding: "96px 32px", background: "var(--paper-2)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 40, marginBottom: 56, flexWrap: "wrap" }}>
            <div style={{ maxWidth: 540 }}>
              <div style={{ fontSize: 12, color: "var(--accent)", fontFamily: "var(--font-geist-mono, monospace)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>Transparence</div>
              <h2 style={{ fontFamily: "var(--font-instrument, serif)", fontWeight: 400, fontSize: "clamp(32px, 4vw, 52px)", lineHeight: 1.05, letterSpacing: "-0.015em", margin: "0 0 18px" }}>
                Pourquoi faire confiance à <em style={{ fontStyle: "italic", color: "var(--accent)" }}>Finazen</em> ?
              </h2>
              <p style={{ fontSize: 16, color: "var(--muted)", lineHeight: 1.65, margin: 0 }}>
                Finazen n&apos;est pas un oracle. C&apos;est un outil d&apos;analyse qui exploite des données financières réelles et publiques pour t&apos;aider à prendre de meilleures décisions — <strong style={{ color: "var(--ink)" }}>sans jamais se substituer à ton jugement</strong>.
              </p>
            </div>
            <div style={{ maxWidth: 400 }}>
              <div style={{ background: "var(--accent-soft)", border: "1px solid rgba(45,125,90,0.22)", borderRadius: 14, padding: "16px 20px", fontSize: 14, color: "var(--ink)", lineHeight: 1.6 }}>
                <span style={{ fontWeight: 700 }}>Notre méthode en résumé :</span> chaque note repose sur quatre critères quantifiables — solidité financière, croissance, valorisation et rentabilité — pondérés selon leur pertinence historique. Aucune opinion, aucun biais de marché.{" "}
                <Link href="/methodologie" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "underline", textDecorationThickness: 1 }}>
                  Voir la méthodologie complète →
                </Link>
              </div>
            </div>
          </div>

          {/* 4 trust cards */}
          <div className="steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {[
              {
                icon: "📊",
                title: "Données réelles",
                desc: "Nos analyses s'appuient exclusivement sur les données financières officielles publiées par les entreprises et les marchés.",
              },
              {
                icon: "🔍",
                title: "Méthode transparente",
                desc: "Notre score sur 100 est décomposé critère par critère. Tu sais exactement pourquoi une action est notée ainsi.",
              },
              {
                icon: "🔒",
                title: "Zéro gestion d'argent",
                desc: "Finazen ne touche pas ton argent, n'a pas accès à ton courtier et ne passe aucun ordre en ton nom.",
              },
              {
                icon: "🧭",
                title: "Contrôle total",
                desc: "On t'éclaire, tu décides. Chaque recommandation est une suggestion — la décision finale t'appartient toujours.",
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 16, padding: "22px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--accent-soft)", border: "1px solid rgba(45,125,90,0.15)", display: "grid", placeItems: "center", fontSize: 20 }}>{icon}</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>{title}</div>
                <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PORTFOLIO SECTION
      ══════════════════════════════════════════ */}
      <section style={{ borderTop: "1px solid var(--line)", padding: "96px 32px" }}>
        <div className="two-col" style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          {/* Left */}
          <div>
            <div style={{ fontSize: 12, color: "var(--accent)", fontFamily: "var(--font-geist-mono, monospace)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>Mon portefeuille</div>
            <h2 style={{ fontFamily: "var(--font-instrument, serif)", fontWeight: 400, fontSize: "clamp(34px, 4vw, 52px)", lineHeight: 1.05, letterSpacing: "-0.015em", margin: "0 0 18px" }}>
              Une allocation qui te <em style={{ fontStyle: "italic", color: "var(--accent)" }}>ressemble</em>.
            </h2>
            <p style={{ fontSize: 16, color: "var(--muted)", lineHeight: 1.6, marginBottom: 32 }}>
              Plus qu'une liste d'actions, c'est une stratégie pensée pour ton profil : diversifiée, lisible, et que tu peux comprendre ligne par ligne.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              {[
                { Icon: Clock,    title: "Adapté à ton horizon",       desc: "2 ans, 10 ans, retraite : ton allocation évolue automatiquement avec le temps qui te reste." },
                { Icon: BarChart2, title: "Diversifié par construction", desc: "Pas de paris sur une seule action : on répartit entre zones, secteurs et tailles d'entreprises." },
                { Icon: Shield,   title: "Transparent ligne à ligne",   desc: "Chaque titre vient avec une raison en français — pas un score opaque." },
              ].map(({ Icon, title, desc }) => (
                <div key={title} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center", flexShrink: 0, border: "1px solid rgba(45,125,90,0.18)" }}>
                    <Icon size={17} strokeWidth={1.8} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3, color: "var(--ink)" }}>{title}</div>
                    <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.55 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — portfolio card */}
          <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 22, padding: 26, boxShadow: "0 30px 80px -40px rgba(20,32,26,0.25)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 2 }}>Portefeuille suggéré · Équilibré</div>
                <div style={{ fontFamily: "var(--font-instrument, serif)", fontSize: 22, color: "var(--ink)" }}>
                  Rendement attendu <span style={{ color: "var(--accent)" }}>6,8 %</span> / an
                </div>
              </div>
              <span style={{ fontSize: 11, background: "var(--ink)", color: "var(--paper)", padding: "4px 10px", borderRadius: 9999, fontWeight: 600, flexShrink: 0 }}>Mis à jour aujourd&apos;hui</span>
            </div>

            {/* Donut + legend */}
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 18 }}>
              <DonutChart />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { color: "#1F5C3E", label: "ETF Monde", pct: "45 %" },
                  { color: "#2F7D52", label: "Actions qualité", pct: "35 %" },
                  { color: "#C9A24E", label: "Obligations", pct: "20 %" },
                ].map((l) => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: l.color, flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{l.label}</span>
                    <span style={{ fontFamily: "var(--font-geist-mono, monospace)", color: "var(--muted)" }}>{l.pct}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Holdings — noms complets, € */}
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 14, display: "flex", flexDirection: "column", gap: 0 }}>
              {HOLDINGS.map((h, i) => (
                <div key={h.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: i < HOLDINGS.length - 1 ? "1px dashed var(--line)" : "none", fontSize: 13 }}>
                  <CompanyLogo symbol={h.sym} name={h.name} size={28} radius={7} />
                  <span style={{ flex: 1, color: "var(--muted)" }}>{h.name}</span>
                  <span style={{ fontFamily: "var(--font-geist-mono, monospace)", color: "var(--ink)" }}>{h.price}</span>
                  <span style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 12, color: h.up ? "var(--signal-up)" : "var(--signal-down)" }}>{h.chg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          ANALYSIS SECTION
      ══════════════════════════════════════════ */}
      <section style={{ borderTop: "1px solid var(--line)", padding: "96px 32px", background: "var(--paper-2)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 40, marginBottom: 48, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--accent)", fontFamily: "var(--font-geist-mono, monospace)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>Analyse d'action</div>
              <h2 style={{ fontFamily: "var(--font-instrument, serif)", fontWeight: 400, fontSize: "clamp(32px, 4vw, 52px)", lineHeight: 1.05, letterSpacing: "-0.015em", margin: 0 }}>
                Comprendre une action{" "}
                <em style={{ fontStyle: "italic", color: "var(--accent)" }}>en un coup d&apos;œil</em>.
              </h2>
            </div>
            <p style={{ fontSize: 16, color: "var(--muted)", maxWidth: 400, lineHeight: 1.6, margin: 0 }}>
              Cherche n&apos;importe quelle entreprise. On résume les fondamentaux, l&apos;élan de marché et la note globale — sans avoir à parcourir 12 onglets.
            </p>
          </div>

          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 20 }}>
            {/* Chart card (demo) */}
            <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 18, padding: 22 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <CompanyLogo symbol="AAPL" name="Apple Inc." size={38} radius={9} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>Apple Inc.</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>NASDAQ</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--font-instrument, serif)", fontSize: 28, color: "var(--ink)", lineHeight: 1 }}>192,40 €</div>
                  <div style={{ fontSize: 12, color: demoData.up ? "var(--signal-up)" : "var(--signal-dn)", marginTop: 3 }}>
                    {demoData.up ? "▲" : "▼"} {demoData.chg}
                  </div>
                </div>
              </div>
              {/* Range selector */}
              <div style={{ display: "flex", gap: 4, background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 9999, padding: 3, fontSize: 12, width: "fit-content", margin: "12px 0" }}>
                {(["1J","5J","1M","6M","1A","5A"] as DemoRange[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setDemoRange(r)}
                    style={{ padding: "4px 9px", borderRadius: 9999, border: "none", background: r === demoRange ? "var(--ink)" : "transparent", color: r === demoRange ? "var(--paper)" : "var(--muted)", cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s, color 0.15s" }}
                  >{r}</button>
                ))}
              </div>
              {/* Chart */}
              <svg viewBox="0 0 600 160" preserveAspectRatio="none" style={{ width: "100%", height: 160 }}>
                <defs>
                  <linearGradient id="aaplGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <g stroke="var(--line)" strokeWidth="1">
                  <line x1="0" y1="40" x2="600" y2="40" /><line x1="0" y1="90" x2="600" y2="90" /><line x1="0" y1="140" x2="600" y2="140" />
                </g>
                <path d={demoData.area} fill="url(#aaplGrad)" />
                <path d={demoData.path} fill="none" stroke="var(--accent)" strokeWidth="2.2" />
                <circle cx="600" r="4" fill="var(--accent)"
                  cy={parseFloat(demoData.path.match(/600,(\d+(?:\.\d+)?)$/)?.[1] ?? "18")}
                />
              </svg>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)", marginTop: 6 }}>
                {demoData.labels.map((m, i) => <span key={i}>{m}</span>)}
              </div>
            </div>

            {/* Score card — scores numériques /100 */}
            <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 18, padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Note globale */}
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ position: "relative", width: 60, height: 60 }}>
                  <svg viewBox="0 0 80 80" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="40" cy="40" r="32" fill="none" stroke="var(--line)" strokeWidth="7" />
                    <circle cx="40" cy="40" r="32" fill="none" stroke="var(--accent)" strokeWidth="7"
                      strokeDasharray={`${(78 / 100) * 201} 201`} strokeLinecap="round" />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>78</div>
                      <div style={{ fontSize: 8, color: "var(--muted)" }}>/100</div>
                    </div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 2 }}>Note Finazen · <Link href="/methodologie" style={{ color: "var(--accent)", textDecoration: "underline", textDecorationThickness: 1 }}>Comment ça marche ?</Link></div>
                  <div style={{ fontFamily: "var(--font-instrument, serif)", fontSize: 18, color: "var(--ink)" }}>Bonne opportunité à long terme</div>
                </div>
              </div>

              {/* Score bars — numériques /100 */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {SCORES.map((s) => (
                  <div key={s.label} style={{ display: "grid", gridTemplateColumns: "120px 1fr 36px", gap: 10, alignItems: "center", fontSize: 13 }}>
                    <span style={{ color: "var(--muted)" }}>{s.label}</span>
                    <div style={{ height: 6, background: "var(--paper-3)", borderRadius: 9999, overflow: "hidden" }}>
                      <div style={{ width: `${s.value}%`, height: "100%", background: s.color, borderRadius: 9999 }} />
                    </div>
                    <span style={{ fontFamily: "var(--font-geist-mono, monospace)", color: "var(--ink)", textAlign: "right" }}>{s.value}</span>
                  </div>
                ))}
              </div>

              {/* Quote */}
              <div style={{ background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 10, padding: "11px 13px", fontSize: 12, color: "var(--muted)", fontStyle: "italic", lineHeight: 1.6 }}>
                « Apple reste une <strong style={{ fontStyle: "normal", color: "var(--ink)" }}>valeur de qualité</strong>{" "}avec des marges très solides. Le titre est légèrement cher aujourd&apos;hui — bien adapté à un investissement progressif. »
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SIMULATEUR D'INVESTISSEMENT
      ══════════════════════════════════════════ */}
      <section style={{ borderTop: "1px solid var(--line)", padding: "96px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 40, marginBottom: 56, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--accent)", fontFamily: "var(--font-geist-mono, monospace)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>Simulation</div>
              <h2 style={{ fontFamily: "var(--font-instrument, serif)", fontWeight: 400, fontSize: "clamp(32px, 4vw, 52px)", lineHeight: 1.05, letterSpacing: "-0.015em", margin: 0 }}>
                Combien peut valoir <em style={{ fontStyle: "italic", color: "var(--accent)" }}>ton investissement</em> ?
              </h2>
            </div>
            <p style={{ fontSize: 16, color: "var(--muted)", maxWidth: 400, lineHeight: 1.6, margin: 0 }}>
              Configure ton projet et vois trois scénarios réalistes. Ces projections sont des estimations — pas des promesses.
            </p>
          </div>

          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr", gap: 32, alignItems: "start" }}>
            {/* Controls */}
            <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 20, padding: 28, display: "flex", flexDirection: "column", gap: 26 }}>
              {/* Montant initial */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Montant initial</label>
                  <span style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 15, fontWeight: 700, color: "var(--accent)" }}>{simAmount.toLocaleString("fr-FR")} €</span>
                </div>
                <input type="range" min={500} max={50000} step={500} value={simAmount} onChange={(e) => setSimAmount(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--accent)" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                  <span>500 €</span><span>50 000 €</span>
                </div>
              </div>
              {/* Versement mensuel */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Versement mensuel</label>
                  <span style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 15, fontWeight: 700, color: "var(--accent)" }}>{simMonthly.toLocaleString("fr-FR")} €/mois</span>
                </div>
                <input type="range" min={0} max={2000} step={50} value={simMonthly} onChange={(e) => setSimMonthly(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--accent)" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                  <span>0 €</span><span>2 000 €</span>
                </div>
              </div>
              {/* Durée */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Durée d&apos;investissement</label>
                  <span style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 15, fontWeight: 700, color: "var(--accent)" }}>{simYears} ans</span>
                </div>
                <input type="range" min={1} max={40} step={1} value={simYears} onChange={(e) => setSimYears(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--accent)" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                  <span>1 an</span><span>40 ans</span>
                </div>
              </div>
              {/* Capital total investi */}
              <div style={{ background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "var(--muted)" }}>Capital total investi</span>
                <span style={{ fontFamily: "var(--font-geist-mono, monospace)", fontWeight: 700, color: "var(--ink)" }}>
                  {simMoyen.invested.toLocaleString("fr-FR")} €
                </span>
              </div>
            </div>

            {/* Results */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Scénario prudent",    rate: "4 %/an",  data: simPrudent,   color: "#6B7DB3", bg: "#F0F2FA" },
                { label: "Scénario moyen",       rate: "7 %/an",  data: simMoyen,     color: "var(--accent)", bg: "var(--accent-soft)" },
                { label: "Scénario optimiste",   rate: "10 %/an", data: simOptimiste, color: "#B07D00", bg: "#FDF8EC" },
              ].map(({ label, rate, data, color, bg }) => (
                <div key={label} style={{ background: "#fff", border: `1.5px solid ${color === "var(--accent)" ? "rgba(45,125,90,0.25)" : "var(--line)"}`, borderRadius: 16, padding: "20px 22px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", whiteSpace: "nowrap" }}>{label}</span>
                      <span style={{ fontSize: 12, color, background: bg, border: `1px solid ${color === "var(--accent)" ? "rgba(45,125,90,0.2)" : "transparent"}`, borderRadius: 9999, padding: "2px 8px", whiteSpace: "nowrap" }}>{rate}</span>
                    </div>
                    <div style={{ fontFamily: "var(--font-instrument, serif)", fontSize: 28, color, lineHeight: 1, whiteSpace: "nowrap" }}>
                      {data.total.toLocaleString("fr-FR")} €
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div style={{ background: "var(--paper-2)", borderRadius: 8, padding: "8px 12px" }}>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 2 }}>Capital investi</div>
                      <div style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{data.invested.toLocaleString("fr-FR")} €</div>
                    </div>
                    <div style={{ background: "var(--paper-2)", borderRadius: 8, padding: "8px 12px" }}>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 2 }}>Gains potentiels</div>
                      <div style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 13, fontWeight: 600, color }}>+{data.gain.toLocaleString("fr-FR")} €</div>
                    </div>
                  </div>
                  {/* Progress bar invested vs total */}
                  <div style={{ marginTop: 12, height: 5, background: "var(--paper-3)", borderRadius: 9999, overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(100, Math.round((data.invested / data.total) * 100))}%`, height: "100%", background: color, borderRadius: 9999, transition: "width 0.4s ease" }} />
                  </div>
                  <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>
                    {Math.round((data.invested / data.total) * 100)} % capital · {Math.round((data.gain / data.total) * 100)} % gains
                  </div>
                </div>
              ))}

              {/* Avertissement légal */}
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 12, padding: "12px 16px", fontSize: 12, color: "var(--muted)", lineHeight: 1.55 }}>
                <span style={{ flexShrink: 0, fontSize: 14 }}>⚠️</span>
                <span>Simulations basées sur des taux annuels composés hypothétiques. Les performances passées ne préjugent pas des performances futures. Investir comporte un risque de perte en capital.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PORTEFEUILLE EXEMPLE DÉBUTANT
      ══════════════════════════════════════════ */}
      <section style={{ borderTop: "1px solid var(--line)", padding: "96px 32px", background: "var(--paper-2)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 40, marginBottom: 48, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--accent)", fontFamily: "var(--font-geist-mono, monospace)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>Exemple concret</div>
              <h2 style={{ fontFamily: "var(--font-instrument, serif)", fontWeight: 400, fontSize: "clamp(32px, 4vw, 52px)", lineHeight: 1.05, letterSpacing: "-0.015em", margin: "0 0 12px" }}>
                À quoi ressemble un portefeuille <em style={{ fontStyle: "italic", color: "var(--accent)" }}>débutant</em> ?
              </h2>
              <p style={{ fontSize: 16, color: "var(--muted)", maxWidth: 500, lineHeight: 1.6, margin: 0 }}>
                Voici un exemple de portefeuille accessible sans inscription — pour comprendre la logique avant de créer le tien.
              </p>
            </div>
            <Link href="/advisor" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 22px", borderRadius: 9999, background: "var(--accent)", color: "#F6F2E8", fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", flexShrink: 0, transition: "background 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent)")}
            >
              Découvrir les profils types
              <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
          </div>

          {/* Profile banner */}
          <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 20, padding: "20px 24px", marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ width: 36, height: 36, borderRadius: 10, background: "var(--accent-soft)", display: "grid", placeItems: "center", fontSize: 18 }}>🌱</span>
              <div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>Portefeuille</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>Débutant — Premier investissement</div>
              </div>
            </div>
            {[
              { label: "Profil de risque", value: "Prudent–Équilibré" },
              { label: "Horizon", value: "5–10 ans" },
              { label: "Objectif", value: "Faire travailler son épargne" },
              { label: "Niveau de complexité", value: "⭐ Très simple" },
            ].map(({ label, value }) => (
              <div key={label} style={{ borderLeft: "1px solid var(--line)", paddingLeft: 24 }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Allocation lines */}
          <div className="alloc-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 16 }}>
            {[
              {
                pct: 70, color: "#1F5C3E", label: "ETF Monde", ticker: "CW8.PA",
                role: "Cœur du portefeuille",
                risk: "Risque modéré",
                why: "Un seul fonds qui réplique 1 500 entreprises mondiales. Simple, diversifié, avec un historique de ~7 %/an sur 30 ans.",
              },
              {
                pct: 20, color: "#6B7DB3", label: "ETF Obligations", ticker: "AGG",
                role: "Stabilisateur",
                risk: "Risque faible",
                why: "Réduit la volatilité globale. Quand les actions baissent fortement, les obligations limitent la chute.",
              },
              {
                pct: 10, color: "#C9A24E", label: "Liquidités", ticker: "CASH",
                role: "Réserve de sécurité",
                risk: "Risque nul",
                why: "Conservée sur Livret A ou fonds euro. Permet de saisir une opportunité ou de faire face à un imprévu.",
              },
            ].map(({ pct, color, label, role, risk, why }) => (
              <div key={label} style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 16, padding: "20px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Bar + pct */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1, height: 6, background: "var(--paper-3)", borderRadius: 9999 }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 9999 }} />
                  </div>
                  <span style={{ fontFamily: "var(--font-geist-mono, monospace)", fontWeight: 700, fontSize: 18, color }}>{pct} %</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "var(--ink)" }}>{label}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, background: "var(--accent-soft)", color: "var(--accent)", borderRadius: 9999, padding: "2px 8px", fontWeight: 600 }}>{role}</span>
                  <span style={{ fontSize: 11, background: "var(--paper-2)", color: "var(--muted)", borderRadius: 9999, padding: "2px 8px" }}>{risk}</span>
                </div>
                <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>{why}</p>
              </div>
            ))}
          </div>

          {/* Allocation bar visuelle */}
          <div style={{ height: 12, borderRadius: 9999, overflow: "hidden", display: "flex", marginBottom: 8 }}>
            <div style={{ width: "70%", background: "#1F5C3E" }} />
            <div style={{ width: "20%", background: "#6B7DB3" }} />
            <div style={{ width: "10%", background: "#C9A24E" }} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 12, color: "var(--muted)", marginBottom: 32 }}>
            {[["#1F5C3E","ETF Monde · 70 %"],["#6B7DB3","Obligations · 20 %"],["#C9A24E","Liquidités · 10 %"]].map(([c, l]) => (
              <span key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: c, flexShrink: 0 }} />{l}
              </span>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <Link href="/advisor" style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 32px", borderRadius: 9999, background: "var(--ink)", color: "var(--paper)", fontWeight: 600, fontSize: 15, transition: "background 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#1a2a1e")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--ink)")}
            >
              Découvrir les profils types
              <ArrowRight size={15} strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════ */}
      <section style={{ borderTop: "1px solid var(--line)", padding: "96px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 48, flexWrap: "wrap", gap: 20 }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--accent)", fontFamily: "var(--font-geist-mono, monospace)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>Questions fréquentes</div>
              <h2 style={{ fontFamily: "var(--font-instrument, serif)", fontWeight: 400, fontSize: "clamp(32px, 4vw, 52px)", lineHeight: 1.05, letterSpacing: "-0.015em", margin: 0 }}>
                Tout ce que tu <em style={{ fontStyle: "italic", color: "var(--accent)" }}>te demandes</em> avant de commencer.
              </h2>
            </div>
            <Link href="/faq" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 9999, border: "1.5px solid var(--line)", color: "var(--ink)", fontSize: 14, fontWeight: 500, whiteSpace: "nowrap" }}>
              Voir la FAQ complète →
            </Link>
          </div>

          <div className="two-col faq-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 60px", alignItems: "start" }}>
            {[FAQ.slice(0, 3), FAQ.slice(3)].map((col, ci) => (
              <div key={ci}>
                {col.map((item, i) => {
                  const idx = ci * 3 + i;
                  return (
                    <div key={item.q} style={{ borderBottom: "1px solid var(--line)", padding: "18px 0" }}>
                      <button
                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit", fontWeight: 600, fontSize: 15, color: "var(--ink)" }}
                      >
                        {item.q}
                        <span style={{
                          width: 26, height: 26, borderRadius: "50%", border: "1px solid var(--line)",
                          display: "grid", placeItems: "center", color: "var(--muted)", flexShrink: 0,
                          background: openFaq === idx ? "var(--accent)" : "transparent",
                          borderColor: openFaq === idx ? "var(--accent)" : "var(--line)",
                          transition: "background 0.2s",
                        }}>
                          <span style={{ fontSize: 16, color: openFaq === idx ? "#fff" : "var(--muted)", transform: openFaq === idx ? "rotate(45deg)" : "none", display: "block", transition: "transform 0.25s", lineHeight: 1 }}>+</span>
                        </span>
                      </button>
                      {openFaq === idx && (
                        <p style={{ margin: "12px 0 0", color: "var(--muted)", fontSize: 14, lineHeight: 1.65, maxWidth: 480 }}>{item.a}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA BLOCK — fond sombre
      ══════════════════════════════════════════ */}
      <section style={{ padding: "0 32px 96px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="cta-block-grid" style={{
            background: "var(--ink)", color: "var(--paper)", borderRadius: 28, padding: "72px 56px",
            display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 48, alignItems: "end",
            position: "relative", overflow: "hidden",
          }}>
            {/* Halo */}
            <div style={{ position: "absolute", right: -100, bottom: -200, width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(45,125,90,0.35), transparent 70%)", pointerEvents: "none" }} />
            <div>
              <h2 style={{ fontFamily: "var(--font-instrument, serif)", fontWeight: 400, fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 1.02, letterSpacing: "-0.02em", margin: "0 0 18px", color: "var(--paper)" }}>
                Prêt à découvrir<br />
                <em style={{ fontStyle: "italic", color: "#A8D0AF" }}>ton profil</em> ?
              </h2>
              <p style={{ color: "rgba(245,241,234,0.65)", fontSize: 17, margin: 0, maxWidth: 500 }}>
                Deux minutes. Pas d&apos;inscription. Aucune carte bancaire. Et tu repars avec un exemple de répartition pour ton profil.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, position: "relative", zIndex: 1 }}>
              <Link href="/advisor" style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: "14px 22px", borderRadius: 9999,
                background: "var(--paper)", color: "var(--ink)",
                fontWeight: 600, fontSize: 15, border: "none",
                transition: "background 0.15s",
              }}>
                Découvrir les profils types
                <span style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(10,22,40,0.10)", display: "grid", placeItems: "center" }}>
                  <ArrowRight size={11} strokeWidth={2.5} />
                </span>
              </Link>
              <button onClick={scrollToSearch} style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "14px 22px", borderRadius: 9999,
                background: "transparent", color: "var(--paper)",
                fontWeight: 600, fontSize: 15, border: "1.5px solid rgba(255,255,255,0.25)", cursor: "pointer",
              }}>
                Analyser une action
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <div style={{ padding: "16px 32px 24px", textAlign: "center", borderTop: "1px solid var(--line)" }}>
        <p style={{ fontSize: 11, color: "var(--muted)", maxWidth: 700, margin: "0 auto", lineHeight: 1.6 }}>
          Finazen est un outil d&apos;aide à la décision pédagogique. Les informations présentées ne constituent pas un conseil en investissement au sens de la réglementation AMF. Investir comporte des risques de perte en capital. Les projections affichées sont issues de données de démonstration.
        </p>
      </div>
      <Footer />
    </div>
  );
}
