"use client";

import { X, Share, SquarePlus, MoreVertical, ArrowUp } from "lucide-react";
import DiamondMark from "./DiamondMark";

function Step({ n, icon, children }: { n: number; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div style={{
        width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
        background: "var(--accent-soft)", color: "var(--accent)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 700, marginTop: 1,
      }}>
        {n}
      </div>
      <div style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.55, paddingTop: 2 }}>
        {children}
        {icon && <span style={{ display: "inline-flex", verticalAlign: -4, marginLeft: 6 }}>{icon}</span>}
      </div>
    </div>
  );
}

export default function InstallModal({ ios, onClose }: { ios: boolean; onClose: () => void }) {
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 400,
        background: "rgba(10,22,40,0.5)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div style={{
        background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 24,
        width: "100%", maxWidth: 360, padding: "28px 26px", position: "relative",
        boxShadow: "0 24px 80px rgba(0,0,0,0.22)",
      }}>
        <button
          onClick={onClose}
          aria-label="Fermer"
          style={{
            position: "absolute", top: 18, right: 18,
            width: 30, height: 30, borderRadius: "50%",
            background: "var(--paper-2)", border: "1px solid var(--line)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--muted)", cursor: "pointer",
          }}
        >
          <X size={15} strokeWidth={2} />
        </button>

        {/* En-tête */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 13, background: "#0a1628", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <DiamondMark size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", margin: 0, lineHeight: 1.25 }}>
              Installer Finazen
            </h2>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: "2px 0 0" }}>
              Accès direct depuis l&apos;écran d&apos;accueil
            </p>
          </div>
        </div>

        {ios ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Step n={1} icon={<ArrowUp size={13} strokeWidth={2.2} color="var(--accent)" />}>
              Si tu ne vois pas les icônes en bas de Safari, appuie d&apos;abord sur la barre d&apos;adresse pour les faire apparaître
            </Step>
            <Step n={2} icon={<Share size={13} strokeWidth={2.2} color="var(--accent)" />}>
              Appuie sur l&apos;icône <strong>Partager</strong>
            </Step>
            <Step n={3} icon={<SquarePlus size={13} strokeWidth={2.2} color="var(--accent)" />}>
              Choisis <strong>« Sur l&apos;écran d&apos;accueil »</strong> dans la liste
            </Step>
            <Step n={4}>
              Confirme en appuyant sur <strong>« Ajouter »</strong> en haut à droite
            </Step>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Step n={1} icon={<MoreVertical size={13} strokeWidth={2.2} color="var(--accent)" />}>
              Appuie sur le <strong>menu</strong> (les trois points) en haut à droite de Chrome
            </Step>
            <Step n={2}>
              Choisis <strong>« Installer l&apos;application »</strong> ou <strong>« Ajouter à l&apos;écran d&apos;accueil »</strong>
            </Step>
            <Step n={3}>
              Confirme l&apos;installation
            </Step>
          </div>
        )}

        <div style={{
          marginTop: 22, padding: "12px 14px", borderRadius: 12,
          background: "var(--paper-2)", border: "1px solid var(--line)",
          fontSize: 11.5, color: "var(--muted)", lineHeight: 1.55,
        }}>
          Une fois ajoutée, l&apos;icône Finazen s&apos;ouvre en plein écran, sans barre de navigateur — comme une vraie application.
        </div>
      </div>
    </div>
  );
}
