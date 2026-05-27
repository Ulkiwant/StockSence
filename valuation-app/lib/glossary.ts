import { MetricDef } from "@/components/MetricTooltip";

export const GLOSSARY: Record<string, MetricDef> = {
  /* ── Enveloppes fiscales ─────────────────────────────────────── */
  pea: {
    name: "PEA",
    fullName: "Plan d'Épargne en Actions",
    definition:
      "Compte d'investissement réservé aux résidents français, permettant d'acheter des actions européennes avec une fiscalité avantageuse après 5 ans.",
    howToRead:
      "Plafond de versement à 150 000 €. Après 5 ans de détention, les gains sont exonérés d'impôt sur le revenu (seuls les prélèvements sociaux de 17,2 % s'appliquent). Idéal pour un horizon long terme.\n\n📌 Quand l'utiliser : horizon > 5 ans, actions européennes, premier compte d'investissement recommandé pour un Français.",
    example:
      "💡 Tu investis 200 €/mois pendant 10 ans dans un PEA. À la sortie, tu ne paies que 17,2 % sur tes gains au lieu de 30 % (flat tax). Sur 10 000 € de gains, tu économises ~1 280 € d'impôts.",
    benchmarks: [],
    currentPosition: 0,
    tags: ["Fiscal", "Actions", "Débutant"],
  },
  assurancevie: {
    name: "Assurance-vie",
    fullName: "Contrat d'épargne avec avantages fiscaux et successoraux",
    definition:
      "Contrat d'épargne flexible permettant d'investir en fonds euros (sécurisé) ou en unités de compte (actions, ETF), avec des avantages fiscaux et successoraux.",
    howToRead:
      "Après 8 ans, abattement annuel de 4 600 € (personne seule) ou 9 200 € (couple) sur les gains. Avantage majeur : les sommes transmises aux bénéficiaires échappent en grande partie aux droits de succession.\n\n📌 Quand l'utiliser : épargne moyen/long terme, préparation de la retraite, transmission de patrimoine.",
    example:
      "💡 Marie, 45 ans, place 50 000 € en assurance-vie. Elle peut retirer ses gains après 8 ans avec une fiscalité réduite, et en cas de décès, ses enfants reçoivent le capital avec peu ou pas de droits de succession.",
    benchmarks: [],
    currentPosition: 0,
    tags: ["Fiscal", "Épargne", "Succession"],
  },
  cto: {
    name: "CTO",
    fullName: "Compte-Titres Ordinaire",
    definition:
      "Compte d'investissement sans plafond ni restriction géographique, permettant d'acheter n'importe quelle action mondiale — mais sans avantage fiscal particulier.",
    howToRead:
      "Aucun plafond de versement. Accès à toutes les bourses mondiales (US, Asie, émergents). Les gains sont soumis à la flat tax de 30 % (12,8 % d'impôt + 17,2 % de prélèvements sociaux).\n\n📌 Quand l'utiliser : PEA déjà ouvert ou plein, investissement hors Europe, pas de contrainte de plafond.",
    example:
      "💡 Tu veux acheter des actions Tesla ou Amazon — impossibles dans un PEA (entreprises américaines). Le CTO te donne accès à ces valeurs, mais tes gains seront taxés à 30 % à la revente.",
    benchmarks: [],
    currentPosition: 0,
    tags: ["Fiscal", "Actions", "Flexible"],
  },

  /* ── Multiples de valorisation ───────────────────────────────── */
  pe: {
    name: "P/E",
    fullName: "Price-to-Earnings — Ratio cours / bénéfice",
    definition:
      "Combien les investisseurs paient pour chaque euro de bénéfice annuel d'une entreprise. C'est le multiple de valorisation le plus utilisé au monde.",
    howToRead:
      "P/E 28 = vous payez 28 € pour 1 € de profit. Plus le P/E est élevé, plus l'action est chère par rapport à ses bénéfices. Un P/E élevé peut être justifié par une forte croissance attendue.",
    example:
      "🍎 Apple P/E 28 vs Carrefour P/E 12. Apple est plus chère car les investisseurs anticipent davantage de croissance future. Le P/E moyen du marché tourne autour de 20.",
    benchmarks: [
      { label: "Bon marché", color: "green" },
      { label: "", color: "green" },
      { label: "", color: "yellow" },
      { label: "", color: "yellow" },
      { label: "Cher", color: "red" },
    ],
    currentPosition: 2,
    tags: ["Valorisation", "Multiple", "Bénéfices"],
  },
  evebitda: {
    name: "EV/EBITDA",
    fullName: "Enterprise Value / EBITDA",
    definition:
      "Compare la valeur totale d'une entreprise (dette incluse) à ses profits opérationnels bruts, avant impôts et charges comptables.",
    howToRead:
      "Plus le ratio est bas, moins vous payez cher pour les profits de l'entreprise. Idéal pour comparer des entreprises d'un même secteur.",
    example:
      "📊 Apple EV/EBITDA 18 vs moyenne sectorielle 22 → Apple est relativement moins chère que ses concurrents tech sur ce critère. En dessous de 10 : généralement bon marché.",
    benchmarks: [
      { label: "< 10", color: "green" },
      { label: "", color: "green" },
      { label: "", color: "yellow" },
      { label: "", color: "yellow" },
      { label: "> 25", color: "red" },
    ],
    currentPosition: 2,
    tags: ["Valorisation", "Multiple", "Entreprise"],
  },
  peg: {
    name: "PEG",
    fullName: "Price/Earnings to Growth Ratio",
    definition:
      "Le PEG améliore le P/E en tenant compte de la croissance. Une entreprise qui croît vite mérite un P/E élevé — le PEG permet de savoir si c'est vraiment justifié.",
    howToRead:
      "PEG = P/E ÷ taux de croissance attendu. Un PEG de 1 est le 'juste prix'. En dessous = l'action est bon marché par rapport à sa croissance. Au-dessus de 2 = potentiellement trop chère.",
    example:
      "📈 P/E 28, croissance attendue 20% → PEG 1.4 (acceptable). P/E 28, croissance 30% → PEG 0.93 (excellente affaire, sous-évaluée vs sa croissance).",
    benchmarks: [
      { label: "< 1", color: "green" },
      { label: "", color: "green" },
      { label: "", color: "yellow" },
      { label: "", color: "yellow" },
      { label: "> 2", color: "red" },
    ],
    currentPosition: 2,
    tags: ["Valorisation", "Croissance", "Multiple"],
  },
  dcf: {
    name: "DCF",
    fullName: "Discounted Cash Flow — Flux de trésorerie actualisés",
    definition:
      "Méthode de référence pour calculer la 'vraie valeur' d'une action. Elle projette les bénéfices futurs sur 5–10 ans et les actualise : 100 € dans 5 ans valent moins que 100 € aujourd'hui.",
    howToRead:
      "Si le DCF donne 210 € et l'action vaut 185 €, elle est sous-évaluée de ~12% → signal positif. Si l'action vaut 240 €, elle est survalorisée → signal négatif.",
    example:
      "🔢 Valeur DCF calculée : 210 €\nPrix actuel : 185 €\nMarge de sécurité : +12% → StockSense affiche ✓ OK.",
    benchmarks: [
      { label: "Sous-évalué", color: "green" },
      { label: "", color: "green" },
      { label: "", color: "yellow" },
      { label: "", color: "yellow" },
      { label: "Surévalué", color: "red" },
    ],
    currentPosition: 1,
    tags: ["Valorisation", "Méthode", "Cash Flow"],
  },
  etf: {
    name: "ETF",
    fullName: "Exchange-Traded Fund — Fonds indiciel coté",
    definition:
      "Un ETF regroupe des dizaines ou centaines d'actions en un seul produit financier négociable en bourse. Acheter un ETF World, c'est investir dans les 1 600 plus grandes entreprises mondiales d'un coup.",
    howToRead:
      "Les ETF sont idéaux pour débuter : diversification immédiate, frais très faibles (0.2–0.5%/an), et pas besoin d'analyser chaque entreprise.",
    example:
      "🌍 ETF CAC 40 → vous détenez automatiquement un peu de Total, LVMH, BNP... et 37 autres grandes entreprises françaises, avec un seul achat.",
    benchmarks: [],
    currentPosition: 0,
    tags: ["Produit financier", "Diversification", "Débutant"],
  },
  ticker: {
    name: "Ticker",
    fullName: "Code boursier d'identification",
    definition:
      "Code court (2–5 lettres) qui identifie une action sur une bourse. Chaque entreprise cotée a un ticker unique.",
    howToRead:
      "Utilisez le ticker pour rechercher précisément une action. Le même nom d'entreprise peut exister sur plusieurs bourses avec des tickers différents.",
    example:
      "🔤 AAPL = Apple (NASDAQ) · MC.PA = LVMH (Euronext Paris) · NVDA = Nvidia (NASDAQ) · BNP.PA = BNP Paribas (Paris).",
    benchmarks: [],
    currentPosition: 0,
    tags: ["Bourse", "Identification", "Recherche"],
  },
  signal: {
    name: "Signal IA",
    fullName: "Signal d'achat/vente calculé par l'IA",
    definition:
      "Résumé en un mot de l'analyse complète de l'IA. Il combine tous les multiples (P/E, DCF, EV/EBITDA, PEG) et le compare aux moyennes sectorielles pour donner une recommandation globale.",
    howToRead:
      "STRONG BUY = nettement sous-évalué · BUY = légèrement sous-évalué · HOLD = prix juste · SELL = légèrement surévalué · STRONG SELL = nettement surévalué.",
    example:
      "⚠️ Ce signal est une aide à la décision, pas une garantie. Il reflète la valorisation actuelle — pas les risques futurs, la conjoncture, ou votre situation personnelle.",
    benchmarks: [
      { label: "STRONG BUY", color: "green" },
      { label: "BUY", color: "green" },
      { label: "HOLD", color: "yellow" },
      { label: "SELL", color: "red" },
      { label: "STRONG SELL", color: "red" },
    ],
    currentPosition: 0,
    tags: ["Signal", "IA", "Recommandation"],
  },
  margenethe: {
    name: "Marge nette",
    fullName: "Marge bénéficiaire nette",
    definition:
      "Pourcentage du chiffre d'affaires qui devient réellement du bénéfice, après toutes les charges (salaires, taxes, intérêts...). Mesure l'efficacité réelle d'une entreprise.",
    howToRead:
      "Une marge nette de 20% signifie que pour 100 € vendus, 20 € deviennent du profit. Plus c'est élevé, mieux c'est — mais les niveaux normaux varient beaucoup selon le secteur.",
    example:
      "💰 Apple : marge nette ~25% (excellente). Supermarché : marge nette ~2% (normale pour ce secteur). Ne jamais comparer des secteurs différents.",
    benchmarks: [],
    currentPosition: 0,
    tags: ["Rentabilité", "Bénéfice", "Efficacité"],
  },
  plusvalue: {
    name: "Plus-value",
    fullName: "Gain en capital",
    definition:
      "Différence entre le prix auquel vous avez acheté une action et son prix actuel. Positive = vous gagnez de l'argent. Négative (moins-value) = vous êtes en perte.",
    howToRead:
      "La plus-value n'est 'réalisée' (et donc imposable) que quand vous vendez. Tant que vous gardez l'action, c'est une plus-value 'latente'.",
    example:
      "📈 Vous achetez AAPL à 150 €. Elle vaut maintenant 185 €. Plus-value latente : +35 € (+23%). Si vous vendez, vous réalisez ce gain (et payez des impôts dessus).",
    benchmarks: [],
    currentPosition: 0,
    tags: ["Portefeuille", "Gain", "Fiscalité"],
  },
  roe: {
    name: "ROE",
    fullName: "Return on Equity — Rentabilité des fonds propres",
    definition:
      "Mesure combien de bénéfice l'entreprise génère pour chaque euro investi par ses actionnaires. Plus le ROE est élevé, plus l'entreprise est efficace avec l'argent de ses actionnaires.",
    howToRead:
      "ROE 20% = l'entreprise génère 20 € de profit pour 100 € de capitaux propres. En général, un ROE > 15% est considéré comme bon. Comparez toujours dans le même secteur.",
    example:
      "💼 Apple ROE ~160% (exceptionnel car peu de fonds propres). Banques : ROE ~10–12% (normal pour ce secteur très capitalistique).",
    benchmarks: [
      { label: "< 5%", color: "red" },
      { label: "", color: "yellow" },
      { label: "", color: "yellow" },
      { label: "", color: "green" },
      { label: "> 20%", color: "green" },
    ],
    currentPosition: 2,
    tags: ["Rentabilité", "Fonds propres", "Efficacité"],
  },
  beta: {
    name: "Beta",
    fullName: "Coefficient de volatilité par rapport au marché",
    definition:
      "Mesure la sensibilité d'une action par rapport aux mouvements du marché global. Beta 1 = l'action suit le marché. Beta > 1 = plus volatile que le marché. Beta < 1 = plus stable.",
    howToRead:
      "Beta 1.5 = quand le marché monte de 10%, l'action monte de ~15% (et inversement). Pour un investisseur prudent, un beta faible est préférable.",
    example:
      "📉 Tesla Beta ~2.0 : très volatil. Johnson & Johnson Beta ~0.6 : très stable. En période de krach, un beta élevé amplifie les pertes.",
    benchmarks: [
      { label: "Stable < 0.5", color: "green" },
      { label: "", color: "green" },
      { label: "", color: "yellow" },
      { label: "", color: "yellow" },
      { label: "Volatile > 1.5", color: "red" },
    ],
    currentPosition: 2,
    tags: ["Risque", "Volatilité", "Marché"],
  },
};

// Liste ordonnée pour la page glossaire
export const GLOSSARY_CATEGORIES = [
  {
    title: "Enveloppes fiscales",
    emoji: "🏦",
    keys: ["pea", "assurancevie", "cto"],
  },
  {
    title: "Multiples de valorisation",
    emoji: "📊",
    keys: ["pe", "evebitda", "peg", "dcf"],
  },
  {
    title: "Métriques de performance",
    emoji: "📈",
    keys: ["roe", "margenethe", "beta"],
  },
  {
    title: "Produits & marchés",
    emoji: "🌍",
    keys: ["etf", "ticker"],
  },
  {
    title: "Signaux & portefeuille",
    emoji: "🎯",
    keys: ["signal", "plusvalue"],
  },
];
