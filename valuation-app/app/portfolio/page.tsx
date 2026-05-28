"use client";

import { useState } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";

/* ─── Static portfolio data ─────────────────────────── */
const TOTAL = 28432.40;

const HOLDINGS = [
  { sym: "CW8",   name: "Amundi MSCI World UCITS ETF",          lg: "CW", bg: "#1F5C3E", qty: 18, avg: 462.10, cur: 512.30, val: 9221.40, pct: 32.4, plEur: 903.60, plPct: 10.9, sector: "Diversifié" },
  { sym: "MC.PA", name: "LVMH Moët Hennessy Louis Vuitton",     lg: "LV", bg: "#7D6009", qty: 8,  avg: 714.20, cur: 768.10, val: 6144.80, pct: 21.6, plEur: 431.20, plPct: 7.5,  sector: "Luxe" },
  { sym: "MSFT",  name: "Microsoft Corporation",                lg: "MS", bg: "#0F4C75", qty: 12, avg: 364.80, cur: 412.50, val: 4554.30, pct: 16.0, plEur: 526.18, plPct: 13.1, sector: "Tech" },
  { sym: "AAPL",  name: "Apple Inc.",                           lg: "AP", bg: "#3D3D3D", qty: 25, avg: 175.40, cur: 192.40, val: 4425.20, pct: 15.5, plEur: 390.80, plPct: 9.7,  sector: "Tech" },
  { sym: "OR.PA", name: "L'Oréal S.A.",                        lg: "LO", bg: "#6C3483", qty: 6,  avg: 395.00, cur: 412.30, val: 2473.80, pct: 8.7,  plEur: 103.80, plPct: 4.4,  sector: "Cosmétique" },
  { sym: "IBGL",  name: "iShares Global Govt Bonds UCITS ETF",  lg: "IB", bg: "#4A5568", qty: 25, avg: 38.20,  cur: 40.50,  val: 1012.50, pct: 3.6,  plEur: 57.50,  plPct: 6.0,  sector: "Obligations" },
];

const DONUT_SECTORS = [
  { name: "Diversifié",  pct: 32.4, color: "#1F5C3E" },
  { name: "Tech",        pct: 31.5, color: "#2F7D52" },
  { name: "Luxe",        pct: 21.6, color: "#C9A24E" },
  { name: "Cosmétique",  pct: 8.7,  color: "#7D55C7" },
  { name: "Obligations", pct: 3.6,  color: "#9C9583" },
];

const ACTIVITY = [
  { icon: "€", iBg: "#D6E4D6", iC: "#1F5C3E", sym: "OR.PA",  desc: "6 actions × 6,40 €",     amount: "+38,40 €",   date: "18 mai"   },
  { icon: "↑", iBg: "#D6E4D6", iC: "#1F5C3E", sym: "MSFT",   desc: "4 actions à 408,20 $",   amount: "−1 504,80 €",date: "12 mai"   },
  { icon: "↑", iBg: "#D6E4D6", iC: "#1F5C3E", sym: "CW8",    desc: "2 parts (versement auto)",amount: "−1 024,60 €",date: "1 mai"    },
  { icon: "€", iBg: "#D6E4D6", iC: "#1F5C3E", sym: "TTE.PA", desc: "8 × 0,79 €",             amount: "+6,32 €",    date: "26 avril" },
];

const DIVIDENDS = [
  { sym: "OR.PA",  name: "L'Oréal S.A.",         amount: "+38,40 €", date: "18 juin"  },
  { sym: "MSFT",   name: "Microsoft Corporation", amount: "+10,08 €", date: "14 août"  },
  { sym: "AAPL",   name: "Apple Inc.",            amount: "+5,75 €",  date: "22 août"  },
];

