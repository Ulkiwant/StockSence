"use client";
import { useEffect, useRef } from "react";

const decos = [
  { id: "d1",  side: "left",  top: 30,   speed: 0.09 },
  { id: "d2",  side: "left",  top: 200,  speed: 0.14 },
  { id: "d3",  side: "left",  top: 520,  speed: 0.07 },
  { id: "d4",  side: "left",  top: 780,  speed: 0.10 },
  { id: "d5",  side: "left",  top: 1080, speed: 0.12 },
  { id: "d6",  side: "right", top: 60,   speed: 0.08 },
  { id: "d7",  side: "right", top: 220,  speed: 0.13 },
  { id: "d8",  side: "right", top: 440,  speed: 0.09 },
  { id: "d9",  side: "right", top: 820,  speed: 0.06 },
  { id: "d10", side: "right", top: 1060, speed: 0.11 },
];

// Fade starts at FADE_START px, fully invisible at FADE_END px
const FADE_START = 300;
const FADE_END   = 900;

export default function ScrollDecorations() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const refs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;

      // Parallax on each element
      decos.forEach((d) => {
        const el = refs.current[d.id];
        if (el) el.style.transform = `translateY(${-y * d.speed}px)`;
      });

      // Fade the whole container based on scroll position
      if (containerRef.current) {
        const opacity = y <= FADE_START
          ? 1
          : y >= FADE_END
          ? 0
          : 1 - (y - FADE_START) / (FADE_END - FADE_START);
        containerRef.current.style.opacity = String(opacity);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const setRef = (id: string) => (el: HTMLDivElement | null) => {
    refs.current[id] = el;
  };

  return (
    <div
      ref={containerRef}
      aria-hidden
      style={{
        pointerEvents: "none",
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        zIndex: 0,
        opacity: 1,
        transition: "opacity 0.15s linear",
      }}
    >
      {/* ── GAUCHE ── */}

      {/* Dots triangle haut gauche */}
      <div ref={setRef("d1")} style={{ position: "absolute", left: 8, top: 30 }}>
        <svg width="80" height="180" viewBox="0 0 80 180" fill="none">
          <g fill="#86efac">
            {[
              [8,10,.28],[24,10,.22],[40,10,.16],[56,10,.10],[72,10,.06],
              [8,26,.28],[24,26,.22],[40,26,.16],[56,26,.10],
              [8,42,.26],[24,42,.20],[40,42,.14],
              [8,58,.24],[24,58,.18],
              [8,74,.20],[24,74,.14],
              [8,90,.16],
              [8,106,.12],
              [8,122,.09],
              [8,138,.06],
            ].map(([cx, cy, op], i) => (
              <circle key={i} cx={cx} cy={cy} r="1.4" opacity={op} />
            ))}
          </g>
        </svg>
      </div>

      {/* Courbe montante gauche */}
      <div ref={setRef("d2")} style={{ position: "absolute", left: 0, top: 200 }}>
        <svg width="68" height="110" viewBox="0 0 68 110" fill="none">
          <defs>
            <linearGradient id="cL1" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#86efac" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#86efac" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline
            points="0,106 12,88 24,74 32,80 44,56 56,34 68,10"
            stroke="url(#cL1)" strokeWidth="1.4" fill="none"
            strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Cercles concentriques gauche */}
      <div ref={setRef("d3")} style={{ position: "absolute", left: -30, top: 520 }}>
        <svg width="110" height="110" viewBox="0 0 110 110" fill="none">
          <circle cx="55" cy="55" r="48" stroke="#86efac" strokeWidth="1" strokeOpacity="0.16" fill="none" />
          <circle cx="55" cy="55" r="36" stroke="#86efac" strokeWidth="0.5" strokeOpacity="0.08" fill="none" />
        </svg>
      </div>

      {/* Grille linéaire gauche */}
      <div ref={setRef("d4")} style={{ position: "absolute", left: 0, top: 780 }}>
        <svg width="60" height="160" viewBox="0 0 60 160" fill="none">
          <defs>
            <linearGradient id="gL2" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#86efac" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#86efac" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="gLV" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#86efac" stopOpacity="0.11" />
              <stop offset="100%" stopColor="#86efac" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[20,40,60,80,100,120,140].map((y) => (
            <line key={y} x1="0" y1={y} x2="60" y2={y} stroke="url(#gL2)" strokeWidth="0.5" />
          ))}
          {[15,30,45].map((x) => (
            <line key={x} x1={x} y1="0" x2={x} y2="160" stroke="url(#gLV)" strokeWidth="0.5" />
          ))}
        </svg>
      </div>

      {/* Dots bas gauche */}
      <div ref={setRef("d5")} style={{ position: "absolute", left: 8, top: 1080 }}>
        <svg width="64" height="100" viewBox="0 0 64 100" fill="none">
          <g fill="#86efac">
            {[
              [8,10,.20],[24,10,.14],[40,10,.09],
              [8,26,.18],[24,26,.12],
              [8,42,.14],
              [8,58,.10],
              [8,74,.07],
            ].map(([cx, cy, op], i) => (
              <circle key={i} cx={cx} cy={cy} r="1.4" opacity={op} />
            ))}
          </g>
        </svg>
      </div>

      {/* ── DROITE ── */}

      {/* Grille linéaire droite */}
      <div ref={setRef("d6")} style={{ position: "absolute", right: 0, top: 60 }}>
        <svg width="60" height="200" viewBox="0 0 60 200" fill="none">
          <defs>
            <linearGradient id="gR1" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="#86efac" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#86efac" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="gRV" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#86efac" stopOpacity="0.11" />
              <stop offset="100%" stopColor="#86efac" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[20,40,60,80,100,120,140,160,180].map((y) => (
            <line key={y} x1="0" y1={y} x2="60" y2={y} stroke="url(#gR1)" strokeWidth="0.5" />
          ))}
          {[15,30,45].map((x) => (
            <line key={x} x1={x} y1="0" x2={x} y2="200" stroke="url(#gRV)" strokeWidth="0.5" />
          ))}
        </svg>
      </div>

      {/* Courbe droite */}
      <div ref={setRef("d7")} style={{ position: "absolute", right: 0, top: 220 }}>
        <svg width="68" height="110" viewBox="0 0 68 110" fill="none">
          <defs>
            <linearGradient id="cR1" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="#86efac" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#86efac" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline
            points="68,106 56,88 44,74 36,80 24,56 12,34 0,10"
            stroke="url(#cR1)" strokeWidth="1.4" fill="none"
            strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Dots droite */}
      <div ref={setRef("d8")} style={{ position: "absolute", right: 8, top: 440 }}>
        <svg width="80" height="160" viewBox="0 0 80 160" fill="none">
          <g fill="#86efac">
            {[
              [72,10,.26],[56,10,.20],[40,10,.14],[24,10,.09],[8,10,.05],
              [72,26,.24],[56,26,.18],[40,26,.12],[24,26,.08],
              [72,42,.22],[56,42,.15],[40,42,.09],
              [72,58,.18],[56,58,.12],
              [72,74,.14],[56,74,.09],
              [72,90,.11],
              [72,106,.08],
              [72,122,.05],
            ].map(([cx, cy, op], i) => (
              <circle key={i} cx={cx} cy={cy} r="1.4" opacity={op} />
            ))}
          </g>
        </svg>
      </div>

      {/* Cercles concentriques droite */}
      <div ref={setRef("d9")} style={{ position: "absolute", right: -30, top: 820 }}>
        <svg width="110" height="110" viewBox="0 0 110 110" fill="none">
          <circle cx="55" cy="55" r="48" stroke="#86efac" strokeWidth="1" strokeOpacity="0.14" fill="none" />
          <circle cx="55" cy="55" r="34" stroke="#86efac" strokeWidth="0.5" strokeOpacity="0.07" fill="none" />
        </svg>
      </div>

      {/* Courbe basse droite */}
      <div ref={setRef("d10")} style={{ position: "absolute", right: 0, top: 1060 }}>
        <svg width="68" height="90" viewBox="0 0 68 90" fill="none">
          <defs>
            <linearGradient id="cR2" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="#86efac" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#86efac" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline
            points="68,86 54,68 42,54 34,60 22,40 10,22 0,6"
            stroke="url(#cR2)" strokeWidth="1.4" fill="none"
            strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
