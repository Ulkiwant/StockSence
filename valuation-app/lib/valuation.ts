// Hidden valuation logic — never exposed to the client

export interface ValuationInput {
  currentPrice: number;
  eps: number;
  freeCashFlow: number;
  sharesOutstanding: number;
  revenueGrowth: number;
  operatingMargin: number;
  debtToEquity: number;
  returnOnEquity: number;
  priceToBook: number;
  forwardPE: number;
  trailingPE: number;
  beta: number;
  dividendYield: number;
  sector: string;
  industry: string;
}

export interface ValuationResult {
  fairValue: number;
  dcfValue: number;
  peValue: number;
  upside: number;
  signal: "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL";
  score: number;
  strengths: string[];
  risks: string[];
}

// ─── Industry-level P/E benchmarks (granular) ───────────────────────────────

const INDUSTRY_PE: Record<string, number> = {
  // Technologie
  "Semiconductors": 30, "Semiconductor Equipment & Materials": 28,
  "Software—Application": 38, "Software—Infrastructure": 32,
  "Internet Content & Information": 33, "Information Technology Services": 26,
  "Electronic Components": 22, "Consumer Electronics": 24,
  // Santé
  "Drug Manufacturers—General": 22, "Drug Manufacturers—Specialty & Generic": 18,
  "Biotechnology": 26, "Medical Devices": 30, "Diagnostics & Research": 28,
  "Health Care Plans": 18, "Medical Care Facilities": 20,
  // Chimie & Matériaux
  "Specialty Chemicals": 24, "Chemicals": 18, "Agricultural Inputs": 18,
  "Aluminum": 14, "Steel": 11, "Copper": 13, "Gold": 18, "Silver": 16,
  "Building Materials": 17, "Lumber & Wood Production": 14,
  // Industrie
  "Aerospace & Defense": 24, "Industrial Machinery": 21,
  "Specialty Industrial Machinery": 22, "Railroads": 23,
  "Trucking": 18, "Airlines": 11, "Waste Management": 28,
  "Engineering & Construction": 18, "Infrastructure Operations": 22,
  // Consommation discrétionnaire
  "Auto Manufacturers": 12, "Auto Parts": 14, "Restaurants": 26,
  "Apparel Retail": 18, "Luxury Goods": 30, "Home Improvement Retail": 22,
  "Internet Retail": 40, "Specialty Retail": 18,
  // Consommation de base
  "Beverages—Non-Alcoholic": 28, "Beverages—Alcoholic": 22,
  "Packaged Foods": 22, "Household & Personal Products": 24,
  "Discount Stores": 25, "Grocery Stores": 18, "Tobacco": 13,
  // Énergie
  "Oil & Gas Integrated": 13, "Oil & Gas E&P": 14,
  "Oil & Gas Midstream": 17, "Oil & Gas Refining & Marketing": 11,
  "Oil & Gas Equipment & Services": 15,
  // Finance
  "Banks—Diversified": 12, "Banks—Regional": 11,
  "Insurance—Diversified": 13, "Insurance—Life": 11,
  "Asset Management": 18, "Capital Markets": 15, "Financial Data": 28,
  // Immobilier
  "REIT—Residential": 25, "REIT—Retail": 20, "REIT—Industrial": 30,
  "REIT—Office": 16, "REIT—Healthcare Facilities": 24,
  "Real Estate Services": 20,
  // Utilities
  "Utilities—Regulated Electric": 18, "Utilities—Regulated Gas": 16,
  "Utilities—Regulated Water": 20, "Utilities—Renewable": 28,
  // Télécoms & Médias
  "Telecom Services": 16, "Entertainment": 24, "Broadcasting": 14,
  "Electronic Gaming & Multimedia": 22,
};

const SECTOR_PE_FALLBACK: Record<string, number> = {
  Technology: 30, "Health Care": 24, Healthcare: 24,
  Financials: 13, "Financial Services": 13,
  "Consumer Discretionary": 22, "Consumer Cyclical": 22, "Consumer Staples": 22,
  Energy: 13, Utilities: 19, Industrials: 21, Materials: 19,
  "Basic Materials": 19, "Real Estate": 23,
  "Communication Services": 22, default: 19,
};

