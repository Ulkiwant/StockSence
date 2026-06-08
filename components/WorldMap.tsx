"use client";

import { ComposableMap, Geographies, Geography } from "react-simple-maps";

const GEO_URL = "/world-110m.json";

/* ── ISO numeric → région ── */
const COUNTRY_REGION: Record<number, string> = {
  // Europe
  250: "Europe", // France
  276: "Europe", // Allemagne
  528: "Europe", // Pays-Bas
  380: "Europe", // Italie
  724: "Europe", // Espagne
  826: "Europe", // Royaume-Uni
  56:  "Europe", // Belgique
  752: "Europe", // Suède
  578: "Europe", // Norvège
  208: "Europe", // Danemark
  246: "Europe", // Finlande
  756: "Europe", // Suisse
  620: "Europe", // Portugal
  40:  "Europe", // Autriche
  372: "Europe", // Irlande
  300: "Europe", // Grèce
  616: "Europe", // Pologne
  203: "Europe", // République Tchèque
  348: "Europe", // Hongrie
  642: "Europe", // Roumanie
  100: "Europe", // Bulgarie
  703: "Europe", // Slovaquie
  705: "Europe", // Slovénie
  233: "Europe", // Estonie
  428: "Europe", // Lettonie
  440: "Europe", // Lituanie
  196: "Europe", // Chypre
  442: "Europe", // Luxembourg
  470: "Europe", // Malte
  191: "Europe", // Croatie

  // Amérique du Nord
  840: "Amérique du Nord", // États-Unis
  124: "Amérique du Nord", // Canada
  484: "Amérique du Nord", // Mexique (inclus dans NAFTA)

  // Amérique du Sud
  76:  "Amérique du Sud", // Brésil
  32:  "Amérique du Sud", // Argentine
  152: "Amérique du Sud", // Chili
  170: "Amérique du Sud", // Colombie
  604: "Amérique du Sud", // Pérou
  858: "Amérique du Sud", // Uruguay
  218: "Amérique du Sud", // Équateur
  862: "Amérique du Sud", // Venezuela
  600: "Amérique du Sud", // Paraguay
  68:  "Amérique du Sud", // Bolivie
  740: "Amérique du Sud", // Suriname
  328: "Amérique du Sud", // Guyana

  // Asie-Océanie
  392: "Asie-Océanie", // Japon
  344: "Asie-Océanie", // Hong Kong
  156: "Asie-Océanie", // Chine
  36:  "Asie-Océanie", // Australie
  356: "Asie-Océanie", // Inde
  702: "Asie-Océanie", // Singapour
  410: "Asie-Océanie", // Corée du Sud
  158: "Asie-Océanie", // Taïwan
  764: "Asie-Océanie", // Thaïlande
  458: "Asie-Océanie", // Malaisie
  360: "Asie-Océanie", // Indonésie
  608: "Asie-Océanie", // Philippines
  704: "Asie-Océanie", // Viêtnam
  554: "Asie-Océanie", // Nouvelle-Zélande
  50:  "Asie-Océanie", // Bangladesh
  586: "Asie-Océanie", // Pakistan
  144: "Asie-Océanie", // Sri Lanka
  116: "Asie-Océanie", // Cambodge
  104: "Asie-Océanie", // Myanmar

  // Marchés émergents (Afrique + Moyen-Orient)
  710: "Marchés émergents", // Afrique du Sud
  566: "Marchés émergents", // Nigeria
  818: "Marchés émergents", // Égypte
  404: "Marchés émergents", // Kenya
  788: "Marchés émergents", // Tunisie
  12:  "Marchés émergents", // Algérie
  504: "Marchés émergents", // Maroc
  682: "Marchés émergents", // Arabie Saoudite
  784: "Marchés émergents", // Émirats arabes unis
  634: "Marchés émergents", // Qatar
  368: "Marchés émergents", // Irak
  364: "Marchés émergents", // Iran
  792: "Marchés émergents", // Turquie
  376: "Marchés émergents", // Israël
  643: "Marchés émergents", // Russie
};

const REGION_COLORS: Record<string, { base: string; dark: string }> = {
  "Europe":             { base: "#1a4a7a", dark: "#0e2d4d" },
  "Amérique du Nord":   { base: "#2a6aad", dark: "#1a4a7a" },
  "Asie-Océanie":       { base: "#4a9eff", dark: "#2a6aad" },
  "Amérique du Sud":    { base: "#63b3f0", dark: "#4a9eff" },
  "Marchés émergents":  { base: "#8ecef7", dark: "#63b3f0" },
};

interface Props {
  /** Map: region label → portfolio weight 0-100 */
  regionWeights: Record<string, number>;
}

export default function WorldMap({ regionWeights }: Props) {
  const maxWeight = Math.max(...Object.values(regionWeights), 1);

  const getColor = (isoNumeric: number) => {
    const region = COUNTRY_REGION[isoNumeric];
    if (!region || !regionWeights[region]) return "#ccc8c0";
    const { base, dark } = REGION_COLORS[region] ?? { base: "#4a9eff", dark: "#2a6aad" };
    const intensity = regionWeights[region] / maxWeight;
    // Blend between base and dark based on intensity
    return intensity > 0.6 ? dark : base;
  };

  return (
    <ComposableMap
      width={800}
      height={410}
      projectionConfig={{ scale: 153, center: [0, 0] }}
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      <Geographies geography={GEO_URL}>
        {({ geographies }: { geographies: { rsmKey: string; id: string; properties: Record<string, unknown> }[] }) =>
          geographies.map((geo) => {
            const isoNum = parseInt(geo.id, 10);
            const color = getColor(isoNum);
            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill={color}
                stroke="#b8b2a8"
                strokeWidth={0.4}
                style={{
                  default: { outline: "none" },
                  hover:   { outline: "none", fill: color, opacity: 0.82 },
                  pressed: { outline: "none" },
                }}
              />
            );
          })
        }
      </Geographies>
    </ComposableMap>
  );
}
