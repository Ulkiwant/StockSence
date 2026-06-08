"use client";

import Link from "next/link";
import { useState } from "react";
import Footer from "@/components/Footer";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";

/* ── Critères & pondérations ── */
const CRITERIA = [
  {
    id: "solidite",
    label: "Solidité financière",
    weight: 35,
    color: "#1F5C3E",
    icon: "🏛️",
    desc: "Est-ce que l'entreprise a les reins solides ? On vérifie qu'elle n'est pas trop endettée et qu'elle peut tenir la route même quand les choses vont mal.",
    metrics: [
      {
        name: "Est-ce qu'elle a trop de dettes ?",
        why: "Imagine acheter une maison entièrement à crédit : si tu perds ton emploi, tu ne peux plus rembourser. C'est pareil pour une entreprise. Plus elle emprunte, plus elle prend de risques. On s'assure que ses dettes ne dépassent pas ce qu'elle possède vraiment.",
        good: "Dettes < ce qu'elle possède", weight: 30,
      },
      {
        name: "Peut-elle payer ses factures ce mois-ci ?",
        why: "Même une grande entreprise peut se retrouver à court d'argent si elle ne peut plus payer ses fournisseurs ou ses employés. On vérifie qu'elle dispose d'assez d'argent disponible pour faire face à ses dépenses immédiates.",
        good: "Argent dispo > dépenses à venir", weight: 25,
      },
      {
        name: "Ses profits suffisent-ils à payer les intérêts de ses emprunts ?",
        why: "Quand on emprunte de l'argent à la banque, on paie des intérêts chaque mois. Une entreprise aussi. On vérifie qu'elle gagne suffisamment pour couvrir ces intérêts — et qu'il reste encore de l'argent après.",
        good: "Profits au moins 3× les intérêts", weight: 25,
      },
      {
        name: "Sa santé financière vue de l'extérieur",
        why: "On calcule un score global de solidité, comme une note de crédit. C'est la synthèse de tout ce qui précède : est-ce que cette entreprise inspire confiance à quelqu'un qui lui prêterait de l'argent ?",
        good: "Score de solidité élevé", weight: 20,
      },
    ],
    example: { company: "Apple", score: 91, note: "Apple a tellement d'argent en banque qu'elle pourrait rembourser l'ensemble de ses dettes plusieurs fois. C'est une des entreprises les plus solides au monde." },
  },
  {
    id: "croissance",
    label: "Croissance",
    weight: 25,
    color: "#2F7D52",
    icon: "📈",
    desc: "Est-ce que l'entreprise progresse d'une année sur l'autre ? Une entreprise qui vend et gagne de plus en plus chaque année crée de la richesse pour ceux qui y investissent.",
    metrics: [
      {
        name: "Ses ventes augmentent-elles chaque année ?",
        why: "On regarde si l'entreprise vend davantage d'une année sur l'autre, en moyenne sur 3 ans. Trois ans plutôt qu'un seul, pour ne pas se faire avoir par une bonne ou mauvaise année exceptionnelle.",
        good: "Ventes en hausse d'au moins 8 % par an", weight: 35,
      },
      {
        name: "Ses profits augmentent-ils aussi ?",
        why: "Vendre plus, c'est bien. Mais si on vend plus en gagnant moins sur chaque vente, ce n'est pas forcément bon signe. On s'assure que les profits grandissent aussi — voire plus vite que les ventes.",
        good: "Profits en hausse d'au moins 10 % par an", weight: 35,
      },
      {
        name: "L'argent qui rentre vraiment dans les caisses augmente-t-il ?",
        why: "Les profits annoncés peuvent parfois être embellis par des règles comptables. L'argent réellement disponible dans la caisse, lui, ne ment pas. On vérifie que cet argent réel augmente d'année en année.",
        good: "Argent réel en hausse d'au moins 8 % par an", weight: 30,
      },
    ],
    example: { company: "LVMH", score: 74, note: "LVMH a vendu 9 % de plus chaque année sur 3 ans, et ses profits ont progressé de 11 % par an. Une croissance régulière et impressionnante." },
  },
  {
    id: "valorisation",
    label: "Est-ce que le prix est juste ?",
    weight: 20,
    color: "#B07D00",
    icon: "⚖️",
    desc: "L'action coûte-t-elle trop cher ou est-elle une bonne affaire ? Même l'entreprise la plus solide du monde peut être un mauvais investissement si on la paie beaucoup trop cher.",
    metrics: [
      {
        name: "L'action est-elle chère comparée à ses concurrentes ?",
        why: "Imagine deux boulangeries dans ta rue qui gagnent le même argent. Si l'une se vend 100 000 € et l'autre 200 000 €, la deuxième est deux fois plus chère. On fait pareil pour les actions : on compare le prix à ce que l'entreprise gagne réellement.",
        good: "Prix dans la moyenne du secteur ou en dessous", weight: 30,
      },
      {
        name: "Ce prix est-il justifié par sa vitesse de croissance ?",
        why: "Payer plus cher peut être logique si l'entreprise grandit beaucoup plus vite que les autres. Un restaurant qui double son nombre de clients chaque année vaut peut-être le double d'un restaurant qui stagne. On vérifie que le prix élevé est mérité.",
        good: "Prix raisonnable vu la croissance", weight: 30,
      },
      {
        name: "Combien paie-t-on pour chaque euro d'argent réellement gagné ?",
        why: "Plutôt que de regarder les profits annoncés (qui peuvent être arrangés), on regarde l'argent réel qui entre en caisse. C'est une mesure plus honnête du vrai prix payé.",
        good: "Moins de 25 fois l'argent annuel généré", weight: 20,
      },
      {
        name: "Quel est le vrai prix de l'entreprise en entier ?",
        why: "Pour racheter une entreprise, il faut aussi reprendre ses dettes. Ce critère compare ce prix total (rachat + dettes) à ce qu'elle gagne avant de payer ses impôts et ses emprunts. C'est le prix réel, tout compris.",
        good: "Moins de 15 fois son bénéfice annuel", weight: 20,
      },
    ],
    example: { company: "Sanofi", score: 68, note: "Pour acheter une part de Sanofi, on paie 12 fois ce qu'elle gagne en un an. Dans son secteur (la pharmacie), la moyenne est à 18 fois. Elle est donc nettement moins chère que ses concurrentes." },
  },
  {
    id: "rentabilite",
    label: "Qualité & Rentabilité",
    weight: 20,
    color: "#6B7DB3",
    icon: "💎",
    desc: "Est-ce une entreprise qui gagne vraiment bien sa vie ? Les meilleures entreprises ont souvent quelque chose d'unique — une marque, un brevet, une habitude client — qui leur permet de garder des marges élevées.",
    metrics: [
      {
        name: "Que reste-t-il après avoir tout payé ?",
        why: "Sur 100 € que l'entreprise encaisse en vendant ses produits ou services, combien lui reste-t-il après avoir payé ses employés, ses fournisseurs, ses impôts et tout le reste ? Si elle garde 20 €, c'est une excellente affaire.",
        good: "Au moins 10 € gardés pour 100 € vendus", weight: 30,
      },
      {
        name: "Combien rapporte-t-elle à ceux qui y ont investi ?",
        why: "Si tu confies 1 000 € à cette entreprise, combien te rend-elle chaque année sous forme de profits ? Une entreprise qui génère 200 € de profit pour 1 000 € investis est bien meilleure qu'une qui n'en génère que 50 €.",
        good: "Au moins 15 € de profit pour 100 € investis", weight: 30,
      },
      {
        name: "Gagne-t-elle plus qu'elle ne dépense pour fonctionner ?",
        why: "Une entreprise crée de la richesse seulement si ce qu'elle gagne dépasse ce que ça lui coûte de fonctionner — y compris le coût de ses emprunts et ce que ses actionnaires attendent. Sinon, elle dépense plus qu'elle ne produit.",
        good: "Gains > coût total de fonctionnement", weight: 25,
      },
      {
        name: "Son activité principale est-elle efficace ?",
        why: "Avant de payer ses impôts et ses emprunts, est-ce que son cœur de métier est rentable ? C'est utile pour comparer des entreprises de pays différents, où les règles fiscales ne sont pas les mêmes.",
        good: "Au moins 20 % de bénéfice sur l'activité principale", weight: 15,
      },
    ],
    example: { company: "L'Oréal", score: 83, note: "L'Oréal garde 14 € pour chaque 100 € vendus, génère 22 € de profit pour chaque 100 € investis par ses actionnaires, et ce depuis plus de 10 ans sans interruption." },
  },
];

