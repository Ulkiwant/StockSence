import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",          // Pas d'indexation des API
          "/auth/",         // Pas d'indexation des pages auth
          "/parametres/",   // Pas d'indexation des paramètres utilisateur
        ],
      },
    ],
    sitemap: "https://finazen.fr/sitemap.xml",
    host: "https://finazen.fr",
  };
}