/* ─── Performance chart (inline SVG) ────────────────── */
const PORT_CURVE = [25100, 25800, 26200, 25900, 27100, 27600, 28000, 27400, 28100, 28300, 28350, 28432];
const CAC_CURVE  = [25100, 25300, 25500, 25200, 25700, 25900, 26100, 25800, 26200, 26400, 26500, 26600];
const CHART_MONTHS = ["déc.", "janv.", "févr.", "mars", "avril", "mai"];
const TX_MARKERS   = [{ idx: 2, label: "+ CW8" }, { idx: 7, label: "+ MSFT" }];

function PerfChart() {
  const W = 800, H = 260, PL = 10, PR = 64, PT = 20, PB = 30;
  const cW = W - PL - PR, cH = H - PT - PB;
  const allV = [...PORT_CURVE, ...CAC_CURVE];
  const lo = Math.min(...allV) - 200, hi = Math.max(...allV) + 200, rng = hi - lo;
  const px = (i: number) => PL + (i / (PORT_CURVE.length - 1)) * cW;
  const py = (v: number) => PT + (1 - (v - lo) / rng) * cH;
  const portD = PORT_CURVE.map((v, i) => `${i === 0 ? "M" : "L"}${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(" ");
  const cacD  = CAC_CURVE.map((v, i)  => `${i === 0 ? "M" : "L"}${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(" ");
  const areaD = `${portD} L${px(PORT_CURVE.length-1).toFixed(1)},${(PT+cH).toFixed(1)} L${PL},${(PT+cH).toFixed(1)} Z`;
  const gridY = [29500, 28000, 26500, 25000];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 260 }}>
      <defs>
        <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#1F5C3E" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#1F5C3E" stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridY.map((v) => <line key={v} x1={PL} y1={py(v).toFixed(1)} x2={W-PR} y2={py(v).toFixed(1)} stroke="#D9D1BD" strokeWidth="1" strokeDasharray="2 4" />)}
      {gridY.map((v) => <text key={v} x={W-PR+6} y={(py(v)+4).toFixed(1)} fontFamily="var(--font-geist-mono,monospace)" fontSize="10" fill="#9C9583">{v.toLocaleString("fr-FR")} €</text>)}
      <path d={cacD}  stroke="#9C9583" strokeWidth="1.5" strokeDasharray="4 3" fill="none" />
      <path d={areaD} fill="url(#pg)" />
      <path d={portD} stroke="#1F5C3E" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx={px(PORT_CURVE.length-1).toFixed(1)} cy={py(PORT_CURVE[PORT_CURVE.length-1]).toFixed(1)} r="5"  fill="#1F5C3E" />
      <circle cx={px(PORT_CURVE.length-1).toFixed(1)} cy={py(PORT_CURVE[PORT_CURVE.length-1]).toFixed(1)} r="10" fill="#1F5C3E" fillOpacity="0.2" />
      {TX_MARKERS.map((t) => {
        const x = px(t.idx), y = py(PORT_CURVE[t.idx]);
        return (
          <g key={t.idx}>
            <line x1={x.toFixed(1)} y1={(y-14).toFixed(1)} x2={x.toFixed(1)} y2={(y+2).toFixed(1)} stroke="#C9A24E" strokeWidth="1" strokeDasharray="2 2" />
            <circle cx={x.toFixed(1)} cy={(y-14).toFixed(1)} r="3" fill="#C9A24E" />
            <text x={(x+6).toFixed(1)} y={(y-10).toFixed(1)} fontFamily="var(--font-geist-mono,monospace)" fontSize="9.5" fill="#C9A24E" fontWeight="600">{t.label}</text>
          </g>
        );
      })}
      {CHART_MONTHS.map((m, i) => {
        const xi = Math.round(i * (PORT_CURVE.length - 1) / (CHART_MONTHS.length - 1));
        return <text key={m} x={px(xi).toFixed(1)} y={(PT+cH+18).toFixed(1)} fontFamily="var(--font-geist-mono,monospace)" fontSize="10" fill="#9C9583" textAnchor="middle">{m}</text>;
      })}
    </svg>
  );
}

