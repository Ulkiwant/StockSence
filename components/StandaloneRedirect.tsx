"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isStandalone } from "@/lib/installPrompt";

/**
 * Une fois l'app installée et lancée depuis l'écran d'accueil (mode standalone),
 * on ouvre directement sur la watchlist plutôt que sur la page marketing —
 * comme une vraie app qui démarre sur le compte, pas sur une landing page.
 */
export default function StandaloneRedirect() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === "/" && isStandalone()) {
      router.replace("/watchlist");
    }
  }, [pathname, router]);

  return null;
}
