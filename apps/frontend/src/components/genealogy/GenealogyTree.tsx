"use client";

import { useState } from "react";
import { X, Dna, AlertTriangle, Cigarette, Heart, Skull, Sparkles } from "lucide-react";
import {
  FAMILY,
  FAMILY_BY_ID,
  HEREDITARY_SUMMARY,
  type Person,
  type Severity,
} from "@/lib/medicalRecord";

// ── Layout fijo, calculado para que los enlaces queden alineados ─────────────
// Diseño compacto estilo pedigrí clínico: padres juntos al centro, abuelos
// laterales conectados con L-bend (línea baja al bus de descendencia y luego
// horizontal hasta el hijo). Esto evita la línea de pareja larga y deja claras
// las relaciones de filiación.
const NODE_W = 132;
const NODE_H = 108;
const POS: Record<string, { x: number; y: number }> = {
  // G1 — abuelos (laterales)
  g1_pat_abuelo: { x: 40, y: 20 },
  g1_pat_abuela: { x: 210, y: 20 },
  g1_mat_abuelo: { x: 900, y: 20 },
  g1_mat_abuela: { x: 1070, y: 20 },
  // G2 — padres (juntos al centro, couple line corta)
  g2_padre: { x: 445, y: 200 },
  g2_madre: { x: 605, y: 200 },
  // G3 — paciente y hermanos centrados bajo G2
  g3_hermana: { x: 310, y: 380 },
  g3_paciente: { x: 525, y: 380 },
  g3_hermano: { x: 740, y: 380 },
  // G4 — Sofía bajo Laura, Mateo+Isabella bajo Carlos
  g4_sobrina: { x: 310, y: 560 },
  g4_hijo1: { x: 450, y: 560 },
  g4_hijo2: { x: 600, y: 560 },
};
const STAGE_W = 1240;
const STAGE_H = 700;

const SEVERITY_STYLE: Record<Severity, { ring: string; bg: string; dot: string; label: string }> = {
  asma_clinica: {
    ring: "border-rose-500/55",
    bg: "bg-rose-950/40",
    dot: "bg-rose-400",
    label: "Asma clínica",
  },
  atopia: {
    ring: "border-amber-500/45",
    bg: "bg-amber-950/30",
    dot: "bg-amber-400",
    label: "Fenotipo atópico",
  },
  subclinico: {
    ring: "border-sky-500/45",
    bg: "bg-sky-950/30",
    dot: "bg-sky-400",
    label: "Subclínico",
  },
  ninguno: {
    ring: "border-white/10",
    bg: "bg-zinc-900/50",
    dot: "bg-zinc-500",
    label: "Sin atopia",
  },
};

