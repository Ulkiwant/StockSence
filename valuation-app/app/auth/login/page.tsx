"use client";

import { Suspense } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "/";
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
    } else {
      router.push(redirect);
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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

      <div>
        <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
          Mot de passe
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

      <div style={{ textAlign: "right", marginTop: -6 }}>
        <Link href="/auth/forgot-password" style={{ fontSize: 13, color: "var(--text-secondary)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-blue)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
        >
          Mot de passe oublié ?
        </Link>
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
        {loading ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}

export default function LoginPage() {
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
            Connexion
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Retrouvez vos favoris et votre portefeuille
          </p>
        </div>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "var(--text-secondary)" }}>
          Pas encore de compte ?{" "}
          <Link href="/auth/signup" style={{ color: "var(--accent-blue)", fontWeight: 500 }}>
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
