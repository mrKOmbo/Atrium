// Respuestas hardcoded para el demo. Sin LLM = instantáneo.
// Cada entrada simula lo que devolvería /api/atlas-chat (ui + scene + office + quickActions).

export type Choice = { label: string; icon?: string; value: string };
export type SceneCmd = {
  action: "highlight" | "isolate" | "showAll" | "camera" | "loadScene";
  objectId?: string; region?: string; contentId?: string;
};
export type OfficeCmd = { agentId: string; intent: string; targetId?: string };
export type UICard =
  | { type: "organCard"; specialist?: string; topic: string; content: string; stats?: { label: string; value: string; progress: number }[]; facts?: string[]; warning?: string }
  | { type: "question"; specialist?: string; message: string; choices?: Choice[] }
  | { type: "analysis"; specialist?: string; message: string }
  | { type: "summary"; message: string }
  | null;

export type ScriptResponse = {
  reply?: string;
  scene?: SceneCmd[];
  office?: OfficeCmd[];
  ui?: UICard;
  quickActions?: Choice[];
};

const QA_ROOT: Choice[] = [
  { label: "Corazón", icon: "heart", value: "Pulso, muéstrame el corazón" },
  { label: "Cerebro", icon: "brain", value: "Synapse, explícame el cerebro" },
  { label: "Pulmones", icon: "lung", value: "Aire, muéstrame los pulmones" },
  { label: "Junta clínica", icon: "users", value: "Convoca al equipo a junta clínica" },
];

// ── CORAZÓN / PULSO ────────────────────────────────────────
const CORAZON: ScriptResponse = {
  reply: "Activando al Dr. Pulso para revisar el caso.",
  scene: [{ action: "isolate", objectId: "heart" }, { action: "camera", region: "chest" }],
  office: [{ agentId: "nova", intent: "work" }, { agentId: "echo", intent: "meeting" }],
  ui: {
    type: "organCard",
    specialist: "pulso",
    topic: "Corazón Humano",
    content: "Hola, aquí Pulso. El corazón es una bomba muscular doble: el lado derecho recibe sangre desoxigenada del cuerpo y la envía a los pulmones, el izquierdo recoge sangre oxigenada y la distribuye a todo el organismo. Mantiene la perfusión tisular bajo presión constante gracias al ritmo sinusal del nodo SA.",
    stats: [
      { label: "Frecuencia cardíaca", value: "60-100 bpm", progress: 70 },
      { label: "Presión arterial", value: "120/80 mmHg", progress: 80 },
      { label: "Gasto cardíaco", value: "5 L/min", progress: 85 },
      { label: "Fracción eyección", value: "55-70%", progress: 65 },
    ],
    facts: [
      "El corazón late ~100,000 veces al día — más de 2,500 millones de latidos en una vida promedio.",
      "La presión que genera es suficiente para bombear sangre a 9 metros de altura.",
      "Tiene su propio sistema eléctrico — late aunque se desconecte de los nervios.",
    ],
  },
  quickActions: [
    { label: "Ver arterias", icon: "heart", value: "Pulso, muéstrame las arterias coronarias" },
    { label: "Sistema circulatorio", icon: "activity", value: "Pulso, recorre el sistema circulatorio completo" },
    { label: "¿Y la presión?", icon: "search", value: "Pulso, profundiza en la presión arterial" },
    { label: "Junta clínica", icon: "users", value: "Convoca al equipo a junta clínica" },
  ],
};

const ARTERIAS: ScriptResponse = {
  reply: "Aislando el árbol arterial coronario.",
  scene: [{ action: "highlight", objectId: "coronary_arteries" }, { action: "camera", region: "chest" }],
  office: [{ agentId: "nova", intent: "work" }],
  ui: {
    type: "organCard",
    specialist: "pulso",
    topic: "Arterias Coronarias",
    content: "Las coronarias son las primeras ramas que salen de la aorta — irrigan al propio corazón. Si una se obstruye (por ateroma o trombo), la zona miocárdica que dependía de ella se queda sin oxígeno: eso es un infarto. Las dos principales son la coronaria izquierda (que se divide en descendente anterior y circunfleja) y la coronaria derecha.",
    stats: [
      { label: "Flujo coronario", value: "250 ml/min", progress: 60 },
      { label: "% del gasto cardíaco", value: "5%", progress: 5 },
      { label: "Demanda O₂ miocardio", value: "8-15 ml/100g", progress: 70 },
    ],
    facts: [
      "El miocardio extrae el 75% del oxígeno de la sangre coronaria — el más alto del cuerpo.",
      "El flujo coronario ocurre principalmente en diástole, cuando el músculo se relaja.",
    ],
    warning: "Una obstrucción >70% del lumen ya compromete la perfusión bajo esfuerzo.",
  },
  quickActions: [
    { label: "Sistema circulatorio", icon: "activity", value: "Pulso, recorre el sistema circulatorio completo" },
    { label: "Volver al corazón", icon: "heart", value: "Pulso, muéstrame el corazón" },
    { label: "Pasar al cerebro", icon: "brain", value: "Synapse, explícame el cerebro" },
    { label: "Junta clínica", icon: "users", value: "Convoca al equipo a junta clínica" },
  ],
};

