/**
 * Rate limiting en mémoire pour les routes publiques.
 *
 * ⚠️ LIMITATION SERVERLESS : sur Vercel chaque instance Lambda a sa propre
 * mémoire — le store ne persiste pas entre les invocations.
 * Ce rate limit protège contre les abus dans une même instance (burst local)
 * mais n'est PAS un rate limit distribué fiable.
 *
 * Pour un rate limiting robuste en production, migrer vers Upstash Redis :
 *   npm install @upstash/ratelimit @upstash/redis
 *   + ajouter UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN dans les env vars Vercel
 */

interface RateLimitEntry { count: number; resetAt: number; }
const store = new Map<string, RateLimitEntry>();

/**
 * @param key     Identifiant (IP ou email)
 * @param limit   Nombre max de requêtes
 * @param window  Fenêtre en secondes
 * @returns true si la requête est autorisée, false si bloquée
 */
export function checkRateLimit(key: string, limit: number, windowSeconds: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count++;
  return true;
}

/**
 * Extrait une clé d'identification résistante au spoofing.
 *
 * Sur Vercel :
 *  - x-vercel-forwarded-for  : IP réelle injectée par la plateforme (ne peut pas être forgée)
 *  - x-real-ip               : fallback Vercel
 *  - x-forwarded-for         : dernier recours (peut être forgé par le client — ne pas utiliser seul)
 */
export function getRateLimitKey(req: Request): string {
  // Vercel injecte x-vercel-forwarded-for — ne peut pas être forgé par le client
  const vercelIP = req.headers.get("x-vercel-forwarded-for");
  if (vercelIP) return vercelIP.split(",")[0].trim();

  // x-real-ip — injecté par certains proxies de confiance
  const realIP = req.headers.get("x-real-ip");
  if (realIP) return realIP.trim();

  // Fallback : on prend la DERNIÈRE valeur de x-forwarded-for (la plus difficile à forger)
  // car les proxies de confiance ajoutent leur IP à la fin
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map(s => s.trim());
    return ips[ips.length - 1]; // dernière IP = ajoutée par le dernier proxy de confiance
  }

  return "unknown";
}
