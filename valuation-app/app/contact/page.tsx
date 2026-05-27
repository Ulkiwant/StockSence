"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, MessageSquare, Send, Check } from "lucide-react";
import Footer from "@/components/Footer";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 10,
  border: "1.5px solid var(--line)",
  background: "#fff",
  color: "var(--ink)",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
  fontFamily: "inherit",
};

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // UI only — pas de backend pour l'instant
    setSent(true);
  };

  return (
    <div style={{ background: "var(--paper)", minHeight: "100vh" }}>
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "48px 28px 64px" }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 28 }}>
          <Link href="/" style={{ color: "var(--muted)" }}>Accueil</Link>
          <span style={{ margin: "0 6px" }}>›</span>
          <span style={{ color: "var(--ink)", fontWeight: 600 }}>Contact</span>
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <MessageSquare size={20} strokeWidth={1.8} color="var(--accent)" />
          <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.5px", color: "var(--ink)" }}>
            Nous contacter
          </h1>
        </div>
        <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, marginBottom: 40 }}>
          Une question, un bug, une suggestion ? Nous répondons sous 48h ouvrées.
        </p>

        {/* Email direct */}
        <a href="mailto:contact@rendly.fr" style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "16px 20px", borderRadius: 12,
          background: "var(--accent-soft)", border: "1.5px solid rgba(45,125,90,0.25)",
          textDecoration: "none", marginBottom: 32, transition: "border-color 0.15s",
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Mail size={18} color="#fff" strokeWidth={1.8} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 2 }}>Email direct</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--accent)" }}>contact@rendly.fr</div>
          </div>
        </a>

        {/* Form */}
        {sent ? (
          <div style={{
            textAlign: "center", padding: "48px 24px",
            background: "var(--paper-2)", border: "1.5px solid var(--line)", borderRadius: 16,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <Check size={24} color="var(--accent)" strokeWidth={2.5} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>
              Message envoyé !
            </h2>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, marginBottom: 24 }}>
              Merci pour votre message. Nous vous répondrons à <strong>{form.email}</strong> dans les 48h.
            </p>
            <button
              onClick={() => { setSent(false); setForm({ name: "", email: "", message: "" }); }}
              style={{
                padding: "9px 20px", borderRadius: 9999, border: "1.5px solid var(--line)",
                background: "transparent", color: "var(--muted)", fontSize: 13, cursor: "pointer",
              }}
            >
              Envoyer un autre message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>
                  Nom <span style={{ color: "var(--signal-down)" }}>*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="Votre nom"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--line)")}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>
                  Email <span style={{ color: "var(--signal-down)" }}>*</span>
                </label>
                <input
                  required
                  type="email"
                  placeholder="votre@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--line)")}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>
                Message <span style={{ color: "var(--signal-down)" }}>*</span>
              </label>
              <textarea
                required
                rows={6}
                placeholder="Décrivez votre question ou suggestion..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                style={{ ...inputStyle, resize: "vertical", minHeight: 140 }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--line)")}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <p style={{ fontSize: 12, color: "var(--muted)" }}>
                Réponse sous 48h ouvrées. Aucun démarchage commercial.
              </p>
              <button
                type="submit"
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "11px 24px", borderRadius: 9999, border: "none",
                  background: "var(--accent)", color: "#fff",
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <Send size={14} strokeWidth={2} />
                Envoyer le message
              </button>
            </div>
          </form>
        )}

        {/* FAQ link */}
        <div style={{
          marginTop: 40, padding: "14px 18px", borderRadius: 10,
          background: "var(--paper-2)", border: "1px solid var(--line)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12,
        }}>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>
            Vous trouverez peut-être la réponse dans notre FAQ.
          </p>
          <Link href="/faq" style={{
            fontSize: 13, fontWeight: 600, color: "var(--accent)",
            textDecoration: "none", whiteSpace: "nowrap",
          }}>
            Voir la FAQ →
          </Link>
        </div>

      </main>
      <Footer />
    </div>
  );
}