const CIRCULATORIO: ScriptResponse = {
  reply: "Trazando el circuito completo: pulmonar + sistémico.",
  scene: [{ action: "showAll" }, { action: "camera", region: "full" }],
  office: [{ agentId: "nova", intent: "work" }, { agentId: "jade", intent: "work" }],
  ui: {
    type: "organCard",
    specialist: "pulso",
    topic: "Sistema Circulatorio",
    content: "Dos circuitos en serie: el pulmonar (corazón derecho → pulmones → corazón izquierdo) oxigena la sangre, y el sistémico (corazón izquierdo → cuerpo → corazón derecho) la distribuye y recoge CO₂. Las arterias salen del corazón con presión alta, las venas regresan a baja presión, y los capilares hacen el intercambio gaseoso y de nutrientes.",
    stats: [
      { label: "Vasos totales", value: "~100,000 km", progress: 100 },
      { label: "Volumen sanguíneo", value: "5 L", progress: 60 },
      { label: "Tiempo de vuelta completa", value: "~60 seg", progress: 50 },
    ],
    facts: [
      "Si pusieras todos los vasos sanguíneos en línea, darían 2.5 vueltas a la Tierra.",
      "Los capilares son tan finos que los glóbulos rojos pasan de uno en uno.",
    ],
  },
  quickActions: [
    { label: "Volver al corazón", icon: "heart", value: "Pulso, muéstrame el corazón" },
    { label: "Pulmones", icon: "lung", value: "Aire, muéstrame los pulmones" },
    { label: "Junta clínica", icon: "users", value: "Convoca al equipo a junta clínica" },
  ],
};

const PRESION: ScriptResponse = {
  reply: "Profundizando en hemodinámica.",
  scene: [{ action: "camera", region: "chest" }],
  office: [{ agentId: "nova", intent: "work" }],
  ui: {
    type: "organCard",
    specialist: "pulso",
    topic: "Presión Arterial",
    content: "La presión arterial es la fuerza con que la sangre empuja las paredes de las arterias. Tiene dos componentes: sistólica (cuando el ventrículo se contrae, ~120 mmHg) y diastólica (cuando se relaja y se llena, ~80 mmHg). Depende del gasto cardíaco × resistencia vascular periférica. Subir crónicamente engrosa las paredes y daña órganos blanco: corazón, cerebro, riñón, retina.",
    stats: [
      { label: "Sistólica óptima", value: "<120 mmHg", progress: 70 },
      { label: "Diastólica óptima", value: "<80 mmHg", progress: 75 },
      { label: "Hipertensión grado 1", value: "≥140/90", progress: 90 },
    ],
    facts: [
      "La presión cae ~10 mmHg al dormir; si no, hay riesgo cardiovascular elevado.",
      "Los deportistas de resistencia suelen tener bradicardia (40-60 bpm) por hipertrofia ventricular fisiológica.",
    ],
    warning: "≥180/120 mmHg es crisis hipertensiva — requiere atención inmediata.",
  },
  quickActions: [
    { label: "Volver al corazón", icon: "heart", value: "Pulso, muéstrame el corazón" },
    { label: "Sistema circulatorio", icon: "activity", value: "Pulso, recorre el sistema circulatorio completo" },
    { label: "Pasar al cerebro", icon: "brain", value: "Synapse, explícame el cerebro" },
  ],
};

// ── CEREBRO / SYNAPSE ──────────────────────────────────────
const CEREBRO: ScriptResponse = {
  reply: "Synapse al frente. Mapeo del SNC iniciado.",
  scene: [{ action: "isolate", objectId: "brain" }, { action: "camera", region: "head" }],
  office: [{ agentId: "pixel", intent: "work" }, { agentId: "echo", intent: "meeting" }],
  ui: {
    type: "organCard",
    specialist: "synapse",
    topic: "Cerebro humano",
    content: "El cerebro es el centro de procesamiento del sistema nervioso. Sus 86 mil millones de neuronas se organizan en circuitos especializados: corteza prefrontal para decisión, hipocampo para memoria, amígdala para emoción, cerebelo para coordinación motora. La plasticidad — la capacidad de los circuitos de reorganizarse — es lo que permite aprender, recordar y rehabilitarse después de una lesión.",
    stats: [
      { label: "Neuronas", value: "86 mil millones", progress: 90 },
      { label: "Sinapsis", value: "~10¹⁵", progress: 100 },
      { label: "Consumo metabólico", value: "20% del O₂", progress: 75 },
      { label: "Peso", value: "~1.4 kg", progress: 35 },
    ],
    facts: [
      "El cerebro genera ~20 watts — suficiente para una bombilla LED tenue.",
      "La velocidad de transmisión nerviosa puede llegar a 120 m/s en fibras mielinizadas.",
      "Pierdes ~85,000 neuronas al día, pero formas sinapsis nuevas constantemente.",
    ],
  },
  quickActions: [
    { label: "Hipocampo", icon: "brain", value: "Synapse, explícame el hipocampo" },
    { label: "Corteza prefrontal", icon: "search", value: "Synapse, profundiza en la corteza prefrontal" },
    { label: "Sistema nervioso", icon: "activity", value: "Synapse, muéstrame el sistema nervioso completo" },
    { label: "Pasar al corazón", icon: "heart", value: "Pulso, muéstrame el corazón" },
  ],
};

