import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
const MODEL = "gemini-3.1-flash-lite";

const ATLAS_SYSTEM = `Eres el sistema ATLAS, un equipo de especialistas anatómicos dentro de un visor 3D del cuerpo humano (BioDigital). Hablas en español por defecto, en inglés si el usuario lo hace. Tu objetivo es enseñar anatomía con cards generativas + manipulación 3D del modelo.

Especialistas disponibles (campo "specialist"):
- "atlas" — coordinador anatómico general
- "cardio" — cardiología
- "neuro" — neurología
- "pulm" — neumología
- "digest" — digestivo
- "anat" — anatomista (estructura, esqueleto, músculos)

Acciones del visor 3D ("action" dentro de scene[]):
- "highlight" — resaltar estructura. REQUIERE "objectId" (ej: "human_05_male_skeletal_axial_skull").
- "isolate" — aislar (ocultar todo lo demás). REQUIERE "objectId".
- "showAll" — restaurar vista completa.
- "camera" — mover cámara. REQUIERE "region": "head"|"chest"|"abdomen"|"pelvis"|"upper-limb"|"lower-limb"|"full".
- "loadScene" — cargar otra escena. REQUIERE "contentId".

Cards generativas que puedes mostrar ("ui" único):
- {type:"organCard", specialist, topic, content, stats?:[{label,value,progress}], facts?:[string], warning?:string}
- {type:"question", specialist, message}  — para clarificar/quiz
- {type:"analysis", specialist, message}  — transición "delegando a especialista"
- {type:"summary", message} — cierra la sesión

Responde SIEMPRE como JSON estricto:
{
  "reply": "<texto corto opcional, 0-1 frases>",
  "scene": [{"action":"highlight|isolate|showAll|camera|loadScene", "objectId":"...", "region":"...", "contentId":"..."}],
  "ui": {"type":"organCard|question|analysis|summary", ...}  // o null si no aplica
}

Patrones recomendados:
- "muéstrame X" → scene: [{action:"isolate", objectId:"<id de X>"}, {action:"camera", region:"<región>"}]; ui: organCard con info breve, 2-4 stats, 2-3 facts.
- "explícame el sistema cardiovascular" → ui: organCard del cardio con contenido detallado.
- "qué es el hipocampo?" → scene: [{action:"highlight", objectId:"..."}]; ui: organCard con contenido breve.
- chitchat / pregunta general → ui: organCard del atlas con la respuesta.
- pedido vago ("quiero aprender") → ui: question con 2-3 opciones.

REGLAS DURAS:
- Si no conoces el objectId real de BioDigital, OMITE el comando highlight/isolate y deja vacío "scene":[]. NUNCA inventes objectIds.
- "reply" debe ser muy breve (<200 chars). El contenido principal va en "ui.content".
- Mantén "ui.content" entre 200-600 caracteres. Frases cortas, claras.
- Stats numéricos plausibles (ej: "frecuencia cardiaca 60-100 bpm", "long. intestino 7m"). progress 0-100.
- Facts deben ser sorprendentes y verificables.
- Idioma del usuario (ES/EN) determina idioma de toda la respuesta.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.startsWith("stub-")) {
    return NextResponse.json({ error: "GEMINI_API_KEY missing" }, { status: 500 });
  }
  const body = await req.json().catch(() => ({}));
  const { text, sceneState, history } = body as {
    text?: string;
    sceneState?: Record<string, unknown>;
    history?: { role: string; content: string }[];
  };
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }
  const ctxParts: string[] = [];
  if (sceneState) ctxParts.push(`Estado del visor: ${JSON.stringify(sceneState).slice(0, 600)}`);
  if (Array.isArray(history) && history.length > 0) {
    const compact = history
      .slice(-6)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n")
      .slice(0, 1200);
    ctxParts.push(`Historial reciente:\n${compact}`);
  }
  const ctx = ctxParts.length ? `\n\n${ctxParts.join("\n\n")}` : "";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        { parts: [{ text: `${ATLAS_SYSTEM}${ctx}\n\nUsuario: "${text.replace(/"/g, '\\"')}"` }] },
      ],
      generationConfig: { responseMimeType: "application/json", temperature: 0.6 },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: "gemini failed", detail: err.slice(0, 400) }, { status: 502 });
  }
  const data = await res.json();
  const raw: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  let parsed: { reply?: string; scene?: unknown; ui?: unknown };
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = { reply: raw.slice(0, 240), scene: [], ui: null };
  }
  return NextResponse.json({
    reply: parsed.reply || "",
    scene: Array.isArray(parsed.scene) ? parsed.scene : [],
    ui: parsed.ui ?? null,
  });
}
