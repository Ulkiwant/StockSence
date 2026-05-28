"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import { SearchModal } from "@/components/SearchModal";

/* ─── Types ─────────────────────────────────────────── */
type Dir = "up" | "dn" | "flat";
type Sig = "buy-strong" | "buy" | "neutral" | "watch" | "sell";

interface Row {
  sym: string; name: string; lg: string; bg: string;
  px: string;
  d1: string; d1d: Dir; d7: string; d7d: Dir; d30: string; d30d: Dir;
  sig: Sig; sigT: string; note: number; fav: 0 | 1;
  spk: number[];
}

/* ─── Demo data (design handoff spec) ───────────────── */
const DEMO: Row[] = [
  { sym: "NVDA",  name: "NVIDIA Corporation",                   lg: "NV", bg: "#1F5C3E", px: "875,40 $", d1: "+3,15 %", d1d: "up", d7: "+8,20 %",  d7d: "up", d30: "+18,40 %", d30d: "up", sig: "buy-strong", sigT: "Achat fort",    note: 92, fav: 1, spk: [720,735,750,760,748,780,810,830,855,840,862,875] },
  { sym: "MSFT",  name: "Microsoft Corporation",                lg: "MS", bg: "#0F4C75", px: "412,50 $", d1: "+1,80 %", d1d: "up", d7: "+3,50 %",  d7d: "up", d30:  "+9,20 %", d30d: "up", sig: "buy-strong", sigT: "Achat fort",    note: 91, fav: 1, spk: [365,370,380,375,390,388,395,400,405,408,410,412] },
  { sym: "GOOGL", name: "Alphabet Inc. (Classe A)",             lg: "GO", bg: "#1A5276", px: "178,30 $", d1: "+1,45 %", d1d: "up", d7: "+2,80 %",  d7d: "up", d30:  "+7,60 %", d30d: "up", sig: "buy",        sigT: "Achat",         note: 87, fav: 0, spk: [155,158,162,160,168,170,172,169,174,176,177,178] },
  { sym: "AAPL",  name: "Apple Inc.",                           lg: "AP", bg: "#3D3D3D", px: "192,40 $", d1: "+0,90 %", d1d: "up", d7: "+1,20 %",  d7d: "up", d30:  "+5,80 %", d30d: "up", sig: "buy",        sigT: "Achat",         note: 88, fav: 1, spk: [175,178,177,180,182,184,186,185,188,190,191,192] },
  { sym: "AMZN",  name: "Amazon.com, Inc.",                    lg: "AM", bg: "#7D4E1C", px: "185,60 $", d1: "+2,10 %", d1d: "up", d7: "+4,30 %",  d7d: "up", d30: "+11,20 %", d30d: "up", sig: "buy",        sigT: "Achat",         note: 86, fav: 0, spk: [155,158,160,165,162,168,170,175,178,180,183,186] },
  { sym: "OR.PA", name: "L'Oréal S.A.",                        lg: "LO", bg: "#6C3483", px: "412,30 €", d1: "+0,60 %", d1d: "up", d7: "+1,10 %",  d7d: "up", d30:  "+3,40 %", d30d: "up", sig: "buy",        sigT: "Achat",         note: 85, fav: 0, spk: [395,398,396,400,402,404,403,406,408,410,411,412] },
  { sym: "AI.PA", name: "Air Liquide S.A.",                    lg: "AL", bg: "#1A4971", px: "162,50 €", d1: "+0,45 %", d1d: "up", d7: "+0,90 %",  d7d: "up", d30:  "+4,20 %", d30d: "up", sig: "buy",        sigT: "Achat",         note: 84, fav: 0, spk: [152,154,155,153,156,157,158,159,160,161,162,162] },
  { sym: "MC.PA", name: "LVMH Moët Hennessy Louis Vuitton",    lg: "LV", bg: "#7D6009", px: "768,10 €", d1: "+0,30 %", d1d: "up", d7: "-1,20 %",  d7d: "dn", d30:  "+2,10 %", d30d: "up", sig: "neutral",    sigT: "Neutre",        note: 78, fav: 0, spk: [745,750,758,760,755,762,758,764,766,768,767,768] },
  { sym:"TTE.PA", name: "TotalEnergies SE",                    lg: "TE", bg: "#4A235A", px:  "60,42 €", d1: "-0,80 %", d1d: "dn", d7: "-2,10 %",  d7d: "dn", d30:  "-3,60 %", d30d: "dn", sig: "neutral",    sigT: "Neutre",        note: 76, fav: 0, spk: [64,63,62,63,61,62,61,60,61,60,61,60] },
  { sym:"SAN.PA", name: "Sanofi S.A.",                         lg: "SA", bg: "#6E2C00", px:  "95,18 €", d1: "-1,40 %", d1d: "dn", d7: "-3,80 %",  d7d: "dn", d30:  "-5,20 %", d30d: "dn", sig: "watch",      sigT: "À surveiller",  note: 70, fav: 0, spk: [102,100,98,99,97,96,97,96,95,96,95,95] },
  { sym: "TSLA",  name: "Tesla, Inc.",                          lg: "TS", bg: "#922B21", px: "178,40 $", d1: "+1,20 %", d1d: "up", d7: "-4,50 %",  d7d: "dn", d30:  "-8,30 %", d30d: "dn", sig: "watch",      sigT: "À surveiller",  note: 64, fav: 0, spk: [200,195,188,192,185,180,182,178,175,176,177,178] },
  { sym:"BNP.PA", name: "BNP Paribas S.A.",                    lg: "BN", bg: "#512E5F", px:  "62,38 €", d1: "-2,30 %", d1d: "dn", d7: "-5,10 %",  d7d: "dn", d30:  "-7,80 %", d30d: "dn", sig: "sell",       sigT: "Surévalué",     note: 56, fav: 0, spk: [70,68,67,66,65,64,63,63,64,63,62,62] },
];

