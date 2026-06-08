"use client";
import { useState } from "react";

const TOKEN = "pk_SHXx5drDRcG_3ctNjrEHCA";

/* ── Ticker → domaine (Logo.dev exige un domaine, pas un ticker) ── */
const TICKER_DOMAIN: Record<string, string> = {
  // France — CAC 40 + mid caps
  "AI.PA":    "airliquide.com",       "MC.PA":  "lvmh.com",
  "OR.PA":    "loreal.com",           "TTE.PA": "totalenergies.com",
  "SAN.PA":   "sanofi.com",           "BNP.PA": "bnpparibas.com",
  "SU.PA":    "schneider-electric.com","CAP.PA": "capgemini.com",
  "ACA.PA":   "credit-agricole.com",  "GLE.PA": "societegenerale.com",
  "SGO.PA":   "saint-gobain.com",     "RMS.PA": "hermes.com",
  "KER.PA":   "kering.com",           "DSY.PA": "dassault-systemes.com",
  "HO.PA":    "thalesgroup.com",      "VIE.PA": "veolia.com",
  "EN.PA":    "bouygues.com",         "CS.PA":  "axaim.com",
  "AXA.PA":   "axa.com",              "BN.PA":  "danone.com",
  "SAF.PA":   "safran.com",           "AIR.PA": "airbus.com",
  "EDF.PA":   "edf.fr",               "RNO.PA": "renault.com",
  "PUB.PA":   "publicis.com",         "RI.PA":  "pernod-ricard.com",
  "ML.PA":    "michelin.com",         "MT.AS":  "arcelormittal.com",
  "FP.PA":    "totalenergies.com",    "STMPA.PA":"st.com",
  "EXO.PA":   "exor.com",             "IP.PA":  "interparfum.com",
  "STM.PA":   "st.com",
  // Schneider Electric — symboles alternatifs
  "SCHN.PA":  "schneider-electric.com",
  // Pays-Bas
  "ASML.AS":  "asml.com",             "PHIA.AS":"philips.com",
  "INGA.AS":  "ing.com",              "ABN.AS": "abnamro.com",
  "HEIA.AS":  "heineken.com",         "UNA.AS": "unilever.com",
  "RDSA.AS":  "shell.com",            "BESI.AS":"besi.com",
  "IWDA.AS":  "ishares.com",          "VWCE.DE":"vanguard.com",
  "ESGE.PA":  "ishares.com",          "IUSQ.DE":"ishares.com",
  // Allemagne
  "SAP.DE":   "sap.com",              "ALV.DE": "allianz.com",
  "DTE.DE":   "telekom.com",          "BAS.DE": "basf.com",
  "BAYN.DE":  "bayer.com",            "BMW.DE": "bmw.com",
  "MBG.DE":   "mercedes-benz.com",    "SIE.DE": "siemens.com",
  "VOW3.DE":  "volkswagen.com",       "ADS.DE": "adidas.com",
  // UK
  "HSBA.L":   "hsbc.com",             "BP.L":   "bp.com",
  "SHEL.L":   "shell.com",            "ULVR.L": "unilever.com",
  "GSK.L":    "gsk.com",              "AZN.L":  "astrazeneca.com",
  "RIO.L":    "riotinto.com",
  // Italie + Stellantis toutes cotations
  "STLAM.MI": "stellantis.com",  "STLA": "stellantis.com",  "STLAM": "stellantis.com",
  "ENI.MI": "eni.com",
  "ISP.MI":   "intesasanpaolo.com",   "UCG.MI": "unicredit.eu",
  "ENEL.MI":  "enel.com",             "LDO.MI": "leonardocompany.com",
  // US — S&P 500 top
  "AAPL":  "apple.com",    "MSFT":  "microsoft.com",  "NVDA":  "nvidia.com",
  "GOOGL": "google.com",   "GOOG":  "google.com",     "AMZN":  "amazon.com",
  "META":  "meta.com",     "TSLA":  "tesla.com",      "AVGO":  "broadcom.com",
  "JPM":   "jpmorganchase.com","V":  "visa.com",       "MA":    "mastercard.com",
  "UNH":   "unitedhealthgroup.com","XOM":"exxonmobil.com","COST":"costco.com",
  "JNJ":   "jnj.com",      "PG":    "pg.com",          "WMT":   "walmart.com",
  "HD":    "homedepot.com","CVX":   "chevron.com",     "MRK":   "merck.com",
  "ABBV":  "abbvie.com",   "LLY":   "lilly.com",       "KO":    "coca-cola.com",
  "PEP":   "pepsico.com",  "AMD":   "amd.com",          "INTC":  "intel.com",
  "CSCO":  "cisco.com",    "ADBE":  "adobe.com",        "NFLX":  "netflix.com",
  "CRM":   "salesforce.com","ORCL": "oracle.com",       "IBM":   "ibm.com",
  "QCOM":  "qualcomm.com", "TXN":   "ti.com",           "AMAT":  "appliedmaterials.com",
  "GS":    "goldmansachs.com","BAC": "bankofamerica.com","MS": "morganstanley.com",
  "PYPL":  "paypal.com",   "SHOP":  "shopify.com",      "SQ":    "squareup.com",
  "SPOT":  "spotify.com",  "UBER":  "uber.com",          "LYFT":  "lyft.com",
  "ABNB":  "airbnb.com",   "COIN":  "coinbase.com",      "SNAP":  "snap.com",
  "TWTR":  "twitter.com",  "DIS":   "disney.com",        "CMCSA": "comcast.com",
  "T":     "att.com",      "VZ":    "verizon.com",        "TMUS":  "t-mobile.com",
  "BA":    "boeing.com",   "RTX":   "rtx.com",            "LMT":   "lockheedmartin.com",
  "CAT":   "caterpillar.com","GE":  "ge.com",              "MMM":   "3m.com",
  "HON":   "honeywell.com","UPS":   "ups.com",             "FDX":   "fedex.com",
  "SBUX":  "starbucks.com","MCD":   "mcdonalds.com",       "NKE":   "nike.com",
  "AMGN":  "amgen.com",    "GILD":  "gilead.com",          "REGN":  "regeneron.com",
  "BMY":   "bms.com",      "PFE":   "pfizer.com",          "MRNA":  "modernatx.com",
  "BNTX":  "biontech.com", "NVO":   "novonordisk.com",
  // ETF — logo de l'émetteur
  "CW8.PA":   "amundi.com",  "PANX.PA":"amundi.com",
  "EWLD.PA":  "amundi.com",  "C40.PA": "amundi.com",
  "LCWD.PA":  "amundi.com",
  "SPY":   "ssga.com",     "VOO":   "vanguard.com",  "IVV":   "ishares.com",
  "QQQ":   "invesco.com",  "VTI":   "vanguard.com",  "VEA":   "vanguard.com",
  "EFA":   "ishares.com",  "AGG":   "ishares.com",   "BND":   "vanguard.com",
};

