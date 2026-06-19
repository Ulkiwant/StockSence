"use client";

import { useEffect, useState } from "react";
import { X, Share, SquarePlus, Download } from "lucide-react";
import { useMobile } from "@/lib/useMobile";

const DISMISS_KEY = "finazen_install_dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !("MSStream" in window);
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export default function InstallBanner() {
  const isMobile = useMobile();
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (!isMobile) return;
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    if (isIOS()) {
      setIos(true);
      setVisible(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [isMobile]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, "1");
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    dismiss();
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed", left: 12, right: 12, bottom: 12, zIndex: 250,
        background: "#0a1628", borderRadius: 18,
        padding: "14px 14px 14px 16px",
        boxShadow: "0 12px 32px rgba(10,22,40,0.35)",
        display: "flex", alignItems: "center", gap: 12,
        animation: "installBannerIn 0.3s ease-out",
      }}
    >
      <style>{`
        @keyframes installBannerIn {
          from { transform: translateY(16px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      {/* Icône app */}
      <div style={{
        width: 42, height: 42, borderRadius: 11, background: "#13233f",
        border: "1px solid rgba(245,241,234,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <svg width="22" height="28" viewBox="0 0 34 54" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 1 L29 16 L34 24 L17 53 L0 24 L5 16 Z" stroke="#f5f1ea" strokeWidth="3" strokeLinejoin="round" />
          <line x1="0" y1="24" x2="34" y2="24" stroke="#f5f1ea" strokeWidth="3" />
        </svg>
      </div>

      {/* Texte */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#f5f1ea", lineHeight: 1.3 }}>
          Installer Finazen
        </div>
        <div style={{ fontSize: 11.5, color: "rgba(245,241,234,0.65)", lineHeight: 1.4, marginTop: 1 }}>
          {ios
            ? <>Appuie sur <Share size={11} style={{ verticalAlign: -1, margin: "0 2px" }} /> puis <SquarePlus size={11} style={{ verticalAlign: -1, margin: "0 2px" }} /> &laquo; Sur l&apos;écran d&apos;accueil &raquo;</>
            : "Accès direct depuis ton écran d'accueil, sans store"}
        </div>
      </div>

      {/* Action */}
      {!ios && (
        <button
          onClick={install}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "var(--accent)", color: "#fff",
            border: "none", borderRadius: 9999,
            padding: "9px 14px", fontSize: 12.5, fontWeight: 700,
            cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap",
          }}
        >
          <Download size={13} strokeWidth={2.4} />
          Installer
        </button>
      )}

      <button
        onClick={dismiss}
        aria-label="Fermer"
        style={{
          width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
          background: "rgba(245,241,234,0.08)", border: "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "rgba(245,241,234,0.55)", cursor: "pointer",
        }}
      >
        <X size={14} strokeWidth={2} />
      </button>
    </div>
  );
}
