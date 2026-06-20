"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, Lightbulb, RefreshCw } from "lucide-react";
import Footer from "@/components/Footer";
import CompanyLogo from "@/components/CompanyLogo";
import { useUserPlan } from "@/lib/useUserPlan";

const USD_TO_EUR = 0.92;

interface Idea {
  symbol: string; name: string; price: number; currency: string;
  change: number; signal: string; score: number; reason: string; sector?: string;
}

interface IdeasResponse {
  ideas: Idea[];
  plan: string;
  limit: number;
  total: number;
}

const SIG_LABEL: Record<string, string> = {
  STRONG_BUY: "Très sous-évalué", BUY: "Sous-évalué", HOLD: "Neutre",
  SELL: "À surveiller", STRONG_SELL: "Surévalué",
};
const SIG_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  STRONG_BUY: { bg: "#1F5C3E",            color: "#F6F2E8",            border: "#1F5C3E" },
  BUY:        { bg: "rgba(45,125,90,0.12)", color: "var(--signal-up)",  border: "rgba(45,125,90,0.30)" },
  HOLD:       { bg: "var(--paper-3)",       color: "var(--muted)",      border: "var(--line)" },
  SELL:       { bg: "rgba(176,125,0,0.10)", color: "#7A5A1F",           border: "rgba(176,125,0,0.30)" },
  STRONG_SELL:{ bg: "rgba(184,74,58,0.10)", color: "var(--signal-down)",border: "rgba(184,74,58,0.30)" },
};

function SignalBadge({ signal }: { signal: string }) {
  const s = SIG_STYLE[signal] ?? SIG_STYLE.HOLD;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: "nowrap", flexShrink: 0 }}>
      {(signal === "STRONG_BUY" || signal === "BUY") && <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.color, flexShrink: 0 }} />}
      {SIG_LABEL[signal] ?? signal}
    </span>
  );
}