const SUGGESTIONS = [
  { sym: "SCHN.PA", name: "Schneider Electric SE",         lg: "SE", bg: "#1E5C2D", sig: "buy"        as Sig, sigT: "Achat",      px: "226,45 €", why: "Leader mondial en gestion d'énergie et automatisation industrielle." },
  { sym: "ASML",    name: "ASML Holding N.V.",             lg: "AS", bg: "#1A2F5A", sig: "buy-strong" as Sig, sigT: "Achat fort", px: "848,20 €", why: "Monopole mondial sur les machines EUV — indispensables pour toutes les puces modernes." },
  { sym: "RMS.PA",  name: "Hermès International S.A.",    lg: "HE", bg: "#8B4513", sig: "buy"        as Sig, sigT: "Achat",      px: "2 178 €",  why: "Luxe absolu avec des marges records — portefeuille de marques introuvables ailleurs." },
];

/* ─── Signal styles ──────────────────────────────────── */
const SBADGE: Record<Sig, { bg: string; color: string; dot: string }> = {
  "buy-strong": { bg: "#1F5C3E",  color: "#F6F2E8", dot: "#F6F2E8" },
  "buy":        { bg: "#D6E4D6",  color: "#1F5C3E", dot: "#1F5C3E" },
  "neutral":    { bg: "#E8E0CE",  color: "#3A3E33", dot: "#7A7768" },
  "watch":      { bg: "#F0E4C3",  color: "#7A5A1F", dot: "#C9A24E" },
  "sell":       { bg: "#EBD7D2",  color: "#B84A3E", dot: "#B84A3E" },
};

/* ─── Tiny components ────────────────────────────────── */
function Sparkline({ pts, dir }: { pts: number[]; dir: Dir }) {
  const c = dir === "up" ? "#2F7D52" : dir === "dn" ? "#B84A3E" : "#7A7768";
  const W = 80, H = 28, P = 2;
  const lo = Math.min(...pts), hi = Math.max(...pts), rng = hi - lo || 1;
  const xs = pts.map((_, i) => P + (i / (pts.length - 1)) * (W - P * 2));
  const ys = pts.map((v) => P + (1 - (v - lo) / rng) * (H - P * 2));
  const d = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const lx = xs[pts.length - 1], ly = ys[pts.length - 1];
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
      <path d={d} stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx.toFixed(1)} cy={ly.toFixed(1)} r="2" fill={c} />
    </svg>
  );
}

function Badge({ sig, label }: { sig: Sig; label: string }) {
  const s = SBADGE[sig];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, fontFamily: "var(--font-geist-mono,monospace)", whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {label}
    </span>
  );
}

