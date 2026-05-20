"use client";
import { useEffect, useState, useCallback } from "react";
import type { UserResponse } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

interface WatchItem { symbol: string; name: string }
interface Alert {
  ticker: string;
  alert_type: "signal_change" | "price_variation";
  threshold: number | null;
  active: boolean;
}

type AlertsMap = Record<string, { signalActive: boolean; priceActive: boolean; threshold: string }>;

function defaultEntry() {
  return { signalActive: false, priceActive: false, threshold: "5" };
}

export default function AlertesPage() {
  const [watchlist, setWatchlist] = useState<WatchItem[]>([]);
  const [alertsMap, setAlertsMap] = useState<AlertsMap>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved]   = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Charge la watchlist et les alertes existantes
  const loadData = useCallback(async () => {
    setLoading(true);
    const [wlRes, alRes] = await Promise.all([
      fetch("/api/watchlist"),
      fetch("/api/alerts"),
    ]);
    const wl: WatchItem[] = wlRes.ok ? await wlRes.json() : [];
    const al: Alert[]     = alRes.ok ? await alRes.json() : [];

    // Buid alerts map
    const map: AlertsMap = {};
    wl.forEach(({ symbol }) => { map[symbol] = defaultEntry(); });
    al.forEach((a) => {
      if (!map[a.ticker]) map[a.ticker] = defaultEntry();
      if (a.alert_type === "signal_change")   map[a.ticker].signalActive = a.active;
      if (a.alert_type === "price_variation") {
        map[a.ticker].priceActive = a.active;
        map[a.ticker].threshold   = String(a.threshold ?? 5);
      }
    });

    setWatchlist(wl);
    setAlertsMap(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then((res: UserResponse) => {
      if (res.data.user) loadData();
    });
  }, [loadData, supabase]);

  const update = (symbol: string, patch: Partial<AlertsMap[string]>) => {
    setAlertsMap(prev => ({ ...prev, [symbol]: { ...prev[symbol], ...patch } }));
  };

  const save = async (symbol: string) => {
    setSaving(p => ({ ...p, [symbol]: true }));
    const entry = alertsMap[symbol] ?? defaultEntry();
    const wItem = watchlist.find(w => w.symbol === symbol);

    await Promise.all([
      fetch("/api/alerts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: symbol,
          alert_type: "signal_change",
          active: entry.signalActive,
          threshold: null,
        }),
      }),
      fetch("/api/alerts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: symbol,
          alert_type: "price_variation",
          active: entry.priceActive,
          threshold: parseFloat(entry.threshold) || 5,
        }),
      }),
    ]);

    setSaving(p => ({ ...p, [symbol]: false }));
    setSaved(p => ({ ...p, [symbol]: true }));
    setTimeout(() => setSaved(p => ({ ...p, [symbol]: false })), 2000);
    void wItem; // suppress unused warning
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", gap: 8, fontSize: 12, color: "var(--text-muted)", marginBottom: 32 }}>
        <Link href="/" style={{ color: "var(--text-muted)" }}>Accueil</Link>
        <span>/</span>
        <span>Paramètres</span>
        <span>/</span>
        <span style={{ color: "var(--text-secondary)" }}>Alertes email</span>
      </div>

      <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.4px", marginBottom: 8 }}>
        Alertes email
      </h1>
      <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 40 }}>
        Recevez un email dès que le signal IA d&apos;une de vos actions change,
        ou quand son cours varie de plus d&apos;un certain pourcentage.
      </p>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1,2,3].map(i => (
            <div key={i} className="skeleton" style={{ height: 110, borderRadius: 14 }} />
          ))}
        </div>
      ) : watchlist.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "48px 24px",
          background: "var(--bg-card)", borderRadius: 16,
          border: "1px solid var(--border)",
        }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>⭐</div>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20 }}>
            Votre watchlist est vide. Ajoutez des actions pour créer des alertes.
          </p>
          <Link href="/watchlist" style={{
            display: "inline-block", padding: "10px 20px", borderRadius: 10,
            background: "var(--cta-bg)", border: "1px solid var(--cta-border)",
            color: "var(--cta-text)", fontWeight: 600, fontSize: 13,
          }}>
            Aller à ma watchlist →
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {watchlist.map(({ symbol, name }) => {
            const entry = alertsMap[symbol] ?? defaultEntry();
            const isSaving = saving[symbol];
            const isSaved  = saved[symbol];

            return (
              <div key={symbol} style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: "20px 22px",
                transition: "border-color 0.2s",
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border-hover)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: "rgba(59,123,255,0.12)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 800, color: "var(--accent-blue)",
                    }}>
                      {symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{symbol}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{name}</div>
                    </div>
                  </div>
                  <Link
                    href={`/stock/${symbol}`}
                    style={{ fontSize: 11, color: "var(--text-muted)", textDecoration: "underline", textUnderlineOffset: 2 }}
                  >
                    Voir l&apos;analyse
                  </Link>
                </div>

                {/* Toggles */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                  {/* Signal change */}
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <Toggle
                      checked={entry.signalActive}
                      onChange={v => update(symbol, { signalActive: v })}
                    />
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                      M&apos;alerter si le signal IA change
                    </span>
                  </label>

                  {/* Price variation */}
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <Toggle
                      checked={entry.priceActive}
                      onChange={v => update(symbol, { priceActive: v })}
                    />
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                      M&apos;alerter si le prix varie de &gt;
                    </span>
                    <input
                      type="number"
                      min="1" max="50" step="0.5"
                      value={entry.threshold}
                      onChange={e => update(symbol, { threshold: e.target.value })}
                      onClick={e => e.stopPropagation()}
                      style={{
                        width: 52, height: 28,
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 6, color: "var(--text-primary)",
                        fontSize: 13, textAlign: "center",
                        outline: "none",
                      }}
                    />
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>%</span>
                  </label>
                </div>

                {/* Save button */}
                <button
                  onClick={() => save(symbol)}
                  disabled={isSaving}
                  style={{
                    padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                    cursor: isSaving ? "wait" : "pointer",
                    background: isSaved ? "rgba(134,239,172,0.12)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${isSaved ? "rgba(134,239,172,0.3)" : "rgba(255,255,255,0.10)"}`,
                    color: isSaved ? "var(--accent)" : "var(--text-secondary)",
                    transition: "all 0.2s",
                  }}
                >
                  {isSaving ? "Sauvegarde…" : isSaved ? "✓ Sauvegardé" : "Sauvegarder"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Info box */}
      <div style={{
        marginTop: 32,
        padding: "14px 18px",
        borderRadius: 12,
        background: "rgba(134,239,172,0.04)",
        border: "1px solid rgba(134,239,172,0.12)",
        fontSize: 12, color: "var(--text-muted)", lineHeight: 1.65,
      }}>
        📬 Les alertes sont vérifiées toutes les heures. Vous ne recevrez qu&apos;un seul email
        par événement — pas de spam.
      </div>
    </div>
  );
}

// ─── Toggle switch mini-composant ────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 36, height: 20, borderRadius: 10, flexShrink: 0,
        background: checked ? "rgba(134,239,172,0.25)" : "rgba(255,255,255,0.08)",
        border: `1px solid ${checked ? "rgba(134,239,172,0.45)" : "rgba(255,255,255,0.14)"}`,
        position: "relative", cursor: "pointer",
        transition: "background 0.2s, border-color 0.2s",
        padding: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 2,
        left: checked ? "calc(100% - 18px)" : 2,
        width: 14, height: 14, borderRadius: "50%",
        background: checked ? "var(--accent)" : "rgba(255,255,255,0.35)",
        transition: "left 0.2s, background 0.2s",
      }} />
    </button>
  );
}