/* ─── Donut SVG ──────────────────────────────────────── */
function Donut() {
  const cx = 21, cy = 21, r = 16, circ = 2 * Math.PI * r;
  let off = 0;
  const segs = DONUT_SECTORS.map((s) => { const dash = (s.pct / 100) * circ; const seg = { ...s, dash, off }; off += dash; return seg; });
  return (
    <div style={{ position: "relative", width: 180, height: 180, flexShrink: 0 }}>
      <svg width="180" height="180" viewBox="0 0 42 42" style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--line)" strokeWidth="7" />
        {segs.map((s) => (
          <circle key={s.name} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth="7"
            strokeDasharray={`${s.dash.toFixed(2)} ${(circ-s.dash).toFixed(2)}`}
            strokeDashoffset={(-s.off).toFixed(2)} />
        ))}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", pointerEvents: "none" }}>
        <span style={{ fontFamily: "var(--font-instrument,serif)", fontSize: 14, color: "var(--ink)", lineHeight: 1.2 }}>28 432 €</span>
        <span style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 8, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>VALEUR</span>
      </div>
    </div>
  );
}

/* ─── Weight bar ─────────────────────────────────────── */
function WBar({ pct, color }: { pct: number; color: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 60, height: 5, borderRadius: 3, background: "var(--line)", overflow: "hidden", display: "inline-block" }}>
        <span style={{ display: "block", height: "100%", width: `${pct}%`, background: color, borderRadius: 3 }} />
      </span>
      <span style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 12, color: "var(--muted)" }}>{pct} %</span>
    </span>
  );
}