const HIPOCAMPO: ScriptResponse = {
  reply: "Acercándome al lóbulo temporal medial.",
  scene: [{ action: "highlight", objectId: "hippocampus" }, { action: "camera", region: "head" }],
  office: [{ agentId: "pixel", intent: "work" }],
  ui: {
    type: "organCard",
    specialist: "synapse",
    topic: "Hipocampo",
    content: "El hipocampo, escondido en el lóbulo temporal medial, es la fábrica de la memoria episódica. Convierte las experiencias en recuerdos consolidables: si lo lesionamos (ej. caso H.M.), la persona puede recordar el pasado pero no formar nuevos recuerdos. También es clave en navegación espacial — las 'células de lugar' descubiertas aquí ganaron el Nobel 2014.",
    stats: [
      { label: "Volumen", value: "~3.5 cm³", progress: 35 },
      { label: "Neurogénesis adulta", value: "~700/día", progress: 30 },
      { label: "% reducción en Alzheimer", value: "20-30%", progress: 25 },
    ],
    facts: [
      "Es uno de los pocos lugares del cerebro adulto donde nacen neuronas nuevas (giro dentado).",
      "Los taxistas de Londres tienen el hipocampo posterior agrandado por memorizar el callejero.",
    ],
    warning: "Su atrofia es marcador temprano de enfermedad de Alzheimer.",
  },
  quickActions: [
    { label: "Volver al cerebro", icon: "brain", value: "Synapse, explícame el cerebro" },
    { label: "Corteza prefrontal", icon: "search", value: "Synapse, profundiza en la corteza prefrontal" },
    { label: "Junta clínica", icon: "users", value: "Convoca al equipo a junta clínica" },
  ],
};

const CORTEZA: ScriptResponse = {
  reply: "Activando lóbulo frontal anterior.",
  scene: [{ action: "highlight", objectId: "prefrontal_cortex" }, { action: "camera", region: "head" }],
  office: [{ agentId: "pixel", intent: "work" }],
  ui: {
    type: "organCard",
    specialist: "synapse",
    topic: "Corteza prefrontal",
    content: "La corteza prefrontal es la región del cerebro que tomó más tiempo en evolucionar — y la última en madurar (alrededor de los 25 años). Aquí ocurre la planificación, la inhibición de impulsos, el juicio moral y la memoria de trabajo. Es lo que separa la 'reacción' de la 'decisión'. Las lesiones aquí (caso Phineas Gage) cambian la personalidad sin afectar el lenguaje ni la memoria.",
    stats: [
      { label: "% del córtex", value: "~10%", progress: 10 },
      { label: "Madura a los", value: "25 años", progress: 80 },
      { label: "Conexiones", value: "alta densidad", progress: 90 },
    ],
    facts: [
      "Phineas Gage sobrevivió a una barra de hierro que atravesó su corteza prefrontal — vivió 12 años más, pero su personalidad cambió radicalmente.",
      "El córtex prefrontal es lo último en encenderse al despertar y lo primero en apagarse al dormir.",
    ],
  },
  quickActions: [
    { label: "Hipocampo", icon: "brain", value: "Synapse, explícame el hipocampo" },
    { label: "Volver al cerebro", icon: "brain", value: "Synapse, explícame el cerebro" },
    { label: "Pasar al corazón", icon: "heart", value: "Pulso, muéstrame el corazón" },
  ],
};

const NERVIOSO: ScriptResponse = {
  reply: "Trazando el SNC + SNP.",
  scene: [{ action: "showAll" }, { action: "camera", region: "full" }],
  office: [{ agentId: "pixel", intent: "work" }, { agentId: "rune", intent: "work" }],
  ui: {
    type: "organCard",
    specialist: "synapse",
    topic: "Sistema Nervioso",
    content: "Dos grandes divisiones: SNC (cerebro + médula espinal) y SNP (todos los nervios que salen). El SNP a su vez se divide en somático (control voluntario del músculo) y autónomo (involuntario: simpático para 'fight-or-flight', parasimpático para 'rest-and-digest'). Todos los circuitos usan el mismo lenguaje: potenciales de acción + neurotransmisores.",
    stats: [
      { label: "Neuronas totales", value: "~100 mil millones", progress: 95 },
      { label: "Pares craneales", value: "12", progress: 12 },
      { label: "Nervios espinales", value: "31 pares", progress: 31 },
    ],
    facts: [
      "El nervio ciático es el más largo del cuerpo — del lumbar hasta el pie.",
      "Los neurotransmisores principales son: glutamato (excitatorio), GABA (inhibitorio), dopamina, serotonina, acetilcolina.",
    ],
  },
  quickActions: [
    { label: "Hipocampo", icon: "brain", value: "Synapse, explícame el hipocampo" },
    { label: "Volver al cerebro", icon: "brain", value: "Synapse, explícame el cerebro" },
    { label: "Pasar al corazón", icon: "heart", value: "Pulso, muéstrame el corazón" },
  ],
};

