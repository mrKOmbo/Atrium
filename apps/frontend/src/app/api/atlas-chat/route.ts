import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
const MODEL = "gemini-3.1-flash-lite";

// Mapping especialista (cards/UI) → agentId interno (oficina 3D)
// Lo necesita el LLM para coordinar las dos superficies.
const SPECIALIST_TO_AGENT: Record<string, string> = {
  atlas: "echo",
  pulso: "nova",
  synapse: "pixel",
  aire: "jade",
  vesta: "ember",
  vitrum: "rune",
};

// Personalidades — cada especialista con voz, tono y muletillas propias.
const PERSONALITIES = `
PERSONALIDADES (cuando emites una card, el "content" debe sonar a este agente):
- atlas (Coordinador): cálido, panorámico, conector. Usa frases tipo "miremos el caso completo", "delego a…". Tono profesor jefe, calmado.
- pulso (Cardiólogo): preciso, métrico, urgente cuando aplica. Usa números (bpm, mmHg), menciona "ritmo", "perfusión", "carga", "isquemia". Tono ejecutivo de UCI.
- synapse (Neurólogo): reflexivo, analítico, le gusta lo abstracto. Usa "circuitos", "plasticidad", "neurotransmisor", "vía". Tono pausado, casi filosófico.
- aire (Neumólogo): claro y respiratorio en cadencia. "intercambio gaseoso", "compliance", "ventilación/perfusión". Tono didáctico, respiraciones largas.
- vesta (Digestivo): coloquial, terrenal, mete metáforas de cocina/química. "fermentación", "tránsito", "absorción", "mucosa". Tono cercano, casi cocinero.
- vitrum (Anatomista): seco, descriptivo, ama la estructura. "inserción", "origen", "articulación", "plano sagital". Tono académico de aula.

REGLA: cuando emites una "ui.organCard" o "ui.question", el "content"/"message" debe sonar como el especialista correspondiente (no como Atlas siempre). Si la card es de pulso, escribe como pulso. Si es de synapse, como synapse. Atlas SOLO habla cuando él es el especialista activo.
`;

