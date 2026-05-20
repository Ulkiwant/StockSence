"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Brand from "@/components/Brand";
import { AlertCircle } from "lucide-react";

function LoginForm() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const router  = useRouter();
  const params  = useSearchParams();
  const redirect = params.get("redirect") ?? "/";
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError("Email ou mot de passe incorrect."); setLoading(false); }
    else { router.push(redirect); router.refresh(); }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: 12,
    background: "#fff", border: "1.5px solid var(--line)",
    color: "var(--ink)", fontSize: 14, outline: "none",
    fontFamily: "inherit", transition: "border-color 0.15s, box-shadow 0.15s",
  };

  return (
    <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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

      <div>
        <label style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", display: "block", marginBottom: 6 }}>Adresse email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
          placeholder="vous@exemple.com" style={inputStyle}
          onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; e.target.style.boxShadow = "0 0 0 3px rgba(45,125,90,0.12)"; }}
          onBlur={(e)  => { e.target.style.borderColor = "var(--line)"; e.target.style.boxShadow = "none"; }}
        />
      </div>

      <div>
        <label style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", display: "block", marginBottom: 6 }}>Mot de passe</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
          placeholder="••••••••" style={inputStyle}
          onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; e.target.style.boxShadow = "0 0 0 3px rgba(45,125,90,0.12)"; }}
          onBlur={(e)  => { e.target.style.borderColor = "var(--line)"; e.target.style.boxShadow = "none"; }}
        />
      </div>

      <div style={{ textAlign: "right", marginTop: -6 }}>
        <Link href="/auth/forgot-password" style={{ fontSize: 12, color: "var(--muted)" }}>
          Mot de passe oublié ?
        </Link>
      </div>

      <button type="submit" disabled={loading} style={{
        width: "100%", padding: "13px", borderRadius: 9999, border: "none",
        background: loading ? "rgba(45,125,90,0.45)" : "var(--accent)",
        color: "#fff", fontSize: 14, fontWeight: 600,
        cursor: loading ? "not-allowed" : "pointer", marginTop: 4,
        transition: "background 0.15s",
      }}>
        {loading ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", padding: "24px", background: "var(--paper)",
    }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
            <Brand size="lg" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>Connexion</h1>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>Retrouvez vos favoris et votre portefeuille</p>
        </div>

        <div style={{ background: "var(--paper-2)", border: "1.5px solid var(--line)", borderRadius: 18, padding: "28px 24px" }}>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--muted)" }}>
          Pas encore de compte ?{" "}
          <Link href="/auth/signup" style={{ color: "var(--accent)", fontWeight: 600 }}>
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
