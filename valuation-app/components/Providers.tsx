"use client";
import { useEffect } from "react";
import { SettingsProvider } from "@/lib/settings";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Prevent unhandled promise rejections from crashing the page in Safari.
    // Safari can show "This page couldn't load" when an unhandled rejection
    // propagates to the WKWebView navigation delegate.
    const handler = (e: PromiseRejectionEvent) => {
      console.error("[Rently] unhandled rejection:", e.reason);
      e.preventDefault();
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  return <SettingsProvider>{children}</SettingsProvider>;
}
