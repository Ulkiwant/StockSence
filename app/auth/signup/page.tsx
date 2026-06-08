"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Brand from "@/components/Brand";
import { AlertCircle, Mail } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState(false);
  const router   = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    if (password.length < 8)  { setError("Le mot de passe doit contenir au moins 8 caractères."); return; }
    setLoading(true); setError(null);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message === "User already registered" ? "Cet email est déjà utilisé." : error.message);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  };

  void router; // router used only in login form

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: 12,
    background: "#fff", border: "1.5px solid var(--line)",
    color: "var(--ink)", fontSize: 14, outline: "none",
    fontFamily: "inherit", transition: "border-color 0.15s, box-shadow 0.15s",
  };

  if (success) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "var(--paper)" }}>
        <div style={{ textAlign: "center", maxWidth: 380 }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%", background: "var(--accent-soft)",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px",
          }}>
            <Mail size={28} strokeWidth={1.5} color="var(--accent)" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)", marginBottom: 10 }}>Vérifiez votre email</h2>
          <p style={{ color: "var(--muted)", lineHeight: 1.65, marginBottom: 24, fontSize: 14 }}>
            Un lien de confirmation a été envoyé à <strong style={{ color: "var(--ink)" }}>{email}</strong>.
            Cliquez dessus pour activer votre compte.
          </p>
          <Link href="/auth/login" className="btn-primary" style={{ display: "inline-flex" }}>
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "var(--paper)" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
            <Brand size="lg" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>Créer un compte</h1>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>Gratuit · Sécurisé · Personnalisé</p>
        </div>

        <div style={{ background: "var(--paper-2)", border: "1.5px solid var(--line)", borderRadius: 18, padding: "28px 24px" }}>
          <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {error && (
              <div style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                padding: "12px 14px", borderRadius: 10,
                background: "rgba(184,74,58,0.06)", border: "1px solid rgba(184,74,58,0.20)",
                color: "var(--signal-down)", fontSize: 13,
              }}>
                <AlertCircle size={14} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
                {error}
              </div>
            )}

            {[
              { label: "Adresse email",          value: email,    set: setEmail,    type: "email",    placeholder: "vous@exemple.com"     },
              { label: "Mot de passe",            value: password, set: setPassword, type: "password", placeholder: "8 caractères minimum" },
              { label: "Confirmer le mot de passe", value: confirm, set: setConfirm, type: "password", placeholder: "••••••••"             },
            ].map((field) => (
              <div key={field.label}>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", display: "block", marginBottom: 6 }}>
                  {field.label}
                </label>
                <input type={field.type} value={field.value} onChange={(e) => field.set(e.target.value)}
                  required placeholder={field.placeholder} style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; e.target.style.boxShadow = "0 0 0 3px rgba(45,125,90,0.12)"; }}
                  onBlur={(e)  => { e.target.style.borderColor = "var(--line)";   e.target.style.boxShadow = "none"; }}
                />
              </div>
            ))}

            <button type="submit" disabled={loading} style={{
              width: "100%", padding: "13px", borderRadius: 9999, border: "none",
              background: loading ? "rgba(45,125,90,0.45)" : "var(--accent)",
              color: "#fff", fontSize: 14, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer", marginTop: 4,
              transition: "background 0.15s",
            }}>
              {loading ? "Création…" : "Créer mon compte"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--muted)" }}>
          Déjà un compte ?{" "}
          <Link href="/auth/login" style={{ color: "var(--accent)", fontWeight: 600 }}>Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
