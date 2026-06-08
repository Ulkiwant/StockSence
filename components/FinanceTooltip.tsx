"use client";

import { useState, useRef } from "react";

const DEFINITIONS: Record<string, string> = {
  "P/E": "Le ratio Prix/Bénéfice indique combien les investisseurs paient pour 1€ de bénéfice. Un P/E de 20 signifie qu'ils paient 20€ pour 1€ de bénéfice annuel.",
  "EPS": "Bénéfice Par Action — la part du bénéfice total de l'entreprise qui revient à chaque action.",
  "Valeur intrinsèque": "Prix qu'une action devrait théoriquement valoir en se basant sur les flux de trésorerie futurs estimés.",
  "Upside": "Potentiel de hausse — si une action vaut 80€ et que son prix cible est 100€, l'upside est +25%.",
  "Beta": "Mesure la volatilité par rapport au marché. Un beta de 1.5 signifie que l'action bouge 1.5× plus que le marché.",
  "ROE": "Rendement des Capitaux Propres — mesure à quel point l'entreprise génère du profit avec l'argent des actionnaires. Plus c'est élevé, mieux c'est.",
  "Marge opérationnelle": "Pourcentage du chiffre d'affaires qui reste après les coûts d'exploitation. Une marge de 20% signifie que pour 100€ de ventes, 20€ deviennent du profit opérationnel.",
  "Dette/Capitaux propres": "Ratio d'endettement — compare ce que l'entreprise doit à ce qu'elle possède. Un ratio > 1 signifie qu'elle est plus endettée que ses fonds propres.",
  "DCF": "Actualisation des Flux de Trésorerie — méthode qui calcule la valeur actuelle des profits futurs estimés de l'entreprise.",
  "Dividende": "Part du bénéfice distribué directement aux actionnaires, souvent chaque année ou chaque trimestre.",
  "Capitalisation": "Valeur totale de l'entreprise en bourse = prix de l'action × nombre d'actions. Indicateur de la taille de l'entreprise.",
  "Volume": "Nombre d'actions échangées sur un jour. Un volume élevé indique beaucoup d'intérêt des investisseurs.",
  "52 semaines": "Les prix minimum et maximum atteints par l'action au cours de la dernière année.",
};

interface Props {
  term: string;
  children: React.ReactNode;
}

export default function FinanceTooltip({ term, children }: Props) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const definition = DEFINITIONS[term];

  if (!definition) return <>{children}</>;

  return (
    <span
      ref={ref}
      style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 4 }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <span
        style={{
          borderBottom: "1px dashed rgba(123,90,255,0.5)",
          cursor: "help",
          color: "inherit",
        }}
      >
        {children}
      </span>
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--accent-purple)"
        strokeWidth="2"
        style={{ opacity: 0.7, flexShrink: 0 }}
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {visible && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 10px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#1e2230",
            border: "1px solid rgba(123,90,255,0.3)",
            borderRadius: 10,
            padding: "10px 14px",
            width: 260,
            fontSize: 12,
            lineHeight: 1.6,
            color: "var(--text-secondary)",
            zIndex: 200,
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            pointerEvents: "none",
          }}
        >
          <span style={{ fontWeight: 600, color: "var(--accent-purple)", display: "block", marginBottom: 4 }}>
            {term}
          </span>
          {definition}
          <div
            style={{
              position: "absolute",
              bottom: -6,
              left: "50%",
              transform: "translateX(-50%) rotate(45deg)",
              width: 10,
              height: 10,
              background: "#1e2230",
              borderRight: "1px solid rgba(123,90,255,0.3)",
              borderBottom: "1px solid rgba(123,90,255,0.3)",
            }}
          />
        </div>
      )}
    </span>
  );
}
