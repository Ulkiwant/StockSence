"use client";

import { useState } from "react";
import { Check, X, TrendingUp, TrendingDown, Download, ChevronRight, AlertTriangle, Lightbulb, RefreshCw, Briefcase } from "lucide-react";
import ScenarioAnalysis from "@/components/ScenarioAnalysis";
import SignalPill from "@/components/SignalPill";

interface Profile {
  // Étape 0 — Identité
  firstName: string;
  age: string;
  situation: string;
  family: string;
  hasEmergencyFund: boolean | null;
  // Étape 1 — Risque
  riskTolerance: string;
  reactionToDrop: string;
  involvement: string;
  // Étape 2 — Horizon
  horizon: string;
  // Étape 3 — Capital
  capital: string;
  monthly: string;
  alreadyInvested: boolean | null;
  experience: string;
  // Étape 4 — Positions existantes (conditionnel)
  existingHoldings: Array<{ symbol: string; name: string; weight: string }>;
  // Étape 5 — Objectif & dividendes
  goal: string;
  wantsDividends: string;
  taxWrapper: string[];
  // Étape 6 — Répartition
  allocationMix: string;
  geography: string;
  esgInterest: string;
  // Étape 7 — Secteurs
  favoriteSectors: string[];
  excludedSectors: string[];
}

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
}

const TOTAL_STEPS = 8;
const RISK_COLOR: Record<string, string> = { Faible: "var(--signal-up)", Modéré: "var(--signal-neutral)", Élevé: "var(--signal-down)" };

const ALL_SECTORS = [
  { id: "tech", label: "Technologie", sub: "IA, cloud, semi-conducteurs" },
  { id: "health", label: "Santé", sub: "pharma, biotech, dispositifs médicaux" },
  { id: "finance", label: "Finance", sub: "banques, assurances, fintech" },
  { id: "consumer", label: "Consommation", sub: "luxe, grande distribution, e-commerce" },
  { id: "energy", label: "Énergie verte", sub: "solaire, éolien, hydrogène" },
  { id: "realestate", label: "Immobilier", sub: "REITs, foncières cotées" },
  { id: "industry", label: "Industrie", sub: "aéronautique, défense, infrastructures" },
  { id: "materials", label: "Matières premières", sub: "métaux, mines, agriculture" },
  { id: "telecom", label: "Télécom & Médias", sub: "opérateurs, streaming, pub" },
  { id: "food", label: "Agro-alimentaire", sub: "biens de consommation courante" },
];

const EXCLUDED_SECTORS = ["Énergie fossile", "Armement", "Tabac", "Alcool", "Jeu d'argent", "Crypto"];

const emptyProfile: Profile = {
  firstName: "", age: "", situation: "", family: "", hasEmergencyFund: null,
  riskTolerance: "", reactionToDrop: "", involvement: "",
  horizon: "",
  capital: "", monthly: "0", alreadyInvested: null, experience: "",
  existingHoldings: [],
  goal: "", wantsDividends: "", taxWrapper: [],
  allocationMix: "", geography: "Mondial", esgInterest: "Non concerné",
  favoriteSectors: [], excludedSectors: [],
};

const stepLabels = ["Vous", "Risque", "Durée", "Capital", "Positions", "Objectifs", "Répartition", "Secteurs"];

