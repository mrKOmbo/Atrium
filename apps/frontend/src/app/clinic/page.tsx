"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { User, Users, Columns2, X, Sparkles, Dna, Mic, MicOff } from "lucide-react";
import { lookupScript } from "@/lib/clinicScript";
import {
  AnalysisCard,
  QuestionCard,
  OrganCard,
  FinalSummaryCard,
  WelcomeCard,
  SPECIALIST_IDS,
  getSpecialist,
} from "@/components/atlas/AtlasCards";
import HumanBody3D, { regionToOrganHint, objectIdToBodyRegion } from "@/components/clinic/HumanBody3D";
import { REGION_CARDS } from "@/components/clinic/body-cards";
import GenealogyTree from "@/components/genealogy/GenealogyTree";
import OrganVisualizer from "@/components/organ-viz/OrganVisualizer";

declare global {
  interface Window {
    HumanAPI?: new (frameId: string) => HumanInstance;
    __atlasHuman?: HumanInstance;
  }
}
interface HumanInstance {
  on: (event: string, cb: (data: unknown) => void) => void;
  send: (method: string, ...args: unknown[]) => void;
}

type SceneCmd = {
  action: "highlight" | "isolate" | "showAll" | "camera" | "loadScene";
  objectId?: string; region?: string; contentId?: string;
};
type OfficeCmd = { agentId: string; intent: string; targetId?: string };
type Choice = { label: string; icon?: string; value: string };
type UICard =
  | { type: "organCard"; specialist?: string; topic: string; content: string; stats?: { label: string; value: string; progress: number }[]; facts?: string[]; warning?: string }
  | { type: "question"; specialist?: string; message: string; choices?: Choice[] }
  | { type: "analysis"; specialist?: string; message: string }
  | { type: "summary"; message: string }
  | null;

type ViewMode = "patient" | "team" | "split";

const SPECIALIST_TO_INTERNAL: Record<string, string> = {
  atlas: "echo", pulso: "nova", synapse: "pixel",
  aire: "jade", vesta: "ember", vitrum: "rune",
};

const REGION_PROMPTS: Record<string, string> = {
  head: "Synapse, ¿qué pasa con la cabeza?",
  brain: "Synapse, explícame el cerebro",
  torso_chest: "Pulso, examina el pecho",
  heart: "Pulso, muéstrame el corazón",
  lungs: "Aire, muéstrame los pulmones",
  torso_abdomen: "Vesta, revisa el abdomen",
  stomach: "Vesta, ¿qué hay con el estómago?",
  liver: "Vesta, examina el hígado",
  kidneys: "Vesta, muéstrame los riñones",
  pelvis: "Vitrum, revisa la pelvis",
  arm_left: "Vitrum, examina el brazo izquierdo",
  arm_right: "Vitrum, examina el brazo derecho",
  leg_left: "Vitrum, examina la pierna izquierda",
  leg_right: "Vitrum, examina la pierna derecha",
  hand_left: "Vitrum, ¿qué hay con la mano izquierda?",
  hand_right: "Vitrum, ¿qué hay con la mano derecha?",
  foot_left: "Vitrum, examina el pie izquierdo",
  foot_right: "Vitrum, examina el pie derecho",
  skeleton: "Vitrum, muéstrame el esqueleto",
};

function organToSpecialist(objectId: string): string | null {
  const id = objectId.toLowerCase();
  if (/heart|cardio|atri|ventric|aort|coronar|circulat/.test(id)) return "pulso";
  if (/brain|cerebr|neur|spinal|cortex|cerebell|hippocamp|nerve/.test(id)) return "synapse";
  if (/lung|pulm|bronch|trache|alveol|respir/.test(id)) return "aire";
  if (/stomach|intest|liver|panc|gastr|colon|hepat|digest/.test(id)) return "vesta";
  if (/skelet|bone|skull|vertebr|femur|cranium|musc|tendon|ligament/.test(id)) return "vitrum";
  return "atlas";
}

