"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { AuthChangeEvent, Session, UserResponse } from "@supabase/supabase-js";
import { Search, ChevronRight } from "lucide-react";
import TickerTape from "@/components/TickerTape";

/* ── types ─────────────────────────────────────────────────────── */
interface LiveStock {
  symbol: string;
  name: string;
  market: string;
  price: number;
  change: number;
  gaugeScore: number;
  signal: string;
  pe: number;
  peg: number;
  evebitda: number;
  loaded: boolean;
}

/* ── demo fallback ─────────────────────────────────────────────── */
const DEMO_FALLBACK: LiveStock[] = [
  { symbol: "AAPL",  name: "Apple Inc.",  market: "NASDAQ",   price: 192.40, change: +0.62, gaugeScore:  10, signal: "HOLD", pe: 29.1, peg: 1.8, evebitda: 22.4, loaded: false },
  { symbol: "MC.PA", name: "LVMH",        market: "Euronext", price: 768.10, change: -0.91, gaugeScore:   0, signal: "HOLD", pe: 21.3, peg: 1.4, evebitda: 14.2, loaded: false },
  { symbol: "MSFT",  name: "Microsoft",   market: "NASDAQ",   price: 415.60, change: +0.82, gaugeScore:  10, signal: "HOLD", pe: 34.2, peg: 2.1, evebitda: 25.8, loaded: false },
  { symbol: "TSLA",  name: "Tesla",       market: "NASDAQ",   price: 172.40, change: -2.10, gaugeScore: -30, signal: "SELL", pe: 58.3, peg: 3.2, evebitda: 42.1, loaded: false },
];

/* ── static content ─────────────────────────────────────────────── */
const STEPS = [
  {
    n: "1", label: "Profil",
    title: "Dis-nous ce que tu veux faire de ton argent.",
    desc: "Quelques questions claires — durée, montant, tolérance au risque — et on calcule ton profil d'investisseur.",
    vis: [
      { k: "Horizon", v: "10 ans", color: "#14201A" },
      { k: "Montant initial", v: "1 000 €", color: "#14201A" },
      { k: "Profil détecté", v: "Équilibré", color: "#1F5C3E" },
    ],
  },
  {
    n: "2", label: "Recommandation",
    title: "Reçois un portefeuille prêt à acheter.",
    desc: "Une sélection d'actions et de fonds avec les pourcentages exacts, des explications en clair, et la performance attendue.",
    vis: [
      { k: "Fonds diversifié mondial", v: "45 %", color: "#14201A" },
      { k: "Grandes entreprises",      v: "35 %", color: "#14201A" },
      { k: "Placements défensifs",     v: "20 %", color: "#14201A" },
    ],
  },
  {
    n: "3", label: "Suivi",
    title: "On t'alerte quand quelque chose bouge.",
    desc: "Variations notables, opportunités, rééquilibrages : tu reçois une notification simple, lisible, sans bruit inutile.",
    vis: [
      { k: "Apple · achat conseillé", v: "+12 %", color: "#2F7D52" },
      { k: "Sanofi · à surveiller",  v: "−4 %",  color: "#B84A3E" },
      { k: "Rééquilibrage suggéré", v: "2 lignes", color: "#14201A" },
    ],
  },
];

const TESTIMONIALS = [
  {
    initials: "CL", name: "Camille L.", role: "Designer · 28 ans · Lyon",
    gradient: "linear-gradient(135deg,#1F5C3E,#2F7D52)",
    quote: "J'ai ajouté mes premières actions à ma liste de suivi et j'ai reçu une alerte dès que l'une d'elles a basculé en signal d'achat. Sans Rently j'aurais raté le moment.",
  },
  {
    initials: "TM", name: "Thomas M.", role: "Développeur · 34 ans · Nantes",
    gradient: "linear-gradient(135deg,#C9A24E,#8E6E2C)",
    quote: "Le score sur 100, les signaux visuels, le graphique de répartition — en deux minutes je vois si mon portefeuille est équilibré. C'est exactement ce qu'il me fallait.",
  },
  {
    initials: "SR", name: "Sarah R.", role: "Médecin · 41 ans · Bordeaux",
    gradient: "linear-gradient(135deg,#3A3E33,#14201A)",
    quote: "Je ne comprenais rien à la bourse. Rently traduit tout en français clair, avec des recommandations concrètes. J'ai enfin un portefeuille qui me ressemble.",
  },
];

const FAQ_ITEMS = [
  {
    q: "Est-ce que Rently gère mon argent ?",
    a: "Non. Rently est un outil d'analyse et de recommandation. Tu gardes le contrôle total et tu passes tes ordres chez ton courtier habituel (Boursorama, Trade Republic, Degiro, etc.).",
  },
  {
    q: "Combien faut-il pour commencer ?",
    a: "À partir de 50 € grâce aux investissements fractionnés. Nos simulations partent souvent de 1 000 € car c'est un montant illustratif courant — mais le service marche à toute échelle.",
  },
  {
    q: "D'où viennent vos données ?",
    a: "Des bourses (Euronext, Nasdaq, NYSE) via des fournisseurs de données officiels. Les analyses sont produites par nos modèles, calibrés sur 30 ans d'historique.",
  },
  {
    q: "Est-ce que c'est risqué ?",
    a: "Investir comporte des risques de perte en capital. Rently te propose des allocations diversifiées calibrées à ton profil, mais aucun rendement n'est garanti — ni par nous, ni par personne.",
  },
  {
    q: "Vais-je vraiment rester gratuit ?",
    a: "Pendant la phase beta, oui — sans carte bancaire. À terme, l'analyse de base restera gratuite ; seules les fonctionnalités avancées (alertes en temps réel, multi-portefeuilles) deviendront payantes.",
  },
  {
    q: "Mes données sont-elles en sécurité ?",
    a: "On ne te demande aucune information sensible (pas de RIB, pas d'accès courtier). Les emails sont chiffrés au repos, hébergés en France, conformément au RGPD.",
  },
];

