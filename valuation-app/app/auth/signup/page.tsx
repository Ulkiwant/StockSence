"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    if (password.length < 8) { setError("Le mot de passe doit contenir au moins 8 caractères."); return; }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message === "User already registered" ? "Cet email est déjà utilisé." : error.message);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", padding: "24px",
      }}>
        <div style={{ textAlign: "center", maxWidth: 380 }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>📬</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Vérifiez votre email</h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 24 }}>
            Un lien de confirmation a été envoyé à <strong>{email}</strong>. Cliquez dessus pour activer votre compte.
          </p>
          <Link href="/auth/login" style={{
            display: "inline-flex", padding: "10px 24px", borderRadius: 10,
            background: "linear-gradient(135deg, #3b7bff, #7b5aff)",
            color: "#fff", fontWeight: 600, fontSize: 14,
          }}>
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", padding: "24px",
      background: "radial-gradient(ellipse at 50% 0%, rgba(59,123,255,0.08) 0%, transparent 60%)",
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
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
          <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 28, marginBottom: 8 }}>Créer un compte</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Gratuit · Sécurisé · Personnalisé</p>
        </div>

        <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {error && (
            <div style={{
              padding: "12px 16px", borderRadius: 10,
              background: "rgba(255,71,87,0.1)", border: "1px solid rgba(255,71,87,0.3)",
              color: "var(--accent-red)", fontSize: 14,
            }}>{error}</div>
          )}

          {[
            { label: "Adresse email", value: email, set: setEmail, type: "email", placeholder: "vous@exemple.com" },
            { label: "Mot de passe", value: password, set: setPassword, type: "password", placeholder: "8 caractères minimum" },
            { label: "Confirmer le mot de passe", value: confirm, set: setConfirm, type: "password", placeholder: "••••••••" },
          ].map((field) => (
            <div key={field.label}>
              <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                {field.label}
              </label>
              <input
                type={field.type}
                value={field.value}
                onChange={(e) => field.set(e.target.value)}
                required
                placeholder={field.placeholder}
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
          ))}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "14px", borderRadius: 12, border: "none",
              background: loading ? "rgba(59,123,255,0.4)" : "linear-gradient(135deg, #3b7bff, #7b5aff)",
              color: "#fff", fontSize: 15, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer", marginTop: 6,
            }}
          >
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "var(--text-secondary)" }}>
          Déjà un compte ?{" "}
          <Link href="/auth/login" style={{ color: "var(--accent-blue)", fontWeight: 500 }}>
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
