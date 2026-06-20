"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Sparkles, AlertCircle } from "lucide-react";
import Footer from "@/components/Footer";

const FAQS = [
  { q: "Comment est calculée la valeur intrinsèque ?", a: "Notre modèle combine plusieurs méthodes de valorisation : le DCF (flux de trésorerie actualisés), les ratios PER historique et forward, et le rendement FCF. Les poids varient selon le secteur — par exemple, les banques sont valorisées principalement par le Price/Book, les utilities par le DCF. Le résultat est une estimation, pas une certitude." },
  { q: "Que signifient les signaux de valorisation ?", a: "Ces signaux indiquent l'écart entre le cours actuel et la valeur intrinsèque estimée : Forte décote (>+25%), Sous-évalué (+10% à +25%), Neutre (-20% à +10%), À surveiller (-30% à -20%), Surévalué (<-30%). Un signal Sous-évalué signifie que l'action semble décotée selon notre modèle." },
  { q: "Les données sont-elles en temps réel ?", a: "Les prix sont fournis par Yahoo Finance avec un léger délai (15-20 min pour la plupart des marchés). Les données financières (BPA, marges) sont mises à jour trimestriellement lors des publications de résultats." },
  { q: "Puis-je faire confiance aux valorisations pour investir ?", a: "Non — ces valorisations sont des estimations quantitatives basées sur des données publiques. Elles ne remplacent pas l'analyse fondamentale approfondie ni le conseil d'un professionnel agréé. Utilisez-les comme un premier filtre, pas comme une décision d'investissement." },
  { q: "Comment fonctionnent les profils d'investisseur ?", a: "Le questionnaire situe ton profil parmi 4 profils-types (Prudent, Équilibré, Dynamique, Offensif) à partir de quelques réponses (horizon, tolérance au risque, objectifs). Pour chaque profil-type, nous présentons un exemple générique de répartition entre ETF et actions, identique pour tous les utilisateurs de ce profil." },
  { q: "Est-ce que Finazen me donne un conseil personnalisé ?", a: "Non. Finazen n'est pas un conseiller en investissements financiers (CIF) et n'est pas inscrit à l'ORIAS. Les exemples de répartition par profil-type sont des contenus pédagogiques génériques, non adaptés à ta situation personnelle, et ne constituent pas une recommandation personnalisée au sens du Code monétaire et financier. Avant d'investir, fais tes propres recherches ou consulte un CIF inscrit à l'ORIAS." },
  { q: "Quels marchés sont couverts ?", a: "Tous les marchés accessibles via Yahoo Finance : NYSE, NASDAQ, Euronext Paris (.PA), Amsterdam (.AS), Bruxelles (.BR), London Stock Exchange (.L), et bien d'autres. Utilisez le suffixe Yahoo Finance pour les marchés européens (ex: AI.PA pour Air Liquide)." },
  { q: "Comment ajouter un ETF à mon portefeuille ?", a: "Dans l'onglet Portefeuille, cliquez '+ Ajouter', saisissez le symbole Yahoo Finance de l'ETF (ex: IWDA.AS, CW8.PA, SP5.PA). Le type ETF sera détecté automatiquement et le nom sera rempli." },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [question, setQuestion]   = useState("");
  const [answer, setAnswer]       = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const [aiError, setAiError]     = useState<string | null>(null);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true); setAnswer(null); setAiError(null);
    try {
      const res = await fetch("/api/faq", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question }) });
      const data = await res.json();
      if (data.error) setAiError(data.error);
      else setAnswer(data.answer);
    } catch {
      setAiError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "var(--paper)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 28px 64px" }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 28 }}>
          <Link href="/" style={{ color: "var(--muted)" }}>Accueil</Link>
          <span style={{ margin: "0 6px" }}>›</span>
          <span style={{ color: "var(--ink)", fontWeight: 600 }}>FAQ</span>
        </div>

        <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.5px", color: "var(--ink)", marginBottom: 8 }}>
          Questions fréquentes
        </h1>
        <p style={{ fontSize: 15, color: "var(--muted)", marginBottom: 36, lineHeight: 1.65 }}>
          Tout ce que vous devez savoir sur Finazen et ses fonctionnalités.
        </p>

        {/* Accordion */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 40 }}>
          {FAQS.map((faq, i) => (
            <div key={i}
              style={{
                background: "var(--paper-2)", border: "1.5px solid var(--line)",
                borderRadius: 14, overflow: "hidden", cursor: "pointer",
                transition: "border-color 0.15s",
              }}
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", gap: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", lineHeight: 1.4 }}>{faq.q}</span>
                <span style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: "var(--paper-3)", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Plus size={14} strokeWidth={2} color="var(--muted)"
                    style={{ transform: openIndex === i ? "rotate(45deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                  />
                </span>
              </div>
              {openIndex === i && (
                <div style={{
                  padding: "0 20px 16px", paddingTop: 14,
                  fontSize: 13, lineHeight: 1.8, color: "var(--muted)",
                  borderTop: "1px solid var(--line)",
                }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* AI Q&A */}
        <div style={{ background: "var(--paper-2)", border: "1.5px solid var(--line)", borderRadius: 16, padding: "24px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, background: "var(--accent-soft)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Sparkles size={15} strokeWidth={1.8} color="var(--accent)" />
            </div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>Poser une question à l&apos;IA</h2>
          </div>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 18 }}>
            Votre question n&apos;est pas dans la liste ? Notre assistant répond en français sur tous les sujets liés à la finance.
          </p>

          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ex: Quelle est la différence entre un ETF et un fonds commun de placement ?"
            rows={3}
            onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) handleAsk(); }}
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 12,
              border: "1.5px solid var(--line)", background: "#fff",
              color: "var(--ink)", fontSize: 13, resize: "vertical",
              fontFamily: "inherit", lineHeight: 1.65, outline: "none",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(45,125,90,0.12)"; }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = "var(--line)";   e.currentTarget.style.boxShadow = "none"; }}
          />

          <button onClick={handleAsk} disabled={loading || !question.trim()}
            style={{
              marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6,
              padding: "9px 20px", borderRadius: 9999,
              background: "var(--accent)", color: "#fff", fontWeight: 600, fontSize: 13, border: "none",
              cursor: loading || !question.trim() ? "not-allowed" : "pointer",
              opacity: loading || !question.trim() ? 0.55 : 1,
              transition: "opacity 0.15s",
            }}
          >
            <Sparkles size={13} strokeWidth={2} />
            {loading ? "L'IA réfléchit…" : "Poser la question"}
          </button>

          {answer && (
            <div style={{
              marginTop: 18, padding: "14px 16px", borderRadius: 10,
              background: "var(--accent-soft)", border: "1px solid rgba(45,125,90,0.20)",
              fontSize: 13, lineHeight: 1.8, color: "var(--ink)",
            }}>
              {answer}
            </div>
          )}

          {aiError && (
            <div style={{
              marginTop: 18, padding: "12px 16px", borderRadius: 10,
              background: "rgba(184,74,58,0.06)", border: "1px solid rgba(184,74,58,0.20)",
              fontSize: 13, color: "var(--signal-down)",
              display: "flex", alignItems: "flex-start", gap: 8,
            }}>
              <AlertCircle size={14} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
              {aiError}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