export default function ClinicPage() {
  const [view, setView] = useState<ViewMode>("team");
  const [history, setHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [pending, setPending] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [activeSpecialist, setActiveSpecialist] = useState("atlas");
  const [card, setCard] = useState<UICard>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showRoster, setShowRoster] = useState(false);
  const [bodyHighlight, setBodyHighlight] = useState<string | null>(null);
  const [showGenealogy, setShowGenealogy] = useState(false);
  const [quickActions, setQuickActions] = useState<Choice[]>([
    { label: "Corazón", icon: "heart", value: "Pulso, muéstrame el corazón" },
    { label: "Cerebro", icon: "brain", value: "Synapse, explícame el cerebro" },
    { label: "Pulmones", icon: "lung", value: "Aire, muéstrame los pulmones" },
    { label: "Junta clínica", icon: "users", value: "Convoca al equipo a junta clínica" },
  ]);

  const humanRef = useRef<HumanInstance | null>(null);
  const officeRef = useRef<HTMLIFrameElement>(null);
  const lastPickRef = useRef<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const developerKey = process.env.NEXT_PUBLIC_BIODIGITAL_KEY ?? "";
  const contentId = process.env.NEXT_PUBLIC_BIODIGITAL_CONTENT_ID ?? "production/maleAdult/skeleton.json";
  const hasKey = developerKey && !developerKey.includes("PASTE_YOUR");

  const widgetSrc = hasKey
    ? `https://human.biodigital.com/widget/?be=${encodeURIComponent(contentId)}&dk=${encodeURIComponent(developerKey)}&ui-anatomy-descriptions=true&ui-anatomy-pronunciations=true&ui-anatomy-labels=false&ui-audio=false&ui-chapter-list=false&ui-fullscreen=false&ui-help=false&ui-info=false&ui-label-list=false&ui-layers=true&ui-loader=circle&ui-media-controls=false&ui-menu=false&ui-nav=true&ui-search=false&ui-tools=true&ui-tutorial=false&ui-undo=false&ui-whiteboard=false&initial.none=false&disable-scroll=false&load-rotate=10`
    : "";

  // URL sync
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("view") as ViewMode | null;
    if (v && ["patient", "team", "split"].includes(v)) setView(v);
  }, []);
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("view", view);
    window.history.replaceState({}, "", url.toString());
  }, [view]);

  // BioDigital bind
  useEffect(() => {
    if (!sdkReady || !hasKey || humanRef.current) return;
    if (typeof window === "undefined" || !window.HumanAPI) return;
    const tryBind = () => {
      if (!document.getElementById("biodigital-frame")) return false;
      const h = new window.HumanAPI!("biodigital-frame");
      humanRef.current = h;
      window.__atlasHuman = h;
      h.on("scene.loaded", () => {});
      h.on("scene.objectsSelected", (data: unknown) => {
        const obj = (data as Record<string, boolean>) || {};
        const id = Object.keys(obj).find((k) => obj[k]);
        if (!id) return;
        lastPickRef.current = id;
        const sp = organToSpecialist(id);
        if (sp) {
          setActiveSpecialist(sp);
          const internal = SPECIALIST_TO_INTERNAL[sp];
          if (internal) officeRef.current?.contentWindow?.postMessage({
            type: "dispatchIntent", agentId: internal, intent: "work", opts: {},
          }, "*");
          showToast(`${getSpecialist(sp).name} se acerca al caso`);
        }
      });
      return true;
    };
    if (!tryBind()) {
      const t = setInterval(() => { if (tryBind()) clearInterval(t); }, 400);
      return () => clearInterval(t);
    }
  }, [sdkReady, hasKey, view]);

  const showToast = (msg: string, ms = 3500) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), ms);
  };

  const applyScene = useCallback((cmds: SceneCmd[]) => {
    if (!cmds?.length) return;
    const h = humanRef.current;
    cmds.forEach((cmd, i) => {
      setTimeout(() => {
        // mirror highlight onto our 3D body (works with or without BioDigital)
        if (cmd.action === "highlight" || cmd.action === "isolate") {
          const region = objectIdToBodyRegion(cmd.objectId);
          if (region) setBodyHighlight(region);
        } else if (cmd.action === "showAll") {
          setBodyHighlight(null);
        }
        // forward to BioDigital if present
        if (!h) return;
        try {
          switch (cmd.action) {
            case "highlight": if (cmd.objectId) h.send("scene.colorObject", cmd.objectId, "#ff5d2b", true); break;
            case "isolate": if (cmd.objectId) h.send("scene.showObjects", { [cmd.objectId]: true }, false); break;
            case "showAll": h.send("scene.reset"); break;
            case "camera": h.send("camera.set", { region: cmd.region || "full" }); break;
            case "loadScene": if (cmd.contentId) h.send("scene.load", cmd.contentId); break;
          }
        } catch (e) { console.warn("[scene]", e); }
      }, 200 + i * 220);
    });
  }, []);

  const applyOffice = useCallback((cmds: OfficeCmd[]) => {
    if (!cmds?.length || !officeRef.current?.contentWindow) return;
    cmds.forEach((cmd, i) => {
      setTimeout(() => {
        officeRef.current?.contentWindow?.postMessage({
          type: "dispatchIntent",
          agentId: cmd.agentId, intent: cmd.intent,
          opts: cmd.intent === "talk-to" ? { targetId: cmd.targetId } : {},
        }, "*");
      }, 240 + i * 180);
    });
  }, []);

  // Hardcoded flow — sin LLM, instantáneo. Usa scripts en /lib/clinicScript.
  const send = useCallback(
    (textRaw: string, _opts: { previousCard?: { type: string; specialist?: string; topic?: string } } = {}) => {
      const text = textRaw.trim();
      if (!text || pending) return;
      setShowWelcome(false);
      setHistory((h) => [...h, { role: "user", content: text }]);
      setPending(true);
      const data = lookupScript(text);
      if (Array.isArray(data.quickActions) && data.quickActions.length > 0) {
        setQuickActions(data.quickActions);
      }
      if (data.reply) setHistory((h) => [...h, { role: "assistant", content: data.reply || "" }]);
      if (Array.isArray(data.scene)) applyScene(data.scene);
      if (Array.isArray(data.office)) applyOffice(data.office);
      if (data.ui) {
        const sp = ("specialist" in data.ui && data.ui.specialist) || activeSpecialist;
        if (SPECIALIST_IDS.includes(sp)) setActiveSpecialist(sp);
        let nextCard: UICard = data.ui;
        if (data.ui.type === "analysis" && /\?/.test(data.ui.message)) {
          nextCard = { type: "question", specialist: sp, message: data.ui.message };
        }
        setCard(nextCard);
        if (nextCard.type === "organCard") showToast(`${getSpecialist(sp).name} · ${nextCard.topic}`, 4000);
        else if (nextCard.type === "summary") showToast("Sesión completa", 4000);
        else if (nextCard.type === "question") showToast(`${getSpecialist(sp).name} pregunta`, 3000);
        else if (nextCard.type === "analysis") showToast(`${getSpecialist(sp).name} · ${nextCard.message}`, 3500);
      }
      // micro-delay para que el toast de "analizando" no se sienta artificial
      setTimeout(() => setPending(false), 80);
    },
    [pending, applyScene, applyOffice, activeSpecialist]
  );

  const closeCard = () => { setCard(null); setBodyHighlight(null); };

  // Auto-dismiss de AnalysisCard (es solo transición, sin botones)
  useEffect(() => {
    if (card?.type !== "analysis") return;
    const t = setTimeout(() => setCard(null), 3500);
    return () => clearTimeout(t);
  }, [card]);

  // Listener: chat interno del office posteando al parent
  useEffect(() => {
    const onMsg = (ev: MessageEvent) => {
      const data = ev.data;
      if (!data || typeof data !== "object") return;
      if (data.type === "agent-chat" && typeof data.text === "string") {
        // Mapear el agentId interno al specialist y disparar el script hardcoded
        const internalToSpec: Record<string, string> = {
          echo: "atlas", nova: "pulso", pixel: "synapse",
          jade: "aire", ember: "vesta", rune: "vitrum",
        };
        const sp = internalToSpec[data.agentId] || "atlas";
        // Prefijo el texto con el especialista para que el lookup funcione
        const speakerName = getSpecialist(sp).name;
        send(`${speakerName}, ${data.text}`);
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [send]);

  // "Tengo una duda" → abre QuestionCard local del mismo especialista, sin ir al LLM aún.
  const askFollowUp = (prevCard: NonNullable<UICard>) => {
    if (prevCard.type !== "organCard") { setCard(null); return; }
    const sp = prevCard.specialist || activeSpecialist;
    setCard({
      type: "question",
      specialist: sp,
      message: `¿Qué quieres profundizar sobre ${prevCard.topic}?`,
    });
  };

  // ESC cierra card / welcome / roster
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (showGenealogy) setShowGenealogy(false);
      else if (card) setCard(null);
      else if (showRoster) setShowRoster(false);
      else if (showWelcome && history.length === 0) {} // welcome inicial no cierra
      else setShowWelcome(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [card, showRoster, showWelcome, showGenealogy, history.length]);

  const handleBodyPick = useCallback((region: string) => {
    const organHint = regionToOrganHint(region);
    lastPickRef.current = organHint;
    setBodyHighlight(region);
    setShowWelcome(false);

    const cardData = REGION_CARDS[region];
    const sp = cardData?.specialist || organToSpecialist(organHint) || activeSpecialist;
    if (sp && SPECIALIST_IDS.includes(sp)) setActiveSpecialist(sp);

    // tell the office to put the matching agent into "work" stance
    const internal = SPECIALIST_TO_INTERNAL[sp];
    if (internal) officeRef.current?.contentWindow?.postMessage({
      type: "dispatchIntent", agentId: internal, intent: "work", opts: {},
    }, "*");

    if (cardData) {
      setCard(cardData);
      showToast(`${getSpecialist(sp).name} · ${cardData.topic}`, 4000);
    } else {
      showToast(`${getSpecialist(sp).name} se acerca al caso`);
    }
  }, [activeSpecialist]);

  // ── Voice input → match keywords to body regions and trigger same flow as a click
  const handleVoiceInput = useCallback((text: string) => {
    const t = text.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
    const KEYWORD_REGION: Array<[RegExp, string]> = [
      [/\b(corazon|coraz|cardio|latido)\b/, "heart"],
      [/\b(cerebro|cerebr|sistema nervioso|cerebral|hipocampo)\b/, "brain"],
      [/\b(pulmon|pulmones|respira)\b/, "lungs"],
      [/\b(estomago|gastrico|gastrica)\b/, "stomach"],
      [/\b(higado|hepat)\b/, "liver"],
      [/\b(rinon|rinones|kidney|renal)\b/, "kidneys"],
      [/\b(cabeza|craneo)\b/, "head"],
      [/\b(pecho|torax|cardiopulmon)\b/, "torso_chest"],
      [/\b(abdomen|panza|barriga|vientre)\b/, "torso_abdomen"],
      [/\b(pelvis|cadera)\b/, "pelvis"],
      [/\b(brazo izq|brazo izquierdo)\b/, "arm_left"],
      [/\b(brazo der|brazo derecho)\b/, "arm_right"],
      [/\bbrazo\b/, "arm_right"],
      [/\b(pierna izq|pierna izquierda)\b/, "leg_left"],
      [/\b(pierna der|pierna derecha)\b/, "leg_right"],
      [/\bpierna\b/, "leg_right"],
      [/\b(mano izq|mano izquierda)\b/, "hand_left"],
      [/\b(mano der|mano derecha)\b/, "hand_right"],
      [/\bmano\b/, "hand_right"],
      [/\b(pie izq|pie izquierdo)\b/, "foot_left"],
      [/\b(pie der|pie derecho)\b/, "foot_right"],
      [/\bpie\b/, "foot_right"],
      [/\b(esqueleto|huesos)\b/, "skeleton"],
    ];
    for (const [re, region] of KEYWORD_REGION) {
      if (re.test(t)) { handleBodyPick(region); return; }
    }
    showToast(`No te entendí: "${text}"`, 3000);
  }, [handleBodyPick]);

  const patientLayer = hasKey ? (
    <iframe id="biodigital-frame" src={widgetSrc} className="w-full h-full border-none" allowFullScreen title="BioDigital Human" />
  ) : (
    <HumanBody3D
      onPickRegion={handleBodyPick}
      highlightRegion={bodyHighlight}
      focusRegion={card?.type === "organCard" ? bodyHighlight : null}
    />
  );

  const teamLayer = (
    <iframe ref={officeRef} src="/office/index.html?embed=1" className="w-full h-full border-none" title="Atrium Clinic Team" />
  );

  return (
    <>
      <Script src="https://developer.biodigital.com/builds/api/2/human-api.min.js" strategy="afterInteractive" onLoad={() => setSdkReady(true)} />

      <main className="relative w-screen h-screen overflow-hidden bg-[#08090c] text-white">
        {/* ── ESCENA 3D FULLSCREEN ──────────────────────────── */}
        <div className="absolute inset-0 z-0">
          {view === "patient" && patientLayer}
          {view === "team" && teamLayer}
          {view === "split" && (
            <div className="w-full h-full flex">
              <div className="w-1/2 h-full border-r border-white/5">{patientLayer}</div>
              <div className="w-1/2 h-full">{teamLayer}</div>
            </div>
          )}
        </div>

        {/* ── TOAST EFÍMERO TOP-RIGHT (no choca con cards top-left) ── */}
        <div className="absolute top-6 right-6 z-40 pointer-events-none">
          <div
            className={`px-4 py-2.5 rounded-full bg-black/70 backdrop-blur-2xl border border-white/10 shadow-2xl flex items-center gap-2.5 transition-all duration-500 ${
              toast ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${pending ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`}
            />
            <span className="text-[11px] uppercase tracking-[0.25em] font-semibold text-white/50">Atrium</span>
            <span className="text-[12px] text-white/90 font-light italic">{toast || ""}</span>
          </div>
        </div>

        {/* ── PANEL LATERAL TOP-LEFT (sin backdrop, deja ver el hospital) ── */}
        {(card || (showWelcome && history.length === 0)) && (
          <div className="absolute top-6 left-6 z-[100] pointer-events-auto animate-in slide-in-from-left-3 fade-in duration-300">
            <div className="relative">
              {card?.type === "organCard" && (
                <OrganCard
                  specialist={card.specialist || activeSpecialist}
                  topic={card.topic}
                  content={card.content}
                  stats={card.stats}
                  facts={card.facts}
                  warning={card.warning}
                  onAcknowledge={closeCard}
                  onAskFollowUp={() => askFollowUp(card)}
                />
              )}
              {card?.type === "question" && (
                <QuestionCard
                  specialist={card.specialist || activeSpecialist}
                  message={card.message}
                  choices={card.choices}
                  onSubmit={(answer) => {
                    const prev = card;
                    setCard(null);
                    send(answer, { previousCard: { type: "question", specialist: prev.specialist, topic: prev.message } });
                  }}
                />
              )}
              {card?.type === "analysis" && (
                <AnalysisCard specialist={card.specialist || activeSpecialist} message={card.message} />
              )}
              {card?.type === "summary" && card.message && (
                <FinalSummaryCard summary={card.message} onFinish={() => { setCard(null); setHistory([]); setShowWelcome(true); }} />
              )}
              {!card && showWelcome && history.length === 0 && (
                <WelcomeCard onSendMessage={(msg) => { setShowWelcome(false); send(msg); }} />
              )}

              {card && card.type !== "analysis" && (
                <button
                  onClick={closeCard}
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-zinc-900 border border-white/15 text-white/70 hover:text-white hover:bg-zinc-800 flex items-center justify-center transition shadow-xl"
                  aria-label="Cerrar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── ROSTER FLOTANTE (cuando se abre) ──────────────── */}
        {showRoster && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-auto animate-in slide-in-from-bottom-3 fade-in duration-300">
            <div className="bg-black/70 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 flex gap-1 shadow-2xl">
              {SPECIALIST_IDS.map((id) => {
                const sp = getSpecialist(id);
                const active = activeSpecialist === id;
                return (
                  <button
                    key={id}
                    onClick={() => {
                      setActiveSpecialist(id);
                      setShowRoster(false);
                      const internal = SPECIALIST_TO_INTERNAL[id];
                      if (internal) officeRef.current?.contentWindow?.postMessage({
                        type: "dispatchIntent", agentId: internal, intent: "work", opts: {},
                      }, "*");
                      showToast(`${sp.name} activo`);
                    }}
                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                      active ? "bg-white/10 border border-white/15" : "hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <sp.Icon className={`w-4 h-4 ${active ? sp.color : "text-white/50"}`} />
                    <span className="text-[9px] uppercase tracking-[0.18em] font-bold text-white/80">{sp.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── BOTÓN FLOTANTE: ÁRBOL GENEALÓGICO (solo en patient) ── */}
        {(view === "patient" || view === "split") && !showGenealogy && (
          <button
            onClick={() => setShowGenealogy(true)}
            className="absolute top-20 right-6 z-40 group flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-black/70 backdrop-blur-2xl border border-white/10 hover:border-orange-400/40 shadow-2xl transition-all hover:scale-[1.02] pointer-events-auto"
            title="Ver árbol genealógico del paciente"
          >
            <span className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-rose-600 grid place-items-center shadow-md shadow-orange-500/30">
              <Dna className="w-3.5 h-3.5 text-white" />
            </span>
            <div className="flex flex-col items-start leading-tight">
              <span className="text-[9px] uppercase tracking-[0.25em] text-white/45 font-bold">Pedigrí</span>
              <span className="text-[12px] font-semibold text-white/90">Árbol genealógico</span>
            </div>
            <span className="ml-1 px-1.5 py-0.5 rounded-md bg-orange-500/15 border border-orange-500/30 text-[9px] uppercase tracking-[0.18em] font-bold text-orange-200">
              4 gen
            </span>
          </button>
        )}

        {/* ── OVERLAY: ÁRBOL GENEALÓGICO ─────────────────────── */}
        {showGenealogy && <GenealogyTree onClose={() => setShowGenealogy(false)} />}

        {/* ── VISUALIZADOR DE ÓRGANO (cuando hay organCard de heart/brain/lungs) ── */}
        {!showGenealogy && card?.type === "organCard" && (
          <OrganVisualizer topic={card.topic} />
        )}

        {/* ── DOCK CHIPS CONTEXTUALES ────────────────────────── */}
        <DockChips
          chips={quickActions}
          onPick={send}
          onVoice={handleVoiceInput}
          pending={pending}
          activeSpecialist={activeSpecialist}
          onToggleRoster={() => setShowRoster((s) => !s)}
          rosterOpen={showRoster}
          view={view}
          onChangeView={setView}
        />
      </main>
    </>
  );
}

// ── COMPONENTES ────────────────────────────────────────────

function DockChips({
  chips, onPick, onVoice, pending, activeSpecialist, onToggleRoster, rosterOpen, view, onChangeView,
}: {
  chips: Choice[];
  onPick: (t: string) => void;
  onVoice?: (text: string) => void;
  pending: boolean;
  activeSpecialist: string;
  onToggleRoster: () => void;
  rosterOpen: boolean;
  view: ViewMode;
  onChangeView: (v: ViewMode) => void;
}) {
  const sp = getSpecialist(activeSpecialist);
  const [listening, setListening] = useState(false);
  const recogRef = useRef<{ stop: () => void } | null>(null);

  const startVoice = () => {
    type SR = new () => {
      lang: string;
      continuous: boolean;
      interimResults: boolean;
      onstart: (() => void) | null;
      onend: (() => void) | null;
      onerror: ((ev: { error?: string }) => void) | null;
      onresult: (ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
      start: () => void;
      stop: () => void;
    };
    const w = window as unknown as { SpeechRecognition?: SR; webkitSpeechRecognition?: SR };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      alert("Tu navegador no soporta reconocimiento de voz. Probá Chrome o Edge.");
      return;
    }
    if (listening) { recogRef.current?.stop(); return; }
    const r = new SR();
    r.lang = "es-ES";
    r.continuous = false;
    r.interimResults = false;
    r.onstart = () => setListening(true);
    r.onend = () => { setListening(false); recogRef.current = null; };
    r.onerror = () => { setListening(false); recogRef.current = null; };
    r.onresult = (ev) => {
      const t = ev.results[0][0].transcript;
      if (onVoice) onVoice(t);
    };
    recogRef.current = r;
    r.start();
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
      <div className="bg-black/70 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl flex items-center gap-1.5 p-1.5">
        {/* Specialist chip / abre roster */}
        <button
          type="button"
          onClick={onToggleRoster}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-[0.18em] transition ${
            rosterOpen ? "bg-white/15 text-white" : "hover:bg-white/5 text-white/80"
          }`}
        >
          <sp.Icon className={`w-3.5 h-3.5 ${sp.color}`} />
          <span>{sp.name}</span>
        </button>

        <span className="w-px h-6 bg-white/10" />

        {/* Chips contextuales */}
        <div className="flex gap-1 max-w-[640px] overflow-x-auto">
          {chips.slice(0, 5).map((c, i) => {
            const Icon = getDockIcon(c.icon);
            return (
              <button
                key={i}
                onClick={() => !pending && onPick(c.value)}
                disabled={pending}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/25 text-[11px] text-white/85 font-medium transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                <Icon className="w-3.5 h-3.5 text-white/70" />
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>

        <span className="w-px h-6 bg-white/10" />

        {/* Voice button */}
        <button
          type="button"
          onClick={startVoice}
          title={listening ? "Escuchando…" : "Hablar"}
          aria-label={listening ? "Detener reconocimiento" : "Activar reconocimiento de voz"}
          className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition ${
            listening
              ? "bg-rose-600 text-white shadow-lg shadow-rose-600/40"
              : "bg-white/5 hover:bg-white/15 text-white/75 hover:text-white border border-white/10 hover:border-white/25"
          }`}
        >
          {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          {listening && (
            <span className="absolute inset-0 rounded-xl border-2 border-rose-400/70 animate-ping pointer-events-none" />
          )}
        </button>

        <span className="w-px h-6 bg-white/10" />

        {/* View toggle */}
        <div className="flex gap-0.5 px-1">
          <ViewIcon active={view === "patient"} onClick={() => onChangeView("patient")} icon={<User className="w-3.5 h-3.5" />} title="Patient" />
          <ViewIcon active={view === "team"} onClick={() => onChangeView("team")} icon={<Users className="w-3.5 h-3.5" />} title="Team" />
          <ViewIcon active={view === "split"} onClick={() => onChangeView("split")} icon={<Columns2 className="w-3.5 h-3.5" />} title="Split" />
        </div>
      </div>
    </div>
  );
}

import { Heart, Brain, Wind, Salad, Bone, Activity, AlertTriangle, Search, Stethoscope, Microscope, Syringe, Pill, Scan, Baby } from "lucide-react";
function getDockIcon(key?: string): React.FC<{ className?: string }> {
  const map: Record<string, React.FC<{ className?: string }>> = {
    heart: Heart, brain: Brain, lung: Wind, stomach: Salad, bone: Bone,
    sparkles: Sparkles, activity: Activity, wind: Wind, alert: AlertTriangle,
    search: Search, stethoscope: Stethoscope, microscope: Microscope,
    syringe: Syringe, pill: Pill, "x-ray": Scan, baby: Baby, user: User, users: Users,
  };
  return map[key || ""] || Sparkles;
}

function ViewIcon({ active, onClick, icon, title }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
        active ? "bg-white text-black shadow" : "text-white/50 hover:text-white hover:bg-white/5"
      }`}
    >
      {icon}
    </button>
  );
}

function _UnusedWelcomePanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="bg-zinc-950/90 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-10 w-[460px] shadow-2xl text-center space-y-6">
      <div className="flex items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center shadow-lg">
          <Sparkles className="w-6 h-6 text-white fill-white/20" />
        </div>
      </div>
      <button onClick={onClose} className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition text-sm">Empezar</button>
    </div>
  );
}
