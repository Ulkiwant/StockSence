"use client";

import { useEffect, useState, useCallback } from "react";
import type { UserResponse } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { Bell, ArrowRight } from "lucide-react";
import Footer from "@/components/Footer";

interface WatchItem { symbol: string; name: string }
interface Alert {
  ticker: string;
  alert_type: "signal_change" | "price_variation";
  threshold: number | null;
  active: boolean;
}
type AlertsMap = Record<string, { signalActive: boolean; priceActive: boolean; threshold: string }>;

function defaultEntry() { return { signalActive: false, priceActive: false, threshold: "5" }; }

export default function AlertesPage() {
  const [watchlist, setWatchlist] = useState<WatchItem[]>([]);
  const [alertsMap, setAlertsMap] = useState<AlertsMap>({});
  const [saving, setSaving]       = useState<Record<string, boolean>>({});
  const [saved, setSaved]         = useState<Record<string, boolean>>({});
  const [loading, setLoading]     = useState(true);
  const supabase = createClient();

  const loadData = useCallback(async () => {
    setLoading(true);
    const [wlRes, alRes] = await Promise.all([fetch("/api/watchlist"), fetch("/api/alerts")]);
    const wl: WatchItem[] = wlRes.ok ? await wlRes.json() : [];
    const al: Alert[]     = alRes.ok ? await alRes.json() : [];

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
    setWatchlist(wl); setAlertsMap(map); setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then((res: UserResponse) => { if (res.data.user) loadData(); });
  }, [loadData, supabase]);

  const update = (symbol: string, patch: Partial<AlertsMap[string]>) => {
    setAlertsMap((prev) => ({ ...prev, [symbol]: { ...prev[symbol], ...patch } }));
  };

  const save = async (symbol: string) => {
    setSaving((p) => ({ ...p, [symbol]: true }));
    const entry = alertsMap[symbol] ?? defaultEntry();
    await Promise.all([
      fetch("/api/alerts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: symbol, alert_type: "signal_change", active: entry.signalActive, threshold: null }),
      }),
      fetch("/api/alerts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: symbol, alert_type: "price_variation", active: entry.priceActive, threshold: parseFloat(entry.threshold) || 5 }),
      }),
    ]);
    setSaving((p) => ({ ...p, [symbol]: false }));
    setSaved((p) => ({ ...p, [symbol]: true }));
    setTimeout(() => setSaved((p) => ({ ...p, [symbol]: false })), 2000);
  };

  return (
    <div style={{ background: "var(--paper)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 28px 64px" }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 28 }}>
          <Link href="/" style={{ color: "var(--muted)" }}>Accueil</Link>
          <span style={{ margin: "0 6px" }}>›</span>
          <span>Paramètres</span>
          <span style={{ margin: "0 6px" }}>›</span>
          <span style={{ color: "var(--ink)", fontWeight: 600 }}>Alertes email</span>
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <Bell size={20} strokeWidth={1.8} color="var(--accent)" />
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.4px", color: "var(--ink)" }}>
            Alertes email
          </h1>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.65, marginBottom: 32 }}>
          Recevez un email dès que le signal de valorisation d&apos;une de vos actions change,
          ou quand son cours varie de plus d&apos;un certain pourcentage.
        </p>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 14 }} />)}
          </div>
        ) : watchlist.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "48px 24px",
            background: "var(--paper-2)", borderRadius: 16, border: "1.5px dashed var(--line)",
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%", background: "var(--accent-soft)",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
            }}>
              <Bell size={20} strokeWidth={1.5} color="var(--accent)" />
            </div>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>
              Votre watchlist est vide. Ajoutez des actions pour créer des alertes.
            </p>
            <Link href="/watchlist" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "9px 20px", borderRadius: 9999,
              background: "var(--accent)", color: "#fff", fontWeight: 600, fontSize: 13,
            }}>
              Aller à ma watchlist <ArrowRight size={13} />
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {watchlist.map(({ symbol, name }) => {
              const entry    = alertsMap[symbol] ?? defaultEntry();
              const isSaving = saving[symbol];
              const isSaved  = saved[symbol];

              return (
                <div key={symbol} style={{
                  background: "var(--paper-2)", border: "1.5px solid var(--line)",
                  borderRadius: 14, padding: "18px 20px",
                  transition: "border-color 0.15s",
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
                >
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 9,
                        background: "var(--accent-soft)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 9, fontWeight: 800, color: "var(--accent)",
                      }}>
                        {symbol.slice(0, 3)}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{symbol}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>{name}</div>
                      </div>
                    </div>
                    <Link href={`/stock/${symbol}`}
                      style={{ fontSize: 11, color: "var(--accent)", fontWeight: 500 }}>
                      Voir l&apos;analyse
                    </Link>
                  </div>

                  {/* Toggles */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                      <Toggle checked={entry.signalActive} onChange={(v) => update(symbol, { signalActive: v })} />
                      <span style={{ fontSize: 13, color: "var(--ink)" }}>
                        M&apos;alerter si le signal de valorisation change
                      </span>
                    </label>

                    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                      <Toggle checked={entry.priceActive} onChange={(v) => update(symbol, { priceActive: v })} />
                      <span style={{ fontSize: 13, color: "var(--ink)" }}>
                        M&apos;alerter si le prix varie de &gt;
                      </span>
                      <input
                        type="number" min="1" max="50" step="0.5"
                        value={entry.threshold}
                        onChange={(e) => update(symbol, { threshold: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: 52, height: 28, background: "#fff",
                          border: "1.5px solid var(--line)", borderRadius: 8,
                          color: "var(--ink)", fontSize: 13, textAlign: "center",
                          outline: "none", fontFamily: "var(--font-geist-mono, monospace)", fontVariantNumeric: "tabular-nums",
                        }}
                      />
                      <span style={{ fontSize: 13, color: "var(--muted)" }}>%</span>
                    </label>
                  </div>

                  {/* Save button */}
                  <button onClick={() => save(symbol)} disabled={isSaving}
                    style={{
                      padding: "6px 16px", borderRadius: 9999, fontSize: 12, fontWeight: 600,
                      cursor: isSaving ? "wait" : "pointer",
                      background: isSaved ? "var(--accent-soft)" : "transparent",
                      border: `1.5px solid ${isSaved ? "rgba(45,125,90,0.30)" : "var(--line)"}`,
                      color: isSaved ? "var(--accent)" : "var(--muted)",
                      transition: "all 0.18s",
                    }}>
                    {isSaving ? "Sauvegarde…" : isSaved ? "Sauvegardé" : "Sauvegarder"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Info box */}
        <div style={{
          marginTop: 28, padding: "12px 16px", borderRadius: 10,
          background: "var(--accent-soft)", border: "1px solid rgba(45,125,90,0.20)",
          fontSize: 12, color: "var(--muted)", lineHeight: 1.65,
          display: "flex", alignItems: "flex-start", gap: 8,
        }}>
          <Bell size={13} strokeWidth={2} color="var(--accent)" style={{ flexShrink: 0, marginTop: 1 }} />
          Les alertes sont vérifiées toutes les heures. Vous ne recevrez qu&apos;un seul email
          par événement — pas de spam.
        </div>
      </div>
      <Footer />
    </div>
  );
}

/* ── Toggle switch ─────────────────────────────── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      style={{
        width: 36, height: 20, borderRadius: 10, flexShrink: 0,
        background: checked ? "var(--accent-soft)" : "var(--paper-3)",
        border: `1.5px solid ${checked ? "rgba(45,125,90,0.45)" : "var(--line)"}`,
        position: "relative", cursor: "pointer",
        transition: "background 0.18s, border-color 0.18s", padding: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 2,
        left: checked ? "calc(100% - 17px)" : 2,
        width: 13, height: 13, borderRadius: "50%",
        background: checked ? "var(--accent)" : "var(--muted)",
        transition: "left 0.18s, background 0.18s",
      }} />
    </button>
  );
}