/* ─── Page ───────────────────────────────────────────── */
export default function PortfolioPage() {
  const [chartRange, setChartRange] = useState("6M");
  const [holdSort,   setHoldSort]   = useState<"val" | "pl" | "pct">("val");
  const [donutMode,  setDonutMode]  = useState<"Secteur" | "Actif" | "Zone">("Secteur");

  const RANGES = ["1J", "1S", "1M", "6M", "1A", "Tout"];
  const fmt    = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n);

  const sorted = [...HOLDINGS].sort((a, b) => {
    if (holdSort === "pl")  return b.plEur - a.plEur;
    if (holdSort === "pct") return b.pct - a.pct;
    return b.val - a.val;
  });

  return (
    <>
      <div style={{ background: "var(--paper-3)", minHeight: "100vh" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 28px 80px" }}>

          {/* Page header */}
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 11, color: "var(--muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>RENTLY / MON PORTEFEUILLE</p>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
              <div>
                <h1 style={{ fontFamily: "var(--font-instrument,serif)", fontSize: "clamp(40px,4.4vw,56px)", fontWeight: 400, color: "var(--ink)", lineHeight: 1.05, marginBottom: 8 }}>Mon portefeuille.</h1>
                <p style={{ fontSize: 14, color: "var(--muted)" }}>Profil Équilibré · {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} · {HOLDINGS.length} lignes</p>
              </div>
              <div style={{ display: "flex", gap: 10, flexShrink: 0, paddingTop: 8 }}>
                <button style={{ padding: "9px 16px", borderRadius: 9999, border: "1.5px solid var(--line)", background: "var(--paper)", color: "var(--ink)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Rapport mensuel</button>
                <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 9999, border: "none", background: "#1F5C3E", color: "#F6F2E8", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  <span style={{ fontSize: 16, lineHeight: 1 }}>＋</span> Ajouter une transaction
                </button>
              </div>
            </div>
          </div>

          {/* Hero KPI strip */}
          <div style={{ background: "var(--paper)", border: "1.5px solid var(--line)", borderRadius: 18, display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", marginBottom: 28, overflow: "hidden" }}>
            <div style={{ background: "linear-gradient(180deg,#EAF0EA,#F4F1E8)", padding: "28px", borderRight: "1px solid var(--line)" }}>
              <p style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 11, color: "#2F7D52", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>VALEUR TOTALE</p>
              <p style={{ fontFamily: "var(--font-instrument,serif)", fontSize: 52, fontWeight: 400, color: "#1F5C3E", lineHeight: 1, marginBottom: 10 }}>{fmt(TOTAL)}</p>
              <p style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 12, color: "#2F7D52" }}>▲ +124,18 € · +0,44 % aujourd'hui</p>
            </div>
            {[
              { lab: "GAIN TOTAL",       val: "+3 432 €", meta: "+13,7 % depuis l'ouverture", vc: "#1F5C3E" },
              { lab: "ANNUALISÉ",        val: "+9,2 %",   meta: "vs CAC 40 · +6,8 %",         vc: "#1F5C3E" },
              { lab: "DIVIDENDES (12 m)",val: "412 €",    meta: "prochain : 18 juin · OR.PA",  vc: "var(--ink)" },
            ].map((k, i, arr) => (
              <div key={i} style={{ padding: "28px 22px", borderRight: i < arr.length - 1 ? "1px solid var(--line)" : "none" }}>
                <p style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{k.lab}</p>
                <p style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 34, fontWeight: 700, color: k.vc, lineHeight: 1.1 }}>{k.val}</p>
                <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>{k.meta}</p>
              </div>
            ))}
          </div>

          {/* Main layout 1.6fr 1fr */}
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20, alignItems: "start" }}>

            {/* Left */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Performance */}
              <div style={{ background: "var(--paper)", border: "1.5px solid var(--line)", borderRadius: 18, padding: "22px 22px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>Performance</h2>
                    <span style={{ padding: "3px 10px", borderRadius: 9999, background: "#D6E4D6", color: "#1F5C3E", fontSize: 12, fontWeight: 600 }}>▲ +9,2 % annualisé</span>
                  </div>
                  <div style={{ display: "flex", gap: 2, background: "var(--paper-2)", borderRadius: 9999, padding: 3 }}>
                    {RANGES.map((r) => (
                      <button key={r} onClick={() => setChartRange(r)} style={{ padding: "5px 10px", borderRadius: 9999, border: "none", cursor: "pointer", fontSize: 12, fontFamily: "var(--font-geist-mono,monospace)", fontWeight: 600, background: chartRange === r ? "var(--paper)" : "transparent", color: chartRange === r ? "var(--ink)" : "var(--muted)", transition: "all 0.15s" }}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <PerfChart />
                <div style={{ display: "flex", alignItems: "center", gap: 20, paddingTop: 12, borderTop: "1px dashed var(--line)", marginTop: 8 }}>
                  <LegendItem color="#1F5C3E" dashed={false} label="Mon portefeuille" />
                  <LegendItem color="#9C9583" dashed label="CAC 40 (référence)" />
                  <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#C9A24E", display: "inline-block" }} />
                    Transaction
                  </span>
                </div>
              </div>

              {/* Holdings */}
              <div style={{ background: "var(--paper)", border: "1.5px solid var(--line)", borderRadius: 18, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1.5px solid var(--line)" }}>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>Lignes du portefeuille ({HOLDINGS.length} positions)</h2>
                  <div style={{ display: "flex", gap: 2, background: "var(--paper-2)", borderRadius: 9999, padding: 3 }}>
                    {([["val","Valeur"],["pl","P&L"],["pct","Poids"]] as const).map(([s, lbl]) => (
                      <button key={s} onClick={() => setHoldSort(s as typeof holdSort)} style={{ padding: "5px 12px", borderRadius: 9999, border: "none", cursor: "pointer", fontSize: 12, fontFamily: "var(--font-geist-mono,monospace)", fontWeight: 600, background: holdSort === s ? "var(--paper)" : "transparent", color: holdSort === s ? "var(--ink)" : "var(--muted)", transition: "all 0.15s" }}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--line)" }}>
                      {["Action","Qté","Prix moy.","Cours","Valeur","Poids","P&L",""].map((h, i) => (
                        <th key={i} style={{ textAlign: i === 0 ? "left" : "right", padding: "10px 16px", fontFamily: "var(--font-geist-mono,monospace)", fontSize: 11, color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((h, i) => (
                      <tr key={h.sym} style={{ borderBottom: i < sorted.length - 1 ? "1px solid var(--line)" : "none", transition: "background 0.12s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.5)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 7, background: h.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <span style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 10, fontWeight: 700, color: "#fff" }}>{h.lg}</span>
                            </div>
                            <div>
                              <p style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{h.sym}</p>
                              <p style={{ fontSize: 11, color: "var(--muted)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: "right", padding: "14px 16px", fontFamily: "var(--font-geist-mono,monospace)", fontSize: 13, color: "var(--muted)" }}>{h.qty}</td>
                        <td style={{ textAlign: "right", padding: "14px 16px", fontFamily: "var(--font-geist-mono,monospace)", fontSize: 13, color: "var(--muted)" }}>{h.avg.toLocaleString("fr-FR")} €</td>
                        <td style={{ textAlign: "right", padding: "14px 16px", fontFamily: "var(--font-geist-mono,monospace)", fontSize: 13, color: "var(--ink)", fontWeight: 600 }}>{h.cur.toLocaleString("fr-FR")} €</td>
                        <td style={{ textAlign: "right", padding: "14px 16px", fontFamily: "var(--font-geist-mono,monospace)", fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{fmt(h.val)}</td>
                        <td style={{ textAlign: "right", padding: "14px 16px" }}>
                          <WBar pct={h.pct} color={DONUT_SECTORS.find((s) => s.name === h.sector)?.color ?? "#1F5C3E"} />
                        </td>
                        <td style={{ textAlign: "right", padding: "14px 16px" }}>
                          <p style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 12, fontWeight: 600, color: "#2F7D52", whiteSpace: "nowrap" }}>+{fmt(h.plEur)}</p>
                          <p style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 11, color: "#2F7D52" }}>+{h.plPct} %</p>
                        </td>
                        <td style={{ textAlign: "right", padding: "14px 16px" }}>
                          <Link href={`/stock/${h.sym}`} style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-geist-mono,monospace)" }}>Analyser →</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Donut */}
              <div style={{ background: "var(--paper)", border: "1.5px solid var(--line)", borderRadius: 18, padding: 22 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>Répartition</h2>
                  <div style={{ display: "flex", gap: 2, background: "var(--paper-2)", borderRadius: 9999, padding: 3 }}>
                    {(["Secteur","Actif","Zone"] as const).map((m) => (
                      <button key={m} onClick={() => setDonutMode(m)} style={{ padding: "4px 10px", borderRadius: 9999, border: "none", cursor: "pointer", fontSize: 11, fontFamily: "var(--font-geist-mono,monospace)", fontWeight: 600, background: donutMode === m ? "var(--paper)" : "transparent", color: donutMode === m ? "var(--ink)" : "var(--muted)", transition: "all 0.15s" }}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                  <Donut />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                    {DONUT_SECTORS.map((s) => (
                      <div key={s.name} style={{ display: "grid", gridTemplateColumns: "12px 1fr auto", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 12, height: 12, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: "var(--ink)" }}>{s.name}</span>
                        <span style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 12, color: "var(--muted)" }}>{s.pct} %</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Activité */}
              <div style={{ background: "var(--paper)", border: "1.5px solid var(--line)", borderRadius: 18, padding: 22 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>Activité récente</h2>
                  <Link href="#" style={{ fontSize: 12, color: "var(--muted)" }}>Tout voir →</Link>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {ACTIVITY.map((a, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: a.iBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: a.iC, fontSize: 14, fontWeight: 700 }}>{a.icon}</div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{a.sym} <span style={{ fontWeight: 400, color: "var(--muted)", fontSize: 12 }}>— {a.desc}</span></p>
                        <p style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 11, color: "var(--muted)" }}>{a.date}</p>
                      </div>
                      <span style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 13, fontWeight: 600, color: a.amount.startsWith("+") ? "#1F5C3E" : "var(--ink)", flexShrink: 0 }}>{a.amount}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dividendes */}
              <div style={{ background: "linear-gradient(180deg,#F0E4C3,#F6F2E8)", border: "1.5px solid rgba(201,162,78,0.25)", borderRadius: 18, padding: 22 }}>
                <p style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 11, color: "#7A5A1F", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Prochains dividendes</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {DIVIDENDS.map((d, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{d.sym} <span style={{ fontWeight: 400, color: "var(--muted)", fontSize: 12 }}>— {d.name}</span></p>
                        <p style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 11, color: "#7A5A1F" }}>{d.date}</p>
                      </div>
                      <span style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 13, fontWeight: 700, color: "#C9A24E" }}>{d.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Rebalance banner */}
          <div style={{ position: "relative", overflow: "hidden", background: "linear-gradient(135deg,#1F5C3E,#14201A)", borderRadius: 18, padding: "24px 28px", display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 24, marginTop: 28 }}>
            <div style={{ position: "absolute", bottom: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,rgba(47,125,82,0.35) 0%,transparent 70%)", pointerEvents: "none" }} />
            <div>
              <p style={{ fontFamily: "var(--font-instrument,serif)", fontSize: 28, color: "#F6F2E8", lineHeight: 1.2, marginBottom: 8 }}>
                Ton portefeuille a légèrement <em style={{ color: "#86B89A" }}>dévié.</em>
              </p>
              <p style={{ fontSize: 14, color: "#C7C1AF", lineHeight: 1.55, maxWidth: 560 }}>
                La part Tech a progressé à 31,5 % (objectif 28 %). Un léger rééquilibrage maintient ton profil de risque cible.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
              <button style={{ padding: "10px 18px", borderRadius: 9999, border: "1.5px solid rgba(246,242,232,0.35)", background: "rgba(246,242,232,0.12)", color: "#F6F2E8", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Voir les suggestions</button>
              <button style={{ padding: "10px 18px", borderRadius: 9999, border: "1.5px solid rgba(246,242,232,0.2)", background: "transparent", color: "rgba(246,242,232,0.55)", fontSize: 13, cursor: "pointer" }}>Plus tard</button>
            </div>
          </div>

          {/* Insights */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginTop: 28 }}>
            {[
              { iBg: "#D6E4D6", iC: "#1F5C3E", icon: "✦", lab: "Force du portefeuille",    h: "Bien diversifié.",             p: "5 secteurs, 2 zones géographiques. Score de diversification 78/100." },
              { iBg: "#F0E4C3", iC: "#C9A24E", icon: "⚠", lab: "Point d'attention",        h: "Faible exposition obligataire.",p: "3,6 % vs 15 % cible — les obligations amortissent les baisses de marché." },
              { iBg: "#EBD7D2", iC: "#B84A3E", icon: "⤴", lab: "Risque mesuré",            h: "Volatilité élevée.",            p: "±15 % attendus sur 12 mois — dans la norme d'un profil équilibré." },
            ].map((ins, i) => (
              <div key={i} style={{ background: "var(--paper)", border: "1.5px solid var(--line)", borderRadius: 16, padding: 22 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: ins.iBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, fontSize: 16, color: ins.iC }}>{ins.icon}</div>
                <p style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{ins.lab}</p>
                <h3 style={{ fontFamily: "var(--font-instrument,serif)", fontSize: 20, fontWeight: 400, color: "var(--ink)", marginBottom: 8 }}>{ins.h}</h3>
                <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.55 }}>{ins.p}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
      <Footer />
    </>
  );
}

function LegendItem({ color, dashed, label }: { color: string; dashed: boolean; label: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)" }}>
      {dashed
        ? <span style={{ width: 14, height: 0, border: `1px dashed ${color}`, display: "inline-block" }} />
        : <span style={{ width: 14, height: 3, background: color, borderRadius: 2, display: "inline-block" }} />
      }
      {label}
    </span>
  );
}
