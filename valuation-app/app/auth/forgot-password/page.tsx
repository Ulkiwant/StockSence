"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      setError("Une erreur est survenue. Vérifiez votre adresse email.");
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", padding: "24px",
      background: "radial-gradient(ellipse at 50% 0%, rgba(59,123,255,0.08) 0%, transparent 60%)",
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: "var(--cta-bg)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 800, color: "var(--cta-text)",
            }}>S</div>
            <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px" }}>
              Stock<span className="gradient-text">Sense</span>
            </span>
          </Link>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 28, marginBottom: 8 }}>
            Mot de passe oublié
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        {sent ? (
          <div style={{
            padding: "24px", borderRadius: 14,
            background: "rgba(0,200,130,0.08)", border: "1px solid rgba(0,200,130,0.25)",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📬</div>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>Email envoyé !</p>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6 }}>
              Si un compte existe pour <strong>{email}</strong>, vous recevrez un lien de réinitialisation dans quelques instants.
            </p>
            <Link href="/auth/login" style={{
              display: "inline-block", marginTop: 20, fontSize: 14,
              color: "var(--accent-blue)", fontWeight: 500,
            }}>
              ← Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {error && (
              <div style={{
                padding: "12px 16px", borderRadius: 10,
                background: "rgba(252,165,165,0.1)", border: "1px solid rgba(252,165,165,0.3)",
                color: "var(--accent-red)", fontSize: 14,
              }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                Adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="vous@exemple.com"
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: 10,
                  background: "var(--bg-card)", border: "1px solid var(--border)",
                  color: "var(--text-primary)", fontSize: 15, outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => e.target.style.borderColor = "rgba(59,123,255,0.5)"}
                onBlur={(e) => e.target.style.borderColor = "var(--border)"}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "14px", borderRadius: 12, border: "none",
                background: loading ? "rgba(134,239,172,0.35)" : "var(--cta-bg)",
                color: "#fff", fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                marginTop: 6, transition: "opacity 0.2s",
              }}
            >
              {loading ? "Envoi en cours..." : "Envoyer le lien"}
            </button>

            <p style={{ textAlign: "center", marginTop: 8, fontSize: 14, color: "var(--text-secondary)" }}>
              <Link href="/auth/login" style={{ color: "var(--accent-blue)", fontWeight: 500 }}>
                ← Retour à la connexion
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
