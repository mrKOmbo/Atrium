"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import {
  WelcomeCard,
  AnalysisCard,
  QuestionCard,
  OrganCard,
  FinalSummaryCard,
  SPECIALIST_IDS,
  getSpecialist,
} from "@/components/atlas/AtlasCards";

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
  objectId?: string;
  region?: string;
  contentId?: string;
};

type UICard =
  | {
      type: "organCard";
      specialist?: string;
      topic: string;
      content: string;
      stats?: { label: string; value: string; progress: number }[];
      facts?: string[];
      warning?: string;
    }
  | { type: "question"; specialist?: string; message: string }
  | { type: "analysis"; specialist?: string; message: string }
  | { type: "summary"; message: string }
  | null;

type Msg = { role: "user" | "assistant"; content: string };

export default function HumanPage() {
  const [history, setHistory] = useState<Msg[]>([]);
  const [pending, setPending] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [taskStatus, setTaskStatus] = useState("Atlas listo. ¿Qué quieres explorar?");
  const [activeSpecialist, setActiveSpecialist] = useState("atlas");
  const [card, setCard] = useState<UICard>(null);
  const humanRef = useRef<HumanInstance | null>(null);
  const lastPickRef = useRef<string | null>(null);

  const developerKey = process.env.NEXT_PUBLIC_BIODIGITAL_KEY ?? "";
  const contentId =
    process.env.NEXT_PUBLIC_BIODIGITAL_CONTENT_ID ??
    "production/maleAdult/skeleton.json";
  const hasKey = developerKey && !developerKey.includes("PASTE_YOUR");

  const widgetSrc = hasKey
    ? `https://human.biodigital.com/widget/?be=${encodeURIComponent(contentId)}&dk=${encodeURIComponent(developerKey)}&ui-anatomy-descriptions=true&ui-anatomy-pronunciations=true&ui-anatomy-labels=false&ui-audio=false&ui-chapter-list=false&ui-fullscreen=false&ui-help=false&ui-info=false&ui-label-list=false&ui-layers=true&ui-loader=circle&ui-media-controls=false&ui-menu=false&ui-nav=true&ui-search=false&ui-tools=true&ui-tutorial=false&ui-undo=false&ui-whiteboard=false&initial.none=false&disable-scroll=false&load-rotate=10`
    : "";

  // Bind Human API
  useEffect(() => {
    if (!sdkReady || !hasKey || humanRef.current) return;
    if (typeof window === "undefined" || !window.HumanAPI) return;
    const h = new window.HumanAPI("biodigital-frame");
    humanRef.current = h;
    window.__atlasHuman = h;
    h.on("human.ready", () => setSceneReady(true));
    h.on("scene.loaded", () => setSceneReady(true));
    h.on("scene.objectsSelected", (data: unknown) => {
      const obj = (data as Record<string, boolean>) || {};
      const id = Object.keys(obj).find((k) => obj[k]);
      if (id) lastPickRef.current = id;
    });
  }, [sdkReady, hasKey]);

  const applyScene = useCallback((cmds: SceneCmd[]) => {
    const h = humanRef.current;
    if (!h || !cmds?.length) return;
    cmds.forEach((cmd, i) => {
      setTimeout(() => {
        try {
          switch (cmd.action) {
            case "highlight":
              if (cmd.objectId) h.send("scene.colorObject", cmd.objectId, "#ff5d2b", true);
              break;
            case "isolate":
              if (cmd.objectId) h.send("scene.showObjects", { [cmd.objectId]: true }, false);
              break;
            case "showAll":
              h.send("scene.reset");
              break;
            case "camera":
              h.send("camera.set", { region: cmd.region || "full" });
              break;
            case "loadScene":
              if (cmd.contentId) h.send("scene.load", cmd.contentId);
              break;
          }
        } catch (e) {
          console.warn("[atlas scene]", e);
        }
      }, 200 + i * 220);
    });
  }, []);

  const send = useCallback(
    async (textRaw: string) => {
      const text = textRaw.trim();
      if (!text || pending) return;
      setHistory((h) => [...h, { role: "user", content: text }]);
      setPending(true);
      setTaskStatus("Atlas analizando…");
      try {
        const res = await fetch("/api/human-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            sceneState: { lastPicked: lastPickRef.current },
            history: history.slice(-6),
          }),
        });
        const data = (await res.json()) as {
          reply?: string;
          scene?: SceneCmd[];
          ui?: UICard;
        };
        if (data.reply) setHistory((h) => [...h, { role: "assistant", content: data.reply || "" }]);
        if (Array.isArray(data.scene)) applyScene(data.scene);
        if (data.ui) {
          const sp = ("specialist" in data.ui && data.ui.specialist) || "atlas";
          if (SPECIALIST_IDS.includes(sp)) setActiveSpecialist(sp);
          setCard(data.ui);
          if (data.ui.type === "organCard") setTaskStatus(`${getSpecialist(sp).name} explica ${data.ui.topic}`);
          else if (data.ui.type === "question") setTaskStatus(`${getSpecialist(sp).name} pregunta…`);
          else if (data.ui.type === "summary") setTaskStatus("Sesión completa");
          else setTaskStatus(`${getSpecialist(sp).name} en escena`);
        } else {
          setTaskStatus("Listo.");
        }
      } catch {
        setTaskStatus("Error contactando a Atlas.");
      } finally {
        setPending(false);
      }
    },
    [pending, history, applyScene]
  );

  // Iniciar con welcome card
  useEffect(() => {
    setCard({ type: "summary", message: "" }); // placeholder hack
    setCard(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeCard = () => {
    setCard(null);
    setTaskStatus("Atlas listo.");
  };

  const showWelcome = card === null && history.length === 0;

  return (
    <>
      <Script
        src="https://developer.biodigital.com/builds/api/2/human-api.min.js"
        strategy="afterInteractive"
        onLoad={() => setSdkReady(true)}
      />

      <main className="relative w-screen h-screen overflow-hidden bg-zinc-950">
        {/* VISOR 3D */}
        {hasKey ? (
          <iframe
            id="biodigital-frame"
            src={widgetSrc}
            className="absolute inset-0 w-full h-full border-none z-0"
            allowFullScreen
            title="BioDigital Human"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 text-white p-8 z-0">
            <div className="max-w-md text-center space-y-4">
              <div className="text-3xl font-semibold tracking-tight">ATLAS</div>
              <div className="text-sm opacity-70 leading-relaxed">
                Esperando credenciales de BioDigital. Edita
                <code className="mx-1 px-1.5 py-0.5 bg-white/10 rounded text-[12px]">.env</code>
                y reemplaza
                <code className="mx-1 px-1.5 py-0.5 bg-white/10 rounded text-[12px]">
                  NEXT_PUBLIC_BIODIGITAL_KEY
                </code>
                con tu developerKey de
                <a
                  href="https://developer.biodigital.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 underline opacity-90 hover:opacity-100"
                >
                  developer.biodigital.com
                </a>
                . El chat con Atlas funciona ya — pruébalo.
              </div>
            </div>
          </div>
        )}

        {/* OVERLAY */}
        <div className="absolute inset-0 pointer-events-none z-[100]">
          {showWelcome && <WelcomeCard onSendMessage={send} />}
          {card?.type === "organCard" && (
            <OrganCard
              specialist={card.specialist || activeSpecialist}
              topic={card.topic}
              content={card.content}
              stats={card.stats}
              facts={card.facts}
              warning={card.warning}
              onAcknowledge={closeCard}
              onAskFollowUp={() => {
                setCard(null);
                setTaskStatus("¿Qué quieres saber?");
              }}
            />
          )}
          {card?.type === "question" && (
            <QuestionCard
              specialist={card.specialist || activeSpecialist}
              message={card.message}
              onSubmit={(answer) => {
                setCard(null);
                send(answer);
              }}
            />
          )}
          {card?.type === "analysis" && (
            <AnalysisCard
              specialist={card.specialist || activeSpecialist}
              message={card.message}
            />
          )}
          {card?.type === "summary" && card.message && (
            <FinalSummaryCard
              summary={card.message}
              onFinish={() => {
                setCard(null);
                setHistory([]);
              }}
            />
          )}
        </div>

        {/* HUD STATUS top-left */}
        <div className="absolute top-10 left-10 pointer-events-none z-50">
          <div className="bg-black/60 backdrop-blur-3xl border border-white/5 rounded-3xl p-6 min-w-[280px] shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-2 h-2 rounded-full ${
                  pending ? "bg-amber-400 animate-pulse" : sceneReady || !hasKey ? "bg-emerald-400" : "bg-orange-400"
                }`}
              />
              <span className="text-white/40 font-bold tracking-[0.3em] uppercase text-[9px]">
                Atlas Protocol
              </span>
            </div>
            <p className="text-white text-sm font-light tracking-wide italic">"{taskStatus}"</p>
          </div>
        </div>

        {/* HUD ESPECIALISTAS bottom-left */}
        <div className="absolute bottom-10 left-10 pointer-events-none z-50">
          <div className="bg-black/40 backdrop-blur-2xl border border-white/5 rounded-2xl p-2 flex flex-col gap-1.5 shadow-xl">
            {SPECIALIST_IDS.map((id) => {
              const sp = getSpecialist(id);
              const active = activeSpecialist === id;
              return (
                <div
                  key={id}
                  className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-700 ${
                    active
                      ? "bg-white/10 translate-x-2 border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.06)]"
                      : "opacity-30"
                  }`}
                >
                  <sp.Icon className={`w-3.5 h-3.5 ${active ? sp.color : "text-white/60"}`} />
                  <span className="text-white text-[9px] font-bold uppercase tracking-[0.2em]">
                    {sp.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* QUICK PROMPT bar bottom-center (siempre disponible si no hay welcome) */}
        {!showWelcome && (
          <QuickInput onSend={send} pending={pending} />
        )}
      </main>
    </>
  );
}

function QuickInput({ onSend, pending }: { onSend: (t: string) => void; pending: boolean }) {
  const [v, setV] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (v.trim()) {
          onSend(v.trim());
          setV("");
        }
      }}
      className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 pointer-events-auto flex gap-2 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-2xl"
    >
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder="Pregúntale a Atlas…"
        disabled={pending}
        className="bg-transparent text-white placeholder:text-white/30 outline-none px-4 py-2 w-[420px] text-sm"
      />
      <button
        type="submit"
        disabled={pending || !v.trim()}
        className="px-4 py-2 bg-white text-black font-bold rounded-xl text-xs disabled:opacity-40 hover:bg-zinc-200 transition"
      >
        {pending ? "…" : "Enviar"}
      </button>
    </form>
  );
}
