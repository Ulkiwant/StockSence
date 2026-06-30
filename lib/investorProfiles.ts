/**
 * Profils d'investisseur — contenu STATIQUE et IDENTIQUE pour tous les
 * utilisateurs d'un même profil/variante. Aucune génération dynamique / IA.
 *
 * Le questionnaire ROUTE vers un des 4 profils-types de risque
 * (Prudent / Équilibré / Dynamique / Offensif). Chaque profil propose
 * ensuite plusieurs VARIANTES thématiques (même niveau de risque, style
 * d'allocation différent) — l'utilisateur choisit celle qui lui parle le
 * plus. Toujours du contenu statique, jamais une allocation calculée
 * individuellement.
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

export interface ProfileVariant {
  variantKey: string;
  variantLabel: string; // "Mondial", "Dividendes", "Tech & Croissance"...
  variantIcon: string;
  variantDesc: string; // 1 phrase pour différencier les variantes sur l'écran de choix
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

export interface InvestorProfileGroup {
  key: ProfileKey;
  label: string; // "Prudent" | "Équilibré" | "Dynamique" | "Offensif"
  variants: ProfileVariant[];
}

const DISCLAIMER = (label: string) =>
  `Ceci est un exemple générique correspondant au profil ${label}, basé sur des hypothèses pédagogiques. Ce n'est pas une recommandation qui te soit propre. Avant d'investir, fais tes propres recherches ou consulte un conseiller en investissements financiers (CIF) inscrit à l'ORIAS.`;

export const INVESTOR_PROFILES: Record<ProfileKey, InvestorProfileGroup> = {
  prudent: {
    key: "prudent",
    label: "Prudent",
    variants: [
      {
        variantKey: "monde",
        variantLabel: "Sécurité Mondiale",
        variantIcon: "🛡️",
        variantDesc: "Obligations + ETF Monde — le choix le plus simple et le plus diversifié.",
        portfolioName: "Profil Prudent — Sécurité Mondiale",
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
        strategy: "Allocation dominée par les obligations pour limiter les variations de valeur, complétée par une poche actions mondiales diversifiées.",
        rebalancing: "1 fois par an, pour revenir aux pourcentages cibles.",
        tips: [
          "Une allocation à dominante obligataire varie moins, mais offre aussi un potentiel de performance plus limité sur le long terme.",
          "Vérifie régulièrement que la répartition reste proche des pourcentages cibles.",
          "Privilégie des versements réguliers plutôt qu'un versement unique, pour lisser les points d'entrée.",
        ],
        disclaimer: DISCLAIMER("Prudent"),
      },
      {
        variantKey: "rendement",
        variantLabel: "Rendement & Stabilité",
        variantIcon: "💰",
        variantDesc: "Privilégie les dividendes réguliers tout en gardant un risque faible.",
        portfolioName: "Profil Prudent — Rendement & Stabilité",
        summary:
          "Ce profil garde un risque faible grâce à une large poche obligataire, mais oriente la part actions vers des entreprises versant des dividendes réguliers plutôt que vers la croissance pure.",
        expectedReturn: "3 % à 4,5 % par an*",
        riskLevel: "Faible",
        dividendYield: "2,5 % à 3,5 % par an (estimation)",
        taxAdvice: "Le PEA et l'assurance-vie restent pertinents ; les dividendes d'actions PEA bénéficient du même cadre fiscal après 5 ans.",
        allocations: [
          { symbol: "AGGH.AS", name: "iShares Core Global Aggregate Bond UCITS ETF", type: "ETF", percentage: 40, rationale: "Poche obligataire principale — stabilise la valeur du portefeuille.", currency: "EUR" },
          { symbol: "VHYL.AS", name: "Vanguard FTSE All-World High Dividend Yield UCITS ETF", type: "ETF", percentage: 35, rationale: "ETF mondial concentré sur les entreprises à haut rendement de dividende — génère des revenus réguliers.", currency: "EUR" },
          { symbol: "CW8.PA", name: "Amundi MSCI World UCITS ETF", type: "ETF", percentage: 15, rationale: "Diversification complémentaire sur les actions mondiales.", currency: "EUR" },
          { symbol: "PAEEM.PA", name: "Amundi MSCI Emerging Markets UCITS ETF", type: "ETF", percentage: 10, rationale: "Petite poche émergente pour diversifier les zones géographiques.", currency: "EUR" },
        ],
        strategy: "Allocation à dominante obligataire, avec une poche actions orientée vers le rendement (dividendes) plutôt que vers la croissance.",
        rebalancing: "1 fois par an, pour revenir aux pourcentages cibles.",
        tips: [
          "Les dividendes versés peuvent être réinvestis automatiquement pour accélérer l'effet boule de neige.",
          "Un rendement élevé n'est pas garanti dans le temps — il dépend de la santé financière des entreprises versantes.",
          "Cette variante convient bien si tu cherches des revenus réguliers plutôt qu'une plus-value à terme.",
        ],
        disclaimer: DISCLAIMER("Prudent"),
      },
    ],
  },

  equilibre: {
    key: "equilibre",
    label: "Équilibré",
    variants: [
      {
        variantKey: "monde",
        variantLabel: "Mondial Équilibré",
        variantIcon: "🌍",
        variantDesc: "ETF Monde en cœur de portefeuille, complété par des obligations.",
        portfolioName: "Profil Équilibré — Mondial",
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
        strategy: "Cœur du portefeuille en ETF actions mondiales diversifiées, complété par une poche obligataire et une petite ligne d'action individuelle à titre d'exemple.",
        rebalancing: "1 à 2 fois par an, pour revenir aux pourcentages cibles.",
        tips: [
          "La répartition actions/obligations est le principal levier pour ajuster le niveau de risque d'un portefeuille.",
          "Les versements réguliers permettent de lisser les points d'entrée sur le long terme.",
          "Une ligne d'action individuelle reste une exception dans une allocation à dominante diversifiée.",
        ],
        disclaimer: DISCLAIMER("Équilibré"),
      },
      {
        variantKey: "dividendes",
        variantLabel: "Dividendes",
        variantIcon: "💸",
        variantDesc: "Vise des revenus réguliers via des actifs à dividendes, à risque modéré.",
        portfolioName: "Profil Équilibré — Dividendes",
        summary:
          "Même niveau de risque que le profil Équilibré Mondial, mais orienté vers la génération de revenus réguliers grâce à des ETF et actions à dividendes plutôt qu'à la croissance pure.",
        expectedReturn: "4,5 % à 6 % par an*",
        riskLevel: "Modéré",
        dividendYield: "2,5 % à 3 % par an (estimation)",
        taxAdvice: "Le PEA est pertinent pour les titres éligibles ; les dividendes y bénéficient de l'avantage fiscal après 5 ans.",
        allocations: [
          { symbol: "CW8.PA", name: "Amundi MSCI World UCITS ETF", type: "ETF", percentage: 35, rationale: "Cœur de portefeuille mondial, pour garder une diversification large.", currency: "EUR" },
          { symbol: "VHYL.AS", name: "Vanguard FTSE All-World High Dividend Yield UCITS ETF", type: "ETF", percentage: 30, rationale: "ETF mondial à haut rendement de dividende — génère des revenus réguliers.", currency: "EUR" },
          { symbol: "AGGH.AS", name: "iShares Core Global Aggregate Bond UCITS ETF", type: "ETF", percentage: 18, rationale: "Poche obligataire pour réduire la volatilité globale.", currency: "EUR" },
          { symbol: "TTE.PA", name: "TotalEnergies SE", type: "Action", percentage: 9, rationale: "Exemple d'action à dividende régulier, illustrant une ligne de conviction orientée revenus.", currency: "EUR" },
          { symbol: "PAEEM.PA", name: "Amundi MSCI Emerging Markets UCITS ETF", type: "ETF", percentage: 8, rationale: "Diversification géographique complémentaire.", currency: "EUR" },
        ],
        strategy: "Allocation diversifiée mondialement, avec une orientation marquée vers les actifs versant des dividendes réguliers.",
        rebalancing: "1 à 2 fois par an, pour revenir aux pourcentages cibles.",
        tips: [
          "Les dividendes peuvent être réinvestis pour accélérer la croissance du capital dans la durée.",
          "Un dividende élevé aujourd'hui n'est jamais garanti pour demain — il dépend de la santé de l'entreprise.",
          "Cette variante convient bien à un horizon où des revenus réguliers sont recherchés en complément de la croissance.",
        ],
        disclaimer: DISCLAIMER("Équilibré"),
      },
    ],
  },

  dynamique: {
    key: "dynamique",
    label: "Dynamique",
    variants: [
      {
        variantKey: "monde",
        variantLabel: "Mondial + Émergents",
        variantIcon: "🚀",
        variantDesc: "Large part actions mondiales et émergentes pour viser la croissance.",
        portfolioName: "Profil Dynamique — Mondial + Émergents",
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
        strategy: "Allocation très majoritairement investie en actions, avec une part émergente renforcée et quelques lignes individuelles à titre d'exemple.",
        rebalancing: "1 à 2 fois par an, pour revenir aux pourcentages cibles.",
        tips: [
          "Une allocation à dominante actions peut connaître des baisses de 20 à 30 % sur certaines périodes — c'est la contrepartie d'un potentiel de croissance plus élevé.",
          "Les lignes d'actions individuelles concentrent le risque sur une seule entreprise : elles restent minoritaires dans cet exemple.",
          "Un horizon long permet généralement d'amortir les phases de baisse des marchés actions.",
        ],
        disclaimer: DISCLAIMER("Dynamique"),
      },
      {
        variantKey: "tech",
        variantLabel: "Tech & Croissance",
        variantIcon: "💡",
        variantDesc: "Concentré sur la technologie et l'innovation, plus volatil.",
        portfolioName: "Profil Dynamique — Tech & Croissance",
        summary:
          "Même niveau de risque que le profil Dynamique Mondial + Émergents, mais avec une orientation marquée vers le secteur technologique via un ETF Nasdaq et des lignes individuelles du secteur.",
        expectedReturn: "7 % à 9 % par an*",
        riskLevel: "Élevé",
        dividendYield: "0,5 % à 1 % par an (estimation)",
        taxAdvice: "Certains ETF Nasdaq à réplication synthétique sont éligibles au PEA ; vérifie l'éligibilité avant d'investir. Un CTO reste une alternative simple.",
        allocations: [
          { symbol: "CW8.PA", name: "Amundi MSCI World UCITS ETF", type: "ETF", percentage: 35, rationale: "Socle de diversification mondiale, pour ne pas tout miser sur un seul secteur.", currency: "EUR" },
          { symbol: "PUST.PA", name: "Amundi Nasdaq-100 UCITS ETF", type: "ETF", percentage: 25, rationale: "Forte concentration sur les grandes entreprises technologiques américaines.", currency: "EUR" },
          { symbol: "NVDA", name: "NVIDIA Corporation", type: "Action", percentage: 15, rationale: "Exemple d'action individuelle dans les semi-conducteurs et l'intelligence artificielle.", currency: "USD" },
          { symbol: "MC.PA", name: "LVMH Moët Hennessy Louis Vuitton", type: "Action", percentage: 10, rationale: "Exemple d'action individuelle hors secteur tech, pour ne pas tout concentrer sur un seul thème.", currency: "EUR" },
          { symbol: "PAEEM.PA", name: "Amundi MSCI Emerging Markets UCITS ETF", type: "ETF", percentage: 10, rationale: "Diversification géographique complémentaire.", currency: "EUR" },
          { symbol: "AGGH.AS", name: "iShares Core Global Aggregate Bond UCITS ETF", type: "ETF", percentage: 5, rationale: "Petite poche obligataire résiduelle.", currency: "EUR" },
        ],
        strategy: "Allocation majoritairement actions, avec une concentration thématique marquée sur la technologie et l'innovation.",
        rebalancing: "1 à 2 fois par an, pour revenir aux pourcentages cibles.",
        tips: [
          "Une concentration sectorielle (ici la tech) amplifie à la fois le potentiel de gain et le risque de baisse en cas de retournement du secteur.",
          "Le secteur technologique a historiquement connu des phases de forte correction (-50 % ou plus) — un horizon long est recommandé.",
          "Vérifie toujours l'éligibilité PEA exacte d'un ETF avant d'investir : elle peut évoluer.",
        ],
        disclaimer: DISCLAIMER("Dynamique"),
      },
    ],
  },

  offensif: {
    key: "offensif",
    label: "Offensif",
    variants: [
      {
        variantKey: "monde",
        variantLabel: "Croissance Maximale",
        variantIcon: "⚡",
        variantDesc: "Quasi-totalité en actions, y compris des lignes individuelles.",
        portfolioName: "Profil Offensif — Croissance Maximale",
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
        strategy: "Allocation très largement investie en actions, avec une part émergente importante et plusieurs lignes individuelles à titre d'exemple.",
        rebalancing: "1 à 2 fois par an, pour revenir aux pourcentages cibles.",
        tips: [
          "Ce type d'allocation peut connaître des baisses importantes (30 % ou plus) sur certaines périodes.",
          "Plus la part en lignes individuelles est élevée, plus le portefeuille dépend de la performance de quelques entreprises.",
          "Un horizon très long (10 ans ou plus) est généralement nécessaire pour ce type de répartition.",
        ],
        disclaimer: DISCLAIMER("Offensif"),
      },
      {
        variantKey: "tech",
        variantLabel: "Tech Concentré",
        variantIcon: "🔥",
        variantDesc: "Forte concentration sur quelques valeurs technologiques phares.",
        portfolioName: "Profil Offensif — Tech Concentré",
        summary:
          "Même niveau de risque que le profil Offensif Croissance Maximale, mais avec une concentration encore plus marquée sur un petit nombre de grandes valeurs technologiques via un ETF Nasdaq et des lignes individuelles.",
        expectedReturn: "9 % à 11 % par an*",
        riskLevel: "Élevé",
        dividendYield: "0 % à 0,5 % par an (estimation)",
        taxAdvice: "Certains ETF Nasdaq à réplication synthétique sont éligibles au PEA ; vérifie l'éligibilité avant d'investir. Un CTO reste une alternative simple pour les titres non éligibles.",
        allocations: [
          { symbol: "PUST.PA", name: "Amundi Nasdaq-100 UCITS ETF", type: "ETF", percentage: 30, rationale: "Concentration sur les plus grandes entreprises technologiques américaines.", currency: "EUR" },
          { symbol: "NVDA", name: "NVIDIA Corporation", type: "Action", percentage: 15, rationale: "Exemple d'action individuelle dans les semi-conducteurs et l'intelligence artificielle.", currency: "USD" },
          { symbol: "AAPL", name: "Apple Inc.", type: "Action", percentage: 12, rationale: "Exemple d'action individuelle d'une grande entreprise technologique.", currency: "USD" },
          { symbol: "MSFT", name: "Microsoft Corporation", type: "Action", percentage: 10, rationale: "Exemple d'action individuelle technologique diversifiée (cloud, logiciels).", currency: "USD" },
          { symbol: "CW8.PA", name: "Amundi MSCI World UCITS ETF", type: "ETF", percentage: 20, rationale: "Diversification mondiale résiduelle, pour ne pas tout concentrer sur la tech.", currency: "EUR" },
          { symbol: "PAEEM.PA", name: "Amundi MSCI Emerging Markets UCITS ETF", type: "ETF", percentage: 8, rationale: "Diversification géographique complémentaire.", currency: "EUR" },
          { symbol: "AGGH.AS", name: "iShares Core Global Aggregate Bond UCITS ETF", type: "ETF", percentage: 5, rationale: "Poche obligataire résiduelle, volontairement réduite dans ce profil.", currency: "EUR" },
        ],
        strategy: "Allocation très largement investie en actions, avec une concentration thématique forte sur la technologie via un ETF sectoriel et plusieurs lignes individuelles du secteur.",
        rebalancing: "1 à 2 fois par an, pour revenir aux pourcentages cibles.",
        tips: [
          "C'est la variante la plus concentrée proposée : le risque sectoriel (tech) s'ajoute au risque actions classique.",
          "Une poignée d'entreprises peut peser fortement sur la performance globale, dans un sens comme dans l'autre.",
          "Un horizon très long (10 ans ou plus) et une tolérance élevée aux fortes baisses sont nécessaires pour cette variante.",
        ],
        disclaimer: DISCLAIMER("Offensif"),
      },
    ],
  },
};

/**
 * Route vers un profil-type à partir des réponses du questionnaire.
 * Fonction déterministe — aucun appel IA, aucune personnalisation.
 * Détermine uniquement le NIVEAU DE RISQUE ; le choix de la variante
 * thématique se fait ensuite par l'utilisateur lui-même.
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
