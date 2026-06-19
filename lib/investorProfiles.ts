/**
 * Profils d'investisseur — contenu STATIQUE et IDENTIQUE pour tous les
 * utilisateurs d'un même profil. Aucune génération dynamique / IA.
 *
 * Le questionnaire ne fait que ROUTER vers un de ces 4 profils-types
 * (Prudent / Équilibré / Dynamique / Offensif) — il ne produit jamais
 * d'allocation calculée individuellement.
 */

export type ProfileKey = "prudent" | "equilibre" | "dynamique" | "offensif";

export interface ProfileAllocation {
  symbol: string;
  name: string;
  type: string;
  percentage: number;
  rationale: string;
  currency: string;
  dividendFrequency?: string;
}

export interface InvestorProfile {
  key: ProfileKey;
  label: string; // "Prudent" | "Équilibré" | "Dynamique" | "Offensif"
  portfolioName: string;
  summary: string;
  expectedReturn: string;
  riskLevel: string; // Faible | Modéré | Élevé
  dividendYield?: string;
  taxAdvice?: string;
  allocations: ProfileAllocation[];
  strategy: string;
  rebalancing: string;
  tips: string[];
  disclaimer: string;
}

export const INVESTOR_PROFILES: Record<ProfileKey, InvestorProfile> = {
  prudent: {
    key: "prudent",
    label: "Prudent",
    portfolioName: "Profil Prudent",
    summary:
      "Ce profil privilégie la préservation du capital. La part obligataire est majoritaire, avec une poche actions limitée pour conserver un potentiel de croissance sur le long terme.",
    expectedReturn: "3 % à 4 % par an*",
    riskLevel: "Faible",
    dividendYield: "1,5 % à 2,5 % par an (estimation)",
    taxAdvice: "Le PEA et l'assurance-vie sont les enveloppes les plus courantes pour ce type de profil.",
    allocations: [
      { symbol: "AGGH.AS", name: "iShares Core Global Aggregate Bond UCITS ETF", type: "ETF", percentage: 45, rationale: "Obligations internationales diversifiées — sert d'amortisseur en cas de baisse des marchés actions.", currency: "EUR" },
      { symbol: "CW8.PA", name: "Amundi MSCI World UCITS ETF", type: "ETF", percentage: 30, rationale: "Exposition large aux grandes entreprises mondiales, pour conserver un potentiel de croissance.", currency: "EUR" },
      { symbol: "IWDA.AS", name: "iShares Core MSCI World UCITS ETF", type: "ETF", percentage: 15, rationale: "Complément diversifié sur les actions mondiales.", currency: "EUR" },
      { symbol: "PAEEM.PA", name: "Amundi MSCI Emerging Markets UCITS ETF", type: "ETF", percentage: 10, rationale: "Petite poche sur les marchés émergents pour diversifier les zones géographiques.", currency: "EUR" },
    ],
    strategy:
      "Allocation dominée par les obligations pour limiter les variations de valeur, complétée par une poche actions mondiales diversifiées.",
    rebalancing: "1 fois par an, pour revenir aux pourcentages cibles.",
    tips: [
      "Une allocation à dominante obligataire varie moins, mais offre aussi un potentiel de performance plus limité sur le long terme.",
      "Vérifie régulièrement que la répartition reste proche des pourcentages cibles.",
      "Privilégie des versements réguliers plutôt qu'un versement unique, pour lisser les points d'entrée.",
    ],
    disclaimer:
      "Ceci est un exemple générique correspondant au profil Prudent, basé sur des hypothèses pédagogiques. Ce n'est pas une recommandation qui te soit propre. Avant d'investir, fais tes propres recherches ou consulte un conseiller en investissements financiers (CIF) inscrit à l'ORIAS.",
  },

  equilibre: {
    key: "equilibre",
    label: "Équilibré",
    portfolioName: "Profil Équilibré",
    summary:
      "Ce profil recherche un compromis entre croissance et stabilité, avec une majorité d'actions mondiales diversifiées et une poche obligataire pour amortir les baisses.",
    expectedReturn: "5 % à 6 % par an*",
    riskLevel: "Modéré",
    dividendYield: "1,5 % à 2 % par an (estimation)",
    taxAdvice: "Le PEA est l'enveloppe la plus courante pour ce type de profil, pour les titres éligibles.",
    allocations: [
      { symbol: "CW8.PA", name: "Amundi MSCI World UCITS ETF", type: "ETF", percentage: 45, rationale: "Cœur de portefeuille — exposition large aux grandes entreprises mondiales.", currency: "EUR" },
      { symbol: "IWDA.AS", name: "iShares Core MSCI World UCITS ETF", type: "ETF", percentage: 20, rationale: "Complément diversifié sur les actions mondiales.", currency: "EUR" },
      { symbol: "AGGH.AS", name: "iShares Core Global Aggregate Bond UCITS ETF", type: "ETF", percentage: 20, rationale: "Poche obligataire pour réduire la volatilité globale.", currency: "EUR" },
      { symbol: "PAEEM.PA", name: "Amundi MSCI Emerging Markets UCITS ETF", type: "ETF", percentage: 10, rationale: "Diversification géographique vers les marchés émergents.", currency: "EUR" },
      { symbol: "MC.PA", name: "LVMH Moët Hennessy Louis Vuitton", type: "Action", percentage: 5, rationale: "Exemple d'action individuelle illustrant une ligne de conviction au sein d'une allocation diversifiée.", currency: "EUR" },
    ],
    strategy:
      "Cœur du portefeuille en ETF actions mondiales diversifiées, complété par une poche obligataire et une petite ligne d'action individuelle à titre d'exemple.",
    rebalancing: "1 à 2 fois par an, pour revenir aux pourcentages cibles.",
    tips: [
      "La répartition actions/obligations est le principal levier pour ajuster le niveau de risque d'un portefeuille.",
      "Les versements réguliers permettent de lisser les points d'entrée sur le long terme.",
      "Une ligne d'action individuelle reste une exception dans une allocation à dominante diversifiée.",
    ],
    disclaimer:
      "Ceci est un exemple générique correspondant au profil Équilibré, basé sur des hypothèses pédagogiques. Ce n'est pas une recommandation qui te soit propre. Avant d'investir, fais tes propres recherches ou consulte un conseiller en investissements financiers (CIF) inscrit à l'ORIAS.",
  },

  dynamique: {
    key: "dynamique",
    label: "Dynamique",
    portfolioName: "Profil Dynamique",
    summary:
      "Ce profil accepte des variations de valeur plus marquées en échange d'un potentiel de croissance plus élevé, avec une large place laissée aux actions mondiales et émergentes.",
    expectedReturn: "6 % à 8 % par an*",
    riskLevel: "Élevé",
    dividendYield: "1 % à 1,5 % par an (estimation)",
    taxAdvice: "Le PEA reste pertinent pour la part actions éligibles ; un CTO peut compléter pour les ETF non éligibles.",
    allocations: [
      { symbol: "CW8.PA", name: "Amundi MSCI World UCITS ETF", type: "ETF", percentage: 45, rationale: "Cœur de portefeuille — exposition large aux grandes entreprises mondiales.", currency: "EUR" },
      { symbol: "IWDA.AS", name: "iShares Core MSCI World UCITS ETF", type: "ETF", percentage: 20, rationale: "Complément diversifié sur les actions mondiales.", currency: "EUR" },
      { symbol: "PAEEM.PA", name: "Amundi MSCI Emerging Markets UCITS ETF", type: "ETF", percentage: 15, rationale: "Plus forte exposition aux marchés émergents, plus volatils mais à fort potentiel.", currency: "EUR" },
      { symbol: "NVDA", name: "NVIDIA Corporation", type: "Action", percentage: 8, rationale: "Exemple d'action individuelle dans un secteur de croissance.", currency: "USD" },
      { symbol: "MC.PA", name: "LVMH Moët Hennessy Louis Vuitton", type: "Action", percentage: 7, rationale: "Exemple d'action individuelle illustrant une ligne de conviction.", currency: "EUR" },
      { symbol: "AGGH.AS", name: "iShares Core Global Aggregate Bond UCITS ETF", type: "ETF", percentage: 5, rationale: "Petite poche obligataire résiduelle pour limiter légèrement les à-coups.", currency: "EUR" },
    ],
    strategy:
      "Allocation très majoritairement investie en actions, avec une part émergente renforcée et quelques lignes individuelles à titre d'exemple.",
    rebalancing: "1 à 2 fois par an, pour revenir aux pourcentages cibles.",
    tips: [
      "Une allocation à dominante actions peut connaître des baisses de 20 à 30 % sur certaines périodes — c'est la contrepartie d'un potentiel de croissance plus élevé.",
      "Les lignes d'actions individuelles concentrent le risque sur une seule entreprise : elles restent minoritaires dans cet exemple.",
      "Un horizon long permet généralement d'amortir les phases de baisse des marchés actions.",
    ],
    disclaimer:
      "Ceci est un exemple générique correspondant au profil Dynamique, basé sur des hypothèses pédagogiques. Ce n'est pas une recommandation qui te soit propre. Avant d'investir, fais tes propres recherches ou consulte un conseiller en investissements financiers (CIF) inscrit à l'ORIAS.",
  },

  offensif: {
    key: "offensif",
    label: "Offensif",
    portfolioName: "Profil Offensif",
    summary:
      "Ce profil maximise la part actions, y compris sur des zones et valeurs plus volatiles, en échange d'un potentiel de croissance plus élevé sur le très long terme.",
    expectedReturn: "8 % à 10 % par an*",
    riskLevel: "Élevé",
    dividendYield: "0,5 % à 1 % par an (estimation)",
    taxAdvice: "Le PEA reste pertinent pour la part actions éligibles ; un CTO peut compléter pour les ETF et titres non éligibles.",
    allocations: [
      { symbol: "CW8.PA", name: "Amundi MSCI World UCITS ETF", type: "ETF", percentage: 35, rationale: "Socle de diversification sur les actions mondiales.", currency: "EUR" },
      { symbol: "IWDA.AS", name: "iShares Core MSCI World UCITS ETF", type: "ETF", percentage: 15, rationale: "Complément diversifié sur les actions mondiales.", currency: "EUR" },
      { symbol: "PAEEM.PA", name: "Amundi MSCI Emerging Markets UCITS ETF", type: "ETF", percentage: 15, rationale: "Forte exposition aux marchés émergents, plus volatils mais à fort potentiel de croissance.", currency: "EUR" },
      { symbol: "NVDA", name: "NVIDIA Corporation", type: "Action", percentage: 12, rationale: "Exemple d'action individuelle dans un secteur de croissance.", currency: "USD" },
      { symbol: "AAPL", name: "Apple Inc.", type: "Action", percentage: 10, rationale: "Exemple d'action individuelle d'une grande entreprise technologique.", currency: "USD" },
      { symbol: "MC.PA", name: "LVMH Moët Hennessy Louis Vuitton", type: "Action", percentage: 8, rationale: "Exemple d'action individuelle illustrant une ligne de conviction.", currency: "EUR" },
      { symbol: "AGGH.AS", name: "iShares Core Global Aggregate Bond UCITS ETF", type: "ETF", percentage: 5, rationale: "Poche obligataire résiduelle, volontairement réduite dans ce profil.", currency: "EUR" },
    ],
    strategy:
      "Allocation très largement investie en actions, avec une part émergente importante et plusieurs lignes individuelles à titre d'exemple.",
    rebalancing: "1 à 2 fois par an, pour revenir aux pourcentages cibles.",
    tips: [
      "Ce type d'allocation peut connaître des baisses importantes (30 % ou plus) sur certaines périodes.",
      "Plus la part en lignes individuelles est élevée, plus le portefeuille dépend de la performance de quelques entreprises.",
      "Un horizon très long (10 ans ou plus) est généralement nécessaire pour ce type de répartition.",
    ],
    disclaimer:
      "Ceci est un exemple générique correspondant au profil Offensif, basé sur des hypothèses pédagogiques. Ce n'est pas une recommandation qui te soit propre. Avant d'investir, fais tes propres recherches ou consulte un conseiller en investissements financiers (CIF) inscrit à l'ORIAS.",
  },
};

