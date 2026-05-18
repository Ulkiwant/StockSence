"use client";
import { useEffect, useRef } from "react";

// ── Each decoration element ──────────────────────────────────────────────────
interface Deco {
  id: string;
  side: "left" | "right";
  top: number;
  speed: number;
  group: number; // which section group it belongs to
}

// ── Per-group visibility windows (scroll px) ─────────────────────────────────
// opacity: 0 → 1 over [fadeIn_start, fadeIn_end], then 1 → 0 over [fadeOut_start, fadeOut_end]
const GROUPS: Record<number, { fi0: number; fi1: number; fo0: number; fo1: number }> = {
  1: { fi0: 0,    fi1: 0,    fo0: 400,  fo1: 900  }, // Hero — visible from start, fades out
  2: { fi0: 500,  fi1: 900,  fo0: 1800, fo1: 2300 }, // Stats / Features
  3: { fi0: 1800, fi1: 2200, fo0: 3200, fo1: 3700 }, // How it works / Trending
  4: { fi0: 3100, fi1: 3500, fo0: 5000, fo1: 5600 }, // Pricing / CTA
};

function groupOpacity(group: number, y: number): number {
  const g = GROUPS[group];
  if (!g) return 0;
  if (y <= g.fi0) return group === 1 ? 1 : 0; // group 1 starts fully visible
  if (y <= g.fi1) return (y - g.fi0) / (g.fi1 - g.fi0);
  if (y <= g.fo0) return 1;
  if (y <= g.fo1) return 1 - (y - g.fo0) / (g.fo1 - g.fo0);
  return 0;
}

const DECOS: Deco[] = [
  // Group 1 — Hero: dots triangle + curves + concentric circles
  { id: "g1_L1", side: "left",  top: 30,   speed: 0.09, group: 1 },
  { id: "g1_L2", side: "left",  top: 200,  speed: 0.14, group: 1 },
  { id: "g1_L3", side: "left",  top: 520,  speed: 0.07, group: 1 },
  { id: "g1_R1", side: "right", top: 60,   speed: 0.08, group: 1 },
  { id: "g1_R2", side: "right", top: 220,  speed: 0.13, group: 1 },
  { id: "g1_R3", side: "right", top: 440,  speed: 0.09, group: 1 },

  // Group 2 — Stats/Features: horizontal data bars + plus signs
  { id: "g2_L1", side: "left",  top: 80,   speed: 0.05, group: 2 },
  { id: "g2_L2", side: "left",  top: 320,  speed: 0.08, group: 2 },
  { id: "g2_R1", side: "right", top: 120,  speed: 0.06, group: 2 },
  { id: "g2_R2", side: "right", top: 380,  speed: 0.09, group: 2 },

  // Group 3 — How it works/Trending: diagonal ticks + circle rings
  { id: "g3_L1", side: "left",  top: 100,  speed: 0.07, group: 3 },
  { id: "g3_L2", side: "left",  top: 360,  speed: 0.10, group: 3 },
  { id: "g3_R1", side: "right", top: 80,   speed: 0.06, group: 3 },
  { id: "g3_R2", side: "right", top: 340,  speed: 0.11, group: 3 },

  // Group 4 — Pricing/CTA: corner brackets + radial lines
  { id: "g4_L1", side: "left",  top: 60,   speed: 0.06, group: 4 },
  { id: "g4_L2", side: "left",  top: 300,  speed: 0.09, group: 4 },
  { id: "g4_R1", side: "right", top: 100,  speed: 0.07, group: 4 },
  { id: "g4_R2", side: "right", top: 320,  speed: 0.08, group: 4 },
];

// ── SVG renderers per group ───────────────────────────────────────────────────