export default function AdvisorPage() {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [result, setResult] = useState<PortfolioRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // État pour l'import du portefeuille
  const [importingPortfolio, setImportingPortfolio] = useState(false);

  // États locaux pour les positions existantes
  const [newExSymbol, setNewExSymbol] = useState("");
  const [newExName, setNewExName] = useState("");
  const [newExWeight, setNewExWeight] = useState("<10%");
  const [exResolving, setExResolving] = useState(false);

  // États locaux pour les actions imposées
  const [forcedStocks, setForcedStocks] = useState<ForcedStock[]>([]);
  const [forcedInput, setForcedInput] = useState("");
  const [forcedLoading, setForcedLoading] = useState(false);
  const [forcedError, setForcedError] = useState<string | null>(null);

  const set = (field: keyof Profile, value: string | string[] | boolean | Array<{ symbol: string; name: string; weight: string }>) =>
    setProfile((p) => ({ ...p, [field]: value }));

  const toggleArr = (field: "favoriteSectors" | "excludedSectors", val: string) => {
    const cur = profile[field] as string[];
    set(field, cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val]);
  };

  const handleAddForced = async () => {
    if (!forcedInput || forcedLoading) return;
    setForcedLoading(true);
    setForcedError(null);
    try {
      const res = await fetch(`/api/stock/${forcedInput}`);
      if (!res.ok) { setForcedError(`"${forcedInput}" introuvable sur Yahoo Finance.`); setForcedLoading(false); return; }
      const d = await res.json();
      if (forcedStocks.find(s => s.symbol === d.symbol)) { setForcedError("Cette action est déjà dans la liste."); setForcedLoading(false); return; }
      setForcedStocks(fs => [...fs, {
        symbol: d.symbol,
        name: d.name,
        signal: d.valuation?.signal ?? "HOLD",
        upside: d.valuation?.upside ?? 0,
        fairValue: d.valuation?.fairValue ?? d.currentPrice,
        currentPrice: d.currentPrice,
        currency: d.currency,
        confirmed: false,
      }]);
      setForcedInput("");
    } catch { setForcedError("Erreur lors de la récupération des données."); }
    setForcedLoading(false);
  };

  const submit = async () => {
    setLoading(true); setError(null);
    try {
      const confirmedForced = forcedStocks.filter(s => s.confirmed);
      const res = await fetch("/api/advisor", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          monthly: parseFloat(profile.monthly) || 0,
          existingHoldings: profile.existingHoldings,
          forcedStocks: confirmedForced.map(s => ({ symbol: s.symbol, name: s.name, signal: s.signal, upside: s.upside })),
        }),
      });
      const data = await res.json();
      if (res.status === 401) setError("Vous devez être connecté pour générer un portefeuille.");
      else if (res.status === 403) setError("Accès non autorisé.");
      else if (data.error) setError("La génération a échoué. Réessayez dans quelques instants.");
      else { setResult(data); setStep(TOTAL_STEPS + 1); }
    } catch { setError("Erreur réseau. Vérifiez votre connexion et réessayez."); }
    setLoading(false);
  };

  const progress = step <= TOTAL_STEPS ? ((step + 1) / (TOTAL_STEPS + 1)) * 100 : 100;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 20, border: "1.5px solid var(--line)", background: "var(--accent-soft)", marginBottom: 16 }}>
          <Briefcase size={14} color="var(--accent)" />
          <span style={{ fontSize: 13, color: "var(--accent)", fontWeight: 500 }}>Conseiller IA</span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 8, color: "var(--ink)" }}>
          {step <= TOTAL_STEPS
            ? (profile.firstName ? `Votre portefeuille idéal, ${profile.firstName}` : "Trouvez votre portefeuille idéal")
            : (result?.portfolioName ?? "Votre portefeuille")}
        </h1>
        {step <= TOTAL_STEPS && (
          <p style={{ fontSize: 15, color: "var(--muted)" }}>
            {stepLabels[Math.min(step, stepLabels.length - 1)]} · Étape {step + 1}/{TOTAL_STEPS + 1}
          </p>
        )}
      </div>

      {/* Progress */}
      {step <= TOTAL_STEPS && (
        <div style={{ height: 4, borderRadius: 2, background: "var(--line)", marginBottom: 40, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, borderRadius: 2, background: "var(--accent)", transition: "width 0.4s ease" }} />
        </div>
      )}

      {/* ─── ÉTAPE 0 — Identité & situation ─── */}
      {step === 0 && (
        <Section title="Faisons connaissance" sub="Ces informations personnalisent votre recommandation.">
          <Label>Votre prénom (optionnel)</Label>
          <input type="text" value={profile.firstName} onChange={(e) => set("firstName", e.target.value)}
            placeholder="ex : Quentin" style={inputSt}
            onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; e.target.style.outline = "none"; }}
            onBlur={(e) => e.target.style.borderColor = "var(--line)"} />

          <Label req>Votre tranche d'âge</Label>
          <ChipRow>
            {["Moins de 25 ans", "25–35 ans", "35–45 ans", "45–55 ans", "Plus de 55 ans"].map((a) => (
              <Chip key={a} label={a} active={profile.age === a} onClick={() => set("age", a)} />
            ))}
          </ChipRow>

          <Label req>Situation professionnelle</Label>
          <ChipRow>
            {["Salarié(e)", "Indépendant(e) / Chef d'entreprise", "Étudiant(e)", "En recherche d'emploi", "Retraité(e)"].map((s) => (
              <Chip key={s} label={s} active={profile.situation === s} onClick={() => set("situation", s)} />
            ))}
          </ChipRow>

          <Label req>Situation familiale</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { v: "Célibataire sans enfant", d: "Plus de liberté pour prendre des risques." },
              { v: "En couple sans enfant", d: "Double revenu possible, bonne capacité d'épargne." },
              { v: "Parent avec enfant(s) à charge", d: "Prudence pour protéger la famille." },
              { v: "Parent avec enfants autonomes", d: "Retour à une plus grande liberté financière." },
            ].map((o) => <Card key={o.v} title={o.v} desc={o.d} selected={profile.family === o.v} onClick={() => set("family", o.v)} />)}
          </div>

          <Label req>Avez-vous une épargne de précaution (3–6 mois de dépenses) ?</Label>
          <div style={{ display: "flex", gap: 10 }}>
            <Card title="Oui" desc="Je suis serein(e) en cas d'imprévu." selected={profile.hasEmergencyFund === true} onClick={() => set("hasEmergencyFund", true)} />
            <Card title="Non / En cours" desc="Je préfère la constituer en priorité." selected={profile.hasEmergencyFund === false} onClick={() => set("hasEmergencyFund", false)} />
          </div>

          <Nav onBack={() => {}} onNext={() => setStep(1)} hideBack nextDisabled={!profile.age || !profile.situation || !profile.family || profile.hasEmergencyFund === null} />
        </Section>
      )}

      {/* ─── ÉTAPE 1 — Risque ─── */}
      {step === 1 && (
        <Section title="Votre rapport au risque" sub="Soyez honnête — un portefeuille bien calibré est plus efficace qu'un portefeuille trop ambitieux.">
          <Label req>Votre profil de risque</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { v: "Conservateur", d: "Sécurité avant tout. Faibles variations, faibles gains." },
              { v: "Équilibré", d: "Performance et sécurité. Fluctuations modérées acceptées." },
              { v: "Dynamique", d: "Croissance maximale. Fortes variations à court terme acceptées." },
            ].map((o) => <Card key={o.v} title={o.v} desc={o.d} selected={profile.riskTolerance === o.v} onClick={() => set("riskTolerance", o.v)} />)}
          </div>

          <Label req>Si votre portefeuille perd 20 % en 1 mois, vous…</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { v: "Je vends tout immédiatement", d: "La perte me panique, je préfère sortir." },
              { v: "J'attends en espérant une remontée", d: "Inconfortable, mais je patiente." },
              { v: "Je reste serein et je maintiens", d: "Je comprends que c'est temporaire." },
              { v: "Je renforce mes positions", d: "Je vois ça comme une opportunité d'achat." },
            ].map((o) => <Card key={o.v} title={o.v} desc={o.d} selected={profile.reactionToDrop === o.v} onClick={() => set("reactionToDrop", o.v)} />)}
          </div>

          <Label req>Niveau d'implication souhaité</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { v: "Passif — je veux oublier que j'ai investi", d: "ETF larges, rééquilibrage annuel, zéro suivi." },
              { v: "Semi-actif — je consulte 1 fois par mois", d: "Quelques ETF + actions de fond, suivi mensuel." },
              { v: "Actif — je suis l'actualité régulièrement", d: "Mix actions/ETF, ajustements trimestriels." },
            ].map((o) => <Card key={o.v} title={o.v} desc={o.d} selected={profile.involvement === o.v} onClick={() => set("involvement", o.v)} />)}
          </div>

          <Nav onBack={() => setStep(0)} onNext={() => setStep(2)} nextDisabled={!profile.riskTolerance || !profile.reactionToDrop || !profile.involvement} />
        </Section>
      )}

      {/* ─── ÉTAPE 2 — Horizon ─── */}
      {step === 2 && (
        <Section title="Sur quelle durée investissez-vous ?" sub="L'horizon détermine le niveau de risque que vous pouvez vous permettre.">
          {[
            { v: "Moins de 2 ans", d: "Court terme — capital garanti et liquidité en priorité." },
            { v: "2 à 5 ans", d: "Moyen terme — équilibre entre croissance et sécurité." },
            { v: "5 à 10 ans", d: "Long terme — croissance progressive, fluctuations acceptées." },
            { v: "Plus de 10 ans", d: "Très long terme — idéal pour maximiser la capitalisation." },
          ].map((o) => <Card key={o.v} title={o.v} desc={o.d} selected={profile.horizon === o.v} onClick={() => { set("horizon", o.v); }} />)}
          <Nav onBack={() => setStep(1)} onNext={() => setStep(3)} nextDisabled={!profile.horizon} />
        </Section>
      )}

      {/* ─── ÉTAPE 3 — Capital & expérience ─── */}
      {step === 3 && (
        <Section title="Votre capacité d'investissement" sub="Ces informations sont confidentielles et servent uniquement à calibrer les recommandations.">
          <Label req>Capital initial disponible (€)</Label>
          <input type="number" value={profile.capital} onChange={(e) => set("capital", e.target.value)}
            placeholder="ex : 10 000" min="0" style={inputSt}
            onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; e.target.style.outline = "none"; }}
            onBlur={(e) => e.target.style.borderColor = "var(--line)"} />

          <Label>Versement mensuel envisagé (€) — optionnel</Label>
          <input type="number" value={profile.monthly} onChange={(e) => set("monthly", e.target.value)}
            placeholder="ex : 200" min="0" style={inputSt}
            onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; e.target.style.outline = "none"; }}
            onBlur={(e) => e.target.style.borderColor = "var(--line)"} />

          <Label req>Avez-vous déjà investi en bourse ?</Label>
          <div style={{ display: "flex", gap: 10 }}>
            <Card title="Oui" desc="J'ai déjà un portefeuille." selected={profile.alreadyInvested === true} onClick={() => set("alreadyInvested", true)} />
            <Card title="Non" desc="C'est mon premier investissement." selected={profile.alreadyInvested === false} onClick={() => set("alreadyInvested", false)} />
          </div>

          <Label req>Votre expérience en bourse</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { v: "Débutant", d: "Je découvre — je préfère des produits simples à comprendre." },
              { v: "Intermédiaire", d: "Je connais les bases et suis l'actualité économique." },
              { v: "Expérimenté", d: "J'analyse les fondamentaux et gère activement mon portefeuille." },
            ].map((o) => <Card key={o.v} title={o.v} desc={o.d} selected={profile.experience === o.v} onClick={() => set("experience", o.v)} />)}
          </div>

          <Nav onBack={() => setStep(2)}
            onNext={() => profile.alreadyInvested === true ? setStep(4) : setStep(5)}
            nextDisabled={!profile.capital || profile.alreadyInvested === null || !profile.experience} />
        </Section>
      )}

      {/* ─── ÉTAPE 4 — Positions existantes (conditionnel) ─── */}
      {step === 4 && (
        <Section title="Vos positions actuelles" sub="Indiquez vos principales positions pour que l'IA construise un portefeuille complémentaire et diversifié.">

          {/* Bouton import depuis portefeuille */}
          <button
            onClick={async () => {
              setImportingPortfolio(true);
              try {
                const res = await fetch("/api/portfolio");
                const holdings = await res.json();
                if (!Array.isArray(holdings) || holdings.length === 0) {
                  setImportingPortfolio(false);
                  return;
                }
                const total = holdings.reduce((s: number, h: any) => s + h.avg_price * h.quantity, 0);
                const imported = holdings.map((h: any) => {
                  const pct = total > 0 ? (h.avg_price * h.quantity / total) * 100 : 0;
                  const weight = pct < 10 ? "<10%" : pct < 25 ? "10-25%" : pct < 50 ? "25-50%" : ">50%";
                  return { symbol: h.symbol, name: h.name || h.symbol, weight };
                });
                set("existingHoldings", imported);
              } catch {}
              setImportingPortfolio(false);
            }}
            disabled={importingPortfolio}
            style={{
              width: "100%", padding: "12px", borderRadius: 9999, marginBottom: 16,
              border: "1.5px solid var(--line)",
              background: "var(--accent-soft)",
              color: "var(--accent)", fontSize: 14, fontWeight: 600,
              cursor: importingPortfolio ? "wait" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <Download size={15} />{importingPortfolio ? "Importation…" : "Importer depuis mon portefeuille"}
          </button>

          {/* Liste des positions déjà ajoutées */}
          {profile.existingHoldings.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {profile.existingHoldings.map((h, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: "var(--paper-2)", border: "1.5px solid var(--line)" }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>{h.symbol}</span>
                    <span style={{ color: "var(--muted)", fontSize: 12, marginLeft: 8 }}>{h.name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12, color: "var(--accent)", background: "var(--accent-soft)", padding: "2px 8px", borderRadius: 6 }}>{h.weight}</span>
                    <button onClick={() => set("existingHoldings", profile.existingHoldings.filter((_, j) => j !== i))}
                      style={{ background: "rgba(184,74,58,0.08)", border: "none", color: "var(--signal-down)", borderRadius: 6, width: 24, height: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Formulaire ajout */}
          <div style={{ padding: 16, borderRadius: 12, background: "var(--paper-2)", border: "1.5px dashed var(--line)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <label style={labelSt}>Symbole (ex: AAPL, AI.PA)</label>
                <input value={newExSymbol} onChange={(e) => setNewExSymbol(e.target.value.toUpperCase())}
                  onBlur={async (e) => {
                    const sym = e.target.value;
                    if (!sym) return;
                    setExResolving(true);
                    try {
                      const res = await fetch(`/api/stock/${sym}`);
                      if (res.ok) { const d = await res.json(); if (d.name) setNewExName(d.name); }
                    } catch {}
                    setExResolving(false);
                  }}
                  placeholder="AAPL" style={inputSt} />
              </div>
              <div>
                <label style={labelSt}>Part estimée du patrimoine</label>
                <select value={newExWeight} onChange={(e) => setNewExWeight(e.target.value)} style={{ ...inputSt, appearance: "none" as const }}>
                  {["<10%", "10-25%", "25-50%", ">50%"].map((w) => <option key={w}>{w}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={labelSt}>Nom {exResolving ? "(chargement…)" : "(auto-rempli)"}</label>
              <input value={newExName} onChange={(e) => setNewExName(e.target.value)} placeholder="Apple Inc." style={inputSt} />
            </div>
            <button
              onClick={() => {
                if (!newExSymbol) return;
                set("existingHoldings", [...profile.existingHoldings, { symbol: newExSymbol, name: newExName || newExSymbol, weight: newExWeight }]);
                setNewExSymbol(""); setNewExName(""); setNewExWeight("<10%");
              }}
              style={{ padding: "10px 20px", borderRadius: 9999, border: "1.5px solid var(--line)", background: "var(--accent-soft)", color: "var(--accent)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              + Ajouter cette position
            </button>
          </div>

          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 12 }}>
            Vous pouvez passer cette étape si vous ne souhaitez pas entrer vos positions.
          </p>

          <Nav onBack={() => setStep(3)} onNext={() => setStep(5)} nextLabel="Continuer" />
        </Section>
      )}

      {/* ─── ÉTAPE 5 — Objectifs & dividendes ─── */}
      {step === 5 && (
        <Section title="Vos objectifs" sub="Ce que vous voulez accomplir oriente toute la stratégie.">
          <Label req>Objectif principal</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { v: "Faire fructifier mon capital", d: "Maximiser la croissance sur le long terme." },
              { v: "Générer des revenus réguliers", d: "Dividendes et coupons pour un revenu passif." },
              { v: "Préparer ma retraite", d: "Constitution progressive d'un capital sur le long terme." },
              { v: "Acheter un bien immobilier", d: "Horizon court/moyen, capital disponible rapidement." },
              { v: "Protéger mon capital de l'inflation", d: "Préserver le pouvoir d'achat, faible risque." },
            ].map((o) => <Card key={o.v} title={o.v} desc={o.d} selected={profile.goal === o.v} onClick={() => set("goal", o.v)} />)}
          </div>

          <Label req>Souhaitez-vous percevoir des dividendes ?</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { v: "oui", t: "Oui, dividendes prioritaires", d: "Oui, je veux un revenu régulier — privilégier les actions/ETF à dividendes." },
              { v: "optionnel", t: "Optionnel", d: "Optionnel — si c'est disponible pourquoi pas, mais pas une priorité." },
              { v: "non", t: "Non, capitalisation", d: "Non — je préfère la capitalisation pour maximiser la croissance." },
            ].map((o) => <Card key={o.v} title={o.t} desc={o.d} selected={profile.wantsDividends === o.v} onClick={() => set("wantsDividends", o.v)} />)}
          </div>

          <Label>Enveloppe(s) fiscale(s) souhaitée(s) (plusieurs possibles)</Label>
          <ChipRow>
            {[
              { v: "PEA", desc: "Actions européennes, exonéré après 5 ans" },
              { v: "CTO", desc: "Tous marchés, sans plafond" },
              { v: "Assurance-vie", desc: "Avantages succession et liquidité" },
              { v: "PER", desc: "Retraite, déduction fiscale" },
            ].map(({ v, desc }) => {
              const selected = (profile.taxWrapper as string[]).includes(v);
              return (
                <Chip
                  key={v}
                  label={v}
                  active={selected}
                  onClick={() => {
                    const cur = profile.taxWrapper as string[];
                    set("taxWrapper", selected ? cur.filter(x => x !== v) : [...cur, v]);
                  }}
                />
              );
            })}
          </ChipRow>
          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
            {(profile.taxWrapper as string[]).length === 0
              ? "Aucune sélection = l'IA choisira la plus adaptée"
              : `Sélectionné : ${(profile.taxWrapper as string[]).join(" + ")}`}
          </p>

          <Nav onBack={() => profile.alreadyInvested === true ? setStep(4) : setStep(3)} onNext={() => setStep(6)} nextDisabled={!profile.goal || !profile.wantsDividends} />
        </Section>
      )}

      {/* ─── ÉTAPE 6 — Répartition & géographie ─── */}
      {step === 6 && (
        <Section title="Structure de votre portefeuille" sub="Définissez la composition et la géographie de vos investissements.">
          <Label req>Répartition actions / ETF souhaitée</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { v: "100% ETF", d: "Diversification maximale, gestion passive, idéal pour les débutants." },
              { v: "70% ETF / 30% actions", d: "Cœur ETF + quelques convictions sur des actions spécifiques." },
              { v: "50% ETF / 50% actions", d: "Équilibre entre diversification et sélection active." },
              { v: "30% ETF / 70% actions", d: "Stock-picking majoritaire avec une base ETF de sécurité." },
              { v: "100% actions", d: "Sélection active uniquement — expérience recommandée." },
            ].map((o) => <Card key={o.v} title={o.v} desc={o.d} selected={profile.allocationMix === o.v} onClick={() => set("allocationMix", o.v)} />)}
          </div>

          <Label req>Zone géographique principale</Label>
          <ChipRow>
            {["Mondial", "Europe", "États-Unis", "Pays émergents", "Asie"].map((g) => (
              <Chip key={g} label={g} active={profile.geography === g} onClick={() => set("geography", g)} />
            ))}
          </ChipRow>

          <Label req>Investissement responsable (ESG / ISR)</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { v: "Prioritaire", d: "Je veux investir uniquement dans des entreprises responsables." },
              { v: "Si disponible", d: "Je préfère l'ESG si les performances sont comparables." },
              { v: "Non concerné", d: "La performance est mon seul critère." },
            ].map((o) => <Card key={o.v} title={o.v} desc={o.d} selected={profile.esgInterest === o.v} onClick={() => set("esgInterest", o.v)} />)}
          </div>

          <Nav onBack={() => setStep(5)} onNext={() => setStep(7)} nextDisabled={!profile.allocationMix || !profile.esgInterest} />
        </Section>
      )}

      {/* ─── ÉTAPE 7 — Secteurs favoris & exclus ─── */}
      {step === 7 && (
        <Section title="Vos préférences sectorielles" sub="Choisissez les secteurs qui vous intéressent et ceux que vous souhaitez éviter.">
          <Label>Secteurs favoris (optionnel — jusqu'à 3)</Label>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>Ces secteurs seront intégrés si compatibles avec votre profil de risque.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {ALL_SECTORS.map((s) => {
              const active = profile.favoriteSectors.includes(s.id);
              const disabled = !active && profile.favoriteSectors.length >= 3;
              return (
                <button key={s.id} onClick={() => !disabled && toggleArr("favoriteSectors", s.id)} style={{
                  padding: "12px 14px", borderRadius: 10, textAlign: "left", cursor: disabled ? "not-allowed" : "pointer",
                  border: `1.5px solid ${active ? "var(--accent)" : "var(--line)"}`,
                  background: active ? "var(--accent-soft)" : disabled ? "var(--paper-3)" : "var(--paper-2)",
                  opacity: disabled ? 0.4 : 1, transition: "all 0.15s",
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: active ? "var(--accent)" : "var(--ink)" }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{s.sub}</div>
                  {active && <div style={{ fontSize: 10, color: "var(--accent)", marginTop: 4, display: "flex", alignItems: "center", gap: 3 }}><Check size={10} />Sélectionné</div>}
                </button>
              );
            })}
          </div>

          <div style={{ height: 1, background: "var(--line)", margin: "24px 0" }} />

          <Label>Secteurs à exclure (optionnel)</Label>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>Ces secteurs seront évités dans votre portefeuille.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {EXCLUDED_SECTORS.map((s) => (
              <button key={s} onClick={() => toggleArr("excludedSectors", s)} style={{
                padding: "7px 14px", borderRadius: 9999, cursor: "pointer", fontSize: 13, transition: "all 0.15s",
                border: `1.5px solid ${profile.excludedSectors.includes(s) ? "rgba(184,74,58,0.4)" : "var(--line)"}`,
                background: profile.excludedSectors.includes(s) ? "rgba(184,74,58,0.07)" : "transparent",
                color: profile.excludedSectors.includes(s) ? "var(--signal-down)" : "var(--muted)",
              }}>
                {profile.excludedSectors.includes(s) ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><X size={11} />{s}</span> : s}
              </button>
            ))}
          </div>

          <Nav onBack={() => setStep(6)} onNext={() => setStep(8)} nextLabel="Étape suivante" />
        </Section>
      )}

      {/* ─── ÉTAPE 8 — Convictions personnelles & génération ─── */}
      {step === 8 && !result && (
        <Section title="Vos convictions personnelles" sub="Avez-vous des actions ou ETF que vous souhaitez absolument intégrer ? Nous vous donnerons un avis avant de les inclure.">

          {/* Recherche */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <input value={forcedInput} onChange={(e) => setForcedInput(e.target.value.toUpperCase())}
              placeholder="Symbole (ex: NVDA, MC.PA…)" style={{ ...inputSt, flex: 1 }}
              onKeyDown={(e) => e.key === "Enter" && handleAddForced()} />
            <button onClick={handleAddForced} disabled={forcedLoading || !forcedInput}
              style={{ padding: "10px 18px", borderRadius: 9999, border: "none", background: forcedLoading ? "var(--accent-soft)" : "var(--accent)", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
              {forcedLoading ? "…" : "Analyser"}
            </button>
          </div>
          {forcedError && <p style={{ color: "var(--signal-down)", fontSize: 13, marginBottom: 12 }}>{forcedError}</p>}

          {/* Liste des actions analysées */}
          {forcedStocks.map((s, i) => {
            const isPos = s.upside >= 0;
            return (
              <div key={i} style={{ padding: 16, borderRadius: 12, border: `1.5px solid ${s.confirmed ? "var(--accent)" : "var(--line)"}`, background: s.confirmed ? "var(--accent-soft)" : "var(--paper-2)", marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>{s.symbol}</span>
                    <span style={{ color: "var(--muted)", fontSize: 12, marginLeft: 8 }}>{s.name}</span>
                  </div>
                  <button onClick={() => setForcedStocks(fs => fs.filter((_, j) => j !== i))}
                    style={{ background: "rgba(184,74,58,0.08)", border: "none", color: "var(--signal-down)", borderRadius: 6, width: 24, height: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <X size={12} />
                  </button>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" as const, marginBottom: 10 }}>
                  <SignalPill score={s.signal} size="sm" />
                  <span style={{ fontSize: 13, color: isPos ? "var(--signal-up)" : "var(--signal-down)", fontWeight: 600, fontFamily: "var(--font-geist-mono, monospace)", fontVariantNumeric: "tabular-nums" }}>
                    {isPos ? "+" : ""}{s.upside.toFixed(1)}% vs valeur estimée
                  </span>
                  <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)", fontVariantNumeric: "tabular-nums" }}>
                    Valeur estimée : {s.fairValue.toFixed(2)} {s.currency} · Cours : {s.currentPrice.toFixed(2)} {s.currency}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setForcedStocks(fs => fs.map((x, j) => j === i ? { ...x, confirmed: true } : x))}
                    disabled={s.confirmed}
                    style={{ flex: 1, padding: "9px", borderRadius: 9999, border: `1.5px solid ${s.confirmed ? "var(--accent)" : "rgba(45,125,90,0.3)"}`, background: s.confirmed ? "var(--accent-soft)" : "transparent", color: "var(--accent)", fontWeight: 600, fontSize: 13, cursor: s.confirmed ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <Check size={13} />{s.confirmed ? "Inclus dans le portefeuille" : "Oui, l'inclure"}
                  </button>
                  {s.confirmed && (
                    <button onClick={() => setForcedStocks(fs => fs.map((x, j) => j === i ? { ...x, confirmed: false } : x))}
                      style={{ padding: "9px 14px", borderRadius: 9999, border: "1.5px solid var(--line)", background: "transparent", color: "var(--muted)", fontSize: 13, cursor: "pointer" }}>
                      Retirer
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8, marginBottom: 20 }}>
            Vous pouvez passer cette étape sans ajouter d'action.
          </p>

          {/* Bouton de génération */}
          {error && <p style={{ color: "var(--signal-down)", fontSize: 14, marginBottom: 12 }}>{error}</p>}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setStep(7)} style={{ padding: "12px 20px", borderRadius: 9999, border: "1.5px solid var(--line)", background: "transparent", color: "var(--ink)", fontSize: 14, cursor: "pointer" }}>Retour</button>
            <button onClick={submit} disabled={loading}
              style={{ flex: 1, padding: "14px", borderRadius: 9999, border: "none", background: loading ? "var(--accent-soft)" : "var(--accent)", color: loading ? "var(--accent)" : "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Génération en cours…" : "Générer mon portefeuille"}
            </button>
          </div>
        </Section>
      )}

      {/* ─── RÉSULTAT ─── */}
      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Métriques */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
            <MetricCard label="Rendement estimé" value={result.expectedReturn} color="var(--signal-up)" />
            <MetricCard label="Niveau de risque" value={`Risque ${result.riskLevel}`} color={RISK_COLOR[result.riskLevel] ?? "var(--muted)"} />
            {result.dividendYield && result.dividendYield !== "null" && (
              <MetricCard label="Dividende estimé" value={result.dividendYield} color="var(--signal-neutral)" />
            )}
          </div>

          {/* Résumé & conseil fiscal */}
          <div style={{ background: "var(--paper-2)", border: "1.5px solid var(--line)", borderRadius: 16, padding: 24 }}>
            <p style={{ fontSize: 14, lineHeight: 1.75, color: "var(--muted)", marginBottom: 12 }}>{result.summary}</p>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, marginBottom: result.taxAdvice ? 14 : 0 }}>{result.strategy}</p>
            {result.taxAdvice && (
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "var(--accent-soft)", border: "1.5px solid rgba(45,125,90,0.2)", fontSize: 13, color: "var(--accent)", display: "flex", alignItems: "flex-start", gap: 8 }}>
                <Briefcase size={14} style={{ marginTop: 1, flexShrink: 0 }} />{result.taxAdvice}
              </div>
            )}
          </div>

          {/* Allocations */}
          <div style={{ background: "var(--paper-2)", border: "1.5px solid var(--line)", borderRadius: 16, padding: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18, color: "var(--ink)" }}>Allocation recommandée</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {result.allocations.map((a, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                        background: a.type === "ETF" ? "rgba(45,125,90,0.12)" : "var(--accent-soft)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 9, fontWeight: 700,
                        color: "var(--accent)",
                      }}>{a.symbol.slice(0, 4)}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>
                          {a.name || a.symbol}
                          <span style={{ fontSize: 10, color: "var(--muted)", background: "var(--paper-3)", padding: "1px 6px", borderRadius: 4, marginLeft: 6, fontWeight: 500 }}>{a.symbol}</span>
                          <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 4 }}>{a.type}</span>
                          {a.dividendFrequency && a.dividendFrequency !== "Capitalisant" && (
                            <span style={{ fontSize: 10, marginLeft: 6, color: "var(--signal-neutral)", background: "rgba(139,122,94,0.12)", padding: "1px 6px", borderRadius: 4 }}>
                              {a.dividendFrequency}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", fontFamily: "var(--font-geist-mono, monospace)", fontVariantNumeric: "tabular-nums" }}>{a.percentage}%</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: "var(--line)", overflow: "hidden", marginBottom: 4 }}>
                    <div style={{ height: "100%", width: `${a.percentage}%`, borderRadius: 3, background: "var(--accent)", transition: "width 0.6s ease" }} />
                  </div>
                  <p style={{ fontSize: 12, color: "var(--muted)" }}>{a.rationale}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Conseils */}
          {result.tips?.length > 0 && (
            <div style={{ background: "var(--paper-2)", border: "1.5px solid var(--line)", borderRadius: 16, padding: 24 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: "var(--ink)", display: "flex", alignItems: "center", gap: 8 }}>
                <Lightbulb size={16} color="var(--accent)" />Conseils pratiques
              </h2>
              {result.tips.map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, fontSize: 13, color: "var(--muted)" }}>
                  <span style={{ color: "var(--accent)", fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>{tip}
                </div>
              ))}
              <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 8, background: "var(--paper-3)", border: "1.5px solid var(--line)", fontSize: 13, color: "var(--muted)", display: "flex", alignItems: "center", gap: 8 }}>
                <RefreshCw size={13} color="var(--accent)" />Rééquilibrage : <strong style={{ color: "var(--ink)" }}>{result.rebalancing}</strong>
              </div>
            </div>
          )}

          {/* Scenario Analysis */}
          <ScenarioAnalysis
            positions={result.allocations.map((a: Allocation) => ({
              symbol: a.symbol,
              name: a.name,
              marketValue: (parseFloat(profile.capital) * a.percentage) / 100,
              asset_type: a.type?.toLowerCase() === "etf" ? "etf" : "stock",
              sector: undefined,
            }))}
            totalValue={parseFloat(profile.capital)}
            monthlyContribution={parseFloat(profile.monthly) || 0}
            riskLabel={profile.riskTolerance}
          />

          <p style={{ fontSize: 11, color: "var(--muted)", textAlign: "center" }}>{result.disclaimer}</p>

          <button onClick={() => { setStep(0); setResult(null); setProfile(emptyProfile); setError(null); setForcedStocks([]); setForcedInput(""); setForcedError(null); }} style={{
            padding: "12px", borderRadius: 9999, border: "1.5px solid var(--line)",
            background: "transparent", color: "var(--muted)", fontSize: 14, cursor: "pointer",
          }}>Refaire le questionnaire</button>
        </div>
      )}
    </div>
  );
}

