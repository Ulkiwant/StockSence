"use client";

import { useEffect, useState } from "react";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Brand from "./Brand";

const STORAGE_KEY = "ss_onboarding_done";

/* ── Courtiers ─────────────────────────────────────────────────── */
const BROKERS = [
  {
    name: "Trade Republic",
    badge: "Idéal débutants",
    tagline: "0 € de frais · tout en mobile",
    pros: ["Dès 1 € investi", "Interface ultra-simple", "Plans d'épargne automatiques"],
    url: "https://traderepublic.com",
  },
  {
    name: "Boursorama",
    badge: "",
    tagline: "La banque en ligne française",
    pros: ["Parfait pour un PEA", "Support en français", "Interface complète"],
    url: "https://boursorama.com",
  },
  {
    name: "Degiro",
    badge: "",
    tagline: "Frais parmi les plus bas",
    pros: ["Toutes les bourses mondiales", "~1 € par ordre", "Idéal pour tout contrôler"],
    url: "https://degiro.fr",
  },
];

/* ── Types de comptes ──────────────────────────────────────────── */
const ACCOUNTS = [
  {
    code: "PEA",
    emoji: "🇫🇷",
    title: "Plan d'Épargne en Actions",
    desc: "Actions européennes. Zéro impôt sur les gains après 5 ans. Plafond 150 000 €.",
    tip: "✓ Le meilleur départ pour un Français",
    color: "#1F5C3E",
    bg: "#D6E4D6",
  },
  {
    code: "CTO",
    emoji: "🌍",
    title: "Compte-Titres Ordinaire",
    desc: "Apple, Tesla, actions asiatiques… tout est possible. Aucune limite. Imposé à 30 %.",
    tip: "✓ Indispensable pour les actions US",
    color: "#2563EB",
    bg: "#DBEAFE",
  },
  {
    code: "Assurance Vie",
    emoji: "🛡️",
    title: "Assurance Vie",
    desc: "Enveloppe fiscale avantageuse après 8 ans. Gestion déléguée ou pilotée.",
    tip: "✓ Parfait pour préparer la retraite",
    color: "#C9A24E",
    bg: "#FEF3C7",
  },
];

/* ══════════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════════════════════ */
export default function OnboardingOverlay() {
  const [visible, setVisible] = useState(false);
  const [slide, setSlide]     = useState(0);
  const router                = useRouter();

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch { /* Safari private browsing */ }
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
    setVisible(false);
  };

  const goAdvisor = () => {
    dismiss();
    router.push("/advisor");
  };

  const next = () => slide < 4 ? setSlide(s => s + 1) : dismiss();
  const back = () => slide > 0 && setSlide(s => s - 1);

  if (!visible) return null;

  /* Card plus large sur les slides 3 et 4 (steps + courtiers) */
  const wide = slide >= 3;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(10,22,40,0.70)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
      animation: "ob-fade-in 0.22s ease",
    }}>
      {/* Bouton passer */}
      <button onClick={dismiss} style={{
        position: "absolute", top: 18, right: 18,
        background: "rgba(255,255,255,0.12)",
        border: "1px solid rgba(255,255,255,0.20)",
        color: "#F6F2E8", fontSize: 12, padding: "6px 14px",
        borderRadius: 9999, cursor: "pointer",
        display: "flex", alignItems: "center", gap: 6,
        transition: "background 0.15s",
      }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.22)")}
        onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
      >
        <X size={12} /> Passer
      </button>

      {/* Carte principale */}
      <div style={{
        background: "#F6F2E8",
        border: "1.5px solid #D9D1BD",
        borderRadius: 22,
        padding: "34px 34px 26px",
        maxWidth: wide ? 740 : 520,
        width: "100%",
        maxHeight: "92vh",
        overflowY: "auto",
        boxShadow: "0 40px 100px rgba(10,22,40,0.45)",
        animation: "ob-slide-up 0.28s cubic-bezier(0.22,1,0.36,1)",
        transition: "max-width 0.3s ease",
      }}>

        {/* Indicateur de progression */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 28 }}>
          {[0,1,2,3,4].map(i => (
            <button key={i} onClick={() => setSlide(i)} style={{
              width: i === slide ? 22 : 7,
              height: 7,
              borderRadius: 9999,
              background: i === slide ? "#1F5C3E" : i < slide ? "#2F7D52" : "#D9D1BD",
              border: "none", cursor: "pointer", padding: 0,
              transition: "width 0.3s, background 0.3s",
            }} />
          ))}
        </div>

        {/* Contenu de la diapositive */}
        {slide === 0 && <Slide0 />}
        {slide === 1 && <Slide1 />}
        {slide === 2 && <Slide2 />}
        {slide === 3 && <Slide3 />}
        {slide === 4 && <Slide4 dismiss={dismiss} goAdvisor={goAdvisor} />}

        {/* Navigation (cachée sur la dernière diapo qui a ses propres CTA) */}
        {slide < 4 && (
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between",
            marginTop: 28,
          }}>
            <button onClick={back} style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "none", border: "none",
              color: "#7A7768", fontSize: 13,
              cursor: slide === 0 ? "default" : "pointer",
              opacity: slide === 0 ? 0 : 1,
              transition: "opacity 0.2s",
              fontFamily: "inherit",
            }}>
              <ChevronLeft size={14} /> Précédent
            </button>
            <button onClick={next} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "11px 26px", borderRadius: 9999,
              background: "#1F5C3E", color: "#F6F2E8",
              border: "none", fontWeight: 600, fontSize: 14,
              cursor: "pointer", fontFamily: "inherit",
              transition: "background 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = "#1A4D34")}
              onMouseLeave={e => (e.currentTarget.style.background = "#1F5C3E")}
            >
              Suivant <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes ob-fade-in  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ob-slide-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .broker-card:hover {
          border-color: #1F5C3E !important;
          box-shadow: 0 4px 16px rgba(31,92,62,0.14) !important;
        }
        @media (max-width: 680px) {
          .ob-3col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   DIAPOSITIVES
══════════════════════════════════════════════════════════════════ */

/* ── 0 · Bienvenue ───────────────────────────────────────────── */
function Slide0() {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
        <Brand size="lg" />
      </div>
      <h2 style={{
        fontFamily: "var(--font-instrument,Georgia,serif)",
        fontSize: 40, fontWeight: 400, letterSpacing: "-0.02em",
        color: "#14201A", margin: "0 0 14px", lineHeight: 1.05,
      }}>
        Bienvenue 👋
      </h2>
      <p style={{ fontSize: 17, color: "#3A3E33", lineHeight: 1.65, maxWidth: 380, margin: "0 auto 26px" }}>
        Tu es au bon endroit pour commencer à investir —{" "}
        <strong style={{ color: "#14201A" }}>sans jargon</strong>, sans te perdre.
      </p>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 10,
        background: "#EFE9DC", border: "1px solid #D9D1BD",
        borderRadius: 9999, padding: "10px 20px", fontSize: 13, color: "#3A3E33",
      }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#1F5C3E", display: "inline-block", flexShrink: 0 }} />
        <span>Intro de <strong>2 minutes</strong> · 5 diapositives</span>
      </div>
    </div>
  );
}

