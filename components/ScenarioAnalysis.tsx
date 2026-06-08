"use client";
import { useMemo, useState, useRef, useEffect } from "react";
import { TrendingDown, TrendingUp, BarChart2, Info } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface Position {
  symbol: string; name?: string; marketValue: number;
  asset_type: string; beta?: number; sector?: string;
}
interface ScenarioAnalysisProps {
  positions: Position[]; totalValue: number;
  monthlyContribution?: number; riskLabel?: string;
}

const SECTOR_BETA: Record<string, number> = {
  Technology: 1.35, "Financial Services": 1.15, Financials: 1.15,
  Healthcare: 0.8, "Health Care": 0.8, Energy: 1.05, Utilities: 0.55,
  "Consumer Cyclical": 1.1, "Consumer Discretionary": 1.1, "Consumer Staples": 0.65,
  Industrials: 1.0, Materials: 1.05, "Communication Services": 1.1, "Real Estate": 0.9,
};

/* ── Couleurs distinctives ── */
const SCENARIOS = {
  bear:   { label: "Pessimiste", color: "#c0392b", premium: -0.06 },
  normal: { label: "Base",       color: "#b07d00", premium: 0.055 },
  bull:   { label: "Optimiste",  color: "#2d7d5a", premium: 0.115 },
} as const;

type ScenarioKey = keyof typeof SCENARIOS;
const RF = 0.035;

const ScenarioIcon = ({ k, size = 15 }: { k: ScenarioKey; size?: number }) => {
  if (k === "bear")   return <TrendingDown  size={size} strokeWidth={2} />;
  if (k === "bull")   return <TrendingUp    size={size} strokeWidth={2} />;
  return <BarChart2 size={size} strokeWidth={2} />;
};

function fmtShort(n: number): string {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M €";
  if (Math.abs(n) >= 1_000)     return (n / 1_000).toFixed(1) + "k €";
  return n.toFixed(0) + " €";
}
function fmtShortAxis(n: number): string {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (Math.abs(n) >= 1_000)     return (n / 1_000).toFixed(0) + "k";
  return n.toFixed(0);
}
function fmtEur(n: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

/* ── Badge beta cliquable avec tooltip explicatif ── */
function BetaBadge({ beta }: { beta: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const betaInterpretation =
    beta < 0.8 ? "Votre portefeuille est défensif — il résiste mieux aux turbulences, mais progresse moins vite."
    : beta < 1.1 ? "Votre portefeuille suit globalement le marché — ni trop risqué, ni trop défensif."
    : "Votre portefeuille est dynamique — il peut beaucoup gagner, mais aussi beaucoup perdre en cas de crise.";

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-flex" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 12, padding: "4px 12px", borderRadius: 20,
          background: open ? "rgba(59,123,255,0.18)" : "rgba(59,123,255,0.10)",
          color: "var(--accent-blue)", fontWeight: 600,
          border: "none", cursor: "pointer", transition: "background 0.15s",
        }}
      >
        Bêta du portefeuille : {beta.toFixed(2)}
        <Info size={12} strokeWidth={2} style={{ opacity: 0.7 }} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0, width: 272,
          background: "var(--paper)", border: "1.5px solid var(--line)",
          borderRadius: 14, padding: "16px 18px",
          boxShadow: "0 8px 24px rgba(10,22,40,0.12)", zIndex: 100,
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>
            C'est quoi le bêta ?
          </p>
          <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.65, marginBottom: 12 }}>
            Le bêta mesure comment votre portefeuille réagit quand les marchés bougent.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
            {[
              { range: "Bêta < 0,8", label: "Défensif", desc: "Moins de risque, moins de gain potentiel" },
              { range: "Bêta ≈ 1,0", label: "Neutre",   desc: "Suit le marché" },
              { range: "Bêta > 1,2", label: "Dynamique",desc: "Plus de gain possible, plus de risque" },
            ].map(({ range, label, desc }) => (
              <div key={range} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8, background: "var(--paper-2)", border: "1px solid var(--line)" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", minWidth: 62 }}>{range}</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink)" }}>{label}</div>
                  <div style={{ fontSize: 10, color: "var(--muted)" }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600, margin: 0 }}>
            Votre situation : {betaInterpretation}
          </p>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════ */
