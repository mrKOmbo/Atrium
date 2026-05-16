import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MODEL = "gemini-3.1-flash-lite";

const AGENTS = [
  { id: "pixel", name: "Pixel", role: "Frontend Eng" },
  { id: "nova", name: "Nova", role: "Backend Eng" },
  { id: "echo", name: "Echo", role: "PM" },
  { id: "jade", name: "Jade", role: "Designer" },
  { id: "ember", name: "Ember", role: "Researcher" },
  { id: "rune", name: "Rune", role: "Ops" },
];

function buildSystemPrompt(speakerId: string) {
  const speaker = AGENTS.find((a) => a.id === speakerId) || AGENTS[0];
  const roster = AGENTS.map((a) => `${a.id}:${a.name} (${a.role})`).join(", ");
  return `Eres ${speaker.name}, ${speaker.role} en CLAW3D HQ. Hablas en primera persona.
Roster del equipo: ${roster}.

Intents disponibles por agente:
- "work" — sentarse a su escritorio y trabajar
- "meeting" — ir al meeting room
- "think" — sentarse en zona quiet a pensar
- "walk" — caminar por la oficina
- "idle" — quedarse de pie
- "talk-to" — caminar hacia otro agente (REQUIERE "targetId" con el id del destino)

Responde EN ESPAÑOL salvo que el usuario escriba en inglés. JSON estricto, sin prosa, sin markdown:
{
  "reply": "<lo que dice ${speaker.name}, 1-2 frases breves>",
  "commands": [{ "agentId": "<id del roster>", "intent": "work|meeting|think|walk|idle|talk-to", "targetId": "<solo cuando intent='talk-to'>" }]
}

Reglas:
- Si el usuario dice "junta", "meeting", "todos", "equipo", "team standup" → genera commands para los 6 agentes.
- Si el usuario habla solo a ${speaker.name} → un solo command para "${speaker.id}".
- Si es chitchat (saludo, pregunta, opinión) → "commands": [].
- Mantén "reply" bajo 140 caracteres.`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.startsWith("stub-")) {
    return NextResponse.json({ error: "GEMINI_API_KEY missing" }, { status: 500 });
  }
  const { text, speakerId } = await req.json();
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }
  const sys = buildSystemPrompt(speakerId || "pixel");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${sys}\n\nUsuario: "${text.replace(/"/g, '\\"')}"` }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: "gemini failed", detail: err.slice(0, 400) }, { status: 502 });
  }
  const data = await res.json();
  const raw: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  let parsed: { reply?: string; commands?: unknown };
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = { reply: raw.slice(0, 200), commands: [] };
  }
  const commands = Array.isArray(parsed.commands) ? parsed.commands : [];
  return NextResponse.json({ reply: parsed.reply || "", commands });
}