// ── PULMONES / AIRE ────────────────────────────────────────
const PULMONES: ScriptResponse = {
  reply: "Aire en escena. Examinando el árbol respiratorio.",
  scene: [{ action: "isolate", objectId: "lungs" }, { action: "camera", region: "chest" }],
  office: [{ agentId: "jade", intent: "work" }, { agentId: "echo", intent: "meeting" }],
  ui: {
    type: "organCard",
    specialist: "aire",
    topic: "Pulmones",
    content: "Soy Aire. Los pulmones son la interfaz entre el aire ambiente y la sangre. El aire entra por tráquea → bronquios → bronquiolos → ~300 millones de alvéolos donde ocurre el intercambio gaseoso por difusión simple: el O₂ entra al capilar y el CO₂ sale. La respiración es involuntaria pero modulable conscientemente — único sistema autónomo así.",
    stats: [
      { label: "Frecuencia respiratoria", value: "12-20 rpm", progress: 60 },
      { label: "Capacidad vital", value: "4.5-5 L", progress: 70 },
      { label: "Sup. alveolar", value: "~70 m²", progress: 80 },
      { label: "Saturación O₂", value: "95-100%", progress: 95 },
    ],
    facts: [
      "Si extendieras todos los alvéolos, cubrirían una cancha de tenis.",
      "Respiramos ~20,000 veces al día, intercambiando ~10,000 litros de aire.",
      "El pulmón izquierdo tiene 2 lóbulos; el derecho 3 — porque el corazón ocupa espacio del izquierdo.",
    ],
  },
  quickActions: [
    { label: "Bronquios", icon: "wind", value: "Aire, profundiza en los bronquios" },
    { label: "Intercambio gaseoso", icon: "search", value: "Aire, explícame el intercambio gaseoso" },
    { label: "Pasar al corazón", icon: "heart", value: "Pulso, muéstrame el corazón" },
    { label: "Junta clínica", icon: "users", value: "Convoca al equipo a junta clínica" },
  ],
};

const BRONQUIOS: ScriptResponse = {
  reply: "Acercándome al árbol bronquial.",
  scene: [{ action: "highlight", objectId: "bronchi" }, { action: "camera", region: "chest" }],
  office: [{ agentId: "jade", intent: "work" }],
  ui: {
    type: "organCard",
    specialist: "aire",
    topic: "Bronquios",
    content: "El árbol bronquial es la cañería que lleva el aire desde la tráquea hasta los alvéolos. Se ramifica ~23 veces — primero bronquios principales (D + I), luego lobares, segmentarios, y finalmente bronquiolos terminales y respiratorios. Las paredes tienen cilios y moco que atrapan partículas y las suben hacia la garganta (aclaramiento mucociliar).",
    stats: [
      { label: "Generaciones de ramificación", value: "23", progress: 92 },
      { label: "Diámetro tráquea", value: "~2.5 cm", progress: 25 },
      { label: "Diámetro bronquiolo terminal", value: "~0.5 mm", progress: 5 },
    ],
    facts: [
      "Los cilios baten 1,000 veces por minuto moviendo moco hacia arriba.",
      "El bronquio derecho es más vertical → cuerpos extraños tienden a alojarse ahí.",
    ],
    warning: "Asma y EPOC obstruyen este árbol; el broncodilatador relaja el músculo liso.",
  },
  quickActions: [
    { label: "Volver a pulmones", icon: "lung", value: "Aire, muéstrame los pulmones" },
    { label: "Intercambio gaseoso", icon: "search", value: "Aire, explícame el intercambio gaseoso" },
    { label: "Pasar al corazón", icon: "heart", value: "Pulso, muéstrame el corazón" },
  ],
};

const INTERCAMBIO: ScriptResponse = {
  reply: "Vista alveolo-capilar.",
  scene: [{ action: "highlight", objectId: "alveoli" }, { action: "camera", region: "chest" }],
  office: [{ agentId: "jade", intent: "work" }],
  ui: {
    type: "organCard",
    specialist: "aire",
    topic: "Intercambio gaseoso",
    content: "En el alvéolo, el O₂ atraviesa una membrana finísima (~0.5 µm) hacia el capilar pulmonar por gradiente de presión: alvéolo 100 mmHg vs capilar venoso 40 mmHg. El CO₂ va en sentido contrario. Es difusión pura, sin gasto energético. Si la membrana se engrosa (fibrosis) o se llena de líquido (edema), la difusión cae y aparece la hipoxemia.",
    stats: [
      { label: "Espesor membrana", value: "0.5-1 µm", progress: 5 },
      { label: "Tiempo capilar", value: "~0.75 seg", progress: 15 },
      { label: "Saturación arterial", value: "97%", progress: 97 },
    ],
    facts: [
      "El O₂ se equilibra con la sangre en el primer tercio del recorrido capilar — gran reserva funcional.",
      "El CO₂ difunde 20× más rápido que el O₂ por su mayor solubilidad.",
    ],
  },
  quickActions: [
    { label: "Bronquios", icon: "wind", value: "Aire, profundiza en los bronquios" },
    { label: "Volver a pulmones", icon: "lung", value: "Aire, muéstrame los pulmones" },
    { label: "Pasar al corazón", icon: "heart", value: "Pulso, muéstrame el corazón" },
  ],
};