/* ── 1 · Qu'est-ce qu'une action ─────────────────────────────── */
function Slide1() {
  return (
    <div>
      <SlideLabel emoji="📊" label="Les bases · 1 / 3" />
      <h2 style={h2Style}>Une action, c'est quoi exactement ?</h2>

      <p style={bodyStyle}>
        Imagine que tu achètes une <strong>toute petite part</strong> d'Apple. Tu deviens
        copropriétaire de l'entreprise — à 0,000001 % certes, mais quand même.
      </p>
      <p style={{ ...bodyStyle, marginBottom: 20 }}>
        Si Apple vend plus d'iPhones et gagne plus d'argent, ta part vaut{" "}
        <strong style={{ color: "#1F5C3E" }}>plus</strong>. Si l'entreprise traverse une
        mauvaise passe, elle vaut <strong style={{ color: "#B84A3E" }}>moins</strong>.
      </p>

      {/* Analogie visuelle */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={infoBox("#EFE9DC", "#D9D1BD")}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>🏢</div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>Apple Inc.</div>
          <div style={{ fontSize: 12, color: "#7A7768" }}>3 000 milliards de $</div>
        </div>
        <div style={{ textAlign: "center", fontSize: 22 }}>→</div>
        <div style={infoBox("#D6E4D6", "#2F7D5225")}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>📄</div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>1 action AAPL</div>
          <div style={{ fontSize: 12, color: "#1F5C3E" }}>Ta part de l'entreprise</div>
        </div>
      </div>

      <InsightBox>
        <strong>💡 L'essentiel :</strong> une action ≠ jeu de hasard. C'est une part d'un vrai
        business, avec de vraies ventes et de vrais profits.
      </InsightBox>
    </div>
  );
}

/* ── 2 · Pourquoi investir ───────────────────────────────────── */
function Slide2() {
  const livretFv    = Math.round(1000 * Math.pow(1.024, 10));
  const portfolioFv = Math.round(1000 * Math.pow(1.07,  10));

  return (
    <div>
      <SlideLabel emoji="💰" label="Les bases · 2 / 3" />
      <h2 style={h2Style}>Pourquoi ne pas juste laisser à la banque&nbsp;?</h2>

      <p style={{ ...bodyStyle, marginBottom: 18 }}>
        Tu peux. Mais voici ce que ça donne avec{" "}
        <strong>1 000 € placés sur 10 ans</strong> :
      </p>

      {/* Comparaison */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
        <div style={{ border: "1px solid #D9D1BD", borderRadius: 14, padding: "18px 16px", background: "#fff" }}>
          <div style={{ fontSize: 12, color: "#7A7768", display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            🏦 Livret A · 2,4 %/an
          </div>
          <div style={{ fontFamily: "var(--font-instrument,serif)", fontSize: 36, lineHeight: 1, color: "#14201A" }}>
            {livretFv.toLocaleString("fr-FR")} €
          </div>
          <div style={{ fontSize: 12, color: "#7A7768", marginTop: 6 }}>
            +{(livretFv - 1000).toLocaleString("fr-FR")} € de gains
          </div>
        </div>
        <div style={{ border: "1px solid #2F7D5240", borderRadius: 14, padding: "18px 16px", background: "linear-gradient(160deg,#E9F0E5,#F2F4E8)" }}>
          <div style={{ fontSize: 12, color: "#1F5C3E", display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            📈 Portefeuille · ~7 %/an
          </div>
          <div style={{ fontFamily: "var(--font-instrument,serif)", fontSize: 36, lineHeight: 1, color: "#1F5C3E" }}>
            {portfolioFv.toLocaleString("fr-FR")} €
          </div>
          <div style={{ fontSize: 12, color: "#7A7768", marginTop: 6 }}>
            +{(portfolioFv - 1000).toLocaleString("fr-FR")} € de gains ·{" "}
            <strong style={{ color: "#1F5C3E" }}>×{(portfolioFv / 1000).toFixed(1)}</strong>
          </div>
        </div>
      </div>

      <InsightBox>
        <strong>⚠️ L'inflation</strong> tourne autour de 2 %/an. Ton Livret A à 2,4 % protège
        à peine ton pouvoir d'achat. Un portefeuille bien géré le fait{" "}
        <strong>vraiment grandir</strong>.
      </InsightBox>
    </div>
  );
}

/* ── 3 · Comment utiliser Rently ─────────────────────────────── */
function Slide3() {
  const steps = [
    {
      emoji: "🔍",
      title: "Cherche une action",
      desc: "Tape « Apple », « LVMH » ou « Sanofi ». Tu vois sa note (A+, B…), le prix en direct et une analyse en français.",
    },
    {
      emoji: "💬",
      title: "Pose une question à l'IA",
      desc: "« Est-ce le bon moment d'acheter Apple ? » ou « Explique-moi la note B+ ». Réponse claire en 5 secondes.",
    },
    {
      emoji: "📋",
      title: "Reçois ton portefeuille",
      desc: "Va sur « Conseiller » — réponds à 4 questions et obtiens une allocation complète, prête à copier chez ton courtier.",
    },
  ];

  return (
    <div>
      <SlideLabel emoji="⚡" label="Les bases · 3 / 3" />
      <h2 style={h2Style}>Rently en 3 minutes chrono</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {steps.map((step, i) => (
          <div key={i} style={{
            display: "flex", gap: 16, alignItems: "flex-start",
            background: "#EFE9DC", border: "1px solid #D9D1BD",
            borderRadius: 14, padding: "16px 18px",
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "#14201A", color: "#F6F2E8",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, flexShrink: 0,
            }}>
              {step.emoji}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#14201A", marginBottom: 4 }}>
                <span style={{ fontFamily: "var(--font-geist-mono,monospace)", color: "#1F5C3E", marginRight: 6, fontSize: 12 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {step.title}
              </div>
              <div style={{ fontSize: 14, color: "#3A3E33", lineHeight: 1.55 }}>{step.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 4 · Courtiers + types de comptes ────────────────────────── */
function Slide4({ dismiss, goAdvisor }: { dismiss: () => void; goAdvisor: () => void }) {
  return (
    <div>
      <SlideLabel emoji="🏛️" label="Pour passer à l'action" />
      <h2 style={{ ...h2Style, marginBottom: 6 }}>Par où acheter ses premières actions&nbsp;?</h2>
      <p style={{ fontSize: 14, color: "#7A7768", margin: "0 0 20px" }}>
        Rently analyse — les ordres se passent chez un <strong style={{ color: "#14201A" }}>courtier</strong> (gratuit ou quasi).
        En voici 3 solides :
      </p>

      {/* Courtiers */}
      <div className="ob-3col" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 24 }}>
        {BROKERS.map((b) => (
          <a key={b.name} href={b.url} target="_blank" rel="noopener noreferrer"
            style={{ textDecoration: "none", display: "block" }}>
            <div className="broker-card" style={{
              border: "1px solid #D9D1BD", borderRadius: 14,
              padding: "14px 12px", background: "#fff",
              transition: "border-color 0.15s, box-shadow 0.15s",
              height: "100%",
            }}>
              {b.badge && (
                <div style={{
                  fontSize: 10, background: "#D6E4D6", color: "#1F5C3E",
                  padding: "2px 9px", borderRadius: 9999, fontWeight: 700,
                  marginBottom: 8, display: "inline-block",
                }}>
                  {b.badge}
                </div>
              )}
              <div style={{ fontWeight: 700, fontSize: 14, color: "#14201A", marginBottom: 3 }}>
                {b.name}
              </div>
              <div style={{ fontSize: 12, color: "#7A7768", lineHeight: 1.4, marginBottom: 8 }}>
                {b.tagline}
              </div>
              {b.pros.map(p => (
                <div key={p} style={{ fontSize: 11, color: "#3A3E33", display: "flex", gap: 5, marginBottom: 3 }}>
                  <span style={{ color: "#1F5C3E", fontWeight: 700, flexShrink: 0 }}>✓</span> {p}
                </div>
              ))}
              <div style={{ marginTop: 10, fontSize: 11, color: "#1F5C3E", fontWeight: 600 }}>
                Ouvrir un compte ↗
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Séparateur */}
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#7A7768", marginBottom: 10 }}>
        Quel type de compte ouvrir ?
      </div>

      {/* PEA / CTO / AV */}
      <div className="ob-3col" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 24 }}>
        {ACCOUNTS.map((a) => (
          <div key={a.code} style={{
            border: `1.5px solid ${a.color}35`,
            borderRadius: 12, padding: "12px 12px",
            background: a.bg,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
              <span style={{ fontSize: 20 }}>{a.emoji}</span>
              <span style={{
                fontFamily: "var(--font-geist-mono,monospace)",
                fontWeight: 700, fontSize: 13, color: a.color,
              }}>
                {a.code}
              </span>
            </div>
            <div style={{ fontSize: 12, color: "#3A3E33", lineHeight: 1.5, marginBottom: 7 }}>
              {a.desc}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: a.color }}>{a.tip}</div>
          </div>
        ))}
      </div>

      {/* CTA finaux */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={dismiss} style={{
          flex: 1, minWidth: 180,
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
          padding: "13px 22px", borderRadius: 9999,
          background: "#1F5C3E", color: "#F6F2E8",
          border: "none", fontWeight: 600, fontSize: 14,
          cursor: "pointer", fontFamily: "inherit",
          transition: "background 0.15s",
        }}
          onMouseEnter={e => (e.currentTarget.style.background = "#1A4D34")}
          onMouseLeave={e => (e.currentTarget.style.background = "#1F5C3E")}
        >
          Analyser une action →
        </button>
        <button onClick={goAdvisor} style={{
          flex: 1, minWidth: 180,
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
          padding: "13px 22px", borderRadius: 9999,
          background: "transparent", color: "#14201A",
          border: "1px solid #C9C0A8", fontWeight: 500, fontSize: 14,
          cursor: "pointer", fontFamily: "inherit",
          transition: "background 0.15s",
        }}
          onMouseEnter={e => (e.currentTarget.style.background = "#EFE9DC")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          Trouver mon portefeuille
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PETITS COMPOSANTS PARTAGÉS
══════════════════════════════════════════════════════════════════ */
function SlideLabel({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
      <div style={{
        width: 40, height: 40, borderRadius: 11,
        background: "#D6E4D6", display: "flex",
        alignItems: "center", justifyContent: "center", fontSize: 20,
      }}>
        {emoji}
      </div>
      <span style={{
        fontSize: 11, color: "#1F5C3E", fontWeight: 700,
        textTransform: "uppercase", letterSpacing: "0.1em",
      }}>
        {label}
      </span>
    </div>
  );
}

function InsightBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "#EFE9DC", border: "1px solid #D9D1BD",
      borderRadius: 12, padding: "13px 16px",
      fontSize: 14, color: "#3A3E33", lineHeight: 1.55,
    }}>
      {children}
    </div>
  );
}

function infoBox(bg: string, border: string): React.CSSProperties {
  return {
    background: bg, border: `1px solid ${border}`,
    borderRadius: 12, padding: "14px 10px",
    textAlign: "center", color: "#14201A",
  };
}

/* ── Styles partagés ── */
const h2Style: React.CSSProperties = {
  fontFamily: "var(--font-instrument,Georgia,serif)",
  fontSize: 30, fontWeight: 400,
  letterSpacing: "-0.015em",
  color: "#14201A", margin: "0 0 16px", lineHeight: 1.1,
};

const bodyStyle: React.CSSProperties = {
  fontSize: 16, color: "#3A3E33",
  lineHeight: 1.65, margin: "0 0 14px",
};
