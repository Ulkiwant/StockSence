"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { User, KeyRound, Bell, CheckCircle, AlertCircle, Shield, ChevronRight } from "lucide-react";
import Footer from "@/components/Footer";

export default function ComptePage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail]       = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [loading, setLoading]   = useState(true);

  // Mot de passe
  const [newPassword, setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdSaving, setPwdSaving]   = useState(false);
  const [pwdMsg, setPwdMsg]         = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }: { data: { user: { email?: string; created_at?: string } | null } }) => {
      if (!data.user) { router.push("/auth/login"); return; }
      setEmail(data.user.email ?? "");
      setCreatedAt(
        data.user.created_at
          ? new Date(data.user.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
          : ""
      );
      setLoading(false);
    });
  }, []); // eslint-disable-line

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    if (newPassword.length < 8) { setPwdMsg({ type: "error", text: "Le mot de passe doit contenir au moins 8 caractères." }); return; }
    if (newPassword !== confirmPassword) { setPwdMsg({ type: "error", text: "Les mots de passe ne correspondent pas." }); return; }
    setPwdSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwdSaving(false);
    if (error) { setPwdMsg({ type: "error", text: "Erreur : " + error.message }); }
    else { setPwdMsg({ type: "success", text: "Mot de passe mis à jour avec succès." }); setNewPassword(""); setConfirmPassword(""); }
  };

  if (loading) return (
    <div style={{ background: "var(--paper)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="skeleton" style={{ width: 600, height: 400, borderRadius: 18 }} />
    </div>
  );

  const initials = email?.[0]?.toUpperCase() ?? "?";

  return (
    <div style={{ background: "var(--paper)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.12em", fontFamily: "var(--font-geist-mono, monospace)", marginBottom: 28, textTransform: "uppercase", display: "flex", gap: 8 }}>
          <Link href="/" style={{ color: "var(--muted)" }}>Finazen</Link>
          <span>/</span><span style={{ color: "var(--ink)", fontWeight: 600 }}>Mon compte</span>
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 36 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.4px", color: "var(--ink)", marginBottom: 2 }}>Mon compte</h1>
            {createdAt && <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>Membre depuis le {createdAt}</p>}
          </div>
        </div>

        {/* Raccourcis rapides */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          {[
            { href: "/portfolio", icon: "📊", label: "Mon portefeuille" },
            { href: "/watchlist", icon: "⭐", label: "Ma watchlist" },
            { href: "/parametres/alertes", icon: "🔔", label: "Alertes email" },
            { href: "/tarifs", icon: "💳", label: "Offres & tarifs" },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "13px 16px",
              background: "var(--paper-2)", border: "1.5px solid var(--line)", borderRadius: 12,
              color: "var(--ink)", fontSize: 13, fontWeight: 500, textDecoration: "none",
              transition: "border-color 0.15s",
            }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = "var(--accent)")}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = "var(--line)")}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              <ChevronRight size={14} color="var(--muted)" />
            </Link>
          ))}
        </div>

        {/* Informations personnelles */}
        <Section icon={<User size={17} strokeWidth={1.8} color="var(--accent)" />} title="Informations personnelles">
          <div style={{ marginBottom: 6 }}>
            <label style={labelStyle}>Adresse e-mail</label>
            <div style={{ padding: "10px 14px", background: "var(--paper-3)", border: "1.5px solid var(--line)", borderRadius: 10, fontSize: 14, color: "var(--ink)", fontWeight: 500 }}>
              {email}
            </div>
            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 5 }}>Pour modifier votre e-mail, contactez le support.</p>
          </div>
        </Section>

        {/* Plan actuel */}
        <Section icon={<Shield size={17} strokeWidth={1.8} color="var(--accent)" />} title="Mon abonnement">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "var(--accent-soft)", border: "1px solid rgba(45,125,90,0.25)", borderRadius: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>Plan gratuit</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>1 analyse/jour · Watchlist 3 actions · Portefeuille 3 positions</div>
            </div>
            <Link href="/tarifs" style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600, whiteSpace: "nowrap", textDecoration: "none" }}>
              Voir les offres →
            </Link>
          </div>
        </Section>

        {/* Changer le mot de passe */}
        <Section id="password" icon={<KeyRound size={17} strokeWidth={1.8} color="var(--accent)" />} title="Changer le mot de passe">
          <form onSubmit={handlePasswordChange} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle}>Nouveau mot de passe</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="Minimum 8 caractères" required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Confirmer le nouveau mot de passe</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Répétez le nouveau mot de passe" required style={inputStyle} />
            </div>
            {pwdMsg && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, fontSize: 13, background: pwdMsg.type === "success" ? "var(--accent-soft)" : "#fef2f2", border: `1px solid ${pwdMsg.type === "success" ? "rgba(45,125,90,0.25)" : "#fca5a5"}`, color: pwdMsg.type === "success" ? "var(--accent)" : "#c0392b" }}>
                {pwdMsg.type === "success" ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                {pwdMsg.text}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" disabled={pwdSaving} style={{ padding: "9px 22px", borderRadius: 9999, background: "var(--accent)", color: "#fff", fontWeight: 600, fontSize: 13, border: "none", cursor: pwdSaving ? "wait" : "pointer", opacity: pwdSaving ? 0.7 : 1 }}>
                {pwdSaving ? "Enregistrement…" : "Mettre à jour le mot de passe"}
              </button>
            </div>
          </form>
        </Section>

        {/* Alertes email */}
        <Section icon={<Bell size={17} strokeWidth={1.8} color="var(--accent)" />} title="Paramètres de notifications">
          <Link href="/parametres/alertes" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", borderRadius: 12, border: "1.5px solid var(--line)", background: "var(--paper-2)", color: "var(--ink)", fontSize: 13, fontWeight: 500, textDecoration: "none", transition: "border-color 0.15s" }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = "var(--accent)")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = "var(--line)")}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Bell size={15} strokeWidth={1.8} color="var(--muted)" />
              Gérer mes alertes email
            </div>
            <span style={{ fontSize: 16, color: "var(--muted)" }}>›</span>
          </Link>
        </Section>
      </div>
      <Footer />
    </div>
  );
}

/* ── Helpers ── */
const labelStyle: React.CSSProperties = { fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 5, fontWeight: 600 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 14px", borderRadius: 10, background: "#fff", border: "1.5px solid var(--line)", color: "var(--ink)", fontSize: 14, outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" };

function Section({ id, icon, title, children }: { id?: string; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div id={id} style={{ background: "var(--paper-2)", border: "1.5px solid var(--line)", borderRadius: 16, padding: "22px 24px", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 18 }}>
        {icon}
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", margin: 0 }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}