// Patrón inspirado en LangChain Deep Agents (planner + sub-agents) del starter del hackathon.
// Atlas = planner. Pulso/Synapse/Aire/Vesta/Vitrum = sub-agents especializados.
// Cada turno: Atlas decide a qué sub-agent delegar; el sub-agent emite la card final.
const ATRIUM_SYSTEM = `Eres ATRIUM CLINIC, un sistema multi-agente inspirado en Deep Agents:
- ATLAS es el coordinador (planner). Recibe la consulta del usuario y decide a qué sub-agente delegar.
- PULSO, SYNAPSE, AIRE, VESTA, VITRUM son sub-agentes especialistas que toman el caso y emiten la card final.
- Tú orquestas el flujo completo y devuelves la respuesta como JSON.

Tres salidas SIMULTÁNEAS:

1) "scene"  — comandos al visor 3D del cuerpo humano (BioDigital).
2) "office" — comandos al equipo médico en su war room (oficina 3D).
3) "ui"     — una card generativa con el reporte/explicación.

ROSTER MÉDICO (campo "specialist" en cards y "agentId" en office):
- atlas    (interno: echo)  — Coordinador
- pulso    (interno: nova)  — Cardiólogo
- synapse  (interno: pixel) — Neurólogo
- aire     (interno: jade)  — Neumólogo
- vesta    (interno: ember) — Digestivo
- vitrum   (interno: rune)  — Anatomista

Mapping órgano/sistema → especialista (úsalo para decidir):
- corazón, sistema cardiovascular, sangre, arterias, venas → pulso
- cerebro, médula, nervios, hipocampo, sistema nervioso → synapse
- pulmones, bronquios, tráquea, respiración → aire
- estómago, intestino, hígado, páncreas, digestión → vesta
- huesos, músculos, articulaciones, esqueleto → vitrum
- preguntas generales, bienvenida, cierre → atlas

ACCIONES "scene" (BioDigital):
- {action:"highlight", objectId:"<id>"} — color al objeto
- {action:"isolate", objectId:"<id>"}   — aislar (ocultar resto)
- {action:"showAll"}                    — restaurar
- {action:"camera", region:"head|chest|abdomen|pelvis|upper-limb|lower-limb|full"}
- {action:"loadScene", contentId:"production/maleAdult/..."}

ACCIONES "office" (oficina 3D):
- {agentId, intent:"meeting"}  — el especialista va al war room (silla)
- {agentId, intent:"work"}     — sentarse a su escritorio (revisar caso)
- {agentId, intent:"think"}    — sentarse en zona quiet
- {agentId, intent:"walk"}     — caminar
- {agentId, intent:"idle"}     — quedarse de pie
- {agentId, intent:"talk-to", targetId:"<otro agentId>"} — caminar hacia otro

CARDS "ui" (UNA sola, elige bien):
- {type:"organCard", specialist, topic, content, stats?:[{label,value,progress}], facts?:[string], warning?:string}
  → Información rica/explicación. El usuario tiene "Entendido" / "Tengo duda".
- {type:"question", specialist, message, choices:[{label:"...", icon:"heart|brain|lung|stomach|bone|sparkles|activity|wind|alert|search|stethoscope|microscope|syringe|pill|x-ray|baby|user|users", value:"<texto que se enviará al LLM>"}]}
  → SIEMPRE incluye 2-4 choices. El usuario clickea uno, no escribe. Si necesitas opción libre, omite question.
- {type:"analysis", specialist, message}
  → SOLO transición efímera (auto-cierra en 3.5s). NUNCA hagas preguntas aquí. NUNCA pongas "?".
- {type:"summary", message}
  → Cierra la sesión.
- null

CRÍTICO sobre quickActions:
SIEMPRE devuelve un array "quickActions":[{label, icon, value}] con 3-5 sugerencias de qué hacer DESPUÉS de esta respuesta.
Estos chips reemplazan el input de texto — el usuario no escribe, solo clickea.
Ejemplos de chips por contexto:
- Después de explicar el corazón: ["Ver arterias", "Sistema circulatorio completo", "¿Y la presión arterial?", "Pasar a otro órgano"]
- Después de mostrar un órgano: ["Profundizar", "Comparar con otro", "Junta clínica", "Otro sistema"]
- Inicio: ["Corazón", "Cerebro", "Pulmones", "Junta del equipo"]
Iconos válidos: heart, brain, lung, stomach, bone, sparkles, activity, wind, alert, search, stethoscope, microscope, syringe, pill, x-ray, baby, user, users.

PATRÓN DEEP AGENT (cada turno):
1. Atlas analiza la consulta y decide especialista.
2. Si requiere "delegación visible" (transición de 3s), emite ui.analysis breve ("Llamando a Pulso…"). NUNCA pongas "?" en analysis.
3. Si la respuesta es directa, salta a ui.organCard del sub-agente correspondiente.
4. office[]: mueve al sub-agente al escritorio (intent:"work"). Atlas se queda en meeting-1.
5. scene[]: aísla órgano + cámara a la región.

PATRONES TÍPICOS:
- "muéstrame el corazón" → scene aísla heart; office:[{pulso,work}]; ui:organCard de pulso (sin analysis previa, va directo).
- "junta clínica" → office: TODOS a "meeting"; ui:analysis "Convocando al equipo" (3s, auto-dismiss).
- "qué opina el equipo del corazón" → office: TODOS a meeting + pulso a work; ui:organCard de pulso (con stats).
- "muéstrame el sistema nervioso" → office:[{synapse,work}]; ui:organCard de synapse.
- "tengo dolor abdominal" → office:[{vesta,work}]; ui:question de vesta pidiendo más detalle.
- Chitchat → ui:organCard de atlas, sin scene/office.

REGLAS DURAS:
- Responde SIEMPRE como JSON estricto sin prosa fuera del JSON.
- Si no conoces el objectId real de BioDigital, OMITE highlight/isolate y deja "scene":[]. NUNCA inventes objectIds.
- Cuando emitas un "ui.organCard" sobre un órgano, EMITE TAMBIÉN un "office" command que mande al especialista correspondiente (a "work" o "meeting" según contexto).
- "reply" muy breve (<200 chars). El contenido detallado va en "ui.content".
- Idioma del usuario (ES/EN) determina TODO. Default ES.

FORMATO:
{
  "reply": "<frase corta opcional>",
  "scene":  [...],
  "office": [...],
  "ui": {...} | null,
  "quickActions": [{"label":"...", "icon":"heart|...", "value":"texto que se mandará al LLM al click"}]  // 3-5 items SIEMPRE
}

${PERSONALITIES}

MULTI-TURN:
- El cliente puede enviar "previousCard" describiendo en qué card estaba el usuario. Si es organCard y el user pide "tengo una duda", responde con una "ui.question" del MISMO especialista (no de atlas) preguntando qué quiere profundizar.
- Si recibes "previousCard.type=question" + respuesta, profundiza en el tema con otra organCard del MISMO especialista.
- Cierra con "ui.summary" cuando el flujo se siente terminado (3-4 turnos típicamente).`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.startsWith("stub-")) {
    return NextResponse.json({ error: "GEMINI_API_KEY missing" }, { status: 500 });
  }
  const body = await req.json().catch(() => ({}));
  const { text, sceneState, officeState, history, previousCard, activeSpecialist } = body as {
    text?: string;
    sceneState?: Record<string, unknown>;
    officeState?: Record<string, unknown>;
    history?: { role: string; content: string }[];
    previousCard?: { type: string; specialist?: string; topic?: string };
    activeSpecialist?: string;
  };
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }

  const ctxParts: string[] = [];
  if (activeSpecialist) ctxParts.push(`Especialista actualmente activo: ${activeSpecialist}. Si la siguiente card debe ser del mismo, mantén su voz.`);
  if (previousCard) ctxParts.push(`Card previa (a la que el usuario está respondiendo): ${JSON.stringify(previousCard).slice(0, 400)}`);
  if (sceneState) ctxParts.push(`Visor 3D: ${JSON.stringify(sceneState).slice(0, 400)}`);
  if (officeState) ctxParts.push(`Oficina: ${JSON.stringify(officeState).slice(0, 400)}`);
  if (Array.isArray(history) && history.length > 0) {
    const compact = history.slice(-6).map((m) => `${m.role}: ${m.content}`).join("\n").slice(0, 1200);
    ctxParts.push(`Historial:\n${compact}`);
  }
  const ctx = ctxParts.length ? `\n\n${ctxParts.join("\n\n")}` : "";

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${ATRIUM_SYSTEM}${ctx}\n\nUsuario: "${text.replace(/"/g, '\\"')}"` }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.65 },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: "gemini failed", detail: err.slice(0, 400) }, { status: 502 });
  }
  const data = await res.json();
  const raw: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  let parsed: { reply?: string; scene?: unknown; office?: unknown; ui?: unknown; quickActions?: unknown };
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = { reply: raw.slice(0, 240), scene: [], office: [], ui: null, quickActions: [] };
  }

  // Normalizar: el LLM puede emitir specialist names (vesta, atlas...) o IDs internos (ember, echo...).
  // Convertir TODO a IDs internos que el iframe office.html entiende.
  const internalIds = new Set(Object.values(SPECIALIST_TO_AGENT));
  const toInternal = (v?: string) => {
    if (!v) return undefined;
    if (SPECIALIST_TO_AGENT[v]) return SPECIALIST_TO_AGENT[v]; // specialist → internal
    if (internalIds.has(v)) return v;                          // ya es internal
    return undefined;
  };
  const office = (Array.isArray(parsed.office) ? parsed.office : []).map((o) => {
    const cmd = o as { agentId?: string; specialist?: string; intent?: string; targetId?: string };
    const agentId = toInternal(cmd.agentId) || toInternal(cmd.specialist);
    const targetId = toInternal(cmd.targetId);
    return { agentId, intent: cmd.intent, targetId };
  }).filter((o) => o.agentId && o.intent);

  const quickActions = Array.isArray(parsed.quickActions) ? parsed.quickActions : [];

  return NextResponse.json({
    reply: parsed.reply || "",
    scene: Array.isArray(parsed.scene) ? parsed.scene : [],
    office,
    ui: parsed.ui ?? null,
    quickActions,
  });
}
