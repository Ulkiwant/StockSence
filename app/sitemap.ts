import type { MetadataRoute } from "next";

const SITE_URL = "https://finazen.fr";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    /* ── Pages principales ── */
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/advisor`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/watchlist`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/portfolio`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/idees`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
    /* ── Pages SEO ── */
    {
      url: `${SITE_URL}/faq`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/glossaire`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    /* ── Pages légales ── */
    {
      url: `${SITE_URL}/mentions-legales`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/confidentialite`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    /* ── Actions populaires (aide le référencement par nom d'entreprise) ── */
    ...([
      "AAPL", "MSFT", "MC.PA", "OR.PA", "TTE.PA",
      "NVDA", "SAN.PA", "AIR.PA", "AI.PA", "BNP.PA",
      "AMZN", "GOOGL", "META", "TSLA", "ASML.AS",
    ].map((ticker) => ({
      url: `${SITE_URL}/stock/${ticker}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.5,
    }))),
  ];
}
