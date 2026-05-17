"use client";
import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Position {
  symbol: string;
  name?: string;
  marketValue: number;
  asset_type: string;
  beta?: number;
  sector?: string;
}

interface ScenarioAnalysisProps {
  positions: Position[];
  totalValue: number;
  monthlyContribution?: number;
  riskLabel?: string;
}

const SECTOR_BETA: Record<string, number> = {
  Technology: 1.35,
  "Financial Services": 1.15,
  Financials: 1.15,
  Healthcare: 0.8,
  "Health Care": 0.8,
  Energy: 1.05,
  Utilities: 0.55,
  "Consumer Cyclical": 1.1,
  "Consumer Discretionary": 1.1,
  "Consumer Staples": 0.65,
  Industrials: 1.0,
  Materials: 1.05,
  "Communication Services": 1.1,
  "Real Estate": 0.9,
};

const SCENARIOS = {
  bear: { label: "Pessimiste", color: "#ff4757", emoji: "🐻", premium: -0.06 },
  normal: { label: "Base", color: "#fbbf24", emoji: "📊", premium: 0.055 },
  bull: { label: "Optimiste", color: "#00d48a", emoji: "🐂", premium: 0.115 },
} as const;

type ScenarioKey = keyof typeof SCENARIOS;

const RF = 0.035;

function fmtShort(n: number): string {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M €";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + "k €";
  return n.toFixed(0) + " €";
}

function fmtShortAxis(n: number): string {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(0) + "k";
  return n.toFixed(0);
}