function Score({ n }: { n: number }) {
  const c = n >= 80 ? "#1F5C3E" : n >= 60 ? "#C9A24E" : "#B84A3E";
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 1 }}>
      <span style={{ fontFamily: "var(--font-instrument,serif)", fontSize: 22, color: c, lineHeight: 1 }}>{n}</span>
      <span style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 10, color: "var(--muted)" }}>/100</span>
    </span>
  );
}

function SortTh({ label, active, asc, onClick }: { label: string; active: boolean; asc: boolean; onClick: () => void }) {
  return (
    <th onClick={onClick} style={{ textAlign: "right", padding: "10px 12px", fontFamily: "var(--font-geist-mono,monospace)", fontSize: 11, color: active ? "var(--ink)" : "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>
      {label}{active ? (asc ? " ↑" : " ↓") : ""}
    </th>
  );
}

function Delta({ val, dir }: { val: string; dir: Dir }) {
  const c = dir === "up" ? "#2F7D52" : dir === "dn" ? "#B84A3E" : "var(--muted)";
  return <span style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 13, fontWeight: 600, color: c, whiteSpace: "nowrap" }}>{dir === "up" ? "▲ " : dir === "dn" ? "▼ " : ""}{val}</span>;
}

/* ─── Page ───────────────────────────────────────────── */
export default function WatchlistPage() {
  const [tab, setTab]       = useState<"all" | "buy-strong" | "watch" | "sell">("all");
  const [search, setSearch] = useState("");
  const [col, setCol]       = useState<"d1" | "d7" | "d30" | "note">("d1");
  const [asc, setAsc]       = useState(false);
  const [favs, setFavs]     = useState<Set<string>>(new Set(DEMO.filter((r) => r.fav).map((r) => r.sym)));
  const [searchOpen, setSearchOpen] = useState(false);

  const num = (s: string) => parseFloat(s.replace(",", ".").replace(/[^0-9.-]/g, ""));

  const rows = useMemo(() => {
    let r = [...DEMO];
    if (tab === "buy-strong") r = r.filter((x) => x.sig === "buy-strong");
    else if (tab === "watch") r = r.filter((x) => x.sig === "watch");
    else if (tab === "sell")  r = r.filter((x) => x.sig === "sell");
    if (search) { const q = search.toLowerCase(); r = r.filter((x) => x.sym.toLowerCase().includes(q) || x.name.toLowerCase().includes(q)); }
    r.sort((a, b) => { const av = col === "note" ? a.note : num(a[col]); const bv = col === "note" ? b.note : num(b[col]); return asc ? av - bv : bv - av; });
    return r;
  }, [tab, search, col, asc]);

  const handleSort = (c: typeof col) => { if (col === c) setAsc((a) => !a); else { setCol(c); setAsc(false); } };

  const upRows   = DEMO.filter((r) => r.d1d === "up");
  const bestRow  = DEMO.reduce((b, r) => (num(r.d1) > num(b.d1) ? r : b));
  const changed  = DEMO.filter((r) => r.sig === "watch" || r.sig === "sell").slice(0, 2);
  const avgUp    = upRows.reduce((s, r) => s + num(r.d1), 0) / (upRows.length || 1);

  const TABS = [
    { id: "all",        label: `Tous (${DEMO.length})` },
    { id: "buy-strong", label: `Achat fort (${DEMO.filter((r) => r.sig === "buy-strong").length})` },
    { id: "watch",      label: `À surveiller (${DEMO.filter((r) => r.sig === "watch").length})` },
    { id: "sell",       label: `Surévalués (${DEMO.filter((r) => r.sig === "sell").length})` },
  ];

  return (
    <>
      <div style={{ background: "var(--paper-3)", minHeight: "100vh" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 28px 80px" }}>

          {/* Page header */}
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 11, color: "var(--muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
              RENTLY / MES ACTIONS
            </p>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
              <div>
                <h1 style={{ fontFamily: "var(--font-instrument,serif)", fontSize: "clamp(40px,4.4vw,56px)", fontWeight: 400, color: "var(--ink)", lineHeight: 1.05, marginBottom: 8 }}>
                  Mes actions.
                </h1>
                <p style={{ fontSize: 14, color: "var(--muted)" }}>
                  {DEMO.length} valeurs suivies · signaux et variations en direct
                </p>
              </div>
              <div style={{ display: "flex", gap: 10, flexShrink: 0, paddingTop: 8 }}>
                <button style={{ padding: "9px 16px", borderRadius: 9999, border: "1.5px solid var(--line)", background: "var(--paper)", color: "var(--ink)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Exporter
                </button>
                <button
                  onClick={() => setSearchOpen(true)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 9999, border: "none", background: "#1F5C3E", color: "#F6F2E8", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  <span style={{ fontSize: 16, lineHeight: 1 }}>＋</span>
                  Ajouter une action
                </button>
              </div>
            </div>
          </div>

          {/* KPI strip */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 28 }}>
            {[
              { lab: "En hausse aujourd'hui", val: `${upRows.length} / ${DEMO.length}`, valColor: "#1F5C3E", meta: `+${avgUp.toFixed(2).replace(".", ",")} % en moyenne` },
              { lab: "Plus forte hausse",     val: bestRow.sym, valColor: "var(--ink)",  meta: `▲ ${bestRow.d1} · ${bestRow.px}`, metaColor: "#1F5C3E" },
              { lab: "Signaux changés",       val: "2 cette semaine", valColor: "#C9A24E", meta: changed.map((r) => r.sym).join(" · ") },
              { lab: "Performance 30 j",      val: "+4,2 %", valColor: "#1F5C3E",        meta: "vs CAC 40 (indice phare français) · +1,8 %" },
            ].map((k, i) => (
              <div key={i} style={{ background: "var(--paper)", border: "1.5px solid var(--line)", borderRadius: 14, padding: "16px 18px" }}>
                <p style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{k.lab}</p>
                <p style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: i === 0 ? 24 : 20, fontWeight: 700, color: k.valColor, lineHeight: 1.1 }}>{k.val}</p>
                <p style={{ fontSize: 11, color: (k as { metaColor?: string }).metaColor ?? "var(--muted)", marginTop: 4, fontFamily: "var(--font-geist-mono,monospace)" }}>{k.meta}</p>
              </div>
            ))}
          </div>

          {/* Main grid: table | side panels */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>

            {/* Left */}
            <div>
              {/* Toolbar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 3, background: "var(--paper-2)", borderRadius: 9999, padding: 3 }}>
                  {TABS.map((t) => (
                    <button key={t.id} onClick={() => setTab(t.id as typeof tab)} style={{ padding: "6px 14px", borderRadius: 9999, border: "none", cursor: "pointer", fontSize: 12, fontFamily: "var(--font-geist-mono,monospace)", fontWeight: 600, background: tab === t.id ? "var(--paper)" : "transparent", color: tab === t.id ? "var(--ink)" : "var(--muted)", boxShadow: tab === t.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none", transition: "all 0.15s" }}>
                      {t.label}
                    </button>
                  ))}
                </div>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filtrer dans la watchlist…" style={{ padding: "7px 14px", borderRadius: 9999, border: "1.5px solid var(--line)", background: "var(--paper)", color: "var(--ink)", fontSize: 13, outline: "none", minWidth: 200, flex: "0 1 240px" }} />
              </div>

              {/* Table */}
              <div style={{ overflowX: "auto", borderRadius: 14, border: "1.5px solid var(--line)", background: "var(--paper)" }}>
                <table style={{ width: "100%", minWidth: 920, borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "1.5px solid var(--line)" }}>
                      <th style={{ width: 36, padding: "10px 8px 10px 14px" }} />
                      <th style={{ textAlign: "left", padding: "10px 12px", fontFamily: "var(--font-geist-mono,monospace)", fontSize: 11, color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Action</th>
                      <th style={{ textAlign: "right", padding: "10px 12px", fontFamily: "var(--font-geist-mono,monospace)", fontSize: 11, color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Prix</th>
                      <SortTh label="1 J"  active={col === "d1"}   asc={asc} onClick={() => handleSort("d1")} />
                      <SortTh label="7 J"  active={col === "d7"}   asc={asc} onClick={() => handleSort("d7")} />
                      <SortTh label="30 J" active={col === "d30"}  asc={asc} onClick={() => handleSort("d30")} />
                      <th style={{ textAlign: "center", padding: "10px 12px", fontFamily: "var(--font-geist-mono,monospace)", fontSize: 11, color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Tendance</th>
                      <th style={{ textAlign: "center", padding: "10px 12px", fontFamily: "var(--font-geist-mono,monospace)", fontSize: 11, color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Signal IA</th>
                      <SortTh label="Note" active={col === "note"} asc={asc} onClick={() => handleSort("note")} />
                      <th style={{ width: 44 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={r.sym} style={{ borderBottom: i < rows.length - 1 ? "1px solid var(--line)" : "none", transition: "background 0.12s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.6)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        {/* Star */}
                        <td style={{ padding: "12px 8px 12px 14px" }}>
                          <button onClick={() => setFavs((prev) => { const n = new Set(prev); n.has(r.sym) ? n.delete(r.sym) : n.add(r.sym); return n; })} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1 }} aria-label="Favori">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill={favs.has(r.sym) ? "#C9A24E" : "none"} stroke={favs.has(r.sym) ? "#C9A24E" : "#C9C0A8"} strokeWidth="1.8">
                              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                            </svg>
                          </button>
                        </td>
                        {/* Company */}
                        <td style={{ padding: "12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 8, background: r.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <span style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 11, fontWeight: 700, color: "#fff" }}>{r.lg}</span>
                            </div>
                            <div>
                              <p style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 13, fontWeight: 600, color: "var(--ink)", lineHeight: 1.2 }}>{r.sym}</p>
                              <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.2, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</p>
                            </div>
                          </div>
                        </td>
                        {/* Price */}
                        <td style={{ textAlign: "right", padding: "12px", fontFamily: "var(--font-geist-mono,monospace)", fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{r.px}</td>
                        {/* Deltas */}
                        <td style={{ textAlign: "right", padding: "12px" }}><Delta val={r.d1}  dir={r.d1d}  /></td>
                        <td style={{ textAlign: "right", padding: "12px" }}><Delta val={r.d7}  dir={r.d7d}  /></td>
                        <td style={{ textAlign: "right", padding: "12px" }}><Delta val={r.d30} dir={r.d30d} /></td>
                        {/* Sparkline */}
                        <td style={{ textAlign: "center", padding: "12px 8px" }}><Sparkline pts={r.spk} dir={r.d30d} /></td>
                        {/* Signal */}
                        <td style={{ textAlign: "center", padding: "12px 8px" }}><Badge sig={r.sig} label={r.sigT} /></td>
                        {/* Note */}
                        <td style={{ textAlign: "right", padding: "12px 14px 12px 12px" }}><Score n={r.note} /></td>
                        {/* Link */}
                        <td style={{ padding: "12px 14px 12px 4px", textAlign: "center" }}>
                          <Link href={`/stock/${r.sym}`} style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 18, color: "var(--muted)", lineHeight: 1 }} aria-label="Voir l'analyse">⋯</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Pager */}
                <div style={{ padding: "10px 16px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-geist-mono,monospace)" }}>
                    {rows.length} actions · trié par variation 1J {asc ? "croissante" : "décroissante"}
                  </p>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid var(--line)", background: "#1F5C3E", color: "#F6F2E8", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-geist-mono,monospace)", fontWeight: 600 }}>1</button>
                    <button style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid var(--line)", background: "var(--paper)", color: "var(--muted)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-geist-mono,monospace)" }}>2</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: side panels */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Alertes */}
              <div style={{ background: "var(--paper)", border: "1.5px solid var(--line)", borderRadius: 14, padding: 18 }}>
                <p style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Alertes</p>
                {[
                  { icon: "↑", iBg: "#D6E4D6", iC: "#1F5C3E", title: "NVDA : objectif atteint",     desc: 'Signal IA passé à "Achat fort"',        time: "Il y a 2 h" },
                  { icon: "⚠", iBg: "#F0E4C3", iC: "#C9A24E", title: "SAN.PA : signal dégradé",    desc: 'Passage de "Achat" à "À surveiller"',   time: "Il y a 5 h" },
                  { icon: "↓", iBg: "#EBD7D2", iC: "#B84A3E", title: "BNP.PA : seuil de baisse",   desc: "−7,8 % sur 30 jours — analyser",        time: "Il y a 1 j" },
                ].map((a, i, arr) => (
                  <div key={i} style={{ display: "flex", gap: 10, paddingBottom: i < arr.length - 1 ? 12 : 0, marginBottom: i < arr.length - 1 ? 12 : 0, borderBottom: i < arr.length - 1 ? "1px dashed var(--line)" : "none" }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: a.iBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: a.iC, fontSize: 14, fontWeight: 700 }}>{a.icon}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", lineHeight: 1.3, marginBottom: 2 }}>{a.title}</p>
                      <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.3, marginBottom: 4 }}>{a.desc}</p>
                      <p style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 11, color: "var(--muted)" }}>{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Marchés du jour */}
              <div style={{ background: "var(--paper)", border: "1.5px solid var(--line)", borderRadius: 14, padding: 18 }}>
                <p style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Marchés du jour</p>
                {[
                  { lab: "CAC 40",    desc: "40 plus grandes entreprises françaises",       v: "▲ 8 124,32", p: "+0,42 %", up: true  },
                  { lab: "S&P 500",   desc: "500 plus grandes entreprises américaines",     v: "▲ 5 287,10", p: "+0,68 %", up: true  },
                  { lab: "Nasdaq",    desc: "Indice tech US — Apple, Microsoft, Nvidia…",   v: "▲ 16 920,45",p: "+1,12 %", up: true  },
                  { lab: "EUR / USD", desc: "Taux de change euro contre dollar",            v: "▼ 1,0824",   p: "−0,18 %", up: false },
                  { lab: "OAT 10 ans",desc: "Taux de la dette française à 10 ans",          v: "3,12 %",     p: "",        up: true  },
                ].map((m, i, arr) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: i < arr.length - 1 ? 10 : 0, marginBottom: i < arr.length - 1 ? 10 : 0, borderBottom: i < arr.length - 1 ? "1px solid var(--line)" : "none" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{m.lab}</span>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>{m.desc}</span>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 8 }}>
                      <p style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 12, fontWeight: 600, color: m.up ? "#1F5C3E" : "#B84A3E", whiteSpace: "nowrap" }}>{m.v}</p>
                      {m.p && <p style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 11, color: m.up ? "#1F5C3E" : "#B84A3E" }}>{m.p}</p>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Astuce */}
              <div style={{ background: "linear-gradient(180deg,#E9F0E5,#F2F4E8)", border: "1.5px solid rgba(47,125,82,0.25)", borderRadius: 14, padding: 18 }}>
                <p style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 11, color: "#1F5C3E", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>● BON À SAVOIR</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#1F5C3E", marginBottom: 8 }}>Comprends les signaux IA.</p>
                <p style={{ fontSize: 13, color: "#3A5C3A", lineHeight: 1.55, marginBottom: 12 }}>
                  Le signal <strong>"Achat fort"</strong> signifie que le modèle estime l'action sous-évaluée de plus de 15 % par rapport à sa valeur intrinsèque — un point d'entrée potentiel, pas une garantie.
                </p>
                <Link href="/glossaire" style={{ fontSize: 13, fontWeight: 600, color: "#1F5C3E", textDecoration: "none" }}>Comprendre les signaux →</Link>
              </div>
            </div>
          </div>

          {/* Suggestions */}
          <div style={{ marginTop: 56 }}>
            <h2 style={{ fontFamily: "var(--font-instrument,serif)", fontSize: 28, fontWeight: 400, color: "var(--ink)", marginBottom: 6 }}>Tu pourrais aussi suivre</h2>
            <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 24 }}>Sélectionnées selon ton profil et tes positions actuelles.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
              {SUGGESTIONS.map((s) => (
                <div key={s.sym}
                  style={{ background: "var(--paper)", border: "1.5px solid var(--line)", borderRadius: 14, padding: 16, cursor: "pointer", transition: "all 0.15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "#C9C0A8"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "var(--line)"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 11, fontWeight: 700, color: "#fff" }}>{s.lg}</span>
                      </div>
                      <div>
                        <p style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>{s.sym}</p>
                        <p style={{ fontSize: 11, color: "var(--muted)" }}>{s.name}</p>
                      </div>
                    </div>
                    <Badge sig={s.sig} label={s.sigT} />
                  </div>
                  <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.45, marginBottom: 12 }}>{s.why}</p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px dashed var(--line)" }}>
                    <span style={{ fontFamily: "var(--font-geist-mono,monospace)", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{s.px}</span>
                    <button style={{ padding: "5px 12px", borderRadius: 9999, border: "none", background: "var(--ink)", color: "#F6F2E8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>＋ Suivre</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
      <Footer />

      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        watchlistSymbols={DEMO.map((r) => r.sym)}
        onFollow={async () => {}}
        onUnfollow={async () => {}}
      />
    </>
  );
}
