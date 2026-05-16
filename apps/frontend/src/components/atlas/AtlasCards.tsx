"use client";

import React, { useState } from "react";
import {
  Send,
  Mic,
  MicOff,
  Sparkles,
  Loader2,
  Heart,
  Brain,
  Wind,
  Activity,
  CircleDashed,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Bone,
  Stethoscope,
  Microscope,
  Syringe,
  Pill,
  Search,
  Baby,
  User,
  Users,
  Salad,
  Scan,
} from "lucide-react";

// Map icon string → componente lucide. Default = Sparkles.
const ICONS: Record<string, React.FC<{ className?: string }>> = {
  heart: Heart, brain: Brain, lung: Wind, stomach: Salad, bone: Bone,
  sparkles: Sparkles, activity: Activity, wind: Wind, alert: AlertTriangle,
  search: Search, stethoscope: Stethoscope, microscope: Microscope,
  syringe: Syringe, pill: Pill, "x-ray": Scan, baby: Baby, user: User, users: Users,
};
export const getIcon = (key?: string) => ICONS[key || ""] || Sparkles;

export type Choice = { label: string; icon?: string; value: string };

// ── ChoiceGrid: botones visuales con icono — base reutilizable ───────────
export function ChoiceGrid({ choices, onPick, columns = 2 }: { choices: Choice[]; onPick: (v: string) => void; columns?: 1 | 2 | 3 }) {
  const cols = columns === 1 ? "grid-cols-1" : columns === 3 ? "grid-cols-3" : "grid-cols-2";
  return (
    <div className={`grid ${cols} gap-2`}>
      {choices.map((c, i) => {
        const Icon = getIcon(c.icon);
        return (
          <button
            key={i}
            onClick={() => onPick(c.value)}
            className="group flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/25 transition-all active:scale-95"
          >
            <div className="w-9 h-9 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center group-hover:bg-black/60 transition">
              <Icon className="w-4 h-4 text-white/85" />
            </div>
            <span className="text-[11px] text-white/85 font-medium tracking-tight leading-tight text-center line-clamp-2">{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}

const SPECIALISTS: Record<
  string,
  { name: string; tagline: string; color: string; bg: string; Icon: React.FC<{ className?: string }> }
> = {
  atlas:   { name: "Atlas",   tagline: "Coordinador anatómico", color: "text-orange-300", bg: "bg-orange-950/85 border-orange-500/25", Icon: Sparkles },
  pulso:   { name: "Pulso",   tagline: "Cardiólogo",            color: "text-rose-300",   bg: "bg-rose-950/85 border-rose-500/25",     Icon: Heart },
  synapse: { name: "Synapse", tagline: "Neurólogo",             color: "text-purple-300", bg: "bg-purple-950/85 border-purple-500/25", Icon: Brain },
  aire:    { name: "Aire",    tagline: "Neumólogo",             color: "text-sky-300",    bg: "bg-sky-950/85 border-sky-500/25",       Icon: Wind },
  vesta:   { name: "Vesta",   tagline: "Digestivo",             color: "text-emerald-300",bg: "bg-emerald-950/85 border-emerald-500/25",Icon: Activity },
  vitrum:  { name: "Vitrum",  tagline: "Anatomista",            color: "text-yellow-300", bg: "bg-yellow-950/85 border-yellow-500/25", Icon: CircleDashed },
};

export const SPECIALIST_IDS = Object.keys(SPECIALISTS);
export const getSpecialist = (id?: string) => SPECIALISTS[id ?? "atlas"] ?? SPECIALISTS.atlas;

// ── Voice helper ───────────────────────────────────────────
function useVoiceInput(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const start = () => {
    const SR =
      (typeof window !== "undefined" &&
        ((window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
          (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition)) as
        | (new () => SpeechRecognition)
        | undefined;
    if (!SR) return;
    const r = new SR();
    r.lang = "es-ES";
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onresult = (ev: SpeechRecognitionEvent) => {
      onResult(ev.results[0][0].transcript);
    };
    r.start();
  };
  return { listening, start };
}

// ── WelcomeCard (sin input, solo ilustraciones) ────────────
const WELCOME_CHOICES: Choice[] = [
  { label: "Corazón", icon: "heart", value: "Pulso, muéstrame el corazón con datos clave" },
  { label: "Cerebro", icon: "brain", value: "Synapse, explícame el cerebro con sus regiones principales" },
  { label: "Pulmones", icon: "lung", value: "Aire, muéstrame los pulmones y cómo respiramos" },
  { label: "Digestivo", icon: "stomach", value: "Vesta, recorre el sistema digestivo conmigo" },
  { label: "Esqueleto", icon: "bone", value: "Vitrum, muéstrame la estructura ósea" },
  { label: "Junta clínica", icon: "users", value: "Convoca al equipo a junta clínica" },
];

export function WelcomeCard({ onSendMessage }: { onSendMessage: (msg: string) => void }) {
  return (
    <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-7 w-[380px] shadow-2xl pointer-events-auto">
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Sparkles className="text-white w-6 h-6 fill-white/20" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Atrium Clinic</h1>
            <p className="text-zinc-500 text-xs uppercase tracking-widest">Equipo médico IA</p>
          </div>
        </div>
        <p className="text-zinc-300 text-sm leading-relaxed">
          Elige por dónde quieres empezar. El equipo se mueve, examina y te explica.
        </p>
        <ChoiceGrid choices={WELCOME_CHOICES} onPick={onSendMessage} columns={3} />
      </div>
    </div>
  );
}

// ── AnalysisCard (transición) ──────────────────────────────
export function AnalysisCard({ specialist, message }: { specialist: string; message: string }) {
  const sp = getSpecialist(specialist);
  return (
    <div className="relative bg-zinc-950/90 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-8 w-[380px] shadow-2xl duration-500 pointer-events-auto">
      <div className="flex items-center gap-3 mb-4">
        <Loader2 className="w-5 h-5 text-orange-300 animate-spin" />
        <span className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-bold">Delegando</span>
      </div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-black/40 rounded-xl flex items-center justify-center border border-white/10">
          <sp.Icon className={`w-5 h-5 ${sp.color}`} />
        </div>
        <div>
          <div className="text-white font-bold text-sm">{sp.name}</div>
          <div className="text-white/50 text-[10px] uppercase tracking-widest">{sp.tagline}</div>
        </div>
      </div>
      <p className="text-zinc-300 text-sm italic leading-relaxed">"{message}"</p>
    </div>
  );
}

// ── QuestionCard (con choices visuales, sin escribir) ──────
export function QuestionCard({
  specialist,
  message,
  choices,
  onSubmit,
}: {
  specialist: string;
  message: string;
  choices?: Choice[];
  onSubmit: (answer: string) => void;
}) {
  const sp = getSpecialist(specialist);
  const fallback: Choice[] = [
    { label: "Sí, profundiza", icon: "search", value: "Sí, cuéntame más" },
    { label: "Otro tema", icon: "sparkles", value: "Mejor pasemos a otro tema" },
  ];
  const list = choices && choices.length > 0 ? choices : fallback;
  return (
    <div className="relative bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-7 w-[380px] shadow-2xl pointer-events-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-black/40 rounded-2xl flex items-center justify-center border border-white/10">
          <sp.Icon className={`w-6 h-6 ${sp.color}`} />
        </div>
        <div>
          <div className="text-white font-bold">{sp.name}</div>
          <div className="text-white/50 text-[10px] uppercase tracking-widest">pregunta</div>
        </div>
      </div>
      <p className="text-zinc-200 text-sm leading-relaxed mb-4">{message}</p>
      <ChoiceGrid choices={list} onPick={onSubmit} columns={2} />
    </div>
  );
}

// ── OrganCard (info detallada de órgano/sistema) ────────────
export interface OrganCardProps {
  specialist: string;
  topic: string;
  content: string;
  stats?: { label: string; value: string; progress: number }[];
  facts?: string[];
  warning?: string;
  onAcknowledge: () => void;
  onAskFollowUp: () => void;
}

export function OrganCard({
  specialist,
  topic,
  content,
  stats,
  facts,
  warning,
  onAcknowledge,
  onAskFollowUp,
}: OrganCardProps) {
  const sp = getSpecialist(specialist);
  return (
    <div
      className={`relative max-h-[80vh] backdrop-blur-3xl border rounded-[2.5rem] p-7 w-[450px] shadow-2xl duration-500 flex flex-col pointer-events-auto ${sp.bg}`}
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-black/40 rounded-xl flex items-center justify-center shadow-lg border border-white/10">
          <sp.Icon className={`w-6 h-6 ${sp.color}`} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">{sp.name}</h2>
          <p className="text-white/50 text-[10px] uppercase tracking-widest font-bold">{topic}</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-5">
        <div className="bg-black/40 border border-white/5 rounded-2xl p-5 text-white text-sm leading-relaxed">
          {content}
        </div>

        {stats && stats.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Datos clave</h3>
            <div className="grid grid-cols-2 gap-3">
              {stats.map((s, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="text-white/70 text-xs mb-1 truncate">{s.label}</div>
                  <div className="text-white font-bold text-lg mb-2">{s.value}</div>
                  <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-white h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, s.progress))}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {facts && facts.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-[10px] uppercase tracking-widest text-white/50 font-bold">¿Sabías que…?</h3>
            <ul className="space-y-2">
              {facts.map((f, i) => (
                <li key={i} className="flex items-start gap-2 bg-white/[0.03] border border-white/5 rounded-xl p-3 text-white/85 text-xs leading-snug">
                  <Lightbulb className="w-3.5 h-3.5 text-yellow-300 mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {warning && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5" />
            <p className="text-amber-200/80 text-xs font-medium">{warning}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <button onClick={onAskFollowUp} className="py-4 bg-zinc-900/80 hover:bg-zinc-800 text-white font-bold rounded-xl transition-all text-xs border border-white/5">
          Tengo una duda
        </button>
        <button onClick={onAcknowledge} className="py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all shadow-xl text-xs border border-white/10">
          Entendido
        </button>
      </div>
    </div>
  );
}

// ── FinalSummaryCard ───────────────────────────────────────
export function FinalSummaryCard({ summary, onFinish }: { summary: string; onFinish: () => void }) {
  return (
    <div className="relative bg-emerald-950/85 backdrop-blur-3xl border border-emerald-500/25 rounded-[2rem] p-8 w-[380px] shadow-2xl duration-500 pointer-events-auto">
      <div className="flex items-center gap-3 mb-4">
        <CheckCircle2 className="w-6 h-6 text-emerald-300" />
        <span className="text-white/60 text-[10px] uppercase tracking-[0.3em] font-bold">Sesión completa</span>
      </div>
      <p className="text-zinc-200 text-sm leading-relaxed mb-6">{summary}</p>
      <button onClick={onFinish} className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all text-sm">
        Empezar otra exploración
      </button>
    </div>
  );
}