/* ── FAQ Méthodologie ── */
const FAQ_METHODO = [
  {
    q: "La note change-t-elle tous les jours ?",
    a: "Non. La note est recalculée quand l'entreprise publie ses résultats — en général quatre fois par an. Elle ne bouge pas quand le prix de l'action monte ou descend : le prix du marché et la qualité de l'entreprise sont deux choses bien différentes.",
  },
  {
    q: "Pourquoi la note d'une entreprise peut-elle baisser alors que son action monte ?",
    a: "Parce que la note mesure la santé réelle de l'entreprise, pas son prix en bourse. Une entreprise peut annoncer de mauvais résultats (moins de profits, plus de dettes) tout en voyant son action monter — les investisseurs ont leurs propres raisons. La note, elle, regarde les faits.",
  },
  {
    q: "Est-ce que la note tient compte de l'impact environnemental ou social ?",
    a: "Pas encore. Pour l'instant, on ne regarde que les données financières — ce que l'entreprise gagne, dépense et possède. On prévoit d'ajouter des critères sur l'impact environnemental et social dans une prochaine version.",
  },
  {
    q: "Une note de 50/100, c'est bien ou c'est mauvais ?",
    a: "C'est dans la moyenne — ni bon ni mauvais. La moitié des entreprises analysées ont une note inférieure, l'autre moitié une note supérieure. Une note de 50 signifie que cette entreprise est tout à fait ordinaire : pas de signal d'alarme, mais pas de raison particulière de s'enthousiasmer non plus.",
  },
  {
    q: "Si une entreprise a 90/100, est-ce qu'il faut absolument acheter l'action ?",
    a: "Pas forcément. Une très bonne note dit que l'entreprise est solide et de qualité. Mais si tout le monde le sait déjà, son action peut coûter très cher. C'est pourquoi Finazen donne aussi un signal séparé (acheter / attendre / éviter) qui tient compte du prix actuel en plus de la qualité.",
  },
  {
    q: "Quelle différence entre la note et le signal d'investissement ?",
    a: "La note (0 à 100) répond à : 'Est-ce une bonne entreprise ?' Le signal (acheter / attendre / éviter) répond à : 'Est-ce le bon moment pour acheter ?' Une excellente entreprise peut avoir un signal 'attendre' si son action est déjà très chère sur le marché.",
  },
];