/**
 * Route vers un profil-type à partir des réponses du questionnaire.
 * Fonction déterministe — aucun appel IA, aucune personnalisation.
 */
export function determineProfile(answers: Record<string, string | string[] | undefined>): ProfileKey {
  const riskTolerance = (answers.riskTolerance as string) ?? "";
  const reactionToDrop = (answers.reactionToDrop as string) ?? "";
  const horizon = (answers.horizon as string) ?? "";

  let score = 0;

  if (riskTolerance.includes("Dynamique")) score += 4;
  else if (riskTolerance.includes("Équilibré")) score += 2;
  else if (riskTolerance.includes("Prudent")) score += 0;

  if (reactionToDrop.includes("profite")) score += 3;
  else if (reactionToDrop.includes("reste calme")) score += 2;
  else if (reactionToDrop.includes("attends")) score += 1;
  else if (reactionToDrop.includes("vends")) score += 0;

  if (horizon.includes("Plus de")) score += 3;
  else if (horizon.includes("5 à 10")) score += 2;
  else if (horizon.includes("2 à 5")) score += 1;
  else if (horizon.includes("Moins de")) score += 0;

  // score ∈ [0, 10]
  if (score <= 2) return "prudent";
  if (score <= 5) return "equilibre";
  if (score <= 8) return "dynamique";
  return "offensif";
}

export const PROFILE_LABELS: Record<ProfileKey, string> = {
  prudent: "Prudent",
  equilibre: "Équilibré",
  dynamique: "Dynamique",
  offensif: "Offensif",
};
