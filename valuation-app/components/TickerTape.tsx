"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

export interface TickerItem {
  symbol: string;
  name: string;
  price: number;
  change: number; // percentage
}

const DEFAULT_TICKERS: TickerItem[] = [
  { symbol: "AAPL",  name: "Apple",     price: 189.30, change:  1.24 },
  { symbol: "MSFT",  name: "Microsoft", price: 415.60, change:  0.82 },
  { symbol: "NVDA",  name: "Nvidia",    price: 875.40, change:  3.15 },
  { symbol: "GOOGL", name: "Alphabet",  price: 172.50, change: -0.43 },
  { symbol: "AMZN",  name: "Amazon",    price: 198.20, change:  1.67 },
  { symbol: "MC.PA", name: "LVMH",      price: 768.10, change: -0.91 },
  { symbol: "OR.PA", name: "L'Oréal",   price: 412.30, change:  0.55 },
  { symbol: "SAN.PA",name: "Sanofi",    price: 103.50, change:  0.22 },
  { symbol: "BNP.PA",name: "BNP Paribas",price: 73.40, change: -1.12 },
  { symbol: "TTE.PA",name: "TotalEnergies",price: 57.80, change:  0.34 },
];

interface TickerTapeProps {
  items?: TickerItem[];
}

function TickerItemEl({ item }: { item: TickerItem }) {
  const up = item.change >= 0;
  const color = up ? "var(--signal-up)" : "var(--signal-down)";

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "0 24px",
      borderRight: "1px solid var(--line)",
      whiteSpace: "nowrap",
    }}>
      <span style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)", letterSpacing: "-0.01em" }}>
        {item.symbol}
      </span>
      <span style={{
        fontSize: 13,
        color: "var(--ink)",
        fontFamily: "var(--font-geist-mono, monospace)",
        fontVariantNumeric: "tabular-nums",
        letterSpacing: "-0.02em",
      }}>
        {item.price.toFixed(2)}
      </span>
      <span style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        fontSize: 12,
        fontWeight: 600,
        color,
        fontFamily: "var(--font-geist-mono, monospace)",
        fontVariantNumeric: "tabular-nums",
      }}>
        {up
          ? <TrendingUp size={12} strokeWidth={2} />
          : <TrendingDown size={12} strokeWidth={2} />
        }
        {up ? "+" : ""}{item.change.toFixed(2)}%
      </span>
    </span>
  );
}

export default function TickerTape({ items = DEFAULT_TICKERS }: TickerTapeProps) {
  // Duplicate for seamless loop
  const all = [...items, ...items];

  return (
    <div style={{
      overflow: "hidden",
      borderTop: "1px solid var(--line)",
      borderBottom: "1px solid var(--line)",
      background: "var(--paper-2)",
      height: 40,
      display: "flex",
      alignItems: "center",
    }}>
      <div className="ticker-tape-track" style={{ display: "flex", alignItems: "center" }}>
        {all.map((item, i) => (
          <TickerItemEl key={`${item.symbol}-${i}`} item={item} />
        ))}
      </div>
    </div>
  );
}