function renderDeco(id: string): React.ReactNode {
  // Group 1 — Hero
  if (id === "g1_L1") return (
    <svg width="80" height="180" viewBox="0 0 80 180" fill="none">
      <g fill="#86efac">
        {[[8,10,.26],[24,10,.20],[40,10,.14],[56,10,.09],[72,10,.05],
          [8,26,.26],[24,26,.20],[40,26,.14],[56,26,.09],
          [8,42,.24],[24,42,.18],[40,42,.12],
          [8,58,.22],[24,58,.16],
          [8,74,.18],[24,74,.12],
          [8,90,.14],[8,106,.10],[8,122,.07],[8,138,.05],
        ].map(([cx,cy,op],i) => <circle key={i} cx={cx} cy={cy} r="1.4" opacity={op}/>)}
      </g>
    </svg>
  );
  if (id === "g1_L2") return (
    <svg width="68" height="110" viewBox="0 0 68 110" fill="none">
      <defs>
        <linearGradient id="cL1" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#86efac" stopOpacity="0.20"/>
          <stop offset="100%" stopColor="#86efac" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polyline points="0,106 12,88 24,74 32,80 44,56 56,34 68,10"
        stroke="url(#cL1)" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (id === "g1_L3") return (
    <svg width="110" height="110" viewBox="0 0 110 110" fill="none">
      <circle cx="55" cy="55" r="48" stroke="#86efac" strokeWidth="1" strokeOpacity="0.14" fill="none"/>
      <circle cx="55" cy="55" r="34" stroke="#86efac" strokeWidth="0.5" strokeOpacity="0.07" fill="none"/>
    </svg>
  );
  if (id === "g1_R1") return (
    <svg width="60" height="200" viewBox="0 0 60 200" fill="none">
      <defs>
        <linearGradient id="gR1" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#86efac" stopOpacity="0.13"/>
          <stop offset="100%" stopColor="#86efac" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[20,40,60,80,100,120,140,160,180].map(y => (
        <line key={y} x1="0" y1={y} x2="60" y2={y} stroke="url(#gR1)" strokeWidth="0.5"/>
      ))}
    </svg>
  );
  if (id === "g1_R2") return (
    <svg width="68" height="110" viewBox="0 0 68 110" fill="none">
      <defs>
        <linearGradient id="cR1" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#86efac" stopOpacity="0.18"/>
          <stop offset="100%" stopColor="#86efac" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polyline points="68,106 56,88 44,74 36,80 24,56 12,34 0,10"
        stroke="url(#cR1)" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (id === "g1_R3") return (
    <svg width="80" height="160" viewBox="0 0 80 160" fill="none">
      <g fill="#86efac">
        {[[72,10,.24],[56,10,.18],[40,10,.12],[24,10,.07],[8,10,.04],
          [72,26,.22],[56,26,.16],[40,26,.10],[24,26,.06],
          [72,42,.20],[56,42,.13],[40,42,.07],
          [72,58,.16],[56,58,.10],
          [72,74,.12],[56,74,.07],
          [72,90,.09],[72,106,.06],[72,122,.04],
        ].map(([cx,cy,op],i) => <circle key={i} cx={cx} cy={cy} r="1.4" opacity={op}/>)}
      </g>
    </svg>
  );

  // Group 2 — Stats/Features: horizontal data bars + plus signs
  if (id === "g2_L1") return (
    <svg width="72" height="200" viewBox="0 0 72 200" fill="none">
      <defs>
        <linearGradient id="barL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#86efac" stopOpacity="0.22"/>
          <stop offset="100%" stopColor="#86efac" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {/* Horizontal bars of varying lengths — like a mini bar chart */}
      {[[0,20,52],[0,44,38],[0,68,60],[0,92,42],[0,116,55],[0,140,30],[0,164,48],[0,188,36]].map(([x,y,w],i) => (
        <rect key={i} x={x} y={y} width={w} height="2.5" rx="1.2" fill="url(#barL)" opacity={0.7 - i*0.06}/>
      ))}
      {/* small + signs */}
      {[[58,35],[64,85],[60,135]].map(([cx,cy],i) => (
        <g key={i} stroke="#86efac" strokeWidth="0.7" strokeOpacity="0.20" strokeLinecap="round">
          <line x1={cx-4} y1={cy} x2={cx+4} y2={cy}/>
          <line x1={cx} y1={cy-4} x2={cx} y2={cy+4}/>
        </g>
      ))}
    </svg>
  );
  if (id === "g2_L2") return (
    <svg width="56" height="120" viewBox="0 0 56 120" fill="none">
      <defs>
        <linearGradient id="barL2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#86efac" stopOpacity="0.16"/>
          <stop offset="100%" stopColor="#86efac" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[[0,15,40],[0,35,28],[0,55,50],[0,75,32],[0,95,44]].map(([x,y,w],i) => (
        <rect key={i} x={x} y={y} width={w} height="2" rx="1" fill="url(#barL2)" opacity={0.65 - i*0.07}/>
      ))}
    </svg>
  );
  if (id === "g2_R1") return (
    <svg width="72" height="200" viewBox="0 0 72 200" fill="none">
      <defs>
        <linearGradient id="barR1" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#86efac" stopOpacity="0.20"/>
          <stop offset="100%" stopColor="#86efac" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[[20,18,52],[34,42,38],[12,66,58],[28,90,40],[18,114,52],[32,138,34],[14,162,46]].map(([x,y,w],i) => (
        <rect key={i} x={x} y={y} width={w} height="2.5" rx="1.2" fill="url(#barR1)" opacity={0.68 - i*0.06}/>
      ))}
      {[[8,55],[12,110],[6,165]].map(([cx,cy],i) => (
        <g key={i} stroke="#86efac" strokeWidth="0.7" strokeOpacity="0.18" strokeLinecap="round">
          <line x1={cx-4} y1={cy} x2={cx+4} y2={cy}/>
          <line x1={cx} y1={cy-4} x2={cx} y2={cy+4}/>
        </g>
      ))}
    </svg>
  );
  if (id === "g2_R2") return (
    <svg width="56" height="120" viewBox="0 0 56 120" fill="none">
      <defs>
        <linearGradient id="barR2" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#86efac" stopOpacity="0.15"/>
          <stop offset="100%" stopColor="#86efac" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[[16,14,40],[28,34,30],[10,54,48],[22,74,28],[14,94,42]].map(([x,y,w],i) => (
        <rect key={i} x={x} y={y} width={w} height="2" rx="1" fill="url(#barR2)" opacity={0.62 - i*0.07}/>
      ))}
    </svg>
  );

  // Group 3 — How it works/Trending: diagonal ticks + open circles
  if (id === "g3_L1") return (
    <svg width="80" height="220" viewBox="0 0 80 220" fill="none">
      <defs>
        <linearGradient id="diagL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#86efac" stopOpacity="0.18"/>
          <stop offset="100%" stopColor="#86efac" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {/* diagonal tick marks */}
      {[[4,30],[4,60],[4,90],[4,120],[4,150],[4,180],[4,210]].map(([x,y],i) => (
        <line key={i} x1={x} y1={y} x2={x+18} y2={y-12}
          stroke="url(#diagL)" strokeWidth="1.2" strokeLinecap="round" opacity={0.8 - i*0.08}/>
      ))}
      {/* open circles */}
      <circle cx="52" cy="60" r="6" stroke="#86efac" strokeWidth="0.8" strokeOpacity="0.14" fill="none"/>
      <circle cx="60" cy="140" r="10" stroke="#86efac" strokeWidth="0.6" strokeOpacity="0.09" fill="none"/>
      <circle cx="48" cy="200" r="4" stroke="#86efac" strokeWidth="0.8" strokeOpacity="0.12" fill="none"/>
    </svg>
  );
  if (id === "g3_L2") return (
    <svg width="64" height="130" viewBox="0 0 64 130" fill="none">
      {/* dot grid scattered */}
      <g fill="#86efac">
        {[[8,16,.18],[24,16,.13],[40,16,.08],
          [8,40,.16],[24,40,.11],
          [8,64,.14],[24,64,.09],
          [8,88,.11],[8,112,.08],
          [40,56,.10],[56,80,.07],
        ].map(([cx,cy,op],i) => <circle key={i} cx={cx} cy={cy} r="1.5" opacity={op}/>)}
      </g>
    </svg>
  );
  if (id === "g3_R1") return (
    <svg width="80" height="220" viewBox="0 0 80 220" fill="none">
      <defs>
        <linearGradient id="diagR" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#86efac" stopOpacity="0.18"/>
          <stop offset="100%" stopColor="#86efac" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[[76,30],[76,60],[76,90],[76,120],[76,150],[76,180],[76,210]].map(([x,y],i) => (
        <line key={i} x1={x} y1={y} x2={x-18} y2={y-12}
          stroke="url(#diagR)" strokeWidth="1.2" strokeLinecap="round" opacity={0.8 - i*0.08}/>
      ))}
      <circle cx="28" cy="70" r="7" stroke="#86efac" strokeWidth="0.8" strokeOpacity="0.13" fill="none"/>
      <circle cx="20" cy="150" r="11" stroke="#86efac" strokeWidth="0.6" strokeOpacity="0.08" fill="none"/>
      <circle cx="32" cy="205" r="4.5" stroke="#86efac" strokeWidth="0.8" strokeOpacity="0.11" fill="none"/>
    </svg>
  );
  if (id === "g3_R2") return (
    <svg width="64" height="130" viewBox="0 0 64 130" fill="none">
      <g fill="#86efac">
        {[[56,16,.17],[40,16,.12],[24,16,.08],
          [56,40,.15],[40,40,.10],
          [56,64,.13],[40,64,.08],
          [56,88,.10],[56,112,.07],
          [24,56,.09],[8,80,.06],
        ].map(([cx,cy,op],i) => <circle key={i} cx={cx} cy={cy} r="1.5" opacity={op}/>)}
      </g>
    </svg>
  );

  // Group 4 — Pricing/CTA: corner brackets + radial lines
  if (id === "g4_L1") return (
    <svg width="80" height="180" viewBox="0 0 80 180" fill="none">
      <defs>
        <linearGradient id="brktL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#86efac" stopOpacity="0.22"/>
          <stop offset="100%" stopColor="#86efac" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {/* Corner brackets */}
      {[[8,12],[8,70],[8,128]].map(([x,y],i) => (
        <g key={i} stroke="url(#brktL)" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity={0.9 - i*0.15}>
          <polyline points={`${x},${y+14} ${x},${y} ${x+14},${y}`}/>
          <polyline points={`${x+34},${y} ${x+48},${y} ${x+48},${y+14}`}/>
          <polyline points={`${x},${y+30} ${x},${y+44} ${x+14},${y+44}`}/>
          <polyline points={`${x+34},${y+44} ${x+48},${y+44} ${x+48},${y+30}`}/>
        </g>
      ))}
    </svg>
  );
  if (id === "g4_L2") return (
    <svg width="60" height="120" viewBox="0 0 60 120" fill="none">
      {/* Radial short lines emanating from a point */}
      {[0,30,60,90,120,150,210,240,270,300,330].map((deg,i) => {
        const r0 = 18, r1 = 26;
        const a = (deg * Math.PI) / 180;
        const x1 = 30 + r0 * Math.cos(a), y1 = 60 + r0 * Math.sin(a);
        const x2 = 30 + r1 * Math.cos(a), y2 = 60 + r1 * Math.sin(a);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#86efac" strokeWidth="0.9" strokeOpacity={0.12 + i*0.005} strokeLinecap="round"/>;
      })}
      <circle cx="30" cy="60" r="3" fill="#86efac" fillOpacity="0.08"/>
    </svg>
  );
  if (id === "g4_R1") return (
    <svg width="80" height="180" viewBox="0 0 80 180" fill="none">
      <defs>
        <linearGradient id="brktR" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#86efac" stopOpacity="0.22"/>
          <stop offset="100%" stopColor="#86efac" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[[24,12],[24,70],[24,128]].map(([x,y],i) => (
        <g key={i} stroke="url(#brktR)" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity={0.9 - i*0.15}>
          <polyline points={`${x},${y+14} ${x},${y} ${x+14},${y}`}/>
          <polyline points={`${x+34},${y} ${x+48},${y} ${x+48},${y+14}`}/>
          <polyline points={`${x},${y+30} ${x},${y+44} ${x+14},${y+44}`}/>
          <polyline points={`${x+34},${y+44} ${x+48},${y+44} ${x+48},${y+30}`}/>
        </g>
      ))}
    </svg>
  );
  if (id === "g4_R2") return (
    <svg width="60" height="120" viewBox="0 0 60 120" fill="none">
      {[0,30,60,90,120,150,210,240,270,300,330].map((deg,i) => {
        const r0 = 18, r1 = 26;
        const a = (deg * Math.PI) / 180;
        const x1 = 30 + r0 * Math.cos(a), y1 = 60 + r0 * Math.sin(a);
        const x2 = 30 + r1 * Math.cos(a), y2 = 60 + r1 * Math.sin(a);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#86efac" strokeWidth="0.9" strokeOpacity={0.12 + i*0.005} strokeLinecap="round"/>;
      })}
      <circle cx="30" cy="60" r="3" fill="#86efac" fillOpacity="0.08"/>
    </svg>
  );

  return null;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function ScrollDecorations() {
  const wrapperRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const posRefs    = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;

      // Per-group opacity
      const opacities: Record<number, number> = {};
      for (const g of [1,2,3,4]) opacities[g] = groupOpacity(g, y);

      DECOS.forEach((d) => {
        const wrapper = wrapperRefs.current[d.id];
        const posEl   = posRefs.current[d.id];
        if (wrapper) wrapper.style.opacity = String(opacities[d.group]);
        if (posEl)   posEl.style.transform = `translateY(${-y * d.speed}px)`;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // Run once to set initial state
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden
      style={{ pointerEvents: "none", position: "fixed", inset: 0, overflow: "hidden", zIndex: 0 }}
    >
      {DECOS.map((d) => (
        <div
          key={d.id}
          ref={(el) => { wrapperRefs.current[d.id] = el; }}
          style={{
            position: "absolute",
            [d.side]: d.side === "left" ? 0 : 0,
            top: d.top,
            opacity: 1,
            transition: "opacity 0.4s ease",
          }}
        >
          <div ref={(el) => { posRefs.current[d.id] = el; }}>
            {renderDeco(d.id)}
          </div>
        </div>
      ))}
    </div>
  );
}
