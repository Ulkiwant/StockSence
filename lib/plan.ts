/**
 * Gestion des plans Finazen.
 * L'email admin a toujours le plan "admin" (accès illimité total).
 * Les autres utilisateurs sont vérifiés dans la table user_plans.
 */

export type Plan = "free" | "investisseur" | "premium" | "admin";

/** Non-logged users are treated as "guest" — even more restricted than free */
export type PlanWithGuest = Plan | "guest";

/** Email du fondateur — accès total permanent, hardcodé côté serveur */
export const ADMIN_EMAIL = "quentin.celette@edu.em-lyon.com";

/** Hiérarchie des plans (plus le chiffre est élevé, plus c'est élevé) */
const PLAN_LEVEL: Record<Plan, number> = {
  free: 0,
  investisseur: 1,
  premium: 2,
  admin: 99,
};

export function planLevel(plan: Plan): number {
  return PLAN_LEVEL[plan] ?? 0;
}

/** Vérifie si un plan a accès à une fonctionnalité requérant un plan minimum */
export function hasAccess(userPlan: Plan, requiredPlan: Plan): boolean {
  return planLevel(userPlan) >= planLevel(requiredPlan);
}

/** Limites par plan */
export const PLAN_LIMITS: Record<Plan, {
  analysesPerDay: number;
  watchlistMax: number;
  portfolioMax: number;
  advisorEveryNMonths: number;
  advisorPerMonth: number;
  ideasPerDay: number;
  aiAnalysesPerDay: number;
  checkAIPerMonth: number;
  portfolioAIPerMonth: number;
  alerts: boolean;
  export: boolean;
  multiPortfolio: boolean;
  pdfReport: boolean;
  realtimeAlerts: boolean;
}> = {
  free: {
    analysesPerDay: 1,
    watchlistMax: 3,
    portfolioMax: 3,
    advisorEveryNMonths: 3,
    advisorPerMonth: 0,
    ideasPerDay: 3,
    aiAnalysesPerDay: 0,
    checkAIPerMonth: 0,
    portfolioAIPerMonth: 0,
    alerts: false,
    export: false,
    multiPortfolio: false,
    pdfReport: false,
    realtimeAlerts: false,
  },
  investisseur: {
    analysesPerDay: 5,
    watchlistMax: 15,
    portfolioMax: 15,
    advisorEveryNMonths: 0,
    advisorPerMonth: 3,
    ideasPerDay: 10,
    aiAnalysesPerDay: 10,
    checkAIPerMonth: 5,
    portfolioAIPerMonth: 1,
    alerts: true,
    export: true,
    multiPortfolio: false,
    pdfReport: false,
    realtimeAlerts: false,
  },
  premium: {
    analysesPerDay: Infinity,
    watchlistMax: Infinity,
    portfolioMax: Infinity,
    advisorEveryNMonths: 0,
    advisorPerMonth: Infinity,
    ideasPerDay: 15,
    aiAnalysesPerDay: Infinity,
    checkAIPerMonth: Infinity,
    portfolioAIPerMonth: Infinity,
    alerts: true,
    export: true,
    multiPortfolio: true,
    pdfReport: true,
    realtimeAlerts: true,
  },
  admin: {
    analysesPerDay: Infinity,
    watchlistMax: Infinity,
    portfolioMax: Infinity,
    advisorEveryNMonths: 0,
    advisorPerMonth: Infinity,
    ideasPerDay: 15,
    aiAnalysesPerDay: Infinity,
    checkAIPerMonth: Infinity,
    portfolioAIPerMonth: Infinity,
    alerts: true,
    export: true,
    multiPortfolio: true,
    pdfReport: true,
    realtimeAlerts: true,
  },
};

/** Plans qui peuvent utiliser les alertes */
export const PLANS_WITH_ALERTS: Plan[] = ["investisseur", "premium", "admin"];

/** Plans qui peuvent utiliser l'analyse IA */
export const PLANS_WITH_AI: Plan[] = ["investisseur", "premium", "admin"];

export const GUEST_LIMITS = {
  analysesPerDay: 0,
  watchlistMax: 0,
  portfolioMax: 0,
  advisorPerMonth: 0,
  ideasPerDay: 0,
  aiAnalysesPerDay: 0,
  checkAIPerMonth: 0,
  portfolioAIPerMonth: 0,
  alerts: false,
  export: false,
  multiPortfolio: false,
  pdfReport: false,
  realtimeAlerts: false,
} as const;
