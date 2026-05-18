"use client";
import { useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Les décorations sont en position: fixed → leur `top` est RELATIF AU VIEWPORT.
// Pour qu'elles couvrent toute la hauteur de l'écran, on les répartit entre
// ~5 % et ~85 % de la hauteur du viewport sur les deux côtés.
//
// Chaque groupe est lié à une plage de scroll (document px) :
//   fi0→fi1  : fade-in    fo0→fo1 : fade-out
// ─────────────────────────────────────────────────────────────────────────────

interface Deco {
  id: string;
  side: "left" | "right";
  /** Position en vh (0–100) relative au viewport */
  topVh: number;
  speed: number;
  group: number;
}

const GROUPS: Record<number, { fi0: number; fi1: number; fo0: number; fo1: number }> = {
  //              fade-in           fade-out
  1: { fi0: 0,    fi1: 0,    fo0: 350,  fo1: 820  }, // Hero
  2: { fi0: 450,  fi1: 850,  fo0: 2000, fo1: 2500 }, // Stats / Features
  3: { fi0: 1900, fi1: 2300, fo0: 3400, fo1: 3900 }, // How it works / Trending
  4: { fi0: 3200, fi1: 3600, fo0: 5200, fo1: 5800 }, // Pricing / CTA
};

function groupOpacity(g: number, y: number): number {
  const gr = GROUPS[g];
  if (!gr) return 0;
  // Group 1 starts fully visible (no fade-in)
  if (g === 1 && y <= gr.fo0) return 1;
  if (y < gr.fi0) return 0;
  if (y <= gr.fi1) return (y - gr.fi0) / Math.max(1, gr.fi1 - gr.fi0);
  if (y <= gr.fo0) return 1;
  if (y <= gr.fo1) return 1 - (y - gr.fo0) / Math.max(1, gr.fo1 - gr.fo0);
  return 0;
}

// topVh = position en % de la hauteur du viewport (5 = près du haut, 80 = près du bas)
const DECOS: Deco[] = [
  // ── Groupe 1 · Hero ─────────────────────────────────────────
  { id: "g1_L1", side: "left",  topVh:  5,  speed: 0.08, group: 1 },
  { id: "g1_L2", side: "left",  topVh: 32,  speed: 0.13, group: 1 },
  { id: "g1_L3", side: "left",  topVh: 62,  speed: 0.06, group: 1 },
  { id: "g1_R1", side: "right", topVh:  8,  speed: 0.07, group: 1 },
  { id: "g1_R2", side: "right", topVh: 38,  speed: 0.12, group: 1 },
  { id: "g1_R3", side: "right", topVh: 66,  speed: 0.09, group: 1 },

  // ── Groupe 2 · Stats / Features ─────────────────────────────
  { id: "g2_L1", side: "left",  topVh: 10,  speed: 0.05, group: 2 },
  { id: "g2_L2", side: "left",  topVh: 55,  speed: 0.08, group: 2 },
  { id: "g2_R1", side: "right", topVh: 18,  speed: 0.06, group: 2 },
  { id: "g2_R2", side: "right", topVh: 62,  speed: 0.09, group: 2 },

  // ── Groupe 3 · How it works / Trending ──────────────────────
  { id: "g3_L1", side: "left",  topVh: 15,  speed: 0.07, group: 3 },
  { id: "g3_L2", side: "left",  topVh: 58,  speed: 0.10, group: 3 },
  { id: "g3_R1", side: "right", topVh: 10,  speed: 0.06, group: 3 },
  { id: "g3_R2", side: "right", topVh: 55,  speed: 0.11, group: 3 },

  // ── Groupe 4 · Pricing / CTA ────────────────────────────────
  { id: "g4_L1", side: "left",  topVh: 12,  speed: 0.06, group: 4 },
  { id: "g4_L2", side: "left",  topVh: 52,  speed: 0.09, group: 4 },
  { id: "g4_R1", side: "right", topVh: 20,  speed: 0.07, group: 4 },
  { id: "g4_R2", side: "right", topVh: 58,  speed: 0.08, group: 4 },
];

// ─────────────────────────────────────────────────────────────────────────────
// SVG renderers
// ─────────────────────────────────────────────────────────────────────────────
function renderDeco(id: string): React.ReactNode {
  // ── Groupe 1 — Hero : dots, courbes, concentriques ────────────────────────
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
    <svg width="68" height="120" viewBox="0 0 68 120" fill="none">
      <defs>
        <linearGradient id="cL1" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#86efac" stopOpacity="0.22"/>
          <stop offset="100%" stopColor="#86efac" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polyline points="0,116 12,96 24,80 32,88 44,62 56,38 68,10"
        stroke="url(#cL1)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (id === "g1_L3") return (
    <svg width="110" height="110" viewBox="0 0 110 110" fill="none">
      <circle cx="55" cy="55" r="48" stroke="#86efac" strokeWidth="1" strokeOpacity="0.14" fill="none"/>
      <circle cx="55" cy="55" r="34" stroke="#86efac" strokeWidth="0.6" strokeOpacity="0.07" fill="none"/>
      <circle cx="55" cy="55" r="20" stroke="#86efac" strokeWidth="0.4" strokeOpacity="0.05" fill="none"/>
    </svg>
  );
  if (id === "g1_R1") return (
    <svg width="60" height="200" viewBox="0 0 60 200" fill="none">
      <defs>
        <linearGradient id="gR1a" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#86efac" stopOpacity="0.14"/>
          <stop offset="100%" stopColor="#86efac" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[20,40,60,80,100,120,140,160,180].map(y => (
        <line key={y} x1="0" y1={y} x2="60" y2={y} stroke="url(#gR1a)" strokeWidth="0.6"/>
      ))}
    </svg>
  );
  if (id === "g1_R2") return (
    <svg width="68" height="120" viewBox="0 0 68 120" fill="none">
      <defs>
        <linearGradient id="cR1a" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#86efac" stopOpacity="0.20"/>
          <stop offset="100%" stopColor="#86efac" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polyline points="68,116 56,96 44,80 36,88 24,62 12,38 0,10"
        stroke="url(#cR1a)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (id === "g1_R3") return (
    <svg width="80" height="160" viewBox="0 0 80 160" fill="none">
      <g fill="#86efac">
        {[[72,10,.24],[56,10,.18],[40,10,.12],[24,10,.07],[8,10,.04],
          [72,26,.22],[56,26,.16],[40,26,.10],[24,26,.06],
          [72,42,.20],[56,42,.13],[40,42,.07],
          [72,58,.16],[56,58,.10],
          [72,74,.13],[56,74,.07],
          [72,90,.09],[72,106,.06],[72,122,.04],
        ].map(([cx,cy,op],i) => <circle key={i} cx={cx} cy={cy} r="1.4" opacity={op}/>)}
      </g>
    </svg>
  );

  // ── Groupe 2 — Stats/Features : barres horizontales + signes + ────────────
  if (id === "g2_L1") return (
    <svg width="72" height="210" viewBox="0 0 72 210" fill="none">
      <defs>
        <linearGradient id="barL1a" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#86efac" stopOpacity="0.24"/>
          <stop offset="100%" stopColor="#86efac" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[[0,18,52],[0,42,36],[0,66,60],[0,90,40],[0,114,54],[0,138,28],[0,162,46],[0,186,34]].map(([x,y,w],i) => (
        <rect key={i} x={x} y={y} width={w} height="2.5" rx="1.2" fill="url(#barL1a)" opacity={0.75 - i*0.06}/>
      ))}
      {[[58,32],[64,82],[60,140],[55,192]].map(([cx,cy],i) => (
        <g key={i} stroke="#86efac" strokeWidth="0.8" strokeOpacity="0.22" strokeLinecap="round">
          <line x1={cx-5} y1={cy} x2={cx+5} y2={cy}/><line x1={cx} y1={cy-5} x2={cx} y2={cy+5}/>
        </g>
      ))}
    </svg>
  );
  if (id === "g2_L2") return (
    <svg width="56" height="140" viewBox="0 0 56 140" fill="none">
      <defs>
        <linearGradient id="barL2a" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#86efac" stopOpacity="0.18"/>
          <stop offset="100%" stopColor="#86efac" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[[0,15,40],[0,38,28],[0,61,50],[0,84,32],[0,107,44],[0,128,22]].map(([x,y,w],i) => (
        <rect key={i} x={x} y={y} width={w} height="2" rx="1" fill="url(#barL2a)" opacity={0.70 - i*0.08}/>
      ))}
    </svg>
  );
  if (id === "g2_R1") return (
    <svg width="72" height="210" viewBox="0 0 72 210" fill="none">
      <defs>
        <linearGradient id="barR1a" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#86efac" stopOpacity="0.22"/>
          <stop offset="100%" stopColor="#86efac" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[[20,22,52],[34,46,36],[10,70,58],[26,94,38],[16,118,52],[30,142,30],[12,166,44]].map(([x,y,w],i) => (
        <rect key={i} x={x} y={y} width={w} height="2.5" rx="1.2" fill="url(#barR1a)" opacity={0.72 - i*0.06}/>
      ))}
      {[[8,55],[12,120],[6,175]].map(([cx,cy],i) => (
        <g key={i} stroke="#86efac" strokeWidth="0.8" strokeOpacity="0.20" strokeLinecap="round">
          <line x1={cx-5} y1={cy} x2={cx+5} y2={cy}/><line x1={cx} y1={cy-5} x2={cx} y2={cy+5}/>
        </g>
      ))}
    </svg>
  );
  if (id === "g2_R2") return (
    <svg width="56" height="140" viewBox="0 0 56 140" fill="none">
      <defs>
        <linearGradient id="barR2a" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#86efac" stopOpacity="0.16"/>
          <stop offset="100%" stopColor="#86efac" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[[16,14,40],[28,37,28],[8,60,48],[20,83,26],[12,106,40],[24,127,20]].map(([x,y,w],i) => (
        <rect key={i} x={x} y={y} width={w} height="2" rx="1" fill="url(#barR2a)" opacity={0.68 - i*0.08}/>
      ))}
    </svg>
  );

  // ── Groupe 3 — How it works : ticks diagonaux + anneaux + grille dots ─────
  if (id === "g3_L1") return (
    <svg width="80" height="240" viewBox="0 0 80 240" fill="none">
      <defs>
        <linearGradient id="diagL3" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#86efac" stopOpacity="0.20"/>
          <stop offset="100%" stopColor="#86efac" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[20,52,84,116,148,180,212].map((y,i) => (
        <line key={i} x1={4} y1={y} x2={22} y2={y-14}
          stroke="url(#diagL3)" strokeWidth="1.3" strokeLinecap="round" opacity={0.85 - i*0.08}/>
      ))}
      <circle cx="52" cy="60" r="7" stroke="#86efac" strokeWidth="0.8" strokeOpacity="0.13" fill="none"/>
      <circle cx="60" cy="150" r="12" stroke="#86efac" strokeWidth="0.6" strokeOpacity="0.08" fill="none"/>
      <circle cx="46" cy="220" r="5" stroke="#86efac" strokeWidth="0.8" strokeOpacity="0.11" fill="none"/>
    </svg>
  );
  if (id === "g3_L2") return (
    <svg width="64" height="140" viewBox="0 0 64 140" fill="none">
      <g fill="#86efac">
        {[[8,16,.18],[24,16,.13],[40,16,.08],
          [8,40,.16],[24,40,.11],[40,40,.06],
          [8,64,.14],[24,64,.09],
          [8,88,.11],[24,88,.07],
          [8,112,.08],[8,136,.05],
          [40,72,.08],[56,96,.06],
        ].map(([cx,cy,op],i) => <circle key={i} cx={cx} cy={cy} r="1.5" opacity={op}/>)}
      </g>
    </svg>
  );
  if (id === "g3_R1") return (
    <svg width="80" height="240" viewBox="0 0 80 240" fill="none">
      <defs>
        <linearGradient id="diagR3" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#86efac" stopOpacity="0.20"/>
          <stop offset="100%" stopColor="#86efac" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[20,52,84,116,148,180,212].map((y,i) => (
        <line key={i} x1={76} y1={y} x2={58} y2={y-14}
          stroke="url(#diagR3)" strokeWidth="1.3" strokeLinecap="round" opacity={0.85 - i*0.08}/>
      ))}
      <circle cx="28" cy="72" r="8" stroke="#86efac" strokeWidth="0.8" strokeOpacity="0.12" fill="none"/>
      <circle cx="20" cy="160" r="13" stroke="#86efac" strokeWidth="0.6" strokeOpacity="0.07" fill="none"/>
      <circle cx="34" cy="218" r="5" stroke="#86efac" strokeWidth="0.8" strokeOpacity="0.10" fill="none"/>
    </svg>
  );
  if (id === "g3_R2") return (
    <svg width="64" height="140" viewBox="0 0 64 140" fill="none">
      <g fill="#86efac">
        {[[56,16,.17],[40,16,.12],[24,16,.08],
          [56,40,.15],[40,40,.10],[24,40,.06],
          [56,64,.13],[40,64,.08],
          [56,88,.10],[40,88,.06],
          [56,112,.07],[56,136,.05],
          [24,72,.07],[8,96,.05],
        ].map(([cx,cy,op],i) => <circle key={i} cx={cx} cy={cy} r="1.5" opacity={op}/>)}
      </g>
    </svg>
  );

  // ── Groupe 4 — Pricing/CTA : brackets angulaires + étoiles radiales ───────
  if (id === "g4_L1") return (
    <svg width="80" height="200" viewBox="0 0 80 200" fill="none">
      <defs>
        <linearGradient id="brktL4" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#86efac" stopOpacity="0.24"/>
          <stop offset="100%" stopColor="#86efac" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[[6,10],[6,78],[6,146]].map(([x,y],i) => (
        <g key={i} stroke="url(#brktL4)" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity={0.95-i*0.18}>
          <polyline points={`${x},${y+16} ${x},${y} ${x+16},${y}`}/>
          <polyline points={`${x+36},${y} ${x+52},${y} ${x+52},${y+16}`}/>
          <polyline points={`${x},${y+34} ${x},${y+50} ${x+16},${y+50}`}/>
          <polyline points={`${x+36},${y+50} ${x+52},${y+50} ${x+52},${y+34}`}/>
        </g>
      ))}
    </svg>
  );
  if (id === "g4_L2") return (
    <svg width="70" height="130" viewBox="0 0 70 130" fill="none">
      {/* Radial lines — two clusters */}
      {[0,45,90,135,180,225,270,315].map((deg,i) => {
        const r0 = 14, r1 = 22, a = (deg * Math.PI) / 180;
        const x1 = 35 + r0*Math.cos(a), y1 = 35 + r0*Math.sin(a);
        const x2 = 35 + r1*Math.cos(a), y2 = 35 + r1*Math.sin(a);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#86efac" strokeWidth="1" strokeOpacity={0.16} strokeLinecap="round"/>;
      })}
      <circle cx="35" cy="35" r="4" stroke="#86efac" strokeWidth="0.6" strokeOpacity="0.12" fill="none"/>
      {[0,60,120,180,240,300].map((deg,i) => {
        const r0 = 12, r1 = 19, a = (deg * Math.PI) / 180;
        const x1 = 35 + r0*Math.cos(a), y1 = 95 + r0*Math.sin(a);
        const x2 = 35 + r1*Math.cos(a), y2 = 95 + r1*Math.sin(a);
        return <line key={i+10} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#86efac" strokeWidth="0.9" strokeOpacity="0.12" strokeLinecap="round"/>;
      })}
    </svg>
  );
  if (id === "g4_R1") return (
    <svg width="80" height="200" viewBox="0 0 80 200" fill="none">
      <defs>
        <linearGradient id="brktR4" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#86efac" stopOpacity="0.24"/>
          <stop offset="100%" stopColor="#86efac" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[[22,10],[22,78],[22,146]].map(([x,y],i) => (
        <g key={i} stroke="url(#brktR4)" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity={0.95-i*0.18}>
          <polyline points={`${x},${y+16} ${x},${y} ${x+16},${y}`}/>
          <polyline points={`${x+36},${y} ${x+52},${y} ${x+52},${y+16}`}/>
          <polyline points={`${x},${y+34} ${x},${y+50} ${x+16},${y+50}`}/>
          <polyline points={`${x+36},${y+50} ${x+52},${y+50} ${x+52},${y+34}`}/>
        </g>
      ))}
    </svg>
  );
  if (id === "g4_R2") return (
    <svg width="70" height="130" viewBox="0 0 70 130" fill="none">
      {[0,45,90,135,180,225,270,315].map((deg,i) => {
        const r0 = 14, r1 = 22, a = (deg * Math.PI) / 180;
        const x1 = 35 + r0*Math.cos(a), y1 = 35 + r0*Math.sin(a);
        const x2 = 35 + r1*Math.cos(a), y2 = 35 + r1*Math.sin(a);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#86efac" strokeWidth="1" strokeOpacity={0.15} strokeLinecap="round"/>;
      })}
      <circle cx="35" cy="35" r="4" stroke="#86efac" strokeWidth="0.6" strokeOpacity="0.11" fill="none"/>
      {[0,60,120,180,240,300].map((deg,i) => {
        const r0 = 12, r1 = 19, a = (deg * Math.PI) / 180;
        const x1 = 35 + r0*Math.cos(a), y1 = 95 + r0*Math.sin(a);
        const x2 = 35 + r1*Math.cos(a), y2 = 95 + r1*Math.sin(a);
        return <line key={i+10} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#86efac" strokeWidth="0.9" strokeOpacity="0.11" strokeLinecap="round"/>;
      })}
    </svg>
  );

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ScrollDecorations() {
  const wrapperRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const posRefs     = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    // Convert topVh → px using current viewport height
    const vh = window.innerHeight / 100;

    const onScroll = () => {
      const y = window.scrollY;
      const ops: Record<number, number> = {};
      for (const g of [1,2,3,4]) ops[g] = groupOpacity(g, y);

      DECOS.forEach((d) => {
        const wrapper = wrapperRefs.current[d.id];
        const posEl   = posRefs.current[d.id];
        if (wrapper) wrapper.style.opacity = String(ops[d.group]);
        // Parallax: translate UP as page scrolls, starting from viewport position
        if (posEl) posEl.style.transform = `translateY(${-y * d.speed}px)`;
      });
    };

    // Set initial top positions based on vh
    DECOS.forEach((d) => {
      const wrapper = wrapperRefs.current[d.id];
      if (wrapper) wrapper.style.top = `${d.topVh * vh}px`;
    });

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // set initial opacity
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
            [d.side]: 0,
            top: 0, // overridden in useEffect with vh calculation
            opacity: d.group === 1 ? 1 : 0,
            transition: "opacity 0.45s ease",
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
