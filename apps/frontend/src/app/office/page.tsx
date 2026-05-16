"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const AGENTS = [
  { id: "pixel", name: "Pixel", role: "Frontend Eng", color: "#ff7849" },
  { id: "nova", name: "Nova", role: "Backend Eng", color: "#60a5fa" },
  { id: "echo", name: "Echo", role: "PM", color: "#a78bfa" },
  { id: "jade", name: "Jade", role: "Designer", color: "#4ade80" },
  { id: "ember", name: "Ember", role: "Researcher", color: "#f472b6" },
  { id: "rune", name: "Rune", role: "Ops", color: "#facc15" },
];

type Msg = { role: "user" | "assistant"; content: string; speakerId?: string };
type Cmd = { agentId: string; intent: string; targetId?: string };

export default function OfficePage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [speakerId, setSpeakerId] = useState("pixel");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const onMsg = (ev: MessageEvent) => {
      if (ev.data?.type === "office-ready") setReady(true);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const post = useCallback((data: Record<string, unknown>) => {
    iframeRef.current?.contentWindow?.postMessage(data, "*");
  }, []);

  const dispatchCommands = useCallback(
    (cmds: Cmd[]) => {
      cmds.forEach((cmd, i) => {
        if (!cmd?.agentId || !cmd?.intent) return;
        setTimeout(() => {
          post({
            type: "dispatchIntent",
            agentId: cmd.agentId,
            intent: cmd.intent,
            opts: cmd.intent === "talk-to" ? { targetId: cmd.targetId } : {},
          });
        }, 180 + i * 140);
      });
    },
    [post]
  );

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || pending) return;
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setPending(true);
    try {
      const res = await fetch("/api/office-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, speakerId }),
      });
      const data = await res.json();
      if (data?.reply) {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: data.reply, speakerId },
        ]);
      }
      if (Array.isArray(data?.commands)) dispatchCommands(data.commands as Cmd[]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Error contactando a Gemini.", speakerId },
      ]);
    } finally {
      setPending(false);
    }
  }, [input, pending, speakerId, dispatchCommands]);

  const speaker = AGENTS.find((a) => a.id === speakerId)!;

  return (
    <div className="flex h-screen w-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* IFRAME 3D OFFICE */}
      <div className="flex-1 relative">
        <iframe
          ref={iframeRef}
          src="/office/index.html"
          className="w-full h-full border-0"
          title="CLAW3D Office"
        />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur">
            <div className="text-sm opacity-60">Cargando oficina 3D…</div>
          </div>
        )}
      </div>

      {/* SIDEBAR CHAT */}
      <aside className="w-[380px] flex flex-col border-l border-white/10 bg-[#0d0d0d]">
        <header className="px-4 py-3 border-b border-white/10">
          <div className="text-xs uppercase tracking-wider opacity-60">
            Generative UI · CLAW3D HQ
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: speaker.color }}
            />
            <span className="font-medium">{speaker.name}</span>
            <span className="opacity-50 text-sm">{speaker.role}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {AGENTS.map((a) => (
              <button
                key={a.id}
                onClick={() => setSpeakerId(a.id)}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition ${
                  a.id === speakerId
                    ? "border-white/40 bg-white/10"
                    : "border-white/10 hover:border-white/30"
                }`}
                style={
                  a.id === speakerId ? { color: a.color } : { opacity: 0.7 }
                }
              >
                {a.name}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm">
          {messages.length === 0 && (
            <div className="opacity-50 text-xs leading-relaxed">
              <p className="mb-2">
                Hablas con <b>{speaker.name}</b>. Ejemplos:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                <li>“junta de equipo ahora”</li>
                <li>“todos a trabajar”</li>
                <li>“{speaker.name}, ve a pensar un rato”</li>
                <li>“pixel, ve a hablar con echo”</li>
              </ul>
            </div>
          )}
          {messages.map((m, i) => {
            const ag = AGENTS.find((a) => a.id === m.speakerId);
            return (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-[13px] leading-snug ${
                    m.role === "user"
                      ? "bg-white/10 text-white"
                      : "bg-white/[0.04] border border-white/5"
                  }`}
                  style={
                    m.role === "assistant" && ag
                      ? { borderLeft: `3px solid ${ag.color}` }
                      : undefined
                  }
                >
                  {m.role === "assistant" && ag && (
                    <div className="text-[10px] opacity-60 mb-0.5">
                      {ag.name}
                    </div>
                  )}
                  {m.content}
                </div>
              </div>
            );
          })}
          {pending && (
            <div className="opacity-60 text-xs flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-white/40 animate-pulse" />
              {speaker.name} está pensando…
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="p-3 border-t border-white/10 flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Hablale a ${speaker.name}…`}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[13px] outline-none focus:border-white/30"
            disabled={pending || !ready}
          />
          <button
            type="submit"
            disabled={pending || !ready || !input.trim()}
            className="px-3 py-2 rounded-xl bg-white/15 text-[13px] hover:bg-white/25 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Enviar
          </button>
        </form>
      </aside>
    </div>
  );
}