export default function MethodologiePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [openCriteria, setOpenCriteria] = useState<string | null>(null);

  return (
    <div style={{ background: "var(--paper)" }}>
      {/* Nav retour */}
      <nav style={{ borderBottom: "1px solid var(--line)", padding: "0 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", height: 60, display: "flex", alignItems: "center", gap: 24 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--muted)", fontWeight: 500 }}>
            <ArrowLeft size={15} strokeWidth={2} /> Retour
          </Link>
          <span style={{ color: "var(--line)" }}>|</span>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>Méthodologie</span>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: "80px 32px 64px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ maxWidth: 780, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "var(--accent)", fontFamily: "var(--font-geist-mono, monospace)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 20 }}>Transparence · Méthodologie</div>
          <h1 style={{ fontFamily: "var(--font-instrument, serif)", fontWeight: 400, fontSize: "clamp(40px, 5vw, 68px)", lineHeight: 1.05, letterSpacing: "-0.02em", margin: "0 0 24px" }}>
            Comment fonctionne la{" "}
            <em style={{ fontStyle: "italic", color: "var(--accent)" }}>note Finazen</em> ?
          </h1>
          <p style={{ fontSize: 18, color: "var(--muted)", lineHeight: 1.65, maxWidth: 600, margin: "0 auto 32px" }}>
            Zéro boîte noire. Voici exactement comment nous calculons notre score sur 100 — critère par critère, poids par poids.
          </p>
          {/* Score visual */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "#fff", border: "1px solid var(--line)", borderRadius: 14, padding: "12px 24px" }}>
            <div style={{ position: "relative", width: 48, height: 48 }}>
              <svg viewBox="0 0 80 80" style={{ transform: "rotate(-90deg)", width: 48, height: 48 }}>
                <circle cx="40" cy="40" r="32" fill="none" stroke="var(--line)" strokeWidth="8" />
                <circle cx="40" cy="40" r="32" fill="none" stroke="var(--accent)" strokeWidth="8"
                  strokeDasharray={`${(78 / 100) * 201} 201`} strokeLinecap="round" />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)" }}>78</span>
              </div>
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Note Finazen · Exemple Apple</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>Bonne opportunité à long terme</div>
            </div>
          </div>
        </div>
      </section>

      {/* Vue d'ensemble des poids */}
      <section style={{ padding: "72px 32px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 12, color: "var(--accent)", fontFamily: "var(--font-geist-mono, monospace)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>Vue d'ensemble</div>
          <h2 style={{ fontFamily: "var(--font-instrument, serif)", fontWeight: 400, fontSize: "clamp(28px, 3.5vw, 44px)", lineHeight: 1.05, margin: "0 0 40px" }}>
            4 critères, <em style={{ fontStyle: "italic", color: "var(--accent)" }}>100 points</em>
          </h2>

          {/* Barre de répartition */}
          <div style={{ height: 16, borderRadius: 9999, overflow: "hidden", display: "flex", marginBottom: 16, border: "1px solid var(--line)" }}>
            {CRITERIA.map((c) => (
              <div key={c.id} style={{ width: `${c.weight}%`, background: c.color, transition: "width 0.3s" }} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 48 }}>
            {CRITERIA.map((c) => (
              <span key={c.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: c.color }} />
                <span style={{ color: "var(--ink)", fontWeight: 600 }}>{c.label}</span>
                <span style={{ color: "var(--muted)" }}>· {c.weight} %</span>
              </span>
            ))}
          </div>

          {/* Cards critères avec jauge — colonne unique pour éviter le blanc quand une carte s'ouvre */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {CRITERIA.map((c) => (
              <div key={c.id} style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 18, overflow: "hidden" }}>
                {/* Header cliquable */}
                <button
                  onClick={() => setOpenCriteria(openCriteria === c.id ? null : c.id)}
                  style={{ width: "100%", padding: "20px 22px", display: "flex", alignItems: "center", gap: 14, background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                >
                  <span style={{ width: 44, height: 44, borderRadius: 12, background: `${c.color}18`, border: `1px solid ${c.color}30`, display: "grid", placeItems: "center", fontSize: 20, flexShrink: 0 }}>{c.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>{c.label}</span>
                      <span style={{ fontSize: 12, fontFamily: "var(--font-geist-mono, monospace)", color: c.color, background: `${c.color}14`, borderRadius: 9999, padding: "1px 8px", fontWeight: 700 }}>{c.weight} pts</span>
                    </div>
                    {/* Jauge */}
                    <div style={{ height: 5, background: "var(--paper-3)", borderRadius: 9999, overflow: "hidden", width: "100%" }}>
                      <div style={{ width: `${c.weight * (100 / 40)}%`, height: "100%", background: c.color, borderRadius: 9999 }} />
                    </div>
                  </div>
                  {openCriteria === c.id ? <ChevronUp size={16} color="var(--muted)" /> : <ChevronDown size={16} color="var(--muted)" />}
                </button>

                {/* Corps expandable */}
                {openCriteria === c.id && (
                  <div style={{ borderTop: "1px solid var(--line)", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
                    <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>{c.desc}</p>

                    {/* Métriques */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {c.metrics.map((m) => (
                        <div key={m.name} style={{ background: "var(--paper-2)", borderRadius: 10, padding: "14px 16px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6, gap: 12 }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>{m.name}</div>
                            </div>
                            <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                              <span style={{ fontSize: 11, color: "var(--accent)", background: "var(--accent-soft)", borderRadius: 9999, padding: "2px 7px", fontFamily: "var(--font-geist-mono, monospace)", whiteSpace: "nowrap" }}>✓ {m.good}</span>
                              <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)", whiteSpace: "nowrap" }}>{m.weight} %</span>
                            </div>
                          </div>
                          <p style={{ fontSize: 13, color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>{m.why}</p>
                        </div>
                      ))}
                    </div>

                    {/* Exemple concret */}
                    <div style={{ background: `${c.color}0f`, border: `1px solid ${c.color}22`, borderRadius: 10, padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 14 }}>💡</span>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)" }}>Exemple — {c.example.company} :</span>
                        <span style={{ fontSize: 13, color: "var(--muted)", marginLeft: 6 }}>{c.example.note}</span>
                        <span style={{ display: "inline-block", marginLeft: 10, fontFamily: "var(--font-geist-mono, monospace)", fontSize: 13, fontWeight: 700, color: c.color }}>→ {c.example.score}/100</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Exemple de calcul complet */}
      <section style={{ padding: "72px 32px", background: "var(--paper-2)", borderBottom: "1px solid var(--line)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ fontSize: 12, color: "var(--accent)", fontFamily: "var(--font-geist-mono, monospace)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>Exemple concret</div>
          <h2 style={{ fontFamily: "var(--font-instrument, serif)", fontWeight: 400, fontSize: "clamp(26px, 3vw, 40px)", lineHeight: 1.05, margin: "0 0 36px" }}>
            Comment on calcule la note <em style={{ fontStyle: "italic", color: "var(--accent)" }}>Apple (AAPL)</em>
          </h2>

          <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 18, overflow: "hidden" }}>
            <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--line)", background: "var(--paper-2)", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 32, height: 32, borderRadius: 8, background: "#111", display: "grid", placeItems: "center", fontSize: 14, color: "#fff", fontWeight: 700 }}>A</span>
              <span style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>Apple Inc. · AAPL</span>
              <span style={{ marginLeft: "auto", fontFamily: "var(--font-geist-mono, monospace)", fontSize: 11, color: "var(--muted)" }}>Données : exercice fiscal 2024</span>
            </div>
            {/* Lignes */}
            {[
              { crit: "Solidité financière", weight: 35, raw: 91, contrib: 31.9, color: "#1F5C3E", detail: "Très peu de dettes · peut payer ses intérêts 28 fois avec ses profits · trésorerie abondante" },
              { crit: "Croissance",          weight: 25, raw: 72, contrib: 18.0, color: "#2F7D52", detail: "Ventes +5,5 %/an · profits +9,2 %/an · argent en caisse +10,1 %/an" },
              { crit: "Prix payé",           weight: 20, raw: 58, contrib: 11.6, color: "#B07D00", detail: "Action chère vs ses concurrentes · le prix intègre déjà beaucoup de bonnes nouvelles" },
              { crit: "Qualité",             weight: 20, raw: 86, contrib: 17.2, color: "#6B7DB3", detail: "Garde 26 € sur 100 € vendus · très rentable pour ses actionnaires · crée de la valeur" },
            ].map(({ crit, weight, raw, contrib, color, detail }, i, arr) => (
              <div key={crit} style={{ padding: "16px 22px", borderBottom: i < arr.length - 1 ? "1px solid var(--line)" : "none", display: "grid", gridTemplateColumns: "1.2fr 60px 60px 80px", gap: 16, alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)", marginBottom: 3 }}>{crit}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{detail}</div>
                  <div style={{ marginTop: 6, height: 4, background: "var(--paper-3)", borderRadius: 9999, overflow: "hidden", maxWidth: 200 }}>
                    <div style={{ width: `${raw}%`, height: "100%", background: color, borderRadius: 9999 }} />
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 2 }}>Poids</div>
                  <div style={{ fontFamily: "var(--font-geist-mono, monospace)", fontWeight: 700, color: "var(--ink)" }}>{weight} %</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 2 }}>Score brut</div>
                  <div style={{ fontFamily: "var(--font-geist-mono, monospace)", fontWeight: 700, color }}>{raw}/100</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 2 }}>Contribution</div>
                  <div style={{ fontFamily: "var(--font-geist-mono, monospace)", fontWeight: 700, color: "var(--ink)" }}>{contrib.toFixed(1)} pts</div>
                </div>
              </div>
            ))}
            {/* Total */}
            <div style={{ padding: "16px 22px", background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>Note finale Apple</span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-geist-mono, monospace)" }}>31.9 + 18.0 + 11.6 + 17.2</span>
                <span style={{ fontFamily: "var(--font-instrument, serif)", fontSize: 28, color: "var(--accent)" }}>=</span>
                <span style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 24, fontWeight: 800, color: "var(--accent)" }}>78 / 100</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "72px 32px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <div style={{ fontSize: 12, color: "var(--accent)", fontFamily: "var(--font-geist-mono, monospace)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>FAQ</div>
          <h2 style={{ fontFamily: "var(--font-instrument, serif)", fontWeight: 400, fontSize: "clamp(26px, 3vw, 40px)", lineHeight: 1.05, margin: "0 0 36px" }}>
            Questions sur <em style={{ fontStyle: "italic", color: "var(--accent)" }}>la note</em>
          </h2>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {FAQ_METHODO.map((item, i) => (
              <div key={i} style={{ borderBottom: "1px solid var(--line)" }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "18px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit", fontWeight: 600, fontSize: 15, color: "var(--ink)" }}
                >
                  {item.q}
                  <span style={{ width: 26, height: 26, borderRadius: "50%", border: "1px solid var(--line)", display: "grid", placeItems: "center", flexShrink: 0, background: openFaq === i ? "var(--accent)" : "transparent", borderColor: openFaq === i ? "var(--accent)" : "var(--line)", transition: "background 0.2s" }}>
                    <span style={{ fontSize: 16, color: openFaq === i ? "#fff" : "var(--muted)", transform: openFaq === i ? "rotate(45deg)" : "none", display: "block", transition: "transform 0.25s", lineHeight: 1 }}>+</span>
                  </span>
                </button>
                {openFaq === i && (
                  <p style={{ margin: "0 0 18px", color: "var(--muted)", fontSize: 14, lineHeight: 1.65, maxWidth: 640 }}>{item.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "72px 32px" }}>
        <div style={{ maxWidth: 780, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-instrument, serif)", fontWeight: 400, fontSize: "clamp(28px, 3.5vw, 44px)", margin: "0 0 16px", letterSpacing: "-0.015em" }}>
            Voir une vraie analyse <em style={{ fontStyle: "italic", color: "var(--accent)" }}>en action</em>
          </h2>
          <p style={{ fontSize: 16, color: "var(--muted)", lineHeight: 1.6, marginBottom: 28 }}>
            Cherche n'importe quelle action et observe comment chaque critère contribue à la note finale.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 24px", borderRadius: 9999, background: "var(--accent)", color: "#F6F2E8", fontWeight: 600, fontSize: 15 }}>
              Analyser une action →
            </Link>
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 24px", borderRadius: 9999, border: "1.5px solid var(--line)", color: "var(--ink)", fontWeight: 500, fontSize: 15 }}>
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
