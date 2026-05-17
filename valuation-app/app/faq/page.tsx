"use client";

import { useState } from "react";
import Link from "next/link";

const FAQS = [
  { q: "Comment est calculée la valeur intrinsèque ?", a: "Notre modèle combine plusieurs méthodes de valorisation : le DCF (flux de trésorerie actualisés), les ratios P/E historique et forward, et le rendement FCF. Les poids varient selon le secteur — par exemple, les banques sont valorisées principalement par le Price/Book, les utilities par le DCF. Le résultat est une estimation, pas une certitude." },
  { q: "Que signifient les signaux STRONG_BUY, BUY, HOLD, SELL ?", a: "Ces signaux indiquent l'écart entre le cours actuel et la valeur intrinsèque estimée : STRONG_BUY (>+25%), BUY (+10% à +25%), HOLD (-20% à +10%), SELL (-30% à -20%), STRONG_SELL (<-30%). Un signal BUY signifie que l'action semble décotée selon notre modèle quantitatif." },
  { q: "Les données sont-elles en temps réel ?", a: "Les prix sont fournis par Yahoo Finance avec un léger délai (15-20 min pour la plupart des marchés). Les données financières (EPS, FCF, marges) sont mises à jour trimestriellement lors des publications de résultats." },
  { q: "Puis-je faire confiance aux valorisations pour investir ?", a: "Non — ces valorisations sont des estimations quantitatives basées sur des données publiques. Elles ne remplacent pas l'analyse fondamentale approfondie ni le conseil d'un professionnel agréé. Utilisez-les comme un premier filtre, pas comme une décision d'investissement." },
  { q: "Comment fonctionne le conseiller patrimonial IA ?", a: "Le conseiller utilise Claude (IA d'Anthropic) pour générer un portefeuille personnalisé selon votre profil : âge, tolérance au risque, horizon, capital, objectifs et préférences sectorielles. Il suggère des ETF et actions réels avec leurs symboles Yahoo Finance." },
  { q: "Quels marchés sont couverts ?", a: "Tous les marchés accessibles via Yahoo Finance : NYSE, NASDAQ, Euronext Paris (.PA), Amsterdam (.AS), Bruxelles (.BR), London Stock Exchange (.L), et bien d'autres. Utilisez le suffixe Yahoo Finance pour les marchés européens (ex: AI.PA pour Air Liquide)." },
  { q: "Comment ajouter un ETF à mon portefeuille ?", a: "Dans l'onglet Portefeuille, cliquez '+ Ajouter', saisissez le symbole Yahoo Finance de l'ETF (ex: IWDA.AS, CW8.PA, SP5.PA). Le type ETF sera détecté automatiquement et le nom sera rempli." },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer(null);
    setAiError(null);
    try {
      const res = await fetch("/api/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
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
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px" }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 32 }}>
        <Link href="/" style={{ color: "var(--text-muted)" }}>Accueil</Link>
        <span style={{ margin: "0 8px" }}>/</span>
        <span style={{ color: "var(--text-primary)" }}>FAQ</span>
      </div>

      <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 8 }}>
        Questions fréquentes
      </h1>
      <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 40, lineHeight: 1.6 }}>
        Tout ce que vous devez savoir sur StockSense et ses fonctionnalités.
      </p>

      {/* Static FAQs */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 48 }}>
        {FAQS.map((faq, i) => (
          <div
            key={i}
            className="card"
            style={{ padding: 0, overflow: "hidden", cursor: "pointer" }}
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
          >
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "18px 24px", gap: 16,
            }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{faq.q}</span>
              <span style={{
                fontSize: 18, color: "var(--text-muted)", flexShrink: 0,
                transform: openIndex === i ? "rotate(45deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
                display: "inline-block",
              }}>+</span>
            </div>
            {openIndex === i && (
              <div style={{
                padding: "0 24px 18px",
                fontSize: 13, lineHeight: 1.8, color: "var(--text-secondary)",
                borderTop: "1px solid var(--border)",
                paddingTop: 16,
              }}>
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* AI Q&A section */}
      <div className="card" style={{ padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "linear-gradient(135deg, #3b7bff, #7b5aff)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
          }}>✨</div>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Poser une question à l'IA</h2>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
          Votre question n'est pas dans la liste ? Notre assistant IA répond en français sur tous les sujets liés à la finance et à l'investissement.
        </p>

        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ex: Quelle est la différence entre un ETF et un fonds commun de placement ?"
          rows={3}
          style={{
            width: "100%", padding: "12px 14px", borderRadius: 10,
            border: "1px solid var(--border)", background: "rgba(255,255,255,0.04)",
            color: "var(--text-primary)", fontSize: 14, resize: "vertical",
            fontFamily: "inherit", boxSizing: "border-box", lineHeight: 1.6,
            outline: "none",
          }}
          onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) handleAsk(); }}
        />

        <button
          onClick={handleAsk}
          disabled={loading || !question.trim()}
          style={{
            marginTop: 12, padding: "10px 24px", borderRadius: 10,
            background: "linear-gradient(135deg, #3b7bff, #7b5aff)",
            color: "#fff", fontWeight: 600, fontSize: 14, border: "none",
            cursor: loading || !question.trim() ? "not-allowed" : "pointer",
            opacity: loading || !question.trim() ? 0.6 : 1,
            transition: "opacity 0.15s",
          }}
        >
          {loading ? "L'IA réfléchit…" : "Poser la question"}
        </button>

        {answer && (
          <div style={{
            marginTop: 20, padding: "16px 18px", borderRadius: 10,
            background: "rgba(59,123,255,0.06)", border: "1px solid rgba(59,123,255,0.15)",
            fontSize: 14, lineHeight: 1.8, color: "var(--text-secondary)",
          }}>
            {answer}
          </div>
        )}

        {aiError && (
          <div style={{
            marginTop: 20, padding: "12px 16px", borderRadius: 10,
            background: "rgba(255,71,87,0.06)", border: "1px solid rgba(255,71,87,0.15)",
            fontSize: 13, color: "var(--accent-red)",
          }}>
            {aiError}
          </div>
        )}
      </div>
    </div>
  );
}
