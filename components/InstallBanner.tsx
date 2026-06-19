"use client";

import { useEffect, useState } from "react";
import { X, Share, SquarePlus, Download, MoreVertical } from "lucide-react";
import { useMobile } from "@/lib/useMobile";
import { usePwaInstall } from "@/lib/usePwaInstall";
import DiamondMark from "./DiamondMark";

const DISMISS_KEY = "finazen_install_dismissed";

export default function InstallBanner() {
  const isMobile = useMobile();
  const { canInstall, ios, standalone, promptInstall } = usePwaInstall();
  const [visible, setVisible] = useState(false);
  const [waitedForPrompt, setWaitedForPrompt] = useState(false);

  useEffect(() => {
    if (!isMobile || standalone) { setVisible(false); return; }
    if (localStorage.getItem(DISMISS_KEY)) return;
    if (ios) { setVisible(true); return; }
    // Sur Android/Chrome, laisse 2.5s à beforeinstallprompt pour arriver
    // avant d'afficher un message de repli si le navigateur ne le supporte pas.
    const t = setTimeout(() => setWaitedForPrompt(true), 2500);
    return () => clearTimeout(t);
  }, [isMobile, ios, standalone]);

  useEffect(() => {
    if (canInstall) setVisible(true);
  }, [canInstall]);

  useEffect(() => {
    if (waitedForPrompt && !ios && !canInstall && isMobile && !standalone && !localStorage.getItem(DISMISS_KEY)) {
      setVisible(true);
    }
  }, [waitedForPrompt, ios, canInstall, isMobile, standalone]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, "1");
  };

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) dismiss();
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

      {/* Icône app — logo complet, identique à l'icône réelle */}
      <div style={{
        width: 42, height: 42, borderRadius: 11, background: "#13233f",
        border: "1px solid rgba(245,241,234,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <DiamondMark size={22} />
      </div>

      {/* Texte */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#f5f1ea", lineHeight: 1.3 }}>
          Installer Finazen
        </div>
        <div style={{ fontSize: 11.5, color: "rgba(245,241,234,0.65)", lineHeight: 1.4, marginTop: 1 }}>
          {ios ? (
            <>Appuie sur <Share size={11} style={{ verticalAlign: -1, margin: "0 2px" }} /> puis <SquarePlus size={11} style={{ verticalAlign: -1, margin: "0 2px" }} /> &laquo; Sur l&apos;écran d&apos;accueil &raquo;</>
          ) : canInstall ? (
            "Accès direct depuis ton écran d'accueil, sans store"
          ) : (
            <>Ouvre le menu <MoreVertical size={11} style={{ verticalAlign: -1, margin: "0 2px" }} /> de ton navigateur puis &laquo; Installer l&apos;application &raquo;</>
          )}
        </div>
      </div>

      {/* Action */}
      {canInstall && (
        <button
          onClick={handleInstall}
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