// ── DIGESTIVO / VESTA ──────────────────────────────────────
const DIGESTIVO: ScriptResponse = {
  reply: "Vesta lista. Recorriendo el tubo digestivo.",
  scene: [{ action: "showAll" }, { action: "camera", region: "abdomen" }],
  office: [{ agentId: "ember", intent: "work" }, { agentId: "echo", intent: "meeting" }],
  ui: {
    type: "organCard",
    specialist: "vesta",
    topic: "Sistema Digestivo",
    content: "Hola, Vesta al habla. Es como una cocina química larguísima: boca → esófago → estómago (donde el jugo gástrico ácido descompone proteínas) → intestino delgado (donde los enzimas pancreáticos rompen todo y la mucosa absorbe nutrientes) → intestino grueso (recupera agua, fermentación bacteriana) → recto. La microbiota intestinal pesa ~2 kg y tiene más células bacterianas que humanas tenemos.",
    stats: [
      { label: "Long. intestino delgado", value: "~7 m", progress: 70 },
      { label: "Long. intestino grueso", value: "~1.5 m", progress: 15 },
      { label: "Sup. absorción", value: "~250 m²", progress: 90 },
      { label: "Tránsito total", value: "24-72 hrs", progress: 50 },
    ],
    facts: [
      "El estómago produce ~2 litros de jugo gástrico al día (pH ~2 — más ácido que el limón).",
      "El intestino tiene su propio sistema nervioso (entérico) con ~500 millones de neuronas — el 'segundo cerebro'.",
      "Las microvellosidades amplían la superficie de absorción 30x.",
    ],
  },
  quickActions: [
    { label: "Estómago", icon: "stomach", value: "Vesta, profundiza en el estómago" },
    { label: "Intestino", icon: "activity", value: "Vesta, explícame el intestino" },
    { label: "Microbiota", icon: "search", value: "Vesta, háblame de la microbiota" },
    { label: "Junta clínica", icon: "users", value: "Convoca al equipo a junta clínica" },
  ],
};

const ESTOMAGO: ScriptResponse = {
  reply: "Acercando al órgano gástrico.",
  scene: [{ action: "isolate", objectId: "stomach" }, { action: "camera", region: "abdomen" }],
  office: [{ agentId: "ember", intent: "work" }],
  ui: {
    type: "organCard",
    specialist: "vesta",
    topic: "Estómago",
    content: "El estómago es un saco muscular en J que recibe el bolo alimenticio. Sus glándulas producen HCl (para destruir bacterias y desnaturalizar proteínas), pepsinógeno (que se activa a pepsina con el ácido) y factor intrínseco (esencial para absorber B12). Lo que sale al duodeno se llama quimo: una papilla líquida y ácida que tarda 2-4 horas en vaciarse.",
    stats: [
      { label: "Capacidad", value: "1-1.5 L", progress: 60 },
      { label: "pH", value: "1.5-3.5", progress: 95 },
      { label: "Vaciado gástrico", value: "2-4 hrs", progress: 50 },
    ],
    facts: [
      "Tu estómago no se digiere a sí mismo gracias a una capa de moco bicarbonatada que renueva cada minuto.",
      "Una úlcera no es por estrés — el 80% son por la bacteria Helicobacter pylori.",
    ],
    warning: "Reflujo crónico puede llevar a esofagitis y, raramente, esófago de Barrett (premaligno).",
  },
  quickActions: [
    { label: "Volver al digestivo", icon: "stomach", value: "Vesta, recorre el sistema digestivo conmigo" },
    { label: "Intestino", icon: "activity", value: "Vesta, explícame el intestino" },
    { label: "Microbiota", icon: "search", value: "Vesta, háblame de la microbiota" },
  ],
};

const INTESTINO: ScriptResponse = {
  reply: "Tránsito intestinal en pantalla.",
  scene: [{ action: "highlight", objectId: "intestines" }, { action: "camera", region: "abdomen" }],
  office: [{ agentId: "ember", intent: "work" }],
  ui: {
    type: "organCard",
    specialist: "vesta",
    topic: "Intestino",
    content: "El delgado (duodeno + yeyuno + íleon) es donde ocurre el 90% de la absorción de nutrientes. El páncreas le manda enzimas (lipasa, amilasa, tripsina) y la vesícula manda bilis para emulsionar grasas. El grueso (colon) recupera agua y electrolitos, y aloja la microbiota que fermenta lo que no pudimos digerir.",
    stats: [
      { label: "Vellosidades por cm²", value: "~30", progress: 70 },
      { label: "Sup. con microvellosidades", value: "~250 m²", progress: 95 },
      { label: "Absorción de agua", value: "~9 L/día", progress: 90 },
    ],
    facts: [
      "Cada vellosidad tiene su propia red capilar y vaso linfático para llevarse los nutrientes.",
      "El recambio de la mucosa intestinal es de 3-5 días — uno de los tejidos más activos del cuerpo.",
    ],
  },
  quickActions: [
    { label: "Volver al digestivo", icon: "stomach", value: "Vesta, recorre el sistema digestivo conmigo" },
    { label: "Estómago", icon: "stomach", value: "Vesta, profundiza en el estómago" },
    { label: "Microbiota", icon: "search", value: "Vesta, háblame de la microbiota" },
  ],
};

