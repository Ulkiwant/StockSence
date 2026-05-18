"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const PERIODS = [
  { label: "1M", value: "1mo" },
  { label: "3M", value: "3mo" },
  { label: "6M", value: "6mo" },
  { label: "1A", value: "1y" },
  { label: "5A", value: "5y" },
] as const;

type Period = (typeof PERIODS)[number]["value"];

interface DataPoint {
  date: string;
  close: number;
  volume: number;
}

export default function StockChart({ ticker }: { ticker: string }) {
  const [period, setPeriod] = useState<Period>("1y");
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stock/${ticker}/history?period=${period}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [ticker, period]);

  const isPositive =
    data.length > 1 && data[data.length - 1].close >= data[0].close;

  const color = isPositive ? "#86efac" : "#fca5a5";

  const minPrice = Math.min(...data.map((d) => d.close)) * 0.99;
  const maxPrice = Math.max(...data.map((d) => d.close)) * 1.01;

  return (
    <div className="card" style={{ padding: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Évolution du cours</h3>
        <div style={{ display: "flex", gap: 4 }}>
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                border: "none",
                background:
                  period === p.value
                    ? "rgba(59,123,255,0.15)"
                    : "transparent",
                color:
                  period === p.value
                    ? "var(--accent-blue)"
                    : "var(--text-secondary)",
                fontSize: 13,
                fontWeight: period === p.value ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Chargement...</div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => {
                const d = new Date(val);
                return period === "5y"
                  ? d.getFullYear().toString()
                  : d.toLocaleDateString("fr-FR", { month: "short", day: "numeric" });
              }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              domain={[minPrice, maxPrice]}
              width={60}
              tickFormatter={(v) => `${v.toFixed(0)}`}
            />
            <Tooltip
              contentStyle={{
                background: "#1a1d24",
                border: "1px solid var(--border-hover)",
                borderRadius: 8,
                color: "var(--text-primary)",
                fontSize: 13,
              }}
              formatter={(value) => [`${Number(value).toFixed(2)}`, "Prix"]}
              labelFormatter={(label) =>
                new Date(label).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              }
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke={color}
              strokeWidth={2}
              fill="url(#priceGradient)"
              dot={false}
              activeDot={{ r: 4, fill: color }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
