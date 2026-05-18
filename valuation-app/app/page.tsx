"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import StockCard from "@/components/StockCard";
import ScrollDecorations from "@/components/ScrollDecorations";
import { useScrollReveal } from "@/hooks/useScrollReveal";

interface TrendingStock {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  currency: string;
}

const FEATURES = [
  {
    icon: "🤖",
    title: "Valorisation IA",
    desc: "Calcul automatique de la valeur intrinsèque via DCF, P/E, EV/EBITDA. Signal STRONG_BUY à STRONG_SELL instantané.",
  },
  {
    icon: "📊",
    title: "Suivi de portefeuille",
    desc: "Tracking P&L en temps réel, répartition sectorielle, performance sur 1 mois à 5 ans.",
  },
  {
    icon: "🎯",
    title: "Conseiller patrimonial IA",
    desc: "Questionnaire en 8 étapes. L'IA construit votre portefeuille personnalisé sans jargon financier.",
  },
  {
    icon: "⭐",
    title: "Watchlist personnalisée",
    desc: "Suivez vos actions favorites. Scores de valorisation mis à jour chaque jour.",
  },
  {
    icon: "📈",
    title: "Métriques fondamentales",
    desc: "P/E, PEG, EV/EBITDA, marge nette, croissance du CA — tout affiché clairement, sans tableau.",
  },
  {
    icon: "🌍",
    title: "Multi-marchés",
    desc: "NYSE, NASDAQ, Euronext Paris, London Stock Exchange, ETFs. Couverture internationale complète.",
  },
];

const STATS = [
  { value: "2 400+", label: "Analyses réalisées" },
  { value: "180+", label: "Actions couvertes" },
  { value: "4.8/5", label: "Satisfaction utilisateurs" },
  { value: "100%", label: "Gratuit en beta" },
];

const STEPS = [
  { step: "01", title: "Recherchez une action", desc: "Entrez le nom ou le ticker — Apple, LVMH, Nvidia, ETF World..." },
  { step: "02", title: "L'IA analyse", desc: "Valorisation multi-méthodes, score de risque, comparaison sectorielle automatique." },
  { step: "03", title: "Décidez en confiance", desc: "Signal clair, explications en français, sans abonnement ni jargon financier." },
];

const PRICING_ITEMS = [
  "Valorisation IA illimitée",
  "Watchlist jusqu'à 50 actions",
  "Portefeuille simulé",
  "Conseiller patrimonial IA",
  "Données en temps réel",
  "Support par email",
];