export default function GenealogyTree({ onClose }: { onClose: () => void }) {
  const [selectedId, setSelectedId] = useState<string>("g3_paciente");
  const selected = FAMILY_BY_ID[selectedId];

  return (
    <div className="absolute inset-0 z-[200] bg-black/82 backdrop-blur-xl flex flex-col animate-in fade-in duration-200">
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header className="flex items-start justify-between px-8 py-5 border-b border-white/8 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 grid place-items-center shadow-lg shadow-orange-500/20">
            <Dna className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.32em] text-white/45 font-bold">Pedigrí · Atrium Clinic</div>
            <h2 className="text-xl font-bold tracking-tight text-white">Árbol genealógico — familia Mendoza Ríos</h2>
            <p className="text-[12px] text-white/55 mt-0.5">
              {HEREDITARY_SUMMARY.diagnosis} · 4 generaciones · transmisión {HEREDITARY_SUMMARY.inheritedFrom.toLowerCase()}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 grid place-items-center text-white/70 hover:text-white transition"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      {/* ── BODY ───────────────────────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-[1fr_360px] min-h-0">
        {/* TREE STAGE */}
        <div className="relative overflow-auto p-8">
          <div
            className="relative mx-auto"
            style={{ width: STAGE_W, height: STAGE_H }}
          >
            {/* SVG · líneas del pedigrí hardcodeadas (estilo árbol biológico) ── */}
            <svg
              width={STAGE_W}
              height={STAGE_H}
              className="absolute inset-0 pointer-events-none"
              style={{ overflow: "visible" }}
            >
              {/*
                Convención del pedigrí:
                - LÍNEAS DE PAREJA (couple): horizontal blanco entre dos cónyuges
                - LÍNEAS DE DESCENDENCIA (descend): naranja, marca filiación
                  · vertical desde el centro de la pareja → bus de hermanos
                  · bus horizontal que conecta a todos los hijos
                  · vertical desde el bus → top de cada hijo

                Coordenadas de referencia (NODE_W=132, NODE_H=108):
                  G1 y=20  cy=74   bottom=128
                  G2 y=200 cy=254  bottom=308   bus_a_G2 = 164
                  G3 y=380 cy=434  bottom=488   bus_a_G3 = 344
                  G4 y=560 cy=614  bottom=668   bus_a_G4 = 524
                  Roberto cx=106  Carmen cx=276    pat_couple_mid = 191
                  Jesús   cx=966  Esperanza cx=1136 mat_couple_mid = 1051
                  Miguel  cx=511  Patricia  cx=671  G2_couple_mid  = 591
                  Laura cx=376  Carlos cx=591  Diego cx=806
                  Sofía cx=376  Mateo cx=516  Isabella cx=666
              */}
              <g
                stroke="rgba(255,255,255,0.85)"
                strokeWidth={2}
                strokeLinecap="round"
                fill="none"
              >
                {/* Couple lines (parejas) */}
                <path d="M 172 74 L 210 74" />        {/* Roberto ↔ Carmen */}
                <path d="M 1032 74 L 1070 74" />      {/* Jesús ↔ Esperanza */}
                <path d="M 577 254 L 605 254" />      {/* Miguel ↔ Patricia */}
              </g>

              <g
                stroke="rgba(255,180,130,0.7)"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              >
                {/* G1-paterno → Miguel (hijo único): drop, L-bend, drop */}
                <path d="M 191 74 L 191 164 L 511 164 L 511 200" />

                {/* G1-materno → Patricia (hija única): drop, L-bend, drop */}
                <path d="M 1051 74 L 1051 164 L 671 164 L 671 200" />

                {/* G2 (Miguel ↔ Patricia) → Laura, Carlos, Diego (3 hermanos) */}
                {/* tronco vertical desde el midpoint de la pareja al bus */}
                <path d="M 591 254 L 591 344" />
                {/* sibship bus que abarca todos los hijos */}
                <path d="M 376 344 L 806 344" />
                {/* drop a cada hijo */}
                <path d="M 376 344 L 376 380" />
                <path d="M 591 344 L 591 380" />
                <path d="M 806 344 L 806 380" />

                {/* G3 Laura → Sofía (hija única, mismo cx → vertical limpio) */}
                <path d="M 376 488 L 376 560" />

                {/* G3 Carlos → Mateo + Isabella (2 hijos) */}
                <path d="M 591 488 L 591 524" />
                <path d="M 516 524 L 666 524" />
                <path d="M 516 524 L 516 560" />
                <path d="M 666 524 L 666 560" />
              </g>

              {/* Nodos T (cruces bus ↔ vertical) — marcan filiación claramente */}
              <g fill="rgba(255,180,130,0.95)">
                {/* G2 → G3 */}
                <circle cx={376} cy={344} r={2.6} />
                <circle cx={591} cy={344} r={2.6} />
                <circle cx={806} cy={344} r={2.6} />
                {/* G3 Carlos → G4 */}
                <circle cx={516} cy={524} r={2.6} />
                <circle cx={666} cy={524} r={2.6} />
                {/* L-bends abuelos → padres */}
                <circle cx={511} cy={164} r={2.6} />
                <circle cx={671} cy={164} r={2.6} />
              </g>
            </svg>

            {/* GENERATION LABELS */}
            {[
              { y: 20 + NODE_H / 2, label: "G1 · Abuelos" },
              { y: 200 + NODE_H / 2, label: "G2 · Padres" },
              { y: 380 + NODE_H / 2, label: "G3 · Paciente y hermanos" },
              { y: 560 + NODE_H / 2, label: "G4 · Hijos y sobrina" },
            ].map((g) => (
              <div
                key={g.label}
                className="absolute left-0 -translate-x-2 text-[9px] uppercase tracking-[0.25em] text-white/35 font-bold"
                style={{ top: g.y, transform: "translateX(-100%) translateY(50%)" }}
              >
                {g.label}
              </div>
            ))}

            {/* PERSON NODES */}
            {FAMILY.map((p) => (
              <PersonNode
                key={p.id}
                person={p}
                pos={POS[p.id]}
                active={p.id === selectedId}
                onClick={() => setSelectedId(p.id)}
              />
            ))}
          </div>

          {/* LEYENDA */}
          <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-2.5 max-w-[1100px]">
            {(["asma_clinica", "atopia", "subclinico", "ninguno"] as Severity[]).map((s) => (
              <div key={s} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/8">
                <span className={`w-2 h-2 rounded-full ${SEVERITY_STYLE[s].dot}`} />
                <span className="text-[10px] uppercase tracking-[0.18em] text-white/60 font-semibold">{SEVERITY_STYLE[s].label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/8">
              <Cigarette className="w-3 h-3 text-white/55" />
              <span className="text-[10px] uppercase tracking-[0.18em] text-white/60 font-semibold">Tabaquismo</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/8">
              <Skull className="w-3 h-3 text-white/55" />
              <span className="text-[10px] uppercase tracking-[0.18em] text-white/60 font-semibold">Fallecido</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30">
              <Sparkles className="w-3 h-3 text-rose-300" />
              <span className="text-[10px] uppercase tracking-[0.18em] text-rose-200 font-semibold">Caso índice</span>
            </div>
          </div>
        </div>

        {/* DETAIL PANEL */}
        <aside className="border-l border-white/8 overflow-y-auto bg-zinc-950/50">
          <DetailPanel person={selected} />
        </aside>
      </div>
    </div>
  );
}

// ── Tarjeta individual del pedigrí ────────────────────────────────────────
function PersonNode({
  person,
  pos,
  active,
  onClick,
}: {
  person: Person;
  pos: { x: number; y: number };
  active: boolean;
  onClick: () => void;
}) {
  const sty = SEVERITY_STYLE[person.severity];
  const deceased = person.status === "fallecido";
  const isProband = person.isProband;

  return (
    <button
      onClick={onClick}
      style={{ left: pos.x, top: pos.y, width: NODE_W, height: NODE_H }}
      className={`absolute rounded-2xl border ${sty.ring} ${sty.bg} backdrop-blur-md p-2.5 text-left transition-all
      ${active ? "ring-2 ring-orange-400/80 ring-offset-2 ring-offset-black/0 scale-[1.03] shadow-lg shadow-orange-500/15" : "hover:border-white/30 hover:scale-[1.02]"}
      ${isProband ? "shadow-[0_0_0_2px_rgba(244,63,94,0.55)]" : ""}`}
    >
      {/* Top row: sexo + estado */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <SexBadge sex={person.sex} />
          {isProband && (
            <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-rose-300 px-1.5 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/35">
              Índice
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-white/50">
          {person.smoker && <Cigarette className="w-3 h-3" />}
          {deceased && <Skull className="w-3 h-3" />}
        </div>
      </div>

      {/* Nombre */}
      <div className={`text-[12.5px] font-bold leading-tight tracking-tight truncate ${active ? "text-white" : "text-white/92"}`}>
        {person.shortName || person.name.split(" ")[0]}
      </div>

      {/* Años */}
      <div className="text-[10px] text-white/45 font-mono mt-0.5">
        {person.bornYear}{deceased ? `–${person.diedYear}` : person.age ? ` · ${person.age}a` : ""}
      </div>

      {/* Severity dot + label */}
      <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${sty.dot}`} />
        <span className="text-[9px] uppercase tracking-[0.15em] text-white/55 font-semibold truncate">
          {sty.label}
        </span>
      </div>
    </button>
  );
}

function SexBadge({ sex }: { sex: "M" | "F" }) {
  const isM = sex === "M";
  return (
    <span
      className={`w-4 h-4 grid place-items-center rounded-[5px] text-[10px] font-bold ${
        isM ? "bg-sky-500/20 text-sky-200 border border-sky-500/30" : "bg-pink-500/20 text-pink-200 border border-pink-500/30"
      }`}
    >
      {isM ? "♂" : "♀"}
    </span>
  );
}

// ── Panel lateral: detalle de la persona seleccionada ────────────────────
function DetailPanel({ person }: { person: Person }) {
  const sty = SEVERITY_STYLE[person.severity];

  return (
    <div className="p-6 space-y-5">
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-[0.28em] text-white/40 font-bold">
          Generación {person.generation}
        </div>
        <h3 className="text-lg font-bold text-white tracking-tight leading-tight">{person.name}</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] uppercase tracking-[0.18em] font-bold px-2 py-1 rounded-md ${sty.bg} border ${sty.ring} text-white/85`}>
            {sty.label}
          </span>
          {person.isProband && (
            <span className="text-[10px] uppercase tracking-[0.18em] font-bold px-2 py-1 rounded-md bg-rose-500/15 border border-rose-500/40 text-rose-200">
              Caso índice
            </span>
          )}
          {person.smoker && (
            <span className="text-[10px] uppercase tracking-[0.18em] font-bold px-2 py-1 rounded-md bg-zinc-800 border border-white/10 text-white/65 flex items-center gap-1">
              <Cigarette className="w-2.5 h-2.5" /> Fumador
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <Stat label="Nacimiento" value={String(person.bornYear)} />
        {person.diedYear ? (
          <Stat label="Fallecimiento" value={String(person.diedYear)} accent="rose" />
        ) : (
          <Stat label="Edad" value={person.age ? `${person.age} años` : "—"} />
        )}
        <Stat label="Sexo" value={person.sex === "M" ? "Masculino" : "Femenino"} />
        <Stat label="Estado" value={(person.status || "vivo").toUpperCase()} />
      </div>

      {person.causeOfDeath && (
        <Section title="Causa de fallecimiento" icon={<Skull className="w-3 h-3" />}>
          <p className="text-zinc-300 text-[12px] leading-relaxed">{person.causeOfDeath}</p>
        </Section>
      )}

      {person.conditions.length > 0 && (
        <Section title="Condiciones respiratorias" icon={<Heart className="w-3 h-3" />}>
          <ul className="space-y-1.5">
            {person.conditions.map((c, i) => (
              <li key={i} className="text-[12px] text-white/85 leading-snug pl-3 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1 before:h-1 before:rounded-full before:bg-orange-400">
                {c}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {person.atopicConditions && person.atopicConditions.length > 0 && (
        <Section title="Atopia / alergias" icon={<Sparkles className="w-3 h-3" />}>
          <ul className="space-y-1.5">
            {person.atopicConditions.map((c, i) => (
              <li key={i} className="text-[12px] text-white/85 leading-snug pl-3 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1 before:h-1 before:rounded-full before:bg-amber-400">
                {c}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {person.notes && (
        <Section title="Nota clínica">
          <p className="text-[12px] text-white/70 leading-relaxed italic">{person.notes}</p>
        </Section>
      )}

      {person.geneticRelevance && (
        <Section title="Relevancia genética" icon={<Dna className="w-3 h-3" />}>
          <div className="bg-orange-500/8 border border-orange-500/20 rounded-xl p-3">
            <p className="text-[12px] text-orange-100/85 leading-relaxed">{person.geneticRelevance}</p>
          </div>
        </Section>
      )}

      {person.isProband && (
        <Section title="Genes candidatos sospechados" icon={<AlertTriangle className="w-3 h-3" />}>
          <div className="space-y-1.5">
            {HEREDITARY_SUMMARY.candidateGenes.map((g) => (
              <div key={g.gene} className="bg-white/[0.04] border border-white/8 rounded-lg px-3 py-2">
                <div className="text-[11px] font-bold text-white tracking-tight font-mono">{g.gene}</div>
                <div className="text-[10.5px] text-white/55 mt-0.5">{g.role}</div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: "rose" }) {
  return (
    <div className="bg-white/[0.03] border border-white/8 rounded-lg p-2.5">
      <div className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-bold mb-0.5">{label}</div>
      <div className={`text-[12px] font-semibold ${accent === "rose" ? "text-rose-200" : "text-white"}`}>{value}</div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.25em] font-bold text-white/45">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

