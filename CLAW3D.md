# CLAW3D — Generative UI espacial para equipos de agentes

> Built for the **Generative UI Global Hackathon: Agentic Interfaces**.

CLAW3D es una oficina 3D donde un equipo de 6 agentes con roles (Frontend, Backend, PM, Design, Research, Ops) trabaja, se reúne, piensa y se mueve en tiempo real, coordinado por un LLM. El usuario habla con cualquier agente desde un sidebar tipo CopilotKit; el agente responde con texto + comandos JSON estructurados que se ejecutan visiblemente en la oficina 3D.

## Por qué encaja en el spectrum de Generative UI

El demo cubre los tres tiers que el hackathon plantea:

### 1. Controlled (`useFrontendTool` / `useCopilotAction`)
Los 6 agentes y sus 6 intents (`work`, `meeting`, `think`, `walk`, `idle`, `talk-to`) son componentes 3D pre-construidos. El LLM **selecciona y posiciona** sub-agentes en la escena — mismo patrón que `useCopilotAction` registrando una librería de componentes UI controlados.

### 2. Declarative (A2UI-style state stream)
El office 3D emite estado vivo (`{id, action, station, walking}`) por agente vía `postMessage`. Esa señal alimenta el chat lateral y puede pintar dashboards declarativos (cards, charts) generados por Gemini sin código ejecutable en el cliente.

### 3. Open-ended (MCP App surface)
La oficina queda lista para exponerse como MCP App vía `apps/mcp/`. Claude Desktop o ChatGPT pueden invocar herramientas sobre el equipo (`status`, `dispatch`, `assign`) y ver el estado en vivo.

## Stack del starter usado

| Tech | Rol en CLAW3D |
|---|---|
| **Next.js 15 + React 19** | UI principal y API routes |
| **Gemini 3.1 Flash Lite** | Coordinador del equipo (intents + replies en español/inglés) |
| **CopilotKit (v2)** | Disponible en `/leads` con el demo original; `/office` usa pattern propio para minimizar setup |
| **Three.js (vanilla, iframe)** | Render 3D de la oficina, agentes, animaciones, neural panel |
| **postMessage bridge** | Decopla iframe 3D ↔ Next.js. La key de Gemini vive solo en server (`/api/office-chat`) |
| **LangGraph Deep Agents** | Disponible en `apps/agent/` — extensible para planner multi-step en próxima iteración |
| **Notion MCP** | `apps/agent/src/notion_mcp.py` — extensible para tasks reales por agente |

## Cómo correrlo

```bash
# 1. Configurar Gemini key
cp .env.example .env
# Editar .env y poner GEMINI_API_KEY=AIza...

# 2. Levantar solo el frontend (sin Docker, sin agent Python)
npm install
npm run dev:ui

# 3. Abrir http://localhost:3000/office
```

## Arquitectura

```
Browser ─┐
         ├─ /office (Next.js page)
         │     ├─ <iframe src="/office/index.html">  ← Three.js, 6 agentes
         │     │     ↑↓ postMessage { type:"dispatchIntent", agentId, intent }
         │     └─ Sidebar chat (React)
         │           │
         │           └─ POST /api/office-chat
         │                 │
         │                 └─ Gemini 3.1 Flash Lite
         │                       returns { reply, commands[] }
         ↓
   3D scene actualiza posición/animación de cada agente
```

## Decisiones de diseño

- **Iframe en lugar de port React**: el `office.html` ya tiene 4000+ líneas de Three.js maduras (avoid de obstáculos, walk loop con sliding, neural pulses optimizados a 60fps, roomba con AI). Reescribirlo como componente React sería 1 semana de migración. El iframe lo conserva 1:1.
- **Gemini server-side**: la API key nunca llega al cliente. El iframe es 100% pasivo respecto a credenciales.
- **`/office` standalone, `/leads` original**: la página de leads del starter requiere Docker + Postgres + Redis + LangGraph + Notion. `/office` corre con solo `npm run dev:ui` para demo rápido.

## Próximos pasos (post-hackathon)

- [ ] Conectar CopilotKit `useFrontendTool` para tipar las acciones (en vez de postMessage manual)
- [ ] Pintar dashboards A2UI (productividad por agente, agenda del día) cuando el LLM lo decida
- [ ] Notion MCP: tasks reales por agente, meetings generan notas
- [ ] LangGraph Deep Agent como coordinador maestro (planner multi-step)
- [ ] MCP App deploy con `apps/mcp/` para uso desde Claude Desktop
