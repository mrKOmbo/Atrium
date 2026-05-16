"use client";

import { useEffect, useRef, useState } from "react";
import { Heart, Brain, Wind, Activity, Network, Users, Mic } from "lucide-react";

// Mapeo de topic (de OrganCardData) → tipo de visualización.
// Topics que NO matcheen aquí no muestran visualizador (no rompen nada).
type VizType = "heart" | "brain" | "lungs" | "nervous" | "junta";
function topicToViz(topic: string | undefined): VizType | null {
  if (!topic) return null;
  const t = topic.toLowerCase();
  if (t.includes("junta")) return "junta";
  if (t.includes("nervios") || t.includes("snc") || t.includes("snp")) return "nervous";
  if (t.includes("corazón") || t.includes("corazon") || t.includes("cardio")) return "heart";
  if (t.includes("cerebro") || t.includes("cabeza")) return "brain";
  if (t.includes("pulmón") || t.includes("pulmones") || t.includes("respira")) return "lungs";
  return null;
}

export default function OrganVisualizer({ topic }: { topic: string | undefined }) {
  const viz = topicToViz(topic);
  if (!viz) return null;
  return (
    <div className="absolute top-6 right-6 z-50 pointer-events-auto animate-in fade-in slide-in-from-right-3 duration-400 mt-16">
      <div className="bg-black/80 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden w-[340px]">
        {viz === "heart" && <HeartViz />}
        {viz === "brain" && <BrainViz />}
        {viz === "lungs" && <LungsViz />}
        {viz === "nervous" && <NervousViz />}
        {viz === "junta" && <JuntaViz />}
      </div>
    </div>
  );
}

