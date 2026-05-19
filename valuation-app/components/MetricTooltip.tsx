"use client";
import { useState } from "react";

export interface MetricDef {
  name: string;
  fullName: string;
  definition: string;
  howToRead: string;
  example: string;
  benchmarks: { label: string; color: "green" | "yellow" | "red" }[];
  currentPosition: number; // 0-4 index dans benchmarks
  tags: string[];
}

interface Props {
  label: string;
  value: string | number;
  contextText?: string;
  contextColor?: "green" | "yellow" | "red";
  def: MetricDef;
  onOpenGlossary: (def: MetricDef) => void;
}

export function MetricTooltip({
  label,
  value,
  contextText,
  contextColor,
  def,
  onOpenGlossary,
}: Props) {
  const [show, setShow] = useState(false);

  const colorMap = {
    green: "#86efac",
    yellow: "#fcd34d",
    red: "#fca5a5",
  };

  const barColorMap = {
    green: "#86efac",
    yellow: "#fcd34d",
    red: "#fca5a5",
  };

  return (
    <div
      style={{
        position: "relative",
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 10,
        padding: "12px",
        cursor: "default",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={(e) => {
        setShow(true);
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(134,239,172,0.20)";
      }}
      onMouseLeave={(e) => {
        setShow(false);
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)";
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-secondary)", fontFamily: "monospace" }}>
            {label}
          </span>
          <span
            style={{
              fontSize: 8,
              color: "#86efac",
              textDecoration: "underline",
              opacity: show ? 0.9 : 0,
              transition: "opacity 0.15s",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
            onClick={(e) => {
              e.stopPropagation();
              onOpenGlossary(def);
            }}
          >
            → Glossaire
          </span>
        </div>
        <div style={{
          width: 14, height: 14, borderRadius: "50%",
          background: "rgba(134,239,172,0.10)",
          border: "1px solid rgba(134,239,172,0.20)",
          color: "#86efac",
          fontSize: 8, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          ?
        </div>
      </div>

      {/* Valeur */}
      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "monospace", marginTop: 4 }}>
        {value}
      </div>
      {contextText && (
        <div style={{ fontSize: 9, marginTop: 2, color: colorMap[contextColor ?? "green"] }}>
          {contextText}
        </div>
      )}

      {/* Tooltip */}
      {show && (
        <div style={{
          position: "absolute",
          bottom: "calc(100% + 10px)",
          left: "50%",
          transform: "translateX(-50%)",
          width: 220,
          background: "#2a2927",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 12,
          padding: 12,
          zIndex: 50,
          boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
          pointerEvents: "none",
        }}>
          {/* Arrow */}
          <div style={{
            position: "absolute",
            bottom: -4,
            left: "50%",
            transform: "translateX(-50%) rotate(45deg)",
            width: 8, height: 8,
            background: "#2a2927",
            borderRight: "1px solid rgba(255,255,255,0.12)",
            borderBottom: "1px solid rgba(255,255,255,0.12)",
          }} />

          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
            {def.fullName}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            {def.definition}
          </div>

          {/* Barre contextuelle */}
          {def.benchmarks.length > 0 && (
            <>
              <div style={{ display: "flex", gap: 3, marginTop: 10 }}>
                {def.benchmarks.map((b, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: 3,
                      borderRadius: 2,
                      background: i <= def.currentPosition
                        ? barColorMap[b.color]
                        : "rgba(255,255,255,0.06)",
                    }}
                  />
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontSize: 8, color: "var(--text-disabled)" }}>
                  {def.benchmarks[0].label}
                </span>
                <span style={{ fontSize: 8, color: "var(--text-primary)" }}>← Ici</span>
                <span style={{ fontSize: 8, color: "var(--text-disabled)" }}>
                  {def.benchmarks[def.benchmarks.length - 1].label}
                </span>
              </div>
            </>
          )}

          <div style={{
            fontSize: 9, color: "var(--text-disabled)",
            marginTop: 8, paddingTop: 8,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            fontStyle: "italic", lineHeight: 1.6,
          }}>
            {def.example}
          </div>

          <button
            style={{
              marginTop: 8,
              fontSize: 9,
              color: "#86efac",
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              pointerEvents: "auto",
            }}
            onClick={() => onOpenGlossary(def)}
          >
            📖 Fiche complète →
          </button>
        </div>
      )}
    </div>
  );
}