export default function ScenarioAnalysis({
  positions, totalValue, monthlyContribution = 0, riskLabel,
}: ScenarioAnalysisProps) {

  const { portfolioBeta, rates, chartData, projections } = useMemo(() => {
    if (!positions.length || totalValue <= 0)
      return { portfolioBeta: 1.0, rates: { bear: 0, normal: 0, bull: 0 }, chartData: [], projections: { bear: {}, normal: {}, bull: {} } };

    const beta = positions.reduce((sum, p) => {
      const weight = p.marketValue / totalValue;
      let b = p.beta ?? (p.asset_type === "etf" ? 0.9 : p.asset_type === "crypto" ? 2.0 : SECTOR_BETA[p.sector ?? ""] ?? 1.0);
      b = Math.min(Math.max(b, 0.3), 2.5);
      return sum + weight * b;
    }, 0);

    const rawRates = {
      bear:   RF + beta * SCENARIOS.bear.premium,
      normal: RF + beta * SCENARIOS.normal.premium,
      bull:   RF + beta * SCENARIOS.bull.premium,
    };
    const rates = {
      bear:   Math.max(rawRates.bear, -0.25),
      normal: rawRates.normal,
      bull:   Math.min(rawRates.bull, 0.4),
    };

    const project = (r: number, years: number): number => {
      if (years === 0) return totalValue;
      if (monthlyContribution > 0) {
        const pmt = monthlyContribution * 12;
        return totalValue * Math.pow(1 + r, years) + pmt * (Math.pow(1 + r, years) - 1) / r;
      }
      return totalValue * Math.pow(1 + r, years);
    };

    const projKeys = [1, 3, 5, 10];
    const projections = {
      bear:   Object.fromEntries(projKeys.map(y => [y, project(rates.bear, y)])),
      normal: Object.fromEntries(projKeys.map(y => [y, project(rates.normal, y)])),
      bull:   Object.fromEntries(projKeys.map(y => [y, project(rates.bull, y)])),
    };
    const chartData = Array.from({ length: 11 }, (_, year) => ({
      year: year === 0 ? "Auj." : `${year}A`,
      bear:   Math.round(project(rates.bear, year)),
      normal: Math.round(project(rates.normal, year)),
      bull:   Math.round(project(rates.bull, year)),
    }));

    return { portfolioBeta: beta, rates, chartData, projections };
  }, [positions, totalValue, monthlyContribution]);

  if (!positions.length || totalValue <= 0) return null;

  /* Card styles */
  const BG: Record<ScenarioKey, string> = {
    bear:   "rgba(192,57,43,0.06)",
    normal: "rgba(176,125,0,0.06)",
    bull:   "rgba(45,125,90,0.06)",
  };
  const BORDER: Record<ScenarioKey, string> = {
    bear:   "rgba(192,57,43,0.22)",
    normal: "rgba(176,125,0,0.22)",
    bull:   "rgba(45,125,90,0.22)",
  };

  return (
    <div className="card" style={{ padding: 28, marginBottom: 28 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, color: "var(--ink)" }}>
          <BarChart2 size={18} strokeWidth={2} color="var(--accent)" />
          Analyse de scénarios{riskLabel ? ` — Profil ${riskLabel}` : ""}
        </h2>
        <BetaBadge beta={portfolioBeta} />
      </div>

      {/* 3 scenario cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 28 }}>
        {(["bear", "normal", "bull"] as ScenarioKey[]).map((key) => {
          const sc   = SCENARIOS[key];
          const rate = rates[key];
          const proj = projections[key] as Record<number, number>;
          return (
            <div key={key} style={{ background: BG[key], border: `1px solid ${BORDER[key]}`, borderRadius: 14, padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: sc.color, display: "flex" }}><ScenarioIcon k={key} /></span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: sc.color }}>{sc.label}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: sc.color }}>
                  {rate >= 0 ? "+" : ""}{(rate * 100).toFixed(1)} %/an
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {([1, 3, 5, 10] as const).map(y => (
                  <div key={y} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px", fontFamily: "var(--font-geist-mono, monospace)" }}>{y}A</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: sc.color }}>{fmtShort(proj[y])}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 14, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "var(--font-geist-mono, monospace)" }}>
          Valeur projetée sur 10 ans
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="scenGradBear"   x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#c0392b" stopOpacity={0.12}/><stop offset="95%" stopColor="#c0392b" stopOpacity={0}/></linearGradient>
              <linearGradient id="scenGradNormal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#b07d00" stopOpacity={0.12}/><stop offset="95%" stopColor="#b07d00" stopOpacity={0}/></linearGradient>
              <linearGradient id="scenGradBull"   x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2d7d5a" stopOpacity={0.12}/><stop offset="95%" stopColor="#2d7d5a" stopOpacity={0}/></linearGradient>
            </defs>
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtShortAxis} tick={{ fontSize: 10, fill: "var(--muted)" }} axisLine={false} tickLine={false} width={50} />
            <Tooltip
              contentStyle={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}
              formatter={(value: unknown, name: unknown) => {
                const labels: Record<string, string> = { bear: "Pessimiste", normal: "Base", bull: "Optimiste" };
                return [fmtShort(Number(value)), labels[String(name)] ?? String(name)];
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
              formatter={(value: string) => {
                const labels: Record<string, string> = { bear: "Pessimiste", normal: "Base", bull: "Optimiste" };
                return labels[value] ?? value;
              }}
            />
            <Area type="monotone" dataKey="bear"   stroke="#c0392b" strokeWidth={2.2} fill="url(#scenGradBear)"   dot={false} />
            <Area type="monotone" dataKey="normal" stroke="#b07d00" strokeWidth={2.2} fill="url(#scenGradNormal)" dot={false} />
            <Area type="monotone" dataKey="bull"   stroke="#2d7d5a" strokeWidth={2.2} fill="url(#scenGradBull)"   dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Note simplifiée */}
      <p style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.65, padding: "10px 14px", background: "var(--paper-2)", borderRadius: 8, margin: 0 }}>
        Ces projections sont des estimations basées sur votre profil de risque et la composition de votre portefeuille. Elles ne garantissent aucun rendement futur et ne constituent pas un conseil en investissement.
        {monthlyContribution > 0 && ` Versements mensuels de ${fmtEur(monthlyContribution)} inclus dans le calcul.`}
      </p>
    </div>
  );
}