const MICROBIOTA: ScriptResponse = {
  reply: "Acercando al ecosistema intestinal.",
  scene: [{ action: "highlight", objectId: "intestines" }, { action: "camera", region: "abdomen" }],
  office: [{ agentId: "ember", intent: "work" }],
  ui: {
    type: "organCard",
    specialist: "vesta",
    topic: "Microbiota intestinal",
    content: "Más de 100 billones de bacterias viven en tu intestino — pesan tanto como tu cerebro (~2 kg). Producen vitaminas (K, B12, biotina), entrenan el sistema inmune, fermentan fibra en ácidos grasos de cadena corta que nutren las células del colon, y modulan eje intestino-cerebro vía nervio vago. La diversidad microbiana es predictor de salud metabólica y mental.",
    stats: [
      { label: "Especies bacterianas", value: "500-1000", progress: 80 },
      { label: "Genes microbianos", value: "~3 millones", progress: 95 },
      { label: "Peso microbiota", value: "~2 kg", progress: 50 },
    ],
    facts: [
      "Tienes más células bacterianas que humanas (~1.3:1).",
      "El 95% de tu serotonina se produce en el intestino, no en el cerebro.",
      "Antibióticos de amplio espectro pueden tardar meses en restablecer la diversidad microbiana.",
    ],
  },
  quickActions: [
    { label: "Volver al digestivo", icon: "stomach", value: "Vesta, recorre el sistema digestivo conmigo" },
    { label: "Intestino", icon: "activity", value: "Vesta, explícame el intestino" },
    { label: "Pasar al cerebro", icon: "brain", value: "Synapse, explícame el cerebro" },
  ],
};

// ── ESQUELETO / VITRUM ─────────────────────────────────────
const ESQUELETO: ScriptResponse = {
  reply: "Vitrum al frente. Análisis estructural en marcha.",
  scene: [{ action: "isolate", objectId: "skeleton" }, { action: "camera", region: "full" }],
  office: [{ agentId: "rune", intent: "work" }, { agentId: "echo", intent: "meeting" }],
  ui: {
    type: "organCard",
    specialist: "vitrum",
    topic: "Sistema esquelético",
    content: "Soy Vitrum. El esqueleto adulto tiene 206 huesos organizados en dos divisiones: axial (cráneo, columna, costillas, esternón) y apendicular (extremidades + cinturas). No es estructura inerte: el hueso se remodela constantemente por osteoblastos (forman) y osteoclastos (degradan). Almacena el 99% del calcio del cuerpo, produce sangre en la médula ósea roja, y protege órganos vitales.",
    stats: [
      { label: "Huesos adultos", value: "206", progress: 100 },
      { label: "Huesos al nacer", value: "~270", progress: 100 },
      { label: "% del peso corporal", value: "~15%", progress: 15 },
      { label: "Recambio óseo anual", value: "~10%", progress: 10 },
    ],
    facts: [
      "El fémur es el hueso más largo y resistente — soporta hasta 30 veces tu peso.",
      "El estribo del oído es el más pequeño (~3 mm).",
      "La médula ósea roja produce ~2.5 millones de glóbulos rojos por segundo.",
    ],
  },
  quickActions: [
    { label: "Columna", icon: "bone", value: "Vitrum, profundiza en la columna vertebral" },
    { label: "Articulaciones", icon: "activity", value: "Vitrum, explícame las articulaciones" },
    { label: "Cráneo", icon: "search", value: "Vitrum, muéstrame el cráneo" },
    { label: "Junta clínica", icon: "users", value: "Convoca al equipo a junta clínica" },
  ],
};