// Taux de croissance long-terme minimum par secteur (évite de pénaliser
// les entreprises matures sur un seul trimestre de baisse conjoncturelle)
const SECTOR_FLOOR_GROWTH: Record<string, number> = {
  Technology: 0.07, "Health Care": 0.06, Healthcare: 0.06,
  Financials: 0.04, "Financial Services": 0.04,
  "Consumer Discretionary": 0.04, "Consumer Cyclical": 0.04, "Consumer Staples": 0.04,
  Energy: 0.03, Utilities: 0.03, Industrials: 0.05,
  Materials: 0.04, "Basic Materials": 0.04,
  "Real Estate": 0.04, "Communication Services": 0.05, default: 0.04,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Yahoo Finance uses either "—" or " - " depending on the market. Normalize to "—". */
function normalizeIndustry(industry: string): string {
  return industry.replace(/\s+-\s+/g, "—");
}

function getBenchmarkPE(sector: string, industry: string): number {
  const ind = normalizeIndustry(industry);
  return INDUSTRY_PE[ind]
    ?? INDUSTRY_PE[industry]
    ?? SECTOR_PE_FALLBACK[sector]
    ?? SECTOR_PE_FALLBACK.default;
}

function getFloorGrowth(sector: string): number {
  return SECTOR_FLOOR_GROWTH[sector] ?? SECTOR_FLOOR_GROWTH.default;
}

/**
 * Yahoo Finance renvoie debtToEquity tantôt en ratio (0.5) tantôt en
 * pourcentage (50.657). Normalise toujours en ratio décimal.
 */
function normalizeDebtToEquity(raw: number): number {
  if (!raw || raw <= 0) return 0;
  return raw > 10 ? raw / 100 : raw;
}

// ─── 1. DCF (Discounted Cash Flow) ───────────────────────────────────────────

function dcfValuation(input: ValuationInput): number {
  const fcfTotal = input.freeCashFlow;
  const shares = input.sharesOutstanding;
  if (!fcfTotal || !shares || fcfTotal <= 0 || shares <= 0) return 0;

  let fcfPerShare = fcfTotal / shares;

  // Sanity check : FCF/share doit être compris entre 55% et 250% de l'EPS.
  // Sous 55% : Yahoo renvoie souvent un FCF "levered" ou net de remboursements
  // de dette, qui sous-estime le vrai cash généré par l'activité.
  // On utilise alors EPS × 0.70 comme proxy conservateur.
  if (input.eps > 0) {
    const ratio = fcfPerShare / input.eps;
    if (ratio < 0.55 || ratio > 2.5) {
      fcfPerShare = input.eps * 0.70;
    }
  }

  if (fcfPerShare <= 0) return 0;

  // Taux d'actualisation WACC simplifié
  const riskFreeRate = 0.04;         // OAT 10 ans ≈ 4%
  const marketPremium = 0.055;
  const beta = Math.max(input.beta ?? 1, 0.4); // plancher β = 0.4 (défensif)
  const discountRate = riskFreeRate + beta * marketPremium;

  // Taux de croissance : on prend le max entre la croissance observée et le
  // plancher sectoriel long-terme, plafonné à 20%
  const floorGrowth = getFloorGrowth(input.sector);
  const observedGrowth = input.revenueGrowth ?? 0;
  const phase1Growth = Math.min(Math.max(observedGrowth, floorGrowth), 0.20);
  const phase2Growth = Math.min(phase1Growth * 0.5, 0.10);
  const terminalGrowth = 0.025;

  // Vérification que le taux d'actualisation > croissance terminale
  if (discountRate <= terminalGrowth) return 0;

  let dcf = 0;
  let fcf = fcfPerShare;

  // Phase 1 : 5 ans à phase1Growth
  for (let y = 1; y <= 5; y++) {
    fcf *= 1 + phase1Growth;
    dcf += fcf / Math.pow(1 + discountRate, y);
  }

  // Phase 2 : 5 ans à phase2Growth
  for (let y = 6; y <= 10; y++) {
    fcf *= 1 + phase2Growth;
    dcf += fcf / Math.pow(1 + discountRate, y);
  }

  // Valeur terminale (Gordon Growth)
  const tv = (fcf * (1 + terminalGrowth)) / (discountRate - terminalGrowth);
  dcf += tv / Math.pow(1 + discountRate, 10);

  return dcf;
}

// ─── 2. P/E sur bénéfices historiques ────────────────────────────────────────

function trailingPEValuation(input: ValuationInput): number {
  if (!input.eps || input.eps <= 0) return 0;
  const benchPE = getBenchmarkPE(input.sector, input.industry);
  const floorGrowth = getFloorGrowth(input.sector);
  const growth = Math.max(input.revenueGrowth ?? 0, floorGrowth);
  const adjustedPE = benchPE * (1 + Math.min(growth, 0.15) * 0.5);
  return input.eps * adjustedPE;
}

// ─── 3. P/E forward (consensus analystes) ────────────────────────────────────

function forwardPEValuation(input: ValuationInput): number {
  // Si Yahoo donne un forwardPE fiable, on peut dériver l'EPS forward
  // et le valoriser au P/E sectoriel de référence
  if (!input.forwardPE || input.forwardPE <= 0 || !input.currentPrice) return 0;
  const impliedEPSforward = input.currentPrice / input.forwardPE;
  if (impliedEPSforward <= 0) return 0;
  const benchPE = getBenchmarkPE(input.sector, input.industry);
  return impliedEPSforward * benchPE;
}

// ─── 4. Rendement FCF (Price/FCF) ────────────────────────────────────────────

function fcfYieldValuation(input: ValuationInput): number {
  const shares = input.sharesOutstanding;
  const fcfTotal = input.freeCashFlow;
  if (!fcfTotal || !shares || fcfTotal <= 0 || shares <= 0) return 0;

  let fcfPerShare = fcfTotal / shares;
  if (input.eps > 0) {
    const ratio = fcfPerShare / input.eps;
    if (ratio < 0.1 || ratio > 3) fcfPerShare = input.eps * 0.60;
  }
  if (fcfPerShare <= 0) return 0;

  // FCF yield cible par secteur (inverse du P/FCF attendu)
  const sectorFCFYields: Record<string, number> = {
    Technology: 0.032, "Health Care": 0.038, Healthcare: 0.038,
    Financials: 0.07, "Financial Services": 0.07,
    "Consumer Discretionary": 0.048, "Consumer Cyclical": 0.048, "Consumer Staples": 0.042,
    Energy: 0.072, Utilities: 0.05, Industrials: 0.046,
    Materials: 0.05, "Basic Materials": 0.05,
    "Real Estate": 0.04, "Communication Services": 0.045, default: 0.05,
  };
  const targetYield = sectorFCFYields[input.sector] ?? sectorFCFYields.default;
  return fcfPerShare / targetYield;
}

// ─── 5. Scoring ──────────────────────────────────────────────────────────────

function scoreStock(input: ValuationInput, upside: number): number {
  const dte = normalizeDebtToEquity(input.debtToEquity);
  let score = 50;

  // Upside/downside ±25 pts
  score += Math.min(Math.max(upside * 80, -25), 25);

  // Qualité des bénéfices
  if (input.returnOnEquity > 0.2) score += 8;
  else if (input.returnOnEquity > 0.12) score += 4;
  else if (input.returnOnEquity < 0) score -= 8;

  // Endettement normalisé
  if (dte < 0.3) score += 5;
  else if (dte > 2.5) score -= 12;
  else if (dte > 1.5) score -= 6;

  // Marges
  const margin = input.operatingMargin ?? 0;
  if (margin > 0.25) score += 8;
  else if (margin > 0.15) score += 4;
  else if (margin > 0.05) score += 1;
  else if (margin < 0) score -= 8;

  // Croissance (vs plancher sectoriel)
  const floorGrowth = getFloorGrowth(input.sector);
  if (input.revenueGrowth > floorGrowth * 2) score += 5;
  else if (input.revenueGrowth < -0.1) score -= 6;

  // Dividende
  if (input.dividendYield > 0.04) score += 4;
  else if (input.dividendYield > 0.02) score += 2;

  return Math.round(Math.min(Math.max(score, 0), 100));
}

// ─── 5b. Price/Book — pour banques & assurances ──────────────────────────────

const SECTOR_PBOOK_BENCHMARK: Record<string, number> = {
  "Banks—Diversified": 1.0, "Banks—Regional": 0.9,
  "Insurance—Diversified": 1.1, "Insurance—Life": 0.9,
  "Insurance—Property & Casualty": 1.2,
  "Asset Management": 2.2, "Capital Markets": 1.5,
};

function pbookValuation(input: ValuationInput): number {
  if (!input.priceToBook || input.priceToBook <= 0) return 0;
  const ind = normalizeIndustry(input.industry);
  const benchmark = SECTOR_PBOOK_BENCHMARK[ind] ?? SECTOR_PBOOK_BENCHMARK[input.industry];
  if (!benchmark) return 0;
  return input.currentPrice * (benchmark / input.priceToBook);
}

// ─── Export principal ─────────────────────────────────────────────────────────

export function computeValuation(input: ValuationInput): ValuationResult {
  // Calcul de toutes les méthodes
  const dcfV      = dcfValuation(input);
  const trailPEV  = trailingPEValuation(input);
  const fwdPEV    = forwardPEValuation(input);
  const fcfYieldV = fcfYieldValuation(input);
  const pbookV    = pbookValuation(input);

  const sector   = input.sector ?? "";
  const industry = input.industry ?? "";

  // Sélection de méthodes et poids selon le secteur
  let rawMethods: { value: number; weight: number }[];

  const isFinancial = sector === "Financials" || sector === "Financial Services"
    || industry.includes("Bank") || industry.includes("Insurance");

  if (isFinancial) {
    // Banques & assurances : Price/Book dominant
    rawMethods = [
      { value: pbookV,   weight: pbookV   > 0 ? 0.55 : 0 },
      { value: fwdPEV,   weight: fwdPEV   > 0 ? 0.30 : 0 },
      { value: trailPEV, weight: trailPEV > 0 ? 0.15 : 0 },
    ];
  } else if (sector === "Utilities") {
    // Utilities : DCF dominant (cash flows long terme prévisibles)
    rawMethods = [
      { value: dcfV,      weight: dcfV      > 0 ? 0.40 : 0 },
      { value: fwdPEV,    weight: fwdPEV    > 0 ? 0.35 : 0 },
      { value: trailPEV,  weight: trailPEV  > 0 ? 0.15 : 0 },
      { value: fcfYieldV, weight: fcfYieldV > 0 ? 0.10 : 0 },
    ];
  } else if (sector === "Real Estate" || industry.includes("REIT")) {
    // REITs : P/E forward (proxy FFO)
    rawMethods = [
      { value: fwdPEV,   weight: fwdPEV   > 0 ? 0.60 : 0 },
      { value: trailPEV, weight: trailPEV > 0 ? 0.40 : 0 },
    ];
  } else {
    // Défaut : Forward P/E en tête, DCF en validation
    rawMethods = [
      { value: fwdPEV,    weight: fwdPEV    > 0 ? 0.45 : 0 },
      { value: trailPEV,  weight: trailPEV  > 0 ? 0.28 : 0 },
      { value: dcfV,      weight: dcfV      > 0 ? 0.18 : 0 },
      { value: fcfYieldV, weight: fcfYieldV > 0 ? 0.09 : 0 },
    ];
  }

  const methods = rawMethods.filter((m) => m.weight > 0);

  let fairValue: number;
  if (methods.length === 0) {
    fairValue = input.currentPrice;
  } else {
    const totalWeight = methods.reduce((s, m) => s + m.weight, 0);
    fairValue = methods.reduce((s, m) => s + m.value * (m.weight / totalWeight), 0);
  }

  // Garde-fou : atténuation vers le cours si l'écart est extrême.
  // Le marché intègre des informations non disponibles dans les données publiques.
  const ratio = fairValue / input.currentPrice;
  if (ratio > 3)    fairValue = input.currentPrice * (1 + (ratio - 1) * 0.35);
  if (ratio < 0.30) fairValue = input.currentPrice * (0.45 + ratio * 0.55);

  const upside = (fairValue - input.currentPrice) / input.currentPrice;
  const score  = scoreStock(input, upside);

  // Plages élargies pour tenir compte de l'incertitude inhérente aux modèles.
  // Un modèle quantitatif a une marge d'erreur de ±15% — on évite de donner
  // un signal fort pour de petits écarts.
  let signal: ValuationResult["signal"];
  if (upside > 0.25)       signal = "STRONG_BUY";
  else if (upside > 0.10)  signal = "BUY";
  else if (upside > -0.20) signal = "HOLD";
  else if (upside > -0.30) signal = "SELL";
  else                     signal = "STRONG_SELL";

  // Forces & risques
  const dte = normalizeDebtToEquity(input.debtToEquity);
  const strengths: string[] = [];
  const risks: string[] = [];

  if (input.returnOnEquity > 0.15) strengths.push("Rentabilité solide (ROE élevé)");
  if (input.operatingMargin > 0.20) strengths.push("Marges opérationnelles excellentes");
  if (input.revenueGrowth > getFloorGrowth(input.sector) * 1.5) strengths.push("Croissance des revenus soutenue");
  if (dte < 0.4) strengths.push("Bilan financier sain, peu endetté");
  if (input.dividendYield > 0.02) strengths.push(`Dividende attractif (${(input.dividendYield * 100).toFixed(1)}%)`);
  if (upside > 0.15) strengths.push("Décote par rapport à la valeur intrinsèque");
  if (input.priceToBook > 0 && input.priceToBook < 2 && input.returnOnEquity > 0.1) strengths.push("Valorisation raisonnable au regard des fonds propres");

  if (dte > 2.0) risks.push("Niveau d'endettement élevé");
  if (input.beta > 1.5) risks.push(`Forte volatilité (beta ${input.beta.toFixed(2)})`);
  if (input.operatingMargin < 0.05) risks.push("Marges faibles ou sous pression");
  if (input.trailingPE > 45) risks.push("Valorisation exigeante (P/E élevé)");
  if (input.revenueGrowth < -0.08) risks.push("Revenus en contraction significative");
  if (upside < -0.15) risks.push("Cours actuel supérieur à la valeur calculée");
  if (input.forwardPE > 0 && input.forwardPE > getBenchmarkPE(input.sector, input.industry) * 1.5) risks.push("Prime de valorisation élevée vs secteur");

  return {
    fairValue,
    dcfValue: dcfV,
    peValue: trailPEV,
    upside,
    signal,
    score,
    strengths,
    risks,
  };
}
