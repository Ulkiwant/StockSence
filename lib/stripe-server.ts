/**
 * Client Stripe — SERVEUR UNIQUEMENT.
 * Ne jamais importer ce fichier depuis un composant client ("use client").
 */
import Stripe from "stripe";
import type { Plan } from "./plan";
import { STRIPE_PRICES } from "./stripe-prices";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY est obligatoire — vérifiez vos variables d'environnement.");
}

export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY,
  { apiVersion: "2024-04-10" }
);

export { STRIPE_PRICES };

/** Price ID → Plan Finazen */
export const PRICE_TO_PLAN: Record<string, Plan> = {
  "price_1TebdO1YzopuoNEilhkIrK3N": "investisseur",
  "price_1TebfX1YzopuoNEibhNgr5h8": "investisseur",
  "price_1Tebgv1YzopuoNEitG67VT2M": "premium",
  "price_1TebhX1YzopuoNEihctR2CDM": "premium",
};

export const VALID_PRICE_IDS = new Set(Object.values(STRIPE_PRICES));