/* ── Heuristique nom → domaine pour les tickers non référencés ── */
function guessDomain(name: string, symbol: string): string {
  // ETF : utiliser le nom de l'émetteur
  const n = name.toLowerCase();
  if (n.includes("amundi"))       return "amundi.com";
  if (n.includes("ishares") || n.includes("blackrock")) return "ishares.com";
  if (n.includes("vanguard"))     return "vanguard.com";
  if (n.includes("lyxor"))        return "lyxor.com";
  if (n.includes("spdr"))         return "ssga.com";
  if (n.includes("xtrackers"))    return "xtrackers.com";
  if (n.includes("invesco"))      return "invesco.com";
  if (n.includes("bnp"))          return "bnpparibas-am.com";
  if (n.includes("wisdomtree"))   return "wisdomtree.com";
  if (n.includes("vaneck"))       return "vaneck.com";

  // Nettoyer le nom : enlever suffixes juridiques et construire un domaine
  const clean = name
    .replace(/\s+(S\.A\.|SA|Inc\.?|Corp\.?|Ltd\.?|PLC|SE|NV|AG|SAS|SARL|GmbH|Holdings?|Holding|Group|International)\.?$/i, "")
    .replace(/,.*$/, "")
    .replace(/[''']/g, "")
    .replace(/\./g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");      // "Air Liquide" → "airliquide"

  if (clean.length > 2) return `${clean}.com`;
  return symbol.split(".")[0].toLowerCase() + ".com";
}

/* ── Initiales de secours ── */
function getInitials(name: string, symbol: string): string {
  const src = name || symbol;
  const words = src.split(/[\s\-—–·]+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

function symbolColor(symbol: string): string {
  const palette = ["#1F5C3E","#2F7D52","#5C3A21","#0078D4","#111111","#7A1A1A","#003B5C","#6B3FA0","#C9A24E","#2563eb"];
  let h = 0;
  for (const c of symbol) h = h * 31 + c.charCodeAt(0);
  return palette[Math.abs(h) % palette.length];
}

interface CompanyLogoProps {
  symbol: string;
  name?: string;
  size?: number;
  radius?: number;
}

export default function CompanyLogo({ symbol, name = "", size = 36, radius = 8 }: CompanyLogoProps) {
  const domain  = TICKER_DOMAIN[symbol.toUpperCase()] ?? guessDomain(name, symbol);
  const logoDevUrl = `https://img.logo.dev/${domain}?token=${TOKEN}`;
  // Google Favicons = fallback fiable, gratuit, sans limite
  const googleUrl  = `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;

  // Tentative 0 = Logo.dev, tentative 1 = Google favicons, tentative 2 = initiales
  const [attempt, setAttempt] = useState(0);
  const src = attempt === 0 ? logoDevUrl : attempt === 1 ? googleUrl : null;

  if (src) {
    return (
      <img
        src={src}
        alt={name || symbol}
        width={size}
        height={size}
        onError={() => setAttempt(a => a + 1)}
        style={{
          width: size, height: size, borderRadius: radius,
          objectFit: "contain", background: "#fff",
          border: "1px solid var(--line)", flexShrink: 0, display: "block",
        }}
      />
    );
  }

  /* Fallback final : initiales colorées */
  return (
    <div style={{
      width: size, height: size, borderRadius: radius, flexShrink: 0,
      background: symbolColor(symbol),
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: Math.round(size * 0.3), fontWeight: 700, color: "#fff",
      fontFamily: "var(--font-geist-mono, monospace)",
    }}>
      {getInitials(name, symbol)}
    </div>
  );
}