const COLUMNA: ScriptResponse = {
  reply: "Aislando columna vertebral.",
  scene: [{ action: "highlight", objectId: "spine" }, { action: "camera", region: "full" }],
  office: [{ agentId: "rune", intent: "work" }],
  ui: {
    type: "organCard",
    specialist: "vitrum",
    topic: "Columna vertebral",
    content: "33 vértebras apiladas formando 4 curvaturas (cervical, torácica, lumbar, sacra) que distribuyen carga y absorben impacto. Entre vértebras hay discos intervertebrales con núcleo pulposo (gelatina) que actúan como amortiguadores. Por dentro corre la médula espinal protegida por el canal raquídeo. Cada nivel espinal envía un par de nervios que controlan una región del cuerpo.",
    stats: [
      { label: "Vértebras totales", value: "33", progress: 100 },
      { label: "Cervicales", value: "7", progress: 21 },
      { label: "Torácicas", value: "12", progress: 36 },
      { label: "Lumbares", value: "5", progress: 15 },
    ],
    facts: [
      "Eres ~1 cm más alto al despertar que al acostarte — los discos se rehidratan de noche.",
      "La columna soporta hasta 5 veces tu peso corporal en posturas dinámicas.",
    ],
    warning: "Hernias discales lumbares (L4-L5, L5-S1) son la causa #1 de ciática.",
  },
  quickActions: [
    { label: "Volver al esqueleto", icon: "bone", value: "Vitrum, muéstrame la estructura ósea" },
    { label: "Articulaciones", icon: "activity", value: "Vitrum, explícame las articulaciones" },
    { label: "Cráneo", icon: "search", value: "Vitrum, muéstrame el cráneo" },
  ],
};

const ARTICULACIONES: ScriptResponse = {
  reply: "Vista de uniones óseas.",
  scene: [{ action: "showAll" }, { action: "camera", region: "full" }],
  office: [{ agentId: "rune", intent: "work" }],
  ui: {
    type: "organCard",
    specialist: "vitrum",
    topic: "Articulaciones",
    content: "Donde dos huesos se encuentran. Las sinoviales (rodilla, hombro, cadera) tienen cápsula, líquido sinovial lubricante y cartílago hialino que reduce la fricción casi a cero. Cada tipo permite cierto grado de movimiento: enartrosis (esfera-cuenca, hombro/cadera), troclear (codo, rodilla), pivote (atlas-axis), planas (vértebras), silla (pulgar).",
    stats: [
      { label: "Articulaciones del cuerpo", value: "~360", progress: 100 },
      { label: "Coef. fricción cartílago", value: "0.001", progress: 1 },
      { label: "Líquido sinovial rodilla", value: "1-2 ml", progress: 10 },
    ],
    facts: [
      "El cartílago articular es 5x más resbaladizo que el hielo sobre hielo.",
      "La articulación más móvil es el hombro; la más estable es la cadera.",
    ],
    warning: "Artrosis es la pérdida progresiva del cartílago — 80% de la población >65 años.",
  },
  quickActions: [
    { label: "Volver al esqueleto", icon: "bone", value: "Vitrum, muéstrame la estructura ósea" },
    { label: "Columna", icon: "bone", value: "Vitrum, profundiza en la columna vertebral" },
    { label: "Cráneo", icon: "search", value: "Vitrum, muéstrame el cráneo" },
  ],
};

const CRANEO: ScriptResponse = {
  reply: "Aislando bóveda craneal.",
  scene: [{ action: "highlight", objectId: "skull" }, { action: "camera", region: "head" }],
  office: [{ agentId: "rune", intent: "work" }],
  ui: {
    type: "organCard",
    specialist: "vitrum",
    topic: "Cráneo",
    content: "22 huesos fusionados en suturas que protegen el cerebro y forman la cara. Se divide en neurocráneo (bóveda craneal: frontal, parietales, temporales, occipital) y viscerocráneo (huesos faciales). Al nacer las suturas están abiertas (fontanelas) para permitir el parto y el crecimiento cerebral; se cierran entre los 18 meses y 2 años.",
    stats: [
      { label: "Huesos craneales", value: "22", progress: 22 },
      { label: "Suturas mayores", value: "4", progress: 4 },
      { label: "Fontanelas al nacer", value: "6", progress: 6 },
    ],
    facts: [
      "El hueso temporal aloja el oído interno — el aparato sensorial más complejo en el menor volumen.",
      "El hueso hioides es el único hueso que no se articula con ningún otro — flota en el cuello.",
    ],
  },
  quickActions: [
    { label: "Volver al esqueleto", icon: "bone", value: "Vitrum, muéstrame la estructura ósea" },
    { label: "Columna", icon: "bone", value: "Vitrum, profundiza en la columna vertebral" },
    { label: "Pasar al cerebro", icon: "brain", value: "Synapse, explícame el cerebro" },
  ],
};

// ── JUNTA CLÍNICA ──────────────────────────────────────────
const JUNTA: ScriptResponse = {
  reply: "Convocando al equipo completo.",
  scene: [{ action: "showAll" }, { action: "camera", region: "full" }],
  office: [
    { agentId: "echo", intent: "meeting" },
    { agentId: "nova", intent: "meeting" },
    { agentId: "pixel", intent: "meeting" },
    { agentId: "jade", intent: "meeting" },
    { agentId: "ember", intent: "meeting" },
    { agentId: "rune", intent: "meeting" },
  ],
  ui: {
    type: "organCard",
    specialist: "atlas",
    topic: "Junta Clínica",
    content:
      "Sesión multidisciplinaria con los 6 especialistas. Atlas coordina, cada miembro presenta su evaluación del paciente y se acuerda el plan de manejo integral. La discusión cubre diagnóstico diferencial, comorbilidades y siguiente paso terapéutico.",
    stats: [
      { label: "Especialistas", value: "6", progress: 100 },
      { label: "Duración media", value: "12 min", progress: 60 },
      { label: "Decisiones / sesión", value: "3-5", progress: 70 },
    ],
    facts: [
      "Atlas hace de moderador y consolida el plan final.",
      "Cada especialista habla 90-120 segundos antes de pasar el turno.",
      "Las discrepancias se votan; en caso de empate, decide Atlas.",
    ],
  },
  quickActions: QA_ROOT,
};