// ── Header reutilizable ────────────────────────────────────────────────
function VizHeader({
  Icon,
  label,
  metric,
  unit,
  color,
}: {
  Icon: React.FC<{ className?: string }>;
  label: string;
  metric: string;
  unit: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-xl bg-black/40 grid place-items-center border border-white/10`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-[0.25em] text-white/45 font-bold">Live · Atrium</div>
          <div className="text-[12px] text-white font-bold">{label}</div>
        </div>
      </div>
      <div className="text-right">
        <div className={`text-2xl font-bold tracking-tight font-mono ${color}`}>{metric}</div>
        <div className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-bold">{unit}</div>
      </div>
    </div>
  );
}

// ── HEART ─────────────────────────────────────────────────────────────
// Latido (systole/diastole) + trazo ECG en tiempo real
function HeartViz() {
  const BPM = 72;
  const cycleMs = 60000 / BPM; // 833ms

  // ECG canvas 2D con scroll continuo
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2 = canvas.getContext("2d");
    if (!ctx2) return;
    const ctx: CanvasRenderingContext2D = ctx2;

    const W = canvas.width;
    const H = canvas.height;
    let raf = 0;
    let t0 = performance.now();
    let scrollX = 0;
    // Buffer pre-renderizado de un ciclo de ECG: P-Q-R-S-T
    function ecgY(phase: number) {
      // phase 0..1 dentro de un latido
      const baseline = H * 0.55;
      // P wave: 0.10–0.18
      if (phase >= 0.1 && phase < 0.18) {
        const k = (phase - 0.1) / 0.08;
        return baseline - Math.sin(k * Math.PI) * H * 0.1;
      }
      // QRS spike: Q dip 0.30, R peak 0.34, S dip 0.38
      if (phase >= 0.3 && phase < 0.32) return baseline + H * 0.08;
      if (phase >= 0.32 && phase < 0.34) {
        const k = (phase - 0.32) / 0.02;
        return baseline + H * 0.08 - k * H * 0.55;
      }
      if (phase >= 0.34 && phase < 0.36) {
        const k = (phase - 0.34) / 0.02;
        return baseline - H * 0.47 + k * H * 0.6;
      }
      if (phase >= 0.36 && phase < 0.4) {
        const k = (phase - 0.36) / 0.04;
        return baseline + H * 0.13 - k * H * 0.13;
      }
      // T wave: 0.50–0.65
      if (phase >= 0.5 && phase < 0.65) {
        const k = (phase - 0.5) / 0.15;
        return baseline - Math.sin(k * Math.PI) * H * 0.18;
      }
      return baseline;
    }

    const points: { x: number; y: number }[] = [];
    const speedPxPerMs = W / (cycleMs * 2.5); // 2.5 ciclos visibles

    function tick(now: number) {
      const dt = now - t0;
      t0 = now;
      scrollX += speedPxPerMs * dt;
      const phase = (scrollX / (W / 2.5)) % 1; // ~833ms por ciclo en pantalla
      points.push({ x: W, y: ecgY(phase) });
      // shift puntos a la izquierda
      for (const p of points) p.x -= speedPxPerMs * dt;
      while (points.length && points[0].x < -2) points.shift();

      // dibuja
      ctx.fillStyle = "rgba(15,8,8,1)";
      ctx.fillRect(0, 0, W, H);

      // grid sutil
      ctx.strokeStyle = "rgba(244,63,94,0.06)";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 24) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += 16) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // trazo ECG con glow
      ctx.shadowColor = "#fb7185";
      ctx.shadowBlur = 12;
      ctx.strokeStyle = "#fda4af";
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;

      // punto cabeza
      const head = points[points.length - 1];
      if (head) {
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(head.x, head.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cycleMs]);

  return (
    <>
      <VizHeader Icon={Heart} label="Corazón" metric={String(BPM)} unit="bpm" color="text-rose-300" />
      <div className="px-5 py-5 grid place-items-center bg-gradient-to-b from-rose-950/20 to-transparent">
        <svg width="160" height="150" viewBox="0 0 160 150" className="drop-shadow-[0_0_24px_rgba(244,63,94,0.45)]">
          <defs>
            <radialGradient id="heartFill" cx="50%" cy="40%">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="60%" stopColor="#e11d48" />
              <stop offset="100%" stopColor="#7f1d1d" />
            </radialGradient>
          </defs>
          {/* heart path con animación de escala (latido) */}
          <g transform="translate(80 78)">
            <path
              d="M 0 30 C -45 -5 -55 -50 -25 -55 C -10 -57 0 -45 0 -32 C 0 -45 10 -57 25 -55 C 55 -50 45 -5 0 30 Z"
              fill="url(#heartFill)"
              stroke="#fda4af"
              strokeWidth="1"
              style={{
                transformOrigin: "center",
                animation: `heart-beat ${cycleMs}ms cubic-bezier(0.45,0,0.55,1) infinite`,
              }}
            />
          </g>
        </svg>
      </div>
      <div className="px-1 pb-1">
        <canvas ref={canvasRef} width={324} height={84} className="w-full rounded-xl block" />
      </div>
      <div className="px-5 py-3 grid grid-cols-3 gap-2 border-t border-white/8">
        <Mini label="SpO₂" value="97%" hint="reposo" />
        <Mini label="TA" value="118/76" hint="mmHg" />
        <Mini label="VS" value="70 ml" hint="vol/latido" />
      </div>
      <style jsx>{`
        @keyframes heart-beat {
          0% { transform: scale(1); }
          12% { transform: scale(1.16); }
          24% { transform: scale(0.96); }
          38% { transform: scale(1.06); }
          50% { transform: scale(1); }
          100% { transform: scale(1); }
        }
      `}</style>
    </>
  );
}

// ── BRAIN ─────────────────────────────────────────────────────────────
// Ondas EEG multi-canal + sinapsis pulsantes
function BrainViz() {
  const channels = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = channels.current;
    if (!canvas) return;
    const ctx2 = canvas.getContext("2d");
    if (!ctx2) return;
    const ctx: CanvasRenderingContext2D = ctx2;
    const W = canvas.width;
    const H = canvas.height;
    let raf = 0;
    const start = performance.now();

    // 4 canales con frecuencias y amplitudes distintas (alpha, beta, theta, delta-ish)
    const chans = [
      { color: "#a78bfa", freq: 0.011, amp: 7, phase: 0, label: "α" },
      { color: "#f0abfc", freq: 0.018, amp: 5, phase: 1.2, label: "β" },
      { color: "#7dd3fc", freq: 0.007, amp: 9, phase: 2.4, label: "θ" },
      { color: "#86efac", freq: 0.004, amp: 11, phase: 3.6, label: "δ" },
    ];

    function tick() {
      const t = (performance.now() - start);
      ctx.fillStyle = "rgba(10,8,18,1)";
      ctx.fillRect(0, 0, W, H);

      // grid
      ctx.strokeStyle = "rgba(167,139,250,0.05)";
      for (let x = 0; x < W; x += 22) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }

      const lanes = chans.length;
      const laneH = H / lanes;
      chans.forEach((c, i) => {
        const laneY = laneH * (i + 0.5);
        ctx.shadowColor = c.color;
        ctx.shadowBlur = 8;
        ctx.strokeStyle = c.color;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (let x = 0; x < W; x += 1) {
          const noise = (Math.sin((x + t * 0.18) * c.freq * 6.28 + c.phase) +
            Math.sin((x + t * 0.06) * c.freq * 12.56 + c.phase * 1.7) * 0.5);
          const y = laneY + noise * c.amp;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // etiqueta
        ctx.shadowBlur = 0;
        ctx.fillStyle = c.color;
        ctx.font = "bold 9px ui-monospace, monospace";
        ctx.fillText(c.label, 6, laneY - 6);
      });

      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Sinapsis: 9 nodos con pulsos aleatorios
  const [nodes] = useState(() =>
    Array.from({ length: 9 }, () => ({
      x: 30 + Math.random() * 100,
      y: 25 + Math.random() * 90,
      delay: Math.random() * 2.5,
    }))
  );

  return (
    <>
      <VizHeader Icon={Brain} label="Cerebro" metric="10.2" unit="hz · α" color="text-purple-300" />
      <div className="px-5 py-5 grid place-items-center bg-gradient-to-b from-purple-950/20 to-transparent">
        <svg width="160" height="150" viewBox="0 0 160 150" className="drop-shadow-[0_0_24px_rgba(167,139,250,0.45)]">
          <defs>
            <radialGradient id="brainFill" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#c4b5fd" />
              <stop offset="60%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#3b0764" />
            </radialGradient>
          </defs>
          {/* Cerebro estilizado: dos hemisferios */}
          <g transform="translate(80 75)">
            <path
              d="M -2 -45 C -36 -45 -52 -22 -48 0 C -52 22 -32 45 -8 42 C -4 50 4 50 8 42 C 32 45 52 22 48 0 C 52 -22 36 -45 2 -45 Z"
              fill="url(#brainFill)"
              stroke="#c4b5fd"
              strokeWidth="1"
              opacity="0.85"
            />
            {/* circunvoluciones */}
            <path d="M 0 -42 Q 0 0 0 42" stroke="#a78bfa" strokeWidth="0.8" fill="none" opacity="0.6" />
            <path d="M -28 -30 Q -10 -10 -28 10" stroke="#a78bfa" strokeWidth="0.7" fill="none" opacity="0.5" />
            <path d="M 28 -30 Q 10 -10 28 10" stroke="#a78bfa" strokeWidth="0.7" fill="none" opacity="0.5" />
            <path d="M -34 0 Q -20 12 -10 30" stroke="#a78bfa" strokeWidth="0.7" fill="none" opacity="0.5" />
            <path d="M 34 0 Q 20 12 10 30" stroke="#a78bfa" strokeWidth="0.7" fill="none" opacity="0.5" />
          </g>
          {/* Sinapsis pulsantes encima */}
          {nodes.map((n, i) => (
            <g key={i}>
              <circle
                cx={n.x}
                cy={n.y}
                r="2.4"
                fill="#fff"
                style={{
                  animation: `synapse-pulse 2.4s ease-in-out infinite`,
                  animationDelay: `${n.delay}s`,
                  filter: "drop-shadow(0 0 4px #c4b5fd)",
                }}
              />
            </g>
          ))}
        </svg>
      </div>
      <div className="px-1 pb-1">
        <canvas ref={channels} width={324} height={104} className="w-full rounded-xl block" />
      </div>
      <div className="px-5 py-3 grid grid-cols-3 gap-2 border-t border-white/8">
        <Mini label="α" value="10.2 Hz" hint="dominante" />
        <Mini label="β" value="18 Hz" hint="atento" />
        <Mini label="Acoplo" value="0.78" hint="γ-θ" />
      </div>
      <style jsx>{`
        @keyframes synapse-pulse {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.7); }
        }
      `}</style>
    </>
  );
}

// ── LUNGS ─────────────────────────────────────────────────────────────
// Pulmones que se expanden + intercambio O2/CO2 con partículas
function LungsViz() {
  const RPM = 14;
  const cycleMs = 60000 / RPM; // ~4.28s

  // partículas O2 entrando, CO2 saliendo
  const cv = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = cv.current;
    if (!canvas) return;
    const ctx2 = canvas.getContext("2d");
    if (!ctx2) return;
    const ctx: CanvasRenderingContext2D = ctx2;
    const W = canvas.width;
    const H = canvas.height;
    type P = { x: number; y: number; vy: number; life: number; type: "O2" | "CO2" };
    const ps: P[] = [];
    let raf = 0;
    let last = performance.now();

    function spawn() {
      ps.push({
        x: Math.random() * W,
        y: H + 4,
        vy: -0.4 - Math.random() * 0.6,
        life: 0,
        type: "O2",
      });
      ps.push({
        x: Math.random() * W,
        y: -4,
        vy: 0.3 + Math.random() * 0.4,
        life: 0,
        type: "CO2",
      });
    }

    function tick(now: number) {
      const dt = now - last;
      last = now;
      if (Math.random() < dt / 90) spawn();

      ctx.fillStyle = "rgba(8,12,20,1)";
      ctx.fillRect(0, 0, W, H);

      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.y += p.vy * (dt / 16);
        p.life += dt;
        const alpha = Math.max(0, 1 - p.life / 3000);
        ctx.beginPath();
        if (p.type === "O2") {
          ctx.fillStyle = `rgba(125,211,252,${alpha})`;
          ctx.shadowColor = "#7dd3fc";
        } else {
          ctx.fillStyle = `rgba(252,165,165,${alpha * 0.8})`;
          ctx.shadowColor = "#fda4af";
        }
        ctx.shadowBlur = 6;
        ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (p.y < -10 || p.y > H + 10 || p.life > 4000) ps.splice(i, 1);
      }

      // etiquetas O2 / CO2
      ctx.fillStyle = "rgba(125,211,252,0.5)";
      ctx.font = "bold 9px ui-monospace, monospace";
      ctx.fillText("↑ O₂", 8, H - 8);
      ctx.fillStyle = "rgba(252,165,165,0.5)";
      ctx.fillText("↓ CO₂", W - 38, 14);

      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      <VizHeader Icon={Wind} label="Pulmones" metric={String(RPM)} unit="rpm" color="text-sky-300" />
      <div className="px-5 py-5 grid place-items-center bg-gradient-to-b from-sky-950/20 to-transparent relative">
        <svg
          width="180"
          height="150"
          viewBox="0 0 180 150"
          className="drop-shadow-[0_0_24px_rgba(125,211,252,0.4)]"
        >
          <defs>
            <radialGradient id="lungL" cx="50%" cy="40%">
              <stop offset="0%" stopColor="#bae6fd" />
              <stop offset="60%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0c4a6e" />
            </radialGradient>
            <radialGradient id="lungR" cx="50%" cy="40%">
              <stop offset="0%" stopColor="#bae6fd" />
              <stop offset="60%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0c4a6e" />
            </radialGradient>
          </defs>
          {/* tráquea */}
          <rect x="86" y="14" width="8" height="32" rx="3" fill="#94a3b8" opacity="0.55" />
          <circle cx="90" cy="12" r="6" fill="#94a3b8" opacity="0.7" />
          {/* bronquios principales */}
          <path d="M 90 44 L 60 60" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
          <path d="M 90 44 L 120 60" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
          {/* pulmón izquierdo (anatómicamente más pequeño, 2 lóbulos) */}
          <g
            style={{
              transformOrigin: "55px 90px",
              animation: `breathe-l ${cycleMs}ms ease-in-out infinite`,
            }}
          >
            <path
              d="M 56 50 C 30 56 18 80 22 110 C 24 130 40 138 56 134 C 64 132 70 120 70 100 C 70 80 68 60 56 50 Z"
              fill="url(#lungL)"
              stroke="#7dd3fc"
              strokeWidth="1"
              opacity="0.92"
            />
            <path d="M 40 88 Q 56 90 64 96" stroke="#7dd3fc" strokeWidth="0.7" fill="none" opacity="0.55" />
          </g>
          {/* pulmón derecho (3 lóbulos) */}
          <g
            style={{
              transformOrigin: "125px 90px",
              animation: `breathe-r ${cycleMs}ms ease-in-out infinite`,
            }}
          >
            <path
              d="M 124 50 C 150 56 162 80 158 110 C 156 130 140 138 124 134 C 116 132 110 120 110 100 C 110 80 112 60 124 50 Z"
              fill="url(#lungR)"
              stroke="#7dd3fc"
              strokeWidth="1"
              opacity="0.92"
            />
            <path d="M 140 78 Q 124 80 116 86" stroke="#7dd3fc" strokeWidth="0.7" fill="none" opacity="0.55" />
            <path d="M 140 100 Q 124 102 116 108" stroke="#7dd3fc" strokeWidth="0.7" fill="none" opacity="0.55" />
          </g>
        </svg>
      </div>
      <div className="px-1 pb-1">
        <canvas ref={cv} width={324} height={84} className="w-full rounded-xl block" />
      </div>
      <div className="px-5 py-3 grid grid-cols-3 gap-2 border-t border-white/8">
        <Mini label="SpO₂" value="91%" hint="ejercicio" />
        <Mini label="VC" value="6 L" hint="capacidad" />
        <Mini label="VEF₁" value="83%" hint="del predicho" />
      </div>
      <style jsx>{`
        @keyframes breathe-l {
          0%, 100% { transform: scale(1, 1); }
          45% { transform: scale(1.06, 1.12); }
        }
        @keyframes breathe-r {
          0%, 100% { transform: scale(1, 1); }
          45% { transform: scale(1.06, 1.12); }
        }
      `}</style>
    </>
  );
}

// ── NERVOUS SYSTEM ────────────────────────────────────────────────────
// Silueta humana con SNC (cráneo + médula) y SNP (nervios periféricos)
// Pulsos electrofisiológicos viajan por las vías y se ramifican.
function NervousViz() {
  // Pulsos a lo largo de cada nervio. Cada path tiene su propio offset/duración.
  const pulses = [
    { path: "M 90 22 L 90 56", dur: 1.6, delay: 0 },        // cerebro → médula
    { path: "M 90 56 L 90 130", dur: 2.0, delay: 0.4 },     // médula cervical → lumbar
    { path: "M 90 60 L 60 78 L 50 100", dur: 2.2, delay: 0.8 },   // brazo izq
    { path: "M 90 60 L 120 78 L 130 100", dur: 2.2, delay: 1.0 }, // brazo der
    { path: "M 90 130 L 76 162 L 70 196", dur: 2.6, delay: 1.4 }, // pierna izq
    { path: "M 90 130 L 104 162 L 110 196", dur: 2.6, delay: 1.6 }, // pierna der
  ];

  return (
    <>
      <VizHeader Icon={Network} label="Sistema nervioso" metric="120" unit="m/s" color="text-fuchsia-300" />
      <div className="px-5 py-4 grid place-items-center bg-gradient-to-b from-fuchsia-950/20 to-transparent">
        <svg width="180" height="220" viewBox="0 0 180 220" className="drop-shadow-[0_0_22px_rgba(217,70,239,0.4)]">
          <defs>
            <radialGradient id="brainNS" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#f0abfc" />
              <stop offset="80%" stopColor="#a21caf" />
              <stop offset="100%" stopColor="#3b0764" />
            </radialGradient>
          </defs>
          {/* Silueta humana muy estilizada, fondo */}
          <g fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8">
            <ellipse cx="90" cy="22" rx="18" ry="20" />
            <rect x="68" y="42" width="44" height="100" rx="14" />
            <rect x="48" y="62" width="20" height="50" rx="6" />
            <rect x="112" y="62" width="20" height="50" rx="6" />
            <rect x="72" y="138" width="14" height="70" rx="6" />
            <rect x="94" y="138" width="14" height="70" rx="6" />
          </g>

          {/* SNC: cerebro + médula espinal (línea principal) */}
          <ellipse cx="90" cy="22" rx="14" ry="16" fill="url(#brainNS)" stroke="#e879f9" strokeWidth="1" opacity="0.9" />
          <path d="M 90 38 L 90 138" stroke="#d946ef" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
          {/* Vértebras */}
          {Array.from({ length: 14 }).map((_, i) => (
            <rect key={i} x="86" y={42 + i * 7} width="8" height="3" rx="1.2" fill="rgba(217,70,239,0.5)" />
          ))}

          {/* SNP: nervios periféricos */}
          <g stroke="rgba(232,121,249,0.6)" strokeWidth="1.4" fill="none" strokeLinecap="round">
            <path d="M 90 60 L 60 78 L 50 100 L 46 116" />
            <path d="M 90 60 L 120 78 L 130 100 L 134 116" />
            <path d="M 90 130 L 76 162 L 70 196 L 66 210" />
            <path d="M 90 130 L 104 162 L 110 196 L 114 210" />
            {/* nervios laterales */}
            <path d="M 90 90 L 70 96" opacity="0.5" />
            <path d="M 90 90 L 110 96" opacity="0.5" />
            <path d="M 90 110 L 72 116" opacity="0.5" />
            <path d="M 90 110 L 108 116" opacity="0.5" />
          </g>

          {/* Pulsos electrofisiológicos animados */}
          {pulses.map((p, i) => (
            <g key={i}>
              <path d={p.path} fill="none" stroke="transparent" id={`np-${i}`} />
              <circle r="2.6" fill="#fff" filter="url(#nGlow)">
                <animateMotion dur={`${p.dur}s`} repeatCount="indefinite" begin={`${p.delay}s`}>
                  <mpath href={`#np-${i}`} />
                </animateMotion>
                <animate attributeName="opacity" values="0;1;1;0" dur={`${p.dur}s`} repeatCount="indefinite" begin={`${p.delay}s`} />
              </circle>
            </g>
          ))}

          <defs>
            <filter id="nGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
      </div>
      <div className="px-5 pb-4 grid grid-cols-3 gap-2 border-t border-white/8 pt-3">
        <Mini label="Neuronas" value="100B" hint="totales" />
        <Mini label="Pares" value="12 / 31" hint="craneal/espinal" />
        <Mini label="V. conducción" value="120" hint="m/s · α" />
      </div>
    </>
  );
}

