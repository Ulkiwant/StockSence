"use client";
import { useEffect } from "react";
import Link from "next/link";
import { MetricDef } from "./MetricTooltip";

interface Props {
  def: MetricDef | null;
  onClose: () => void;
}

export function GlossaryDrawer({ def, onClose }: Props) {
  useEffect(() => {
    if (def) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [def]);

  if (!def) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          zIndex: 40,
          backdropFilter: "blur(2px)",
        }}
      />

      {/* Drawer */}
      <div style={{
        position: "fixed",
        bottom: 0, left: 0, right: 0,
        background: "#1c1b1a",
        borderTop: "1px solid rgba(255,255,255,0.09)",
        borderRadius: "20px 20px 0 0",
        zIndex: 50,
        padding: "20px 20px 32px",
        maxHeight: "70vh",
        overflowY: "auto",
      }}>
        {/* Handle */}
        <div style={{
          width: 36, height: 3,
          background: "rgba(255,255,255,0.12)",
          borderRadius: 2,
          margin: "0 auto 20px",
        }} />

        <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{def.name}</h2>
        <p style={{ fontSize: 11, color: "var(--text-disabled)", fontFamily: "monospace", marginTop: 2, marginBottom: 20 }}>
          {def.fullName}
        </p>

        {/* Définition */}
        <section style={{ marginBottom: 16 }}>
          <h3 style={{
            fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase",
            color: "var(--text-disabled)", marginBottom: 6,
          }}>
            C&apos;est quoi ?
          </h3>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>
            {def.definition}
          </p>
        </section>

        {/* Comment lire */}
        <section style={{ marginBottom: 16 }}>
          <h3 style={{
            fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase",
            color: "var(--text-disabled)", marginBottom: 6,
          }}>
            Comment le lire ?
          </h3>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>
            {def.howToRead}
          </p>
        </section>

        {/* Exemple */}
        <div style={{
          background: "rgba(134,239,172,0.05)",
          border: "1px solid rgba(134,239,172,0.12)",
          borderRadius: 10,
          padding: "12px",
          marginBottom: 16,
        }}>
          <p style={{ fontSize: 12, color: "#86efac", lineHeight: 1.7, whiteSpace: "pre-line" }}>
            {def.example}
          </p>
        </div>

        {/* Tags */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
          {def.tags.map((t) => (
            <span key={t} style={{
              fontSize: 9, padding: "3px 8px", borderRadius: 999,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "var(--text-muted)",
            }}>
              {t}
            </span>
          ))}
        </div>

        {/* Lien glossaire */}
        <Link
          href="/glossaire"
          style={{
            display: "block", textAlign: "center",
            padding: "10px", borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.09)",
            background: "rgba(255,255,255,0.04)",
            color: "var(--text-secondary)",
            fontSize: 13, marginBottom: 8,
            transition: "background 0.15s",
          }}
        >
          Voir tous les termes du glossaire →
        </Link>
        <button
          onClick={onClose}
          style={{
            width: "100%", padding: "10px",
            borderRadius: 10,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.09)",
            color: "var(--text-secondary)",
            fontSize: 13, cursor: "pointer",
          }}
        >
          Fermer
        </button>
      </div>
    </>
  );
}
