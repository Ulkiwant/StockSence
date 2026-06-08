"use client";
import { useEffect, useState } from "react";

/** Retourne true si l'écran est ≤ 768px (téléphone) */
export function useMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    const mq = window.matchMedia("(max-width: 768px)");
    mq.addEventListener("change", check);
    return () => mq.removeEventListener("change", check);
  }, []);

  return isMobile;
}
