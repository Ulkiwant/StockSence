"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Rently error]", error);
  }, [error]);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "60vh", gap: 20,
      padding: "40px 20px", textAlign: "center",
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: "50%",
        background: "#FEF2F2", display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 24,
      }}>⚠</div>
      <h2 style={{ fontSize: 22, fontWeight: 600, color: "#14201A", margin: 0 }}>
        Une erreur est survenue
      </h2>
      <p style={{ color: "#7A7768", maxWidth: 400, margin: 0, fontSize: 15 }}>
        La page a rencontré un problème. Veuillez réessayer.
      </p>
      <button
        onClick={reset}
        style={{
          padding: "10px 28px", borderRadius: 9999,
          background: "#1F5C3E", color: "#F6F2E8",
          border: "none", cursor: "pointer",
          fontWeight: 500, fontSize: 14, fontFamily: "inherit",
        }}
      >
        Réessayer
      </button>
    </div>
  );
}