export default function IdeesPage() {
  const [ideasData, setIdeasData] = useState<IdeasResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [date] = useState(new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));

  const { plan: userPlan, isGuest, loading: planLoading } = useUserPlan();

  useEffect(() => {
    // Wait for plan to be known before fetching ideas (avoids double-fetch)
    if (planLoading) return;

    fetch("/api/ideas?count=15")
      .then(r => r.json())
      .then(d => {
        // Handle both old array format and new object format
        if (Array.isArray(d)) {
          setIdeasData({ ideas: d, plan: "investisseur", limit: d.length, total: d.length });
        } else {
          setIdeasData(d);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [planLoading]);

  const ideas = ideasData?.ideas ?? [];
  const total = ideasData?.total ?? 15;
  const limit = ideasData?.limit ?? 0;

  const top    = ideas.filter(i => i.signal === "STRONG_BUY" || i.signal === "BUY");
  const others = ideas.filter(i => i.signal !== "STRONG_BUY" && i.signal !== "BUY");

  return (
    <div style={{ background: "var(--paper)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 28px 80px" }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.12em", fontFamily: "var(--font-geist-mono, monospace)", marginBottom: 20, textTransform: "uppercase", display: "flex", gap: 8 }}>
          <Link href="/" style={{ color: "var(--muted)" }}>Finazen</Link>
          <span>/</span>
          <Link href="/watchlist" style={{ color: "var(--muted)" }}>Mes actions</Link>
          <span>/</span>
          <span>Idées du jour</span>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Lightbulb size={20} strokeWidth={1.8} color="var(--accent)" />
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Idées du jour
            </div>
          </div>
          <h1 style={{ fontFamily: "var(--font-instrument, serif)", fontWeight: 400, fontSize: "clamp(36px, 5vw, 58px)", letterSpacing: "-0.02em", lineHeight: 1.05, margin: "0 0 16px" }}>
            15 opportunités sélectionnées <em style={{ fontStyle: "italic", color: "var(--accent)" }}>aujourd'hui</em>.
          </h1>
          <p style={{ fontSize: 16, color: "var(--muted)", maxWidth: 620, lineHeight: 1.65, margin: 0 }}>
            Notre modèle analyse chaque jour l'ensemble de l'univers d'investissement et identifie les entreprises au meilleur profil risque/rendement. La liste change entièrement chaque matin.
          </p>

          {/* Meta row */}
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 20, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}>
              <RefreshCw size={13} strokeWidth={1.8} /> Mis à jour le {date}
            </span>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--line)" }} />
            <span style={{ fontSize: 13, color: "var(--muted)" }}>{ideas.length} entreprises analysées</span>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--line)" }} />
            <span style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600 }}>{top.length} signaux favorables</span>
          </div>
        </div>

        {/* Note pédagogique */}
        <div style={{ background: "var(--accent-soft)", border: "1px solid rgba(45,125,90,0.22)", borderRadius: 14, padding: "14px 18px", marginBottom: 40, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
          <p style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.65, margin: 0 }}>
            Ces idées sont générées automatiquement à partir des fondamentaux, de la dynamique de marché et des valorisations. Elles ne constituent pas un conseil en investissement — c'est un point de départ pour ta propre analyse. L'horizon recommandé est <strong>3 à 5 ans minimum</strong>.
          </p>
        </div>

        {/* Guest — invite à se connecter */}
        {isGuest && !loading && (
          <div style={{
            background: "var(--paper-2)", border: "1.5px solid var(--line)",
            borderRadius: 18, padding: "40px 36px", textAlign: "center",
          }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>🔒</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", marginBottom: 10 }}>
              Connecte-toi pour voir les idées du jour
            </h2>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.65, marginBottom: 24, maxWidth: 480, margin: "0 auto 24px" }}>
              Crée un compte gratuit pour accéder aux 3 meilleures idées du jour. Passe au plan Investisseur pour les 10 idées complètes.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/auth/signup" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "11px 24px", borderRadius: 9999,
                background: "var(--accent)", color: "#fff",
                fontWeight: 600, fontSize: 14, textDecoration: "none",
              }}>
                Créer un compte gratuit
              </Link>
              <Link href="/auth/login" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "11px 24px", borderRadius: 9999,
                border: "1.5px solid var(--line)", color: "var(--ink)",
                fontWeight: 500, fontSize: 14, textDecoration: "none",
              }}>
                Me connecter
              </Link>
            </div>
          </div>
        )}

        {/* Loading */}
        {!isGuest && loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {Array(15).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 14 }} />)}
          </div>
        )}

        {/* No ideas */}
        {!isGuest && !loading && ideas.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 24px", color: "var(--muted)" }}>
            <p>Impossible de charger les idées du jour. Réessayez dans quelques instants.</p>
          </div>
        )}

        {/* Ideas list */}
        {!isGuest && !loading && ideas.length > 0 && (
          <>
            {/* Top picks */}
            {top.length > 0 && (
              <div style={{ marginBottom: 48 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", margin: 0 }}>⭐ Signaux favorables</h2>
                  <span style={{ fontSize: 11, color: "var(--accent)", background: "var(--accent-soft)", padding: "3px 10px", borderRadius: 9999, fontFamily: "var(--font-geist-mono, monospace)", fontWeight: 600 }}>{top.length} entreprises</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                  {top.map(idea => <IdeaCard key={idea.symbol} idea={idea} featured />)}
                </div>
              </div>
            )}

            {/* Others */}
            {others.length > 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", margin: 0 }}>À surveiller</h2>
                  <span style={{ fontSize: 11, color: "var(--muted)", background: "var(--paper-3)", padding: "3px 10px", borderRadius: 9999, fontFamily: "var(--font-geist-mono, monospace)", fontWeight: 600 }}>{others.length} entreprises</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                  {others.map(idea => <IdeaCard key={idea.symbol} idea={idea} />)}
                </div>
              </div>
            )}

            {/* Bandeau upgrade si free (3 idées affichées sur 15) */}
            {userPlan === "free" && limit < total && (
              <div style={{
                marginTop: 40, background: "var(--paper-2)",
                border: "1.5px solid rgba(45,125,90,0.30)",
                borderRadius: 16, padding: "24px 28px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                flexWrap: "wrap", gap: 16,
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>
                    🔒 {total - limit} autres idées disponibles
                  </div>
                  <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
                    Voir les 10 idées complètes avec le plan Investisseur.
                  </p>
                </div>
                <Link href="/tarifs" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "11px 22px", borderRadius: 9999,
                  background: "var(--accent)", color: "#fff",
                  fontWeight: 600, fontSize: 14, textDecoration: "none",
                }}>
                  Passer au plan Investisseur →
                </Link>
              </div>
            )}
          </>
        )}

        {/* CTA */}
        {!isGuest && (
          <div style={{ marginTop: 64, background: "var(--paper-2)", border: "1.5px solid var(--line)", borderRadius: 18, padding: "32px 36px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", margin: "0 0 8px" }}>Ajouter une idée à ta watchlist</h3>
              <p style={{ fontSize: 14, color: "var(--muted)", margin: 0 }}>Clique sur une carte, puis sur "Analyser" pour voir l'analyse complète avant de décider.</p>
            </div>
            <Link href="/watchlist" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 22px", borderRadius: 9999, background: "var(--accent)", color: "#fff", fontWeight: 600, fontSize: 14 }}>
              Voir mes actions →
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

/* ── Idea card ── */
function IdeaCard({ idea, featured = false }: { idea: Idea; featured?: boolean }) {
  const isUp  = idea.change >= 0;
  const eur   = idea.currency === "USD" ? idea.price * USD_TO_EUR : idea.price;
  const eurFmt = eur >= 1000 ? `${eur.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} €` : `${eur.toFixed(2)} €`;

  return (
    <Link href={`/stock/${idea.symbol}`} style={{ textDecoration: "none" }}>
      <div style={{
        background: featured ? "linear-gradient(180deg, rgba(45,125,90,0.04) 0%, var(--paper-2) 100%)" : "var(--paper-2)",
        border: `1.5px solid ${featured ? "rgba(45,125,90,0.25)" : "var(--line)"}`,
        borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 12,
        transition: "transform 0.18s, border-color 0.18s", height: "100%", cursor: "pointer",
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.borderColor = featured ? "rgba(45,125,90,0.50)" : "var(--border-hover)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "none"; (e.currentTarget as HTMLElement).style.borderColor = featured ? "rgba(45,125,90,0.25)" : "var(--line)"; }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
            <CompanyLogo symbol={idea.symbol} name={idea.name} size={36} radius={9} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{idea.name}</div>
              {idea.sector && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{idea.sector}</div>}
            </div>
          </div>
          <SignalBadge signal={idea.signal} />
        </div>

        {/* Reason */}
        <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.65, margin: 0, flex: 1 }}>{idea.reason}</p>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px dashed var(--line)" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-instrument, serif)" }}>{eurFmt}</div>
            <div style={{ fontSize: 12, fontFamily: "var(--font-geist-mono, monospace)", color: isUp ? "var(--signal-up)" : "var(--signal-down)", display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}>
              {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {isUp ? "+" : ""}{(idea.change * 100).toFixed(2)} %
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--font-instrument, serif)", fontSize: 20, color: idea.score >= 70 ? "var(--signal-up)" : idea.score >= 50 ? "#b07d00" : "var(--signal-down)" }}>{idea.score}</div>
            <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)" }}>/100</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
