/**
 * Constantes des prix Stripe — importable côté client et serveur.
 * NE PAS importer stripe (Node.js SDK) ici.
 */
export const STRIPE_PRICES = {
  investisseur_mensuel: "price_1TebdO1YzopuoNEilhkIrK3N",
  investisseur_annuel:  "price_1TebfX1YzopuoNEibhNgr5h8",
  premium_mensuel:      "price_1Tebgv1YzopuoNEitG67VT2M",
  premium_annuel:       "price_1TebhX1YzopuoNEihctR2CDM",
} as const;
