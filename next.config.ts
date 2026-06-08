import type { NextConfig } from "next";

const SECURITY_HEADERS = [
  // Anti-clickjacking
  { key: "X-Frame-Options", value: "DENY" },
  // Empêche le MIME-sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // HSTS — force HTTPS pour 1 an
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // Referrer — ne pas envoyer l'URL complète aux tiers
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Permissions — restreindre les APIs navigateur inutiles
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // XSS Protection (pour navigateurs anciens)
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Content-Security-Policy — restreindre les sources de scripts/styles/images
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Scripts : self + Vercel analytics + inline pour Next.js
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://vercel.live",
      // Styles : self + polices Google
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Polices
      "font-src 'self' https://fonts.gstatic.com",
      // Images : self + logo.dev + Google favicons + Clearbit + data URIs
      "img-src 'self' data: https://img.logo.dev https://www.google.com https://logo.clearbit.com https://icons.duckduckgo.com",
      // Connexions API : self + Supabase + Yahoo Finance (via Next API)
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://js.stripe.com",
      // Frames : Stripe uniquement
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      // Workers
      "worker-src 'self' blob:",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Appliquer les headers de sécurité à toutes les routes
        source: "/(.*)",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