// ── JUNTA CLÍNICA ─────────────────────────────────────────────────────
// Mesa de juntas con los 6 especialistas. Indicador de quien habla rota,
// y un waveform en el header simula el audio de la sesión.
function JuntaViz() {
  const TEAM = [
    { id: "atlas",   name: "Atlas",   role: "Coordinador",   color: "text-orange-300",  ring: "ring-orange-400/60" },
    { id: "pulso",   name: "Pulso",   role: "Cardiólogo",    color: "text-rose-300",    ring: "ring-rose-400/60" },
    { id: "synapse", name: "Synapse", role: "Neurólogo",     color: "text-purple-300",  ring: "ring-purple-400/60" },
    { id: "aire",    name: "Aire",    role: "Neumólogo",     color: "text-sky-300",     ring: "ring-sky-400/60" },
    { id: "vesta",   name: "Vesta",   role: "Digestivo",     color: "text-emerald-300", ring: "ring-emerald-400/60" },
    { id: "vitrum",  name: "Vitrum",  role: "Anatomista",    color: "text-yellow-300",  ring: "ring-yellow-400/60" },
  ];

  // Quién está hablando rota cada 2.4s
  const [speakerIdx, setSpeakerIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSpeakerIdx((i) => (i + 1) % TEAM.length), 2400);
    return () => clearInterval(t);
  }, [TEAM.length]);

  // Timer de sesión
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  // Waveform del audio (canvas)
  const wave = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = wave.current;
    if (!canvas) return;
    const ctx2 = canvas.getContext("2d");
    if (!ctx2) return;
    const ctx: CanvasRenderingContext2D = ctx2;
    const W = canvas.width;
    const H = canvas.height;
    let raf = 0;
    const start = performance.now();

    function tick() {
      const t = (performance.now() - start) * 0.005;
      ctx.fillStyle = "rgba(8,8,14,1)";
      ctx.fillRect(0, 0, W, H);

      const bars = 38;
      const barW = W / bars - 1;
      for (let i = 0; i < bars; i++) {
        const phase = i * 0.4 + t;
        const amp = (Math.sin(phase) * 0.5 + Math.sin(phase * 2.3 + 1) * 0.3 + Math.random() * 0.3) * H * 0.4;
        const h = Math.max(2, Math.abs(amp));
        const grad = ctx.createLinearGradient(0, H / 2 - h, 0, H / 2 + h);
        grad.addColorStop(0, "rgba(251,146,60,0.85)");
        grad.addColorStop(1, "rgba(244,63,94,0.4)");
        ctx.fillStyle = grad;
        ctx.fillRect(i * (barW + 1), H / 2 - h, barW, h * 2);
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-600/20 grid place-items-center border border-orange-500/30">
            <Users className="w-4 h-4 text-orange-300" />
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-[0.25em] text-white/45 font-bold">En sesión</div>
            <div className="text-[12px] text-white font-bold">Junta clínica</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold tracking-tight font-mono text-orange-300">{mm}:{ss}</div>
          <div className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-bold">duración</div>
        </div>
      </div>

      {/* Avatares 3x2 con indicador de quien habla */}
      <div className="px-5 py-4 grid grid-cols-3 gap-2.5 bg-gradient-to-b from-orange-950/15 to-transparent">
        {TEAM.map((m, i) => {
          const speaking = i === speakerIdx;
          return (
            <div
              key={m.id}
              className={`relative flex flex-col items-center gap-1 p-2 rounded-xl border transition-all
                ${speaking ? `bg-white/8 border-white/20 ring-2 ${m.ring} scale-[1.04]` : "bg-white/[0.03] border-white/8"}`}
            >
              <div
                className={`w-9 h-9 rounded-full bg-black/60 grid place-items-center border ${speaking ? "border-white/40" : "border-white/10"}`}
              >
                <span className={`text-[14px] font-bold ${m.color}`}>{m.name[0]}</span>
              </div>
              <div className="text-[10px] font-bold text-white tracking-tight">{m.name}</div>
              <div className="text-[8.5px] uppercase tracking-[0.15em] text-white/45 font-semibold">
                {speaking ? "habla" : m.role}
              </div>
              {speaking && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(74,222,128,0.8)]" />
              )}
            </div>
          );
        })}
      </div>

      {/* Waveform de audio */}
      <div className="px-5 pb-3">
        <div className="flex items-center gap-2 mb-1.5">
          <Mic className="w-3 h-3 text-orange-300" />
          <span className="text-[9px] uppercase tracking-[0.22em] font-bold text-white/55">
            {TEAM[speakerIdx].name} · {TEAM[speakerIdx].role}
          </span>
        </div>
        <canvas ref={wave} width={300} height={56} className="w-full rounded-lg block" />
      </div>

      <div className="px-5 py-3 grid grid-cols-3 gap-2 border-t border-white/8">
        <Mini label="Especialistas" value="6/6" hint="presentes" />
        <Mini label="Decisiones" value="3" hint="acordadas" />
        <Mini label="Caso" value="PAC-847" hint="Mendoza C." />
      </div>
    </>
  );
}

// ── Mini stat ─────────────────────────────────────────────────────────
function Mini({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/8 rounded-xl px-2.5 py-1.5">
      <div className="text-[8.5px] uppercase tracking-[0.2em] text-white/40 font-bold flex items-center gap-1">
        <Activity className="w-2.5 h-2.5" />
        {label}
      </div>
      <div className="text-[12px] text-white font-bold font-mono leading-tight mt-0.5">{value}</div>
      <div className="text-[9px] text-white/40">{hint}</div>
    </div>
  );
}