function fmtEur(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function ScenarioAnalysis({
  positions,
  totalValue,
  monthlyContribution = 0,
  riskLabel,
}: ScenarioAnalysisProps) {
  const { portfolioBeta, rates, chartData, projections } = useMemo(() => {
    if (!positions.length || totalValue <= 0) {
      return { portfolioBeta: 1.0, rates: { bear: 0, normal: 0, bull: 0 }, chartData: [], projections: { bear: {}, normal: {}, bull: {} } };
    }

    // Calcul du beta pondéré
    const beta = positions.reduce((sum, p) => {
      const weight = p.marketValue / totalValue;
      let b =
        p.beta ??
        (p.asset_type === "etf"
          ? 0.9
          : p.asset_type === "crypto"
          ? 2.0
          : SECTOR_BETA[p.sector ?? ""] ?? 1.0);
      b = Math.min(Math.max(b, 0.3), 2.5);
      return sum + weight * b;
    }, 0);

    // Rendements annuels par scénario
    const rawRates = {
      bear: RF + beta * SCENARIOS.bear.premium,
      normal: RF + beta * SCENARIOS.normal.premium,
      bull: RF + beta * SCENARIOS.bull.premium,
    };

    const rates = {
      bear: Math.max(rawRates.bear, -0.25),
      normal: rawRates.normal,
      bull: Math.min(rawRates.bull, 0.4),
    };

    // Fonction de projection
    const project = (r: number, years: number): number => {
      if (years === 0) return totalValue;
      if (monthlyContribution > 0) {
        const pmt = monthlyContribution * 12;
        return totalValue * Math.pow(1 + r, years) + pmt * (Math.pow(1 + r, years) - 1) / r;
      }
      return totalValue * Math.pow(1 + r, years);
    };

    // Projections clés (1A, 3A, 5A, 10A)
    const projKeys = [1, 3, 5, 10];
    const projections = {
      bear: Object.fromEntries(projKeys.map((y) => [y, project(rates.bear, y)])),
      normal: Object.fromEntries(projKeys.map((y) => [y, project(rates.normal, y)])),
      bull: Object.fromEntries(projKeys.map((y) => [y, project(rates.bull, y)])),
    };

    // Données graphique (0 à 10 ans)
    const chartData = Array.from({ length: 11 }, (_, year) => ({
      year: year === 0 ? "Auj." : `${year}A`,
      bear: Math.round(project(rates.bear, year)),
      normal: Math.round(project(rates.normal, year)),
      bull: Math.round(project(rates.bull, year)),
    }));

    return { portfolioBeta: beta, rates, chartData, projections };
  }, [positions, totalValue, monthlyContribution]);

  if (!positions.length || totalValue <= 0) return null;

  const scenarioBgColors: Record<ScenarioKey, string> = {
    bear: "rgba(255,71,87,0.06)",
    normal: "rgba(251,191,36,0.06)",
    bull: "rgba(0,212,138,0.06)",
  };
  const scenarioBorderColors: Record<ScenarioKey, string> = {
    bear: "rgba(255,71,87,0.2)",
    normal: "rgba(251,191,36,0.2)",
    bull: "rgba(0,212,138,0.2)",
  };

  return (
    <div className="card" style={{ padding: 28, marginBottom: 28 }}>
      {/* Titre */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 17, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
          📊 Analyse de scénarios{riskLabel ? ` — Profil ${riskLabel}` : ""}
        </h2>
        <span
          style={{
            fontSize: 12,
            padding: "4px 12px",
            borderRadius: 20,
            background: "rgba(59,123,255,0.1)",
            color: "var(--accent-blue)",
            fontWeight: 600,
          }}
        >
          Beta portefeuille : {portfolioBeta.toFixed(2)}
        </span>
      </div>

      {/* 3 cartes de scénario */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 28,
        }}
      >
        {(["bear", "normal", "bull"] as ScenarioKey[]).map((key) => {
          const sc = SCENARIOS[key];
          const rate = rates[key];
          const proj = projections[key] as Record<number, number>;
          const rateStr = `${rate >= 0 ? "+" : ""}${(rate * 100).toFixed(1)}%/an`;
          return (
            <div
              key={key}
              style={{
                background: scenarioBgColors[key],
                border: `1px solid ${scenarioBorderColors[key]}`,
                borderRadius: 14,
                padding: "18px 20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 14,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{sc.emoji}</span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: sc.color }}>
                    {sc.label}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: sc.color,
                  }}
                >
                  {rateStr}
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 8,
                }}
              >
                {([1, 3, 5, 10] as const).map((y) => (
                  <div key={y} style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--text-muted)",
                        marginBottom: 3,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.3px",
                      }}
                    >
                      {y}A
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: sc.color,
                      }}
                    >
                      {fmtShort(proj[y])}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Graphique */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            marginBottom: 14,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Valeur projetée sur 10 ans
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="scenGradBear" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff4757" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#ff4757" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="scenGradNormal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="scenGradBull" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00d48a" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#00d48a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: "var(--text-muted)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={fmtShortAxis}
              tick={{ fontSize: 10, fill: "var(--text-muted)" }}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <Tooltip
              contentStyle={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}
              formatter={(value: unknown, name: unknown) => {
                const labels: Record<string, string> = {
                  bear: "🐻 Pessimiste",
                  normal: "📊 Base",
                  bull: "🐂 Optimiste",
                };
                return [fmtShort(Number(value)), labels[String(name)] ?? String(name)];
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
              formatter={(value: string) => {
                const labels: Record<string, string> = {
                  bear: "🐻 Pessimiste",
                  normal: "📊 Base",
                  bull: "🐂 Optimiste",
                };
                return labels[value] ?? value;
              }}
            />
            <Area
              type="monotone"
              dataKey="bear"
              stroke="#ff4757"
              strokeWidth={2}
              fill="url(#scenGradBear)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="normal"
              stroke="#fbbf24"
              strokeWidth={2}
              fill="url(#scenGradNormal)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="bull"
              stroke="#00d48a"
              strokeWidth={2}
              fill="url(#scenGradBull)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Note de bas de page */}
      <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>
        Projections basées sur le CAPM simplifié (beta portefeuille : {portfolioBeta.toFixed(2)}).
        Ces estimations ne constituent pas un conseil en investissement.
        Hypothèses : taux sans risque 3,5%, rendement excédentaire bear/base/bull = -6%/+5,5%/+11,5%.
        {monthlyContribution > 0 && ` Versement mensuel inclus : ${fmtEur(monthlyContribution)}/mois.`}
      </p>
    </div>
  );
}
