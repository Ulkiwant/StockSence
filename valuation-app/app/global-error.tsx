"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, background: "#EFE9DC" }}>
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", minHeight: "100vh", gap: 20,
          padding: "40px 20px", textAlign: "center",
        }}>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: "#14201A", margin: 0 }}>
            Erreur critique
          </h2>
          <p style={{ color: "#7A7768", maxWidth: 400, margin: 0, fontSize: 15 }}>
            La page n&apos;a pas pu se charger. Veuillez réessayer.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "10px 28px", borderRadius: 9999,
              background: "#1F5C3E", color: "#F6F2E8",
              border: "none", cursor: "pointer",
              fontWeight: 500, fontSize: 14,
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