export default function HomePage() {
  const [trending, setTrending] = useState<TrendingStock[]>([]);
  const [loading, setLoading] = useState(true);

  useScrollReveal();

  useEffect(() => {
    fetch("/api/trending")
      .then((r) => r.json())
      .then((d) => { setTrending(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ position: "relative" }}>

      {/* Parallax decorations — fixed, behind everything */}
      <ScrollDecorations />

      {/* ─────────────────────────────────────────
          1. HERO
      ───────────────────────────────────────── */}
      <section style={{
        position: "relative", zIndex: 10,
        overflow: "hidden",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", textAlign: "center",
        padding: "100px 24px 80px",
        minHeight: "90vh",
      }}>
        {/* Background glow orbs */}
        <div style={{ position: "absolute", top: -120, left: "20%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,138,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 60, right: "10%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,123,255,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />

        {/* Live badge */}
        <div className="reveal" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "6px 16px", borderRadius: 20, marginBottom: 28,
          border: "1px solid rgba(0,212,138,0.3)", background: "rgba(0,212,138,0.08)",
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent-green)", display: "inline-block", animation: "pulse 2s ease-in-out infinite" }} />
          <span style={{ fontSize: 13, color: "var(--accent-green)", fontWeight: 500 }}>Données en temps réel · Beta gratuit</span>
        </div>

        {/* Headline */}
        <h1 className="reveal reveal-delay-1" style={{
          fontSize: "clamp(36px, 7vw, 72px)", fontWeight: 800,
          letterSpacing: "-2px", lineHeight: 1.07,
          maxWidth: 820, margin: "0 auto 24px",
        }}>
          Découvrez si une action{" "}
          <span style={{ color: "var(--accent-green)" }}>vaut ce qu'elle coûte</span>
        </h1>

        <p className="reveal reveal-delay-2" style={{
          fontSize: "clamp(16px, 2vw, 20px)", color: "var(--text-secondary)",
          maxWidth: 560, margin: "0 auto 40px", lineHeight: 1.65,
        }}>
          Valorisation instantanée par l'IA. Analyse fondamentale, score de risque
          et signal d'achat/vente — sans jargon, pour tout le monde.
        </p>

        {/* Search */}
        <div className="reveal reveal-delay-2" style={{ width: "100%", maxWidth: 560, marginBottom: 32 }}>
          <SearchBar />
        </div>

        {/* CTAs */}
        <div className="reveal reveal-delay-3" style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginBottom: 36 }}>
          <Link href="/auth/signup" style={{
            padding: "14px 28px", borderRadius: 12,
            background: "var(--accent-green)", color: "#0a0b0d",
            fontWeight: 700, fontSize: 15, transition: "opacity 0.15s",
          }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Commencer gratuitement →
          </Link>
          <a href="#how-it-works" style={{
            padding: "14px 28px", borderRadius: 12,
            border: "1px solid var(--border)", color: "var(--text-secondary)",
            fontWeight: 500, fontSize: 15, transition: "border-color 0.15s",
          }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          >
            Voir comment ça marche
          </a>
        </div>

        {/* Social proof micro */}
        <div className="reveal reveal-delay-4" style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", fontSize: 13, color: "var(--text-muted)" }}>
          <span>⭐ 4.8/5 satisfaction beta</span>
          <span>·</span>
          <span>2 400+ analyses réalisées</span>
          <span>·</span>
          <span>100% gratuit</span>
        </div>

        {/* Dashboard preview */}
        <div className="reveal reveal-delay-4" style={{
          marginTop: 64, width: "100%", maxWidth: 960,
          borderRadius: 20, border: "1px solid var(--border)",
          background: "rgba(255,255,255,0.03)", backdropFilter: "blur(8px)",
          overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
        }}>
          {/* Replace this block with: <img src="/dashboard-preview.png" alt="StockSense dashboard" style={{ width: "100%", display: "block" }} /> */}
          <div style={{ padding: "20px 20px 0", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
            <span style={{ marginLeft: 12, fontSize: 11, color: "var(--text-muted)" }}>stocksense.app/portfolio</span>
          </div>
          <div style={{ padding: 28 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Valeur totale", value: "24 870 €", color: "var(--text-primary)" },
                { label: "Investi", value: "20 000 €", color: "var(--text-secondary)" },
                { label: "Plus-value", value: "+4 870 €", color: "var(--accent-green)" },
                { label: "Performance", value: "+24,3 %", color: "var(--accent-green)" },
              ].map((c) => (
                <div key={c.label} style={{ padding: "14px 16px", background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>{c.label}</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: c.color }}>{c.value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { symbol: "AAPL", name: "Apple Inc.", pct: "+38,2 %", pos: true },
                { symbol: "NVDA", name: "NVIDIA Corporation", pct: "+112,4 %", pos: true },
                { symbol: "MC.PA", name: "LVMH Moët Hennessy", pct: "-8,1 %", pos: false },
              ].map((row) => (
                <div key={row.symbol} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "var(--bg-card)", borderRadius: 10, border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(59,123,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "var(--accent-blue)" }}>{row.symbol.slice(0, 4)}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{row.name}</div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{row.symbol}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: row.pos ? "var(--accent-green)" : "var(--accent-red)" }}>{row.pct}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, padding: "6px 10px", borderRadius: 8, background: "rgba(0,212,138,0.06)", border: "1px solid rgba(0,212,138,0.15)", fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>
              Exemple · Données fictives à titre illustratif
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          2. STATS
      ───────────────────────────────────────── */}
      <section style={{
        position: "relative", zIndex: 10,
        borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)",
        padding: "48px 24px",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 32, textAlign: "center" }}>
          {STATS.map((s, i) => (
            <div key={s.label} className={`reveal reveal-delay-${i + 1}`}>
              <div style={{ fontSize: 36, fontWeight: 800, color: "var(--accent-green)", letterSpacing: "-1px" }}>{s.value}</div>
              <div style={{ marginTop: 4, fontSize: 13, color: "var(--text-muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────
          3. FEATURES
      ───────────────────────────────────────── */}
      <section style={{ position: "relative", zIndex: 10, padding: "96px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <div className="reveal" style={{ textAlign: "center", marginBottom: 64 }}>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, letterSpacing: "-0.8px", marginBottom: 12 }}>
            Tout ce dont vous avez besoin
          </h2>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 520, margin: "0 auto" }}>
            StockSense combine analyse fondamentale, IA et données de marché dans un seul outil simple.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          {FEATURES.map((f, i) => (
            <div key={f.title}
              className={`reveal reveal-delay-${(i % 3) + 1}`}
              style={{
                padding: "28px 24px", borderRadius: 16,
                border: "1px solid var(--border)",
                background: "var(--bg-card)",
                transition: "border-color 0.2s, transform 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,212,138,0.3)";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, letterSpacing: "-0.3px" }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────
          4. HOW IT WORKS
      ───────────────────────────────────────── */}
      <section id="how-it-works" style={{
        position: "relative", zIndex: 10,
        padding: "96px 24px",
        background: "rgba(255,255,255,0.015)",
        borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <div className="reveal">
            <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, letterSpacing: "-0.8px", marginBottom: 12 }}>Comment ça marche</h2>
            <p style={{ fontSize: 16, color: "var(--text-secondary)", marginBottom: 64 }}>Trois étapes, moins de 30 secondes.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 40 }}>
            {STEPS.map((s, i) => (
              <div key={s.step} className={`reveal reveal-delay-${i + 1}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                <div style={{ fontSize: 56, fontWeight: 900, color: "rgba(0,212,138,0.2)", letterSpacing: "-3px" }}>{s.step}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.3px" }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          5. TRENDING STOCKS
      ───────────────────────────────────────── */}
      <section style={{ position: "relative", zIndex: 10, maxWidth: 1100, margin: "0 auto", padding: "96px 24px" }}>
        <div className="reveal" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 6 }}>Actions du jour</h2>
            <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>Sélection mise à jour chaque jour</p>
          </div>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </span>
        </div>
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 16 }} />)}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {trending.map((stock) => (
              <StockCard key={stock.symbol} {...stock} />
            ))}
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────
          6. PRICING
      ───────────────────────────────────────── */}
      <section style={{
        position: "relative", zIndex: 10,
        padding: "96px 24px",
        background: "rgba(255,255,255,0.015)",
        borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ maxWidth: 440, margin: "0 auto", textAlign: "center" }}>
          <div className="reveal">
            <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, letterSpacing: "-0.8px", marginBottom: 12 }}>Tarifs</h2>
            <p style={{ fontSize: 16, color: "var(--text-secondary)", marginBottom: 40 }}>Simple. Gratuit pendant toute la beta.</p>
          </div>
          <div className="reveal reveal-delay-1" style={{
            borderRadius: 20, border: "1px solid rgba(0,212,138,0.3)",
            background: "rgba(0,212,138,0.04)", padding: "40px 36px",
          }}>
            <div style={{ fontSize: 64, fontWeight: 900, color: "var(--accent-green)", letterSpacing: "-3px", lineHeight: 1 }}>0 €</div>
            <div style={{ marginTop: 8, fontSize: 15, color: "var(--text-muted)", marginBottom: 36 }}>Accès complet · Aucune carte bancaire</div>
            <ul style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 14, marginBottom: 36, listStyle: "none", padding: 0 }}>
              {PRICING_ITEMS.map((item) => (
                <li key={item} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, color: "var(--text-secondary)" }}>
                  <span style={{ color: "var(--accent-green)", fontWeight: 700, fontSize: 16 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/auth/signup" style={{
              display: "block", textAlign: "center",
              padding: "15px", borderRadius: 12,
              background: "var(--accent-green)", color: "#0a0b0d",
              fontWeight: 700, fontSize: 15, transition: "opacity 0.15s",
            }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Créer un compte gratuit
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          7. CONSEILLER CTA
      ───────────────────────────────────────── */}
      <section style={{ position: "relative", zIndex: 10, maxWidth: 1100, margin: "0 auto", padding: "96px 24px 80px" }}>
        <div className="reveal" style={{
          position: "relative", overflow: "hidden",
          padding: "60px 40px", borderRadius: 24,
          background: "linear-gradient(135deg, rgba(59,123,255,0.12) 0%, rgba(123,90,255,0.12) 100%)",
          border: "1px solid rgba(123,90,255,0.25)",
          textAlign: "center",
        }}>
          <div style={{ position: "absolute", top: -80, left: -80, width: 280, height: 280, borderRadius: "50%", background: "rgba(59,123,255,0.1)", filter: "blur(60px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -80, right: -80, width: 280, height: 280, borderRadius: "50%", background: "rgba(123,90,255,0.1)", filter: "blur(60px)", pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 20, border: "1px solid rgba(123,90,255,0.35)", background: "rgba(123,90,255,0.1)", marginBottom: 20 }}>
              <span>🎯</span>
              <span style={{ fontSize: 13, color: "var(--accent-purple)", fontWeight: 500 }}>Conseiller IA</span>
            </div>
            <h2 style={{ fontSize: "clamp(22px, 4vw, 36px)", fontWeight: 800, letterSpacing: "-0.8px", marginBottom: 14 }}>
              Vous ne savez pas par où commencer ?
            </h2>
            <p style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 500, margin: "0 auto 36px", lineHeight: 1.65 }}>
              Faites le test en 2 minutes et obtenez une recommandation de portefeuille entièrement personnalisée selon votre profil et vos objectifs.
            </p>
            <Link href="/advisor" style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              padding: "16px 36px", borderRadius: 14,
              background: "linear-gradient(135deg, #3b7bff, #7b5aff)",
              color: "#fff", fontWeight: 700, fontSize: 16,
              boxShadow: "0 8px 32px rgba(59,123,255,0.35)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 12px 40px rgba(59,123,255,0.45)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 8px 32px rgba(59,123,255,0.35)";
              }}
            >
              ✨ Créer mon portefeuille gratuit
            </Link>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 16 }}>
              Sans inscription obligatoire · Résultat immédiat · 100% gratuit
            </p>
          </div>
        </div>

        {/* Legal disclaimer */}
        <p className="reveal" style={{
          fontSize: 12, color: "var(--text-muted)", textAlign: "center",
          maxWidth: 680, margin: "40px auto 0", lineHeight: 1.6, padding: "0 16px",
        }}>
          StockSense est un outil d'aide à la décision. Les informations fournies ne constituent pas un conseil en investissement au sens de la réglementation AMF. Investir comporte des risques de perte en capital.
        </p>
      </section>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.9); }
        }
      `}</style>
    </div>
  );
}
