"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import StockCard from "@/components/StockCard";

interface TrendingStock {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  currency: string;
}

export default function HomePage() {
  const [trending, setTrending] = useState<TrendingStock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/trending")
      .then((r) => r.json())
      .then((d) => { setTrending(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px" }}>

      {/* ── Hero ── */}
      <div style={{ textAlign: "center", marginBottom: 72 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "6px 14px", borderRadius: 20,
          border: "1px solid rgba(59,123,255,0.25)", background: "rgba(59,123,255,0.08)",
          marginBottom: 20,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-green)", display: "inline-block", animation: "pulse 2s ease-in-out infinite" }} />
          <span style={{ fontSize: 13, color: "var(--accent-blue)", fontWeight: 500 }}>Données en temps réel</span>
        </div>

        <h1 style={{ fontSize: "clamp(32px, 6vw, 56px)", fontWeight: 800, letterSpacing: "-1.5px", lineHeight: 1.1, marginBottom: 16 }}>
          Découvrez si une action
          <br />
          <span className="gradient-text">vaut ce qu'elle coûte</span>
        </h1>

        <p style={{ fontSize: 18, color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto 36px", lineHeight: 1.6 }}>
          Valorisation instantanée par l'IA. Sans jargon. Pour tout le monde.
        </p>

        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <SearchBar />
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
          {["Apple", "Tesla", "LVMH", "Nvidia", "Amazon"].map((name) => (
            <span key={name} style={{ fontSize: 12, color: "var(--text-muted)", padding: "3px 10px", borderRadius: 6, border: "1px solid var(--border)" }}>{name}</span>
          ))}
        </div>
      </div>

      {/* ── 1. Comment ça marche ── */}
      <div style={{ marginBottom: 80 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 8 }}>Comment ça marche</h2>
          <p style={{ fontSize: 15, color: "var(--text-secondary)" }}>Trois étapes, trente secondes.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          {[
            { emoji: "🔍", title: "Recherchez", desc: "Tapez le nom d'une entreprise ou son symbole boursier. Nous couvrons des milliers d'actions sur tous les marchés mondiaux." },
            { emoji: "⚡", title: "Analyse instantanée", desc: "Notre modèle calcule automatiquement la valeur intrinsèque en croisant DCF, P/E sectoriel et rendement FCF, adapté à chaque secteur." },
            { emoji: "📊", title: "Décidez", desc: "Obtenez un signal clair — Acheter, Conserver ou Vendre — avec la marge de sécurité estimée et les forces et risques identifiés." },
          ].map((s, i) => (
            <div key={s.title} style={{
              position: "relative", padding: "28px 24px",
              background: "var(--bg-card)", borderRadius: 16,
              border: "1px solid var(--border)",
              transition: "border-color 0.2s, transform 0.2s",
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(59,123,255,0.35)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
            >
              <div style={{ position: "absolute", top: 20, right: 20, width: 28, height: 28, borderRadius: 8, background: "rgba(59,123,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--accent-blue)" }}>{i + 1}</div>
              <div style={{ fontSize: 36, marginBottom: 16 }}>{s.emoji}</div>
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 8, letterSpacing: "-0.3px" }}>{s.title}</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 2. Pourquoi StockSense ── */}
      <div style={{ marginBottom: 80, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 8 }}>Pourquoi StockSense ?</h2>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 28, lineHeight: 1.6 }}>
            Investir intelligemment ne devrait pas nécessiter un diplôme en finance.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { icon: "🚫", label: "Pas de tableurs", desc: "Tout est calculé automatiquement, en temps réel." },
              { icon: "💬", label: "Pas de jargon", desc: "Des signaux clairs : Acheter, Conserver, Vendre." },
              { icon: "⚡", label: "Une réponse en 30 secondes", desc: "Recherchez, lisez, décidez. C'est tout." },
              { icon: "🎁", label: "Gratuit pour commencer", desc: "Accès immédiat, sans carte bancaire." },
            ].map((b) => (
              <div key={b.label} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(59,123,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{b.icon}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{b.label}</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 3. Exemple de résultat ── */}
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", top: -10, right: -10, zIndex: 1, background: "rgba(10,11,13,0.85)", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 10px", fontSize: 11, color: "var(--text-muted)", backdropFilter: "blur(8px)" }}>
            Exemple · Données fictives
          </div>
          <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border)", padding: 24, userSelect: "none" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #1d1d1f, #333)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🍎</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>Apple Inc.</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>AAPL · NASDAQ</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 22, fontWeight: 800 }}>187,45 $</div>
                <div style={{ fontSize: 13, color: "var(--accent-green)", fontWeight: 600 }}>+2,34 %</div>
              </div>
            </div>

            {/* Signal badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, padding: "12px 16px", borderRadius: 12, background: "rgba(0,212,138,0.08)", border: "1px solid rgba(0,212,138,0.2)" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--accent-green)", flexShrink: 0 }} />
              <div>
                <span style={{ fontWeight: 700, fontSize: 14, color: "var(--accent-green)" }}>STRONG BUY</span>
                <span style={{ fontSize: 13, color: "var(--text-secondary)", marginLeft: 8 }}>Décote estimée de 24 %</span>
              </div>
            </div>

            {/* Métriques */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[
                { label: "Valeur estimée", value: "246,00 $", color: "var(--accent-green)" },
                { label: "Prix actuel", value: "187,45 $", color: "var(--text-primary)" },
                { label: "Marge de sécurité", value: "+31,2 %", color: "var(--accent-green)" },
              ].map((m) => (
                <div key={m.label} style={{ padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>{m.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* Forces */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {["Rentabilité solide (ROE 35%)", "Marges opérationnelles excellentes", "Dividende attractif (0.9%)"].map((s) => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-secondary)" }}>
                  <span style={{ color: "var(--accent-green)", fontSize: 14 }}>✓</span>{s}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Pour qui ── */}
      <div style={{ marginBottom: 80 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 8 }}>Pour qui ?</h2>
          <p style={{ fontSize: 15, color: "var(--text-secondary)" }}>StockSense s'adapte à votre niveau et vos objectifs.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {[
            { emoji: "🌱", profile: "Le débutant qui commence à épargner", desc: "Vous mettez de côté 50 € par mois et vous ne savez pas comment les faire fructifier. StockSense vous guide sans jargon, avec un conseiller IA qui construit votre premier portefeuille.", color: "#00d48a" },
            { emoji: "📈", profile: "L'actif qui gère son PEA", desc: "Vous suivez déjà vos actions mais vous perdez du temps à éplucher les bilans. StockSense calcule la valeur intrinsèque en un clic et vous alerte sur les meilleures opportunités.", color: "#3b7bff" },
            { emoji: "🏖️", profile: "Le futur retraité qui prépare l'avenir", desc: "Vous investissez sur le long terme et voulez sécuriser votre capital progressivement. StockSense analyse le risque de chaque position et simule l'évolution de votre portefeuille sur 10 ans.", color: "#7b5aff" },
          ].map((p) => (
            <div key={p.profile} style={{
              padding: "28px 24px", background: "var(--bg-card)", borderRadius: 16,
              border: "1px solid var(--border)", transition: "border-color 0.2s, transform 0.2s",
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = p.color + "40"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
            >
              <div style={{ fontSize: 40, marginBottom: 16 }}>{p.emoji}</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10, letterSpacing: "-0.3px", color: p.color }}>{p.profile}</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.65 }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Actions du jour ── */}
      <div style={{ marginBottom: 80 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px" }}>Actions du jour</h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>Sélection mise à jour chaque jour</p>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </div>
        </div>
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 16 }} />)}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {trending.map((stock) => <StockCard key={stock.symbol} {...stock} />)}
          </div>
        )}
      </div>

      {/* ── 5. CTA Conseiller IA ── */}
      <div style={{
        position: "relative", overflow: "hidden",
        padding: "52px 40px", borderRadius: 24,
        background: "linear-gradient(135deg, rgba(59,123,255,0.15) 0%, rgba(123,90,255,0.15) 100%)",
        border: "1px solid rgba(123,90,255,0.25)",
        textAlign: "center",
      }}>
        {/* Orbs décoratifs */}
        <div style={{ position: "absolute", top: -60, left: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(59,123,255,0.12)", filter: "blur(40px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(123,90,255,0.12)", filter: "blur(40px)", pointerEvents: "none" }} />

        <div style={{ position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 20, border: "1px solid rgba(123,90,255,0.35)", background: "rgba(123,90,255,0.1)", marginBottom: 20 }}>
            <span style={{ fontSize: 13 }}>🎯</span>
            <span style={{ fontSize: 13, color: "var(--accent-purple)", fontWeight: 500 }}>Conseiller IA</span>
          </div>

          <h2 style={{ fontSize: "clamp(22px, 4vw, 34px)", fontWeight: 800, letterSpacing: "-0.8px", marginBottom: 12 }}>
            Vous ne savez pas par où commencer ?
          </h2>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto 32px", lineHeight: 1.6 }}>
            Faites le test en 2 minutes et obtenez une recommandation de portefeuille entièrement personnalisée selon votre profil et vos objectifs.
          </p>
          <Link href="/advisor" style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            padding: "15px 32px", borderRadius: 14,
            background: "linear-gradient(135deg, #3b7bff, #7b5aff)",
            color: "#fff", fontWeight: 700, fontSize: 16,
            boxShadow: "0 8px 32px rgba(59,123,255,0.35)",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 12px 40px rgba(59,123,255,0.45)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 8px 32px rgba(59,123,255,0.35)"; }}
          >
            ✨ Créer mon portefeuille gratuit
          </Link>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 16 }}>
            Sans inscription obligatoire · Résultat immédiat · 100% gratuit
          </p>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.9); }
        }
      `}</style>
    </div>
  );
}
