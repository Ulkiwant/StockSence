"use client";

import { X, Share, SquarePlus, MoreVertical } from "lucide-react";
import DiamondMark from "./DiamondMark";

export default function InstallModal({ ios, onClose }: { ios: boolean; onClose: () => void }) {
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 400,
        background: "rgba(10,22,40,0.45)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}
    >
      <div style={{
        background: "var(--paper)", border: "1.5px solid var(--line)", borderRadius: 20,
        width: "100%", maxWidth: 380, padding: 28, position: "relative",
        boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
      }}>
        <button
          onClick={onClose}
          aria-label="Fermer"
          style={{
            position: "absolute", top: 16, right: 16,
            width: 30, height: 30, borderRadius: "50%",
            background: "var(--paper-2)", border: "1px solid var(--line)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--muted)", cursor: "pointer",
          }}
        >
          <X size={15} strokeWidth={2} />
        </button>

        <div style={{
          width: 52, height: 52, borderRadius: 14, background: "#0a1628",
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
        }}>
          <DiamondMark size={26} />
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>
          Installer Finazen
        </h2>

        {ios ? (
          <div style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.7 }}>
            <p style={{ margin: "0 0 12px" }}>Depuis Safari :</p>
            <ol style={{ paddingLeft: 20, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>Appuie sur l&apos;icône <Share size={13} style={{ verticalAlign: -2, margin: "0 2px" }} /> Partager, en bas de l&apos;écran</li>
              <li>Choisis <SquarePlus size={13} style={{ verticalAlign: -2, margin: "0 2px" }} /> &laquo; Sur l&apos;écran d&apos;accueil &raquo;</li>
              <li>Confirme en appuyant sur &laquo; Ajouter &raquo;</li>
            </ol>
          </div>
        ) : (
          <div style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.7 }}>
            <p style={{ margin: "0 0 12px" }}>Depuis Chrome :</p>
            <ol style={{ paddingLeft: 20, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>Appuie sur l&apos;icône <MoreVertical size={13} style={{ verticalAlign: -2, margin: "0 2px" }} /> (menu) en haut à droite</li>
              <li>Choisis &laquo; Installer l&apos;application &raquo; ou &laquo; Ajouter à l&apos;écran d&apos;accueil &raquo;</li>
              <li>Confirme l&apos;installation</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
