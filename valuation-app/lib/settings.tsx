"use client";
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { translations } from "./i18n";

export type Locale   = "fr" | "en";
export type Currency = "EUR" | "USD";

interface SettingsCtx {
  locale:      Locale;
  currency:    Currency;
  setLocale:   (l: Locale) => void;
  setCurrency: (c: Currency) => void;
  t: (key: string) => string;
  fmtPrice: (amount: number, originalCurrency?: string) => string;
}

const Ctx = createContext<SettingsCtx>({} as SettingsCtx);

// Conversion rates (fixed approximation)
const USD_TO_EUR = 0.92;
const EUR_TO_USD = 1.09;

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [locale,   setLocaleState]   = useState<Locale>("fr");
  const [currency, setCurrencyState] = useState<Currency>("EUR");

  // Hydrate from localStorage once on mount
  useEffect(() => {
    const l = localStorage.getItem("ss-locale")   as Locale   | null;
    const c = localStorage.getItem("ss-currency") as Currency | null;
    if (l) setLocaleState(l);
    if (c) setCurrencyState(c);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("ss-locale", l);
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem("ss-currency", c);
  }, []);

  const t = useCallback((key: string): string => {
    return (translations[locale] as Record<string, string>)[key]
        ?? (translations["fr"]   as Record<string, string>)[key]
        ?? key;
  }, [locale]);

  const fmtPrice = useCallback((amount: number, originalCurrency = "USD"): string => {
    let val = amount;
    const orig = originalCurrency.toUpperCase();
    if (orig === "USD" && currency === "EUR") val = amount * USD_TO_EUR;
    if (orig === "EUR" && currency === "USD") val = amount * EUR_TO_USD;
    return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(val);
  }, [locale, currency]);

  return (
    <Ctx.Provider value={{ locale, currency, setLocale, setCurrency, t, fmtPrice }}>
      {children}
    </Ctx.Provider>
  );
}

export const useSettings = () => useContext(Ctx);
