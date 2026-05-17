"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Supabase injecte le token dans le hash de l'URL lors du redirect
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || !hash.includes("access_token")) {
      // Pas de token valide — lien expiré ou invalide
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError("Lien expiré ou invalide. Veuillez recommencer.");
    } else {
      setDone(true);
      setTimeout(() => router.push("/auth/login"), 3000);
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
              background: "linear-gradient(135deg, #3b7bff, #7b5aff)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 800, color: "#fff",
            }}>S</div>
            <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px" }}>
              Stock<span className="gradient-text">Sense</span>
            </span>
          </Link>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 28, marginBottom: 8 }}>
            Nouveau mot de passe
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Choisissez un nouveau mot de passe pour votre compte
          </p>
        </div>

        {done ? (
          <div style={{
            padding: "24px", borderRadius: 14,
            background: "rgba(0,200,130,0.08)", border: "1px solid rgba(0,200,130,0.25)",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>Mot de passe mis à jour !</p>
            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
              Redirection vers la page de connexion...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {error && (
              <div style={{
                padding: "12px 16px", borderRadius: 10,
                background: "rgba(255,71,87,0.1)", border: "1px solid rgba(255,71,87,0.3)",
                color: "var(--accent-red)", fontSize: 14,
              }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                Nouveau mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
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

            <div>
              <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="••••••••"
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
                background: loading ? "rgba(59,123,255,0.4)" : "linear-gradient(135deg, #3b7bff, #7b5aff)",
                color: "#fff", fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                marginTop: 6, transition: "opacity 0.2s",
              }}
            >
              {loading ? "Mise à jour..." : "Enregistrer le nouveau mot de passe"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
