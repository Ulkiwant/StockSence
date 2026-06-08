"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { UserResponse } from "@supabase/supabase-js";
import { ADMIN_EMAIL, Plan } from "@/lib/plan";
import { Trash2, Plus, Shield, Check } from "lucide-react";

interface UserPlanRow {
  id: string;
  email: string;
  plan: Plan;
  note: string | null;
  granted_at: string;
  expires_at: string | null;
}

const PLAN_COLORS: Record<Plan, string> = {
  free:         "#9C9583",
  investisseur: "#2F7D52",
  premium:      "#1F5C3E",
  admin:        "#7D55C7",
};

const PLAN_LABELS: Record<Plan, string> = {
  free: "Gratuit", investisseur: "Investisseur", premium: "Premium", admin: "Admin",
};

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();

  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading]       = useState(true);
  const [users, setUsers]           = useState<UserPlanRow[]>([]);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [error, setError]           = useState<string|null>(null);

  // Formulaire ajout
  const [newEmail, setNewEmail]     = useState("");
  const [newPlan, setNewPlan]       = useState<Plan>("investisseur");
  const [newNote, setNewNote]       = useState("");
  const [newExpiry, setNewExpiry]   = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }: UserResponse) => {
      if (data.user?.email !== ADMIN_EMAIL) {
        router.push("/");
        return;
      }
      setAuthorized(true);
      loadUsers();
    });
  }, []); // eslint-disable-line

  const loadUsers = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    const d = await res.json();
    setUsers(Array.isArray(d) ? d : []);
    setLoading(false);
  };

  const grantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setSaving(true); setError(null); setSaved(false);
    const res = await fetch("/api/admin/grant", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail.trim(), plan: newPlan, note: newNote || null, expires_at: newExpiry || null }),
    });
    const d = await res.json();
    if (d.error) { setError(d.error); setSaving(false); return; }
    setSaved(true); setSaving(false);
    setNewEmail(""); setNewNote(""); setNewExpiry("");
    setTimeout(() => setSaved(false), 3000);
    await loadUsers();
  };

  const revokeAccess = async (email: string) => {
    if (!confirm(`Révoquer l'accès de ${email} ?`)) return;
    await fetch("/api/admin/revoke", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    await loadUsers();
  };

  if (!authorized) return null;

  return (
    <div style={{ background: "var(--paper)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#7D55C720", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={20} color="#7D55C7" />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--ink)", margin: 0 }}>Administration Finazen</h1>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>Accès réservé — {ADMIN_EMAIL}</p>
          </div>
        </div>

        {/* Ton statut */}
        <div style={{ background: "#7D55C710", border: "1px solid #7D55C730", borderRadius: 14, padding: "14px 18px", marginBottom: 32, display: "flex", alignItems: "center", gap: 10 }}>
          <Shield size={16} color="#7D55C7" />
          <span style={{ fontSize: 13, color: "var(--ink)" }}>
            Ton compte <strong>{ADMIN_EMAIL}</strong> a un accès <strong style={{ color: "#7D55C7" }}>Admin illimité permanent</strong> — indépendant de cette table.
          </span>
        </div>

        {/* Formulaire accorder accès */}
        <div style={{ background: "var(--paper-2)", border: "1.5px solid var(--line)", borderRadius: 18, padding: "24px 28px", marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 20 }}>
            <Plus size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
            Accorder un accès
          </h2>
          <form onSubmit={grantAccess} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>Adresse email *</label>
                <input value={newEmail} onChange={e => setNewEmail(e.target.value)} required
                  placeholder="utilisateur@exemple.com"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid var(--line)", background: "#fff", color: "var(--ink)", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>Plan *</label>
                <select value={newPlan} onChange={e => setNewPlan(e.target.value as Plan)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid var(--line)", background: "#fff", color: "var(--ink)", fontSize: 14, outline: "none", boxSizing: "border-box" }}>
                  <option value="investisseur">Investisseur (9,99€)</option>
                  <option value="premium">Premium (14,99€)</option>
                  <option value="free">Gratuit</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>Note interne (optionnel)</label>
                <input value={newNote} onChange={e => setNewNote(e.target.value)}
                  placeholder="ex : ami, partenaire, presse..."
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid var(--line)", background: "#fff", color: "var(--ink)", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>Expiration (optionnel)</label>
                <input type="date" value={newExpiry} onChange={e => setNewExpiry(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid var(--line)", background: "#fff", color: "var(--ink)", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                />
              </div>
            </div>
            {error && <div style={{ fontSize: 12, color: "var(--signal-down)", padding: "8px 12px", background: "rgba(184,74,58,0.08)", borderRadius: 8 }}>{error}</div>}
            <button type="submit" disabled={saving} style={{ alignSelf: "flex-start", padding: "10px 22px", borderRadius: 9999, border: "none", background: saved ? "#2F7D52" : "var(--accent)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "background 0.2s" }}>
              {saved ? <><Check size={14} /> Accès accordé !</> : saving ? "Enregistrement…" : <><Plus size={14} /> Accorder l'accès</>}
            </button>
          </form>
        </div>

        {/* Liste des utilisateurs */}
        <div style={{ background: "var(--paper-2)", border: "1.5px solid var(--line)", borderRadius: 18, overflow: "hidden" }}>
          <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", margin: 0 }}>
              Accès accordés — {users.length} utilisateur{users.length !== 1 ? "s" : ""}
            </h2>
            <button onClick={loadUsers} style={{ fontSize: 12, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>Actualiser</button>
          </div>

          {loading ? (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>Chargement…</div>
          ) : users.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>Aucun accès accordé pour l'instant.</div>
          ) : (
            users.map((u, i) => (
              <div key={u.id} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", alignItems: "center", gap: 16, padding: "14px 24px", borderBottom: i < users.length - 1 ? "1px solid var(--line)" : "none" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{u.email}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                    Accordé le {new Date(u.granted_at).toLocaleDateString("fr-FR")}
                    {u.note && ` · ${u.note}`}
                    {u.expires_at && ` · Expire le ${new Date(u.expires_at).toLocaleDateString("fr-FR")}`}
                  </div>
                </div>
                <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 9999, background: `${PLAN_COLORS[u.plan as Plan]}20`, color: PLAN_COLORS[u.plan as Plan], fontWeight: 700, whiteSpace: "nowrap" }}>
                  {PLAN_LABELS[u.plan as Plan]}
                </span>
                <button onClick={() => revokeAccess(u.email)} title="Révoquer l'accès"
                  style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid rgba(184,74,58,0.25)", background: "rgba(184,74,58,0.07)", color: "var(--signal-down)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
