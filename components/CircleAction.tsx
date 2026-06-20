"use client";

/** Bouton d'action circulaire — façon app native (Revolut, Trade Republic) */
export default function CircleAction({
  icon, label, onClick, primary, disabled,
}: { icon: React.ReactNode; label: string; onClick?: () => void; primary?: boolean; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        background: "none", border: "none", cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1, padding: 0, flex: 1,
      }}
    >
      <span style={{
        width: 46, height: 46, borderRadius: "50%",
        background: primary ? "var(--accent)" : "var(--paper-2)",
        border: primary ? "none" : "1.5px solid var(--line)",
        color: primary ? "#fff" : "var(--ink)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {icon}
      </span>
      <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap" }}>{label}</span>
    </button>
  );
}