const FOOTER_COLS = [
  {
    title: "Produit",
    links: [
      { label: "Portefeuille", href: "/portfolio" },
      { label: "Analyse d'action", href: "/#analyse" },
      { label: "Conseiller", href: "/advisor" },
      { label: "Alertes", href: "/parametres/alertes" },
    ],
  },
  {
    title: "Apprendre",
    links: [
      { label: "Guide débutant", href: "/faq" },
      { label: "Glossaire", href: "/glossaire" },
      { label: "Blog", href: "/faq" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Société",
    links: [
      { label: "À propos", href: "/" },
      { label: "Presse", href: "/" },
      { label: "Carrières", href: "/" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Légal",
    links: [
      { label: "Mentions légales", href: "/mentions-legales" },
      { label: "Confidentialité", href: "/confidentialite" },
      { label: "CGU", href: "/" },
      { label: "Cookies", href: "/" },
    ],
  },
];

/* ── live search hook ──────────────────────────────────────────── */
function useLiveSearch() {
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<{ symbol: string; name: string; exchange: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    const id = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const d = await r.json();
        setResults(d);
        setOpen(true);
      } finally { setLoading(false); }
    }, 280);
    return () => clearTimeout(id);
  }, [query]);

  return { query, setQuery, results, loading, open, setOpen };
}