/* ── Composants réutilisables ── */

function Section({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, letterSpacing: "-0.3px", color: "var(--ink)" }}>{title}</h2>
        <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>{sub}</p>
      </div>
      {children}
    </div>
  );
}

function Label({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", marginTop: 8 }}>
      {children}{req && <span style={{ color: "var(--signal-down)", marginLeft: 3 }}>*</span>}
    </div>
  );
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{children}</div>;
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "7px 14px", borderRadius: 9999, cursor: "pointer", fontSize: 13, transition: "all 0.15s",
      border: `1.5px solid ${active ? "var(--accent)" : "var(--line)"}`,
      background: active ? "var(--accent-soft)" : "transparent",
      color: active ? "var(--accent)" : "var(--muted)",
    }}>{label}</button>
  );
}

function Card({ title, desc, selected, onClick }: { title: string; desc: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 12,
      textAlign: "left", width: "100%", cursor: "pointer", transition: "all 0.2s",
      border: `1.5px solid ${selected ? "var(--accent)" : "var(--line)"}`,
      background: selected ? "var(--accent-soft)" : "var(--paper-2)",
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: selected ? "var(--accent)" : "var(--ink)" }}>{title}</div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2, lineHeight: 1.4 }}>{desc}</div>
      </div>
      {selected && <Check size={14} color="var(--accent)" style={{ flexShrink: 0 }} />}
    </button>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: "var(--ink)", border: "1.5px solid var(--ink)", borderRadius: 16, padding: "16px 20px" }}>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: "var(--font-geist-mono, monospace)", fontVariantNumeric: "tabular-nums" }}>{value}</div>
    </div>
  );
}

function Nav({ onBack, onNext, nextLabel = "Continuer", nextDisabled = false, hideBack = false }: {
  onBack: () => void; onNext: () => void; nextLabel?: string; nextDisabled?: boolean; hideBack?: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
      {!hideBack && (
        <button onClick={onBack} style={{ flex: 1, padding: "12px", borderRadius: 9999, border: "1.5px solid var(--line)", background: "transparent", color: "var(--ink)", fontSize: 14, cursor: "pointer" }}>Retour</button>
      )}
      <button onClick={onNext} disabled={nextDisabled} style={{
        flex: 2, padding: "12px", borderRadius: 9999, border: "none",
        background: nextDisabled ? "var(--paper-3)" : "var(--accent)",
        color: nextDisabled ? "var(--muted)" : "#fff", fontSize: 14, fontWeight: 600, cursor: nextDisabled ? "not-allowed" : "pointer",
      }}>{nextLabel}</button>
    </div>
  );
}

const inputSt: React.CSSProperties = {
  width: "100%", padding: "12px 16px", borderRadius: 12,
  background: "#fff", border: "1.5px solid var(--line)",
  color: "var(--ink)", fontSize: 15, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
};

const labelSt: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6,
};