// ── MAPA DE ACCIONES ───────────────────────────────────────
const SCRIPT: Record<string, ScriptResponse> = {
  // Welcome
  "Pulso, muéstrame el corazón": CORAZON,
  "Pulso, muéstrame el corazón con datos clave": CORAZON,
  "Synapse, explícame el cerebro": CEREBRO,
  "Synapse, explícame el cerebro con sus regiones principales": CEREBRO,
  "Aire, muéstrame los pulmones": PULMONES,
  "Aire, muéstrame los pulmones y cómo respiramos": PULMONES,
  "Vesta, recorre el sistema digestivo conmigo": DIGESTIVO,
  "Vitrum, muéstrame la estructura ósea": ESQUELETO,
  "Convoca al equipo a junta clínica": JUNTA,
  "Convoca al equipo a junta clínica para revisar el caso": JUNTA,
  // Profundización corazón
  "Pulso, muéstrame las arterias coronarias": ARTERIAS,
  "Pulso, recorre el sistema circulatorio completo": CIRCULATORIO,
  "Pulso, profundiza en la presión arterial": PRESION,
  // Profundización cerebro
  "Synapse, explícame el hipocampo": HIPOCAMPO,
  "Synapse, profundiza en la corteza prefrontal": CORTEZA,
  "Synapse, muéstrame el sistema nervioso completo": NERVIOSO,
  // Profundización pulmones
  "Aire, profundiza en los bronquios": BRONQUIOS,
  "Aire, explícame el intercambio gaseoso": INTERCAMBIO,
  // Profundización digestivo
  "Vesta, profundiza en el estómago": ESTOMAGO,
  "Vesta, explícame el intestino": INTESTINO,
  "Vesta, háblame de la microbiota": MICROBIOTA,
  // Profundización esqueleto
  "Vitrum, profundiza en la columna vertebral": COLUMNA,
  "Vitrum, explícame las articulaciones": ARTICULACIONES,
  "Vitrum, muéstrame el cráneo": CRANEO,
};

// Fallback: keyword match si no hay clave exacta
const KEYWORDS: { match: RegExp; resp: ScriptResponse }[] = [
  { match: /coraz[oó]n|cardio|pulso/i, resp: CORAZON },
  { match: /arteria|coronaria/i, resp: ARTERIAS },
  { match: /circulator|sangre/i, resp: CIRCULATORIO },
  { match: /presi[oó]n|hipertens/i, resp: PRESION },
  { match: /cerebro|brain|synapse/i, resp: CEREBRO },
  { match: /hipocampo|memoria/i, resp: HIPOCAMPO },
  { match: /prefrontal|corteza/i, resp: CORTEZA },
  { match: /nervios|neur[oó]/i, resp: NERVIOSO },
  { match: /pulm[oó]n|aire|respira/i, resp: PULMONES },
  { match: /bronqui/i, resp: BRONQUIOS },
  { match: /alve[oó]l|gaseoso|intercambio/i, resp: INTERCAMBIO },
  { match: /digest|vesta|tránsito/i, resp: DIGESTIVO },
  { match: /est[oó]mago|gastr/i, resp: ESTOMAGO },
  { match: /intestin/i, resp: INTESTINO },
  { match: /microbiot|bacter/i, resp: MICROBIOTA },
  { match: /esqueleto|hueso|vitrum/i, resp: ESQUELETO },
  { match: /columna|vértebra|vertebra/i, resp: COLUMNA },
  { match: /articulac/i, resp: ARTICULACIONES },
  { match: /cr[aá]neo|skull/i, resp: CRANEO },
  { match: /junta|equipo|meeting|reuni[oó]n/i, resp: JUNTA },
];

const DEFAULT_RESPONSE: ScriptResponse = {
  reply: "Atrium escuchando.",
  ui: {
    type: "organCard",
    specialist: "atlas",
    topic: "Atrium Clinic",
    content: "Soy Atlas, coordinador del equipo. Elige un órgano o sistema en los chips de abajo para que mis especialistas te lo muestren con datos.",
  },
  quickActions: QA_ROOT,
};

export function lookupScript(text: string): ScriptResponse {
  // 1. Match exacto
  if (SCRIPT[text]) return SCRIPT[text];
  // 2. Match parcial (ignorando capitalización/puntuación)
  const norm = text.trim().toLowerCase();
  for (const key of Object.keys(SCRIPT)) {
    if (key.toLowerCase() === norm) return SCRIPT[key];
  }
  // 3. Keywords
  for (const { match, resp } of KEYWORDS) {
    if (match.test(text)) return resp;
  }
  // 4. Default
  return DEFAULT_RESPONSE;
}

export const INITIAL_QUICK_ACTIONS = QA_ROOT;