/* ══════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const router    = useRouter();
  const search    = useLiveSearch();
  const analysisRef = useRef<HTMLElement>(null);

  const [, setUser]        = useState<{ email?: string } | null>(null);
  const [liveStocks, setLiveStocks] = useState<LiveStock[]>(DEMO_FALLBACK);
  const [horizon, setHorizon]       = useState<10 | 20>(10);
  const [openFaq, setOpenFaq]       = useState<number | null>(0);

  /* ── computed ── */
  const portfolioFv = Math.round(1000 * Math.pow(1.07, horizon));
  const livretFv    = Math.round(1000 * Math.pow(1.024, horizon)); // Livret A taux actuel 2,4 %
  const aapl        = liveStocks[0]; // Apple as showcase stock

  /* ── computed analysis scores (live from API data) ── */
  const overallScore   = Math.round(50 + aapl.gaugeScore / 2);
  const valScore       = aapl.pe  > 0 ? Math.min(95, Math.max(20, Math.round(100 - (aapl.pe  - 8) * 1.8))) : 55;
  const growScore      = aapl.peg > 0 ? Math.min(95, Math.max(20, Math.round(100 - aapl.peg  * 18)))        : 55;
  const solidScore     = Math.min(95, Math.max(40, overallScore + 6));
  const momentumScore  = Math.min(95, Math.max(40, overallScore + (aapl.change >= 0 ? 5 : -5)));
  const verdictTitle   = (({ STRONG_BUY: "Excellente opportunité d'achat", BUY: "Bonne opportunité à long terme", HOLD: "Valorisation correcte, à surveiller", SELL: "Légèrement surévalué", STRONG_SELL: "Fortement surévalué" } as Record<string,string>)[aapl.signal]) ?? "Analyse en cours…";

  /* ── auth ── */
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then((res: UserResponse) => setUser(res.data.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_e: AuthChangeEvent, s: Session | null) => setUser(s?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  /* ── fetch live stock data for analysis section ── */
  useEffect(() => {
    DEMO_FALLBACK.forEach((stock, idx) => {
      fetch(`/api/stock/${stock.symbol}`)
        .then((r) => r.ok ? r.json() : null)
        .then((d) => {
          if (!d || d.error) return;
          const apiScore: number = d.valuation?.score ?? 50;
          const gaugeScore = (apiScore - 50) * 2;
          setLiveStocks((prev) => {
            const next = [...prev];
            next[idx] = {
              symbol:    d.symbol ?? stock.symbol,
              name:      d.name ?? stock.name,
              market:    d.exchange ?? stock.market,
              price:     d.currentPrice ?? stock.price,
              change:    parseFloat(((d.changePercent ?? 0) * 100).toFixed(2)),
              gaugeScore,
              signal:    d.valuation?.signal ?? stock.signal,
              pe:        parseFloat((d.trailingPE || d.forwardPE || stock.pe).toFixed(1)),
              peg:       parseFloat((d.pegRatio || stock.peg).toFixed(1)),
              evebitda:  parseFloat((d.enterpriseToEbitda || stock.evebitda).toFixed(1)),
              loaded:    true,
            };
            return next;
          });
        })
        .catch(() => {});
    });
  }, []);

  const handleSearchGo = (symbol: string) => {
    search.setQuery(""); search.setOpen(false);
    router.push(`/stock/${symbol}`);
  };

  /* ── svg helpers ── */
  const LogoMark = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
      <path d="M4 18 L10 12 L14 16 L20 6"/>
      <path d="M14 6 L20 6 L20 12"/>
    </svg>
  );

  const CheckSvg = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2F7D52"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  );

  const ArrowSvg = () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/>
      <path d="m12 5 7 7-7 7"/>
    </svg>
  );

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  return (
    <div style={{ background: "#EFE9DC", color: "#14201A" }}>

      {/* ── Ticker tape ─────────────────────────────────────────── */}
      <TickerTape />

      {/* ════════════════════════════════════════════════════════════
          1. HERO
      ════════════════════════════════════════════════════════════ */}
      <section style={{ padding: "96px 32px 72px" }}>
        <div className="home-hero-grid" style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 64, alignItems: "center" }}>

          {/* ── Left column ── */}
          <div>
            {/* Eyebrow pill */}
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              fontSize: 13, color: "#1F5C3E",
              background: "#D6E4D6", padding: "6px 14px",
              borderRadius: 9999, border: "1px solid #2F7D5225", marginBottom: 24,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2F7D52", display: "inline-block" }} />
              Beta gratuit · Aucune carte bancaire requise
            </span>

            {/* H1 */}
            <h1 style={{
              fontFamily: "var(--font-instrument, Georgia, serif)",
              fontWeight: 400,
              fontSize: "clamp(48px, 6.4vw, 92px)",
              lineHeight: 1.02,
              letterSpacing: "-0.02em",
              color: "#14201A",
              margin: "0 0 28px",
            }}>
              <span className="hero-strike">1 000 € en livret</span><br />
              ou <span style={{ color: "#1F5C3E", fontStyle: "italic" }}>1 967 €</span> investis<br />
              intelligemment.
            </h1>

            {/* Subtitle */}
            <p style={{ fontSize: 19, color: "#3A3E33", maxWidth: 620, margin: "0 0 36px", lineHeight: 1.5 }}>
              Rently te montre,{" "}
              <strong style={{ color: "#14201A", fontWeight: 600 }}>en deux minutes et sans jargon</strong>,{" "}
              comment construire un portefeuille adapté à ton profil — avec les bonnes actions, au bon moment.
            </p>

            {/* CTAs */}
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 18 }}>
              <Link href="/advisor" className="hero-btn-primary">
                Trouver mon portefeuille
                <span style={{ width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "#FFFFFF20" }}>
                  <ArrowSvg />
                </span>
              </Link>
              <button
                onClick={() => analysisRef.current?.scrollIntoView({ behavior: "smooth" })}
                className="hero-btn-ghost"
              >
                Analyser une action
              </button>
            </div>

            {/* Trust line */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", fontSize: 13, color: "#7A7768" }}>
              {["Sans inscription", "Résultat immédiat", "100 % gratuit"].map((label, i) => (
                <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  {i > 0 && <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#C9C0A8", display: "inline-block" }} />}
                  <CheckSvg />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* ── Right column: Showcase card ── */}
          <div className="showcase-card">
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#7A7768" }}>
                <span style={{ fontSize: 11, color: "#1F5C3E", background: "#D6E4D6", padding: "3px 8px", borderRadius: 9999, fontWeight: 500 }}>
                  Simulation
                </span>
                1 000 € · horizon {horizon} ans
              </div>
              {/* 10 / 20 ans toggle */}
              <div style={{ display: "flex", gap: 4, background: "#EFE9DC", border: "1px solid #D9D1BD", borderRadius: 9999, padding: 3, fontSize: 12 }}>
                {([10, 20] as const).map((h) => (
                  <button key={h} onClick={() => setHorizon(h)} style={{
                    border: "none",
                    background: h === horizon ? "#14201A" : "transparent",
                    color: h === horizon ? "#F6F2E8" : "#7A7768",
                    padding: "4px 10px", borderRadius: 9999,
                    cursor: "pointer", fontFamily: "inherit", fontWeight: 500, fontSize: 12,
                  }}>
                    {h} ans
                  </button>
                ))}
              </div>
            </div>

            {/* Compare grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {/* Livret A */}
              <div style={{ border: "1px solid #D9D1BD", borderRadius: 14, padding: 16, background: "#FFFFFF40" }}>
                <div style={{ fontSize: 12, color: "#7A7768", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18"/>
                  </svg>
                  Livret A · 2,4 %/an
                </div>
                <div style={{ fontFamily: "var(--font-instrument, serif)", fontSize: 34, lineHeight: 1.1, letterSpacing: "-0.01em" }}>
                  {livretFv.toLocaleString("fr-FR")} €
                </div>
                <div style={{ fontSize: 12, color: "#7A7768", marginTop: 4 }}>
                  +{(livretFv - 1000).toLocaleString("fr-FR")} € · gain réel limité
                </div>
              </div>

              {/* Portfolio */}
              <div style={{ border: "1px solid #2F7D5240", borderRadius: 14, padding: 16, background: "linear-gradient(180deg,#E9F0E5 0%,#F2F4E8 100%)" }}>
                <div style={{ fontSize: 12, color: "#7A7768", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1F5C3E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 18 L10 12 L14 16 L20 6"/>
                  </svg>
                  <span style={{ color: "#1F5C3E" }}>Portefeuille Rently · ~7 %/an</span>
                </div>
                <div style={{ fontFamily: "var(--font-instrument, serif)", fontSize: 34, lineHeight: 1.1, letterSpacing: "-0.01em", color: "#1F5C3E" }}>
                  {portfolioFv.toLocaleString("fr-FR")} €
                </div>
                <div style={{ fontSize: 12, color: "#7A7768", marginTop: 4 }}>
                  +{(portfolioFv - 1000).toLocaleString("fr-FR")} € · soit{" "}
                  <strong style={{ color: "#1F5C3E" }}>×{(portfolioFv / 1000).toFixed(1)}</strong> sur le capital
                </div>
              </div>
            </div>

            {/* Sparkline */}
            <svg viewBox="0 0 460 60" preserveAspectRatio="none" style={{ height: 54, width: "100%", marginTop: 14 }}>
              <defs>
                <linearGradient id="sparkGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#2F7D52" stopOpacity={0.35}/>
                  <stop offset="100%" stopColor="#2F7D52" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <path d="M0,50 L40,48 L80,46 L120,42 L160,40 L200,36 L240,30 L280,28 L320,22 L360,18 L400,12 L460,6"
                fill="none" stroke="#1F5C3E" strokeWidth="2.2"/>
              <path d="M0,50 L40,48 L80,46 L120,42 L160,40 L200,36 L240,30 L280,28 L320,22 L360,18 L400,12 L460,6 L460,60 L0,60 Z"
                fill="url(#sparkGrad)"/>
              <path d="M0,55 L460,52" fill="none" stroke="#9C9583" strokeWidth="1.5" strokeDasharray="3 4"/>
              <rect x="4" y="43" width="58" height="12" rx="3" fill="#F6F2E8" opacity="0.9"/>
              <text x="7" y="52" fontFamily="var(--font-geist-mono,monospace)" fontSize="8.5" fill="#3A3E33" fontWeight="600">Livret A · 2,4%</text>
            </svg>

            {/* Chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
              {[["Apple", "+8.2%"], ["LVMH", "+6.4%"], ["Fonds Monde", "+7.1%"], ["Sanofi", "+4.9%"], ["L'Oréal", "+5.6%"]].map(([sym, pct]) => (
                <span key={sym} style={{ fontSize: 12, background: "#EFE9DC", border: "1px solid #D9D1BD", borderRadius: 9999, padding: "5px 10px", color: "#3A3E33", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  {sym} <span style={{ color: "#2F7D52", fontWeight: 600 }}>{pct}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          2. STATS STRIP
      ════════════════════════════════════════════════════════════ */}
      <section style={{ padding: "64px 32px", borderTop: "1px solid #D9D1BD", borderBottom: "1px solid #D9D1BD", background: "#F6F2E8" }}>
        <div className="home-stats-grid" style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 30 }}>
          {[
            { value: "2 400", suffix: "+", label: "Analyses réalisées par nos algorithmes" },
            { value: "180",         suffix: "+", label: "Actions suivies — en France, aux États-Unis et en Europe" },
            { value: "2 min", suffix: "",  label: "Pour obtenir un premier portefeuille" },
            { value: "100",        suffix: "%", label: "Gratuit pendant toute la phase beta" },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontFamily: "var(--font-instrument, serif)", fontSize: 54, lineHeight: 1, letterSpacing: "-0.02em" }}>
                {s.value}
                {s.suffix && (
                  <span style={{ fontSize: 24, color: "#1F5C3E", marginLeft: 2, verticalAlign: "top" }}>{s.suffix}</span>
                )}
              </div>
              <div style={{ fontSize: 13, color: "#7A7768", marginTop: 8 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          3. COMMENT ÇA MARCHE
      ════════════════════════════════════════════════════════════ */}
      <section style={{ padding: "104px 32px", borderTop: "1px solid #D9D1BD" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 40, marginBottom: 48, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 12, color: "#1F5C3E", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                Comment ça marche
              </div>
              <h2 style={{ fontFamily: "var(--font-instrument,serif)", fontWeight: 400, fontSize: "clamp(36px,4.5vw,58px)", lineHeight: 1.05, letterSpacing: "-0.015em", margin: "14px 0 0", maxWidth: 740 }}>
                Trois étapes, <em style={{ fontStyle: "italic", color: "#1F5C3E" }}>zéro jargon</em>.
              </h2>
            </div>
            <p style={{ maxWidth: 440, color: "#3A3E33", fontSize: 17 }}>
              Pas besoin de comprendre les ratios PER ou les bandes de Bollinger.
              On traduit la finance en français — et en décisions.
            </p>
          </div>

          <div className="home-steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {STEPS.map((step) => (
              <div key={step.n} className="step-card">
                <span style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 12, color: "#7A7768", display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#1F5C3E", color: "#F6F2E8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                    {step.n}
                  </span>
                  {step.label}
                </span>
                <h3 style={{ fontFamily: "var(--font-instrument,serif)", fontWeight: 400, fontSize: 30, letterSpacing: "-0.01em", margin: 0, lineHeight: 1.1 }}>
                  {step.title}
                </h3>
                <p style={{ margin: 0, color: "#3A3E33", fontSize: 15 }}>{step.desc}</p>
                <div style={{ marginTop: "auto", background: "#EFE9DC", border: "1px solid #D9D1BD", borderRadius: 12, padding: 14, fontSize: 13 }}>
                  {step.vis.map((row, i) => (
                    <div key={row.k} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", color: "#3A3E33",
                      ...(i > 0 ? { marginTop: 8, paddingTop: 8, borderTop: "1px dashed #D9D1BD" } : {}),
                    }}>
                      <span>{row.k}</span>
                      <span style={{ fontFamily: "var(--font-geist-mono,monospace)", color: row.color }}>{row.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          4. MON PORTEFEUILLE
      ════════════════════════════════════════════════════════════ */}
      <section style={{ padding: "104px 32px", borderTop: "1px solid #D9D1BD" }}>
        <div className="home-reco-grid" style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 60, alignItems: "center" }}>

          {/* Left */}
          <div>
            <div style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 12, color: "#1F5C3E", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>
              Mon portefeuille
            </div>
            <h2 style={{ fontFamily: "var(--font-instrument,serif)", fontWeight: 400, fontSize: "clamp(36px,4.5vw,58px)", lineHeight: 1.05, letterSpacing: "-0.015em", margin: 0 }}>
              Une allocation qui te <em style={{ fontStyle: "italic", color: "#1F5C3E" }}>ressemble</em>.
            </h2>
            <p style={{ fontSize: 17, color: "#3A3E33", marginTop: 18, maxWidth: 440 }}>
              Plus qu&apos;une liste d&apos;actions, c&apos;est une stratégie pensée pour ton profil :
              diversifiée, lisible, et que tu peux comprendre ligne par ligne.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 32 }}>
              {[
                {
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}><circle cx="12" cy="12" r="9"/><path d="M12 3v9l6 3"/></svg>,
                  title: "Adapté à ton horizon",
                  desc: "2 ans, 10 ans, retraite : ton allocation évolue automatiquement avec le temps qui te reste.",
                },
                {
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}><path d="M3 3v18h18"/><path d="M7 14l4-4 4 3 5-7"/></svg>,
                  title: "Diversifié par construction",
                  desc: "Pas de paris sur une seule action : on répartit entre zones, secteurs et tailles d'entreprises.",
                },
                {
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}><path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6Z"/></svg>,
                  title: "Transparent ligne à ligne",
                  desc: "Chaque titre vient avec une raison en français — pas un score opaque.",
                },
              ].map((pt) => (
                <div key={pt.title} style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
                  <div style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 12, background: "#D6E4D6", color: "#1F5C3E", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #2F7D5225" }}>
                    {pt.icon}
                  </div>
                  <div>
                    <h4 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 600 }}>{pt.title}</h4>
                    <p style={{ margin: 0, color: "#3A3E33", fontSize: 15 }}>{pt.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Reco card */}
          <div style={{ background: "#F6F2E8", border: "1px solid #D9D1BD", borderRadius: 22, padding: 26, boxShadow: "0 30px 80px -40px #14201A40" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 14, color: "#7A7768", fontWeight: 500 }}>Portefeuille suggéré · Équilibré</div>
                <div style={{ fontFamily: "var(--font-instrument,serif)", fontSize: 24, letterSpacing: "-0.01em", marginTop: 2 }}>
                  Rendement attendu <span style={{ color: "#1F5C3E" }}>6,8 %</span> / an
                </div>
              </div>
              <span style={{ fontSize: 11, background: "#14201A", color: "#F6F2E8", padding: "4px 10px", borderRadius: 9999, fontWeight: 500, whiteSpace: "nowrap" }}>
                Mis à jour aujourd&apos;hui
              </span>
            </div>

            {/* Donut + legend */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ position: "relative", width: 170, height: 170, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="170" height="170" viewBox="0 0 42 42" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#D9D1BD" strokeWidth="6"/>
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#1F5C3E" strokeWidth="6" strokeDasharray="45 55" strokeDashoffset="25"/>
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#2F7D52" strokeWidth="6" strokeDasharray="35 65" strokeDashoffset="-20"/>
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#C9A24E" strokeWidth="6" strokeDasharray="20 80" strokeDashoffset="-55"/>
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-instrument,serif)", fontSize: 32, lineHeight: 1, color: "#1F5C3E" }}>6,8 %</div>
                  <div style={{ fontSize: 11, color: "#7A7768", marginTop: 4 }}>rendement / an</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, justifyContent: "center" }}>
                {[
                  { color: "#1F5C3E", label: "Fonds mondial",        pct: "45 %" },
                  { color: "#2F7D52", label: "Grandes entreprises",  pct: "35 %" },
                  { color: "#C9A24E", label: "Placements défensifs", pct: "20 %" },
                ].map((item) => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: item.color, flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    <span style={{ fontFamily: "var(--font-geist-mono,monospace)", color: "#14201A" }}>{item.pct}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Holdings */}
            <div style={{ marginTop: 18, borderTop: "1px dashed #D9D1BD", paddingTop: 16 }}>
              {[
                { logo: "A", name: "Amundi MSCI World", price: "€512,30",  change: "+1,84 %", up: true  },
                { logo: "L", name: "LVMH",              price: "€768,10",  change: "−0,91 %", up: false },
                { logo: "L", name: "L'Oréal",           price: "€412,30",  change: "+0,55 %", up: true  },
                { logo: "A", name: "Apple Inc.",         price: "€177,40",  change: "+0,62 %", up: true  },
              ].map((h, i) => (
                <div key={h.name} style={{
                  display: "grid", gridTemplateColumns: "28px 1fr auto auto",
                  gap: 12, alignItems: "center", padding: "8px 0", fontSize: 13,
                  ...(i > 0 ? { borderTop: "1px dashed #D9D1BD" } : {}),
                }}>
                  <span style={{ width: 28, height: 28, borderRadius: 8, background: "#EFE9DC", color: "#3A3E33", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-geist-mono,monospace)", fontSize: 11, fontWeight: 600, border: "1px solid #D9D1BD" }}>
                    {h.logo}
                  </span>
                  <span style={{ color: "#3A3E33", fontWeight: 500 }}>
                    {h.name}
                  </span>
                  <span style={{ fontFamily: "var(--font-geist-mono,monospace)", color: "#14201A" }}>{h.price}</span>
                  <span style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 12, color: h.up ? "#2F7D52" : "#B84A3E" }}>{h.change}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          5. ANALYSE D'ACTION
      ════════════════════════════════════════════════════════════ */}
      <section ref={analysisRef} id="analyse" style={{ padding: "104px 32px 0" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ background: "#E8E0CE", borderRadius: 24, padding: 48, border: "1px solid #D9D1BD" }}>

            {/* Section header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 30, flexWrap: "wrap", marginBottom: 32 }}>
              <div style={{ maxWidth: 560 }}>
                <div style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 12, color: "#1F5C3E", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>
                  Analyse d&apos;action
                </div>
                <h2 style={{ fontFamily: "var(--font-instrument,serif)", fontWeight: 400, fontSize: "clamp(36px,4.5vw,58px)", lineHeight: 1.05, letterSpacing: "-0.015em", margin: 0 }}>
                  Comprendre une action <em style={{ fontStyle: "italic", color: "#1F5C3E" }}>en un coup d&apos;œil</em>.
                </h2>
              </div>
              <p style={{ maxWidth: 440, color: "#3A3E33", fontSize: 17 }}>
                Cherche n&apos;importe quel ticker. On résume les fondamentaux,
                l&apos;élan de marché et la note globale — sans avoir à parcourir 12 onglets.
              </p>
            </div>

            {/* Search */}
            <div style={{ position: "relative", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", background: "#F6F2E8", border: "1px solid #D9D1BD", borderRadius: 9999, padding: "10px 16px", gap: 10 }}>
                <Search size={16} strokeWidth={1.8} color="#7A7768" />
                <input
                  type="text"
                  value={search.query}
                  onChange={(e) => search.setQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && search.results[0]) handleSearchGo(search.results[0].symbol); }}
                  placeholder="Rechercher une action, un ticker ou un secteur…"
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#14201A", fontSize: 14, fontFamily: "inherit" }}
                />
                <button
                  onClick={() => { if (search.results[0]) handleSearchGo(search.results[0].symbol); }}
                  style={{ padding: "7px 18px", borderRadius: 9999, background: "#1F5C3E", color: "#F6F2E8", fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer", flexShrink: 0, fontFamily: "inherit" }}
                >
                  Analyser
                </button>
              </div>

              {/* Dropdown */}
              {search.open && search.results.length > 0 && (
                <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#F6F2E8", border: "1px solid #D9D1BD", borderRadius: 14, overflow: "hidden", zIndex: 100, boxShadow: "0 8px 32px rgba(10,22,40,0.12)" }}>
                  {search.results.slice(0, 6).map((r, i) => (
                    <button
                      key={r.symbol}
                      onClick={() => handleSearchGo(r.symbol)}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "transparent", border: "none", borderBottom: i < Math.min(search.results.length, 6) - 1 ? "1px solid #D9D1BD" : "none", cursor: "pointer", textAlign: "left" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#EFE9DC")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: 7, background: "#D6E4D6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#1F5C3E", flexShrink: 0 }}>
                        {r.symbol.slice(0, 3)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#14201A" }}>{r.symbol}</div>
                        <div style={{ fontSize: 11, color: "#7A7768", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                      </div>
                      <ChevronRight size={14} color="#7A7768" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Chart card + Verdict card */}
            <div className="home-analysis" style={{ display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 24 }}>

              {/* Chart card */}
              <div style={{ background: "#F6F2E8", border: "1px solid #D9D1BD", borderRadius: 18, padding: 22 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: "#000", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, fontFamily: "var(--font-geist-mono,monospace)" }}>
                      A
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>{aapl.name}</div>
                      <div style={{ fontSize: 12, color: "#7A7768" }}>{aapl.symbol} · {aapl.market}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "var(--font-instrument,serif)", fontSize: 34, lineHeight: 1, letterSpacing: "-0.01em" }}>
                      {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(aapl.price)}
                    </div>
                    <div style={{ fontSize: 13, color: aapl.change >= 0 ? "#2F7D52" : "#B84A3E", marginTop: 4 }}>
                      {aapl.change >= 0 ? "▲" : "▼"} {aapl.change >= 0 ? "+" : ""}{aapl.change.toFixed(2)} %
                    </div>
                  </div>
                </div>

                {/* Range selector */}
                <div style={{ display: "flex", gap: 4, background: "#EFE9DC", border: "1px solid #D9D1BD", borderRadius: 9999, padding: 3, fontSize: 12, width: "fit-content", margin: "14px 0" }}>
                  {["1J","5J","1M","6M","1A","5A"].map((r) => (
                    <button key={r} style={{ border: "none", background: r === "6M" ? "#14201A" : "transparent", color: r === "6M" ? "#F6F2E8" : "#7A7768", padding: "4px 10px", borderRadius: 9999, cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}>
                      {r}
                    </button>
                  ))}
                </div>

                {/* Chart SVG */}
                <svg viewBox="0 0 600 200" preserveAspectRatio="none" style={{ width: "100%", height: 200 }}>
                  <defs>
                    <linearGradient id="chartGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#2F7D52" stopOpacity={0.25}/>
                      <stop offset="100%" stopColor="#2F7D52" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <g stroke="#D9D1BD" strokeWidth="1">
                    <line x1="0" y1="40" x2="600" y2="40"/>
                    <line x1="0" y1="100" x2="600" y2="100"/>
                    <line x1="0" y1="160" x2="600" y2="160"/>
                  </g>
                  <path d="M0,140 C50,130 80,150 120,120 S200,80 250,100 S330,60 380,80 S470,50 520,40 S590,30 600,28 L600,200 L0,200 Z" fill="url(#chartGrad)"/>
                  <path d="M0,140 C50,130 80,150 120,120 S200,80 250,100 S330,60 380,80 S470,50 520,40 S590,30 600,28" fill="none" stroke="#1F5C3E" strokeWidth="2.2"/>
                  <circle cx="600" cy="28" r="4" fill="#1F5C3E"/>
                  <circle cx="600" cy="28" r="8" fill="#1F5C3E" opacity={0.2}/>
                </svg>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-geist-mono,monospace)", fontSize: 10, color: "#7A7768", marginTop: 8 }}>
                  {["Déc","Jan","Fév","Mar","Avr","Mai"].map((m) => <span key={m}>{m}</span>)}
                </div>
              </div>

              {/* Verdict card */}
              <div style={{ background: "#F6F2E8", border: "1px solid #D9D1BD", borderRadius: 18, padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Badge + title */}
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: `conic-gradient(#2F7D52 0% ${overallScore}%,#D9D1BD ${overallScore}% 100%)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", flexShrink: 0 }}>
                    <div style={{ position: "absolute", inset: 6, background: "#F6F2E8", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 16, fontWeight: 700, color: "#1F5C3E" }}>{overallScore}</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: "#7A7768", fontWeight: 500 }}>Note Rently</div>
                    <div style={{ fontFamily: "var(--font-instrument,serif)", fontWeight: 400, fontSize: 24, marginTop: 2 }}>
                      {verdictTitle}
                    </div>
                  </div>
                </div>

                {/* Score bars */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { label: "Solidité financière", val: solidScore,    color: "#1F5C3E" },
                    { label: "Croissance",           val: growScore,     color: "#2F7D52" },
                    { label: "Valorisation",         val: valScore,      color: "#C9A24E" },
                    { label: "Élan de marché",       val: momentumScore, color: "#1F5C3E" },
                  ].map((score) => (
                    <div key={score.label} style={{ display: "grid", gridTemplateColumns: "130px 1fr 36px", gap: 12, alignItems: "center", fontSize: 13 }}>
                      <span style={{ color: "#3A3E33" }}>{score.label}</span>
                      <div style={{ height: 6, background: "#EFE9DC", borderRadius: 9999, overflow: "hidden" }}>
                        <div style={{ width: `${score.val}%`, height: "100%", background: score.color, borderRadius: 9999 }} />
                      </div>
                      <span style={{ fontFamily: "var(--font-geist-mono,monospace)", textAlign: "right", color: "#14201A" }}>{score.val}</span>
                    </div>
                  ))}
                </div>

                {/* Note */}
                <div style={{ background: "#EFE9DC", border: "1px solid #D9D1BD", borderRadius: 12, padding: "12px 14px", fontSize: 13, color: "#3A3E33", fontStyle: "italic" }}>
                  « Apple reste une <strong style={{ color: "#14201A", fontStyle: "normal" }}>valeur de qualité</strong> avec des marges très solides. Le titre est légèrement cher aujourd&apos;hui — bien adapté à un investissement progressif (DCA) plutôt qu&apos;un achat en une fois. »
                </div>

                {/* CTA to full page */}
                <Link
                  href={`/stock/${aapl.symbol}`}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 9999, background: "#1F5C3E", color: "#F6F2E8", fontWeight: 500, fontSize: 14, textDecoration: "none", width: "fit-content" }}
                >
                  Voir l&apos;analyse complète
                  <ArrowSvg />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          6. TÉMOIGNAGES
      ════════════════════════════════════════════════════════════ */}
      <section style={{ padding: "104px 32px", borderTop: "1px solid #D9D1BD", marginTop: 104 }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 40, marginBottom: 48, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 12, color: "#1F5C3E", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                Ce qu&apos;ils en disent
              </div>
              <h2 style={{ fontFamily: "var(--font-instrument,serif)", fontWeight: 400, fontSize: "clamp(36px,4.5vw,58px)", lineHeight: 1.05, letterSpacing: "-0.015em", margin: "14px 0 0", maxWidth: 740 }}>
                Conçu pour ceux qui <em style={{ fontStyle: "italic", color: "#1F5C3E" }}>débutent</em> — utilisé par ceux qui investissent déjà.
              </h2>
            </div>
          </div>

          <div className="home-quotes" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {TESTIMONIALS.map((t) => (
              <article key={t.name} style={{ background: "#F6F2E8", border: "1px solid #D9D1BD", borderRadius: 18, padding: 26, display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={{ color: "#C9A24E", fontSize: 13, letterSpacing: 2 }}>★ ★ ★ ★ ★</div>
                <p style={{ fontFamily: "var(--font-instrument,serif)", fontSize: 24, lineHeight: 1.25, letterSpacing: "-0.01em", color: "#14201A", fontStyle: "italic", margin: 0 }}>
                  «&nbsp;{t.quote}&nbsp;»
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "auto" }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: t.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, color: "#F6F2E8", fontSize: 13, flexShrink: 0 }}>
                    {t.initials}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "#7A7768" }}>{t.role}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          7. FAQ
      ════════════════════════════════════════════════════════════ */}
      <section style={{ padding: "104px 32px 80px", borderTop: "1px solid #D9D1BD" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 40, marginBottom: 48, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 12, color: "#1F5C3E", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                Questions fréquentes
              </div>
              <h2 style={{ fontFamily: "var(--font-instrument,serif)", fontWeight: 400, fontSize: "clamp(36px,4.5vw,58px)", lineHeight: 1.05, letterSpacing: "-0.015em", margin: "14px 0 0", maxWidth: 740 }}>
                Tout ce que tu <em style={{ fontStyle: "italic", color: "#1F5C3E" }}>te demandes</em> avant de commencer.
              </h2>
            </div>
            <Link href="/faq" style={{ display: "inline-flex", alignItems: "center", padding: "12px 22px", borderRadius: 9999, border: "1px solid #C9C0A8", background: "transparent", color: "#14201A", fontWeight: 500, fontSize: 14, textDecoration: "none" }}>
              Voir la FAQ complète →
            </Link>
          </div>

          <div className="home-faq-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 60px", alignItems: "start" }}>
            {[FAQ_ITEMS.slice(0, 3), FAQ_ITEMS.slice(3)].map((col, ci) => (
              <div key={ci}>
                {col.map((item, i) => {
                  const idx = ci * 3 + i;
                  const isOpen = openFaq === idx;
                  return (
                    <div key={item.q} style={{ borderBottom: "1px solid #D9D1BD", padding: "18px 0" }}>
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, fontWeight: 500, fontSize: 17, color: "#14201A", width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
                      >
                        {item.q}
                        <span style={{
                          width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                          border: "1px solid #C9C0A8",
                          background: isOpen ? "#1F5C3E" : "transparent",
                          color: isOpen ? "#F6F2E8" : "#3A3E33",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transform: isOpen ? "rotate(45deg)" : "none",
                          transition: "transform 0.25s, background 0.2s",
                        }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                            <path d="M12 5v14M5 12h14"/>
                          </svg>
                        </span>
                      </button>
                      {isOpen && (
                        <p style={{ marginTop: 12, color: "#3A3E33", fontSize: 15, maxWidth: 520 }}>
                          {item.a}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          8. CTA FINAL
      ════════════════════════════════════════════════════════════ */}
      <section style={{ padding: "0 32px 96px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div className="home-cta-block" style={{ background: "#14201A", color: "#F6F2E8", borderRadius: 28, padding: "72px 56px", display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 48, alignItems: "end", position: "relative", overflow: "hidden" }}>
            {/* Decorative glow */}
            <div style={{ position: "absolute", right: -100, bottom: -200, width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(closest-side,#2F7D5260,transparent 70%)", pointerEvents: "none" }} />

            <div style={{ position: "relative", zIndex: 1 }}>
              <h2 style={{ fontFamily: "var(--font-instrument,serif)", fontWeight: 400, fontSize: "clamp(40px,5vw,72px)", lineHeight: 1.02, letterSpacing: "-0.02em", margin: 0, color: "#F6F2E8" }}>
                Prêt à voir à quoi ressemble<br />
                <em style={{ fontStyle: "italic", color: "#A8D0AF" }}>ton portefeuille</em>&nbsp;?
              </h2>
              <p style={{ color: "#C7C1AF", margin: "18px 0 0", fontSize: 17 }}>
                Deux minutes. Pas d&apos;inscription. Aucune carte bancaire. Et tu repars avec une allocation prête à investir.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14, position: "relative", zIndex: 1 }}>
              <Link href="/advisor" style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 22px", borderRadius: 9999, background: "#F6F2E8", color: "#14201A", fontWeight: 500, fontSize: 15, textDecoration: "none", transition: "background 0.2s" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#fff")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#F6F2E8")}
              >
                Trouver mon portefeuille
                <span style={{ width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "#14201A15" }}>
                  <ArrowSvg />
                </span>
              </Link>
              <button
                onClick={() => analysisRef.current?.scrollIntoView({ behavior: "smooth" })}
                style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 22px", borderRadius: 9999, background: "transparent", color: "#F6F2E8", fontWeight: 500, fontSize: 15, border: "1px solid #FFFFFF30", cursor: "pointer", fontFamily: "inherit" }}
              >
                Analyser une action
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          9. FOOTER
      ════════════════════════════════════════════════════════════ */}
      <footer style={{ padding: "60px 32px 40px", color: "#3A3E33", fontSize: 14, borderTop: "1px solid #D9D1BD", background: "#EFE9DC" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div className="home-footer-grid" style={{ display: "grid", gridTemplateColumns: "1.4fr repeat(4,1fr)", gap: 40, marginBottom: 48 }}>
            {/* Brand column */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 600, fontSize: 17, color: "#14201A", marginBottom: 14 }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: "#1F5C3E", display: "flex", alignItems: "center", justifyContent: "center", color: "#F6F2E8", flexShrink: 0 }}>
                  <LogoMark />
                </span>
                Rently
              </div>
              <p style={{ fontSize: 14, color: "#3A3E33", maxWidth: 280, lineHeight: 1.5 }}>
                Investir en bourse, sans jargon. Conçu et hébergé à Paris.
              </p>
            </div>

            {/* Link columns */}
            {FOOTER_COLS.map((col) => (
              <div key={col.title} className="home-ft-cols">
                <h6 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.12em", color: "#7A7768", margin: "0 0 14px", fontWeight: 600 }}>
                  {col.title}
                </h6>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href}
                        style={{ color: "#3A3E33", transition: "color 0.15s" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#1F5C3E")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#3A3E33")}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20, paddingTop: 24, borderTop: "1px solid #D9D1BD", fontSize: 12, color: "#7A7768" }}>
            <span>© 2026 Rently SAS · Tous droits réservés.</span>
            <span style={{ fontFamily: "var(--font-geist-mono,monospace)" }}>v0.9.4 · beta</span>
          </div>

          {/* AMF legal notice */}
          <p style={{ fontSize: 11, color: "#7A7768", marginTop: 24, lineHeight: 1.5, maxWidth: 780, fontStyle: "italic" }}>
            Les performances passées ne préjugent pas des performances futures. Investir comporte un risque de perte en capital. Rently ne fournit pas de conseil en investissement personnalisé au sens de l&apos;article L.321-1 du Code monétaire et financier. Les chiffres affichés sur cette page sont issus de données de démonstration et n&apos;engagent aucunement la société.
          </p>
        </div>
      </footer>

    </div>
  );
}
