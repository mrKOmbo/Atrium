// Hardcoded organ cards. No LLM. Click on body region → setCard(REGION_CARDS[region]).

export type Stat = { label: string; value: string; progress: number };
export type OrganCardData = {
  type: "organCard";
  specialist: string;
  topic: string;
  content: string;
  stats?: Stat[];
  facts?: string[];
  warning?: string;
};

export const REGION_CARDS: Record<string, OrganCardData> = {
  head: {
    type: "organCard",
    specialist: "synapse",
    topic: "Cabeza",
    content:
      "La cabeza alberga el cerebro, los órganos sensoriales y la conexión con la médula. " +
      "Su protección depende del cráneo, las meninges y el líquido cefalorraquídeo.",
    stats: [
      { label: "Peso del cerebro", value: "1.4 kg", progress: 60 },
      { label: "Consumo de energía", value: "20 %", progress: 20 },
    ],
    facts: [
      "El cráneo está formado por 22 huesos.",
      "Recibe ~15 % del flujo sanguíneo total.",
    ],
  },

  brain: {
    type: "organCard",
    specialist: "synapse",
    topic: "Cerebro",
    content:
      "El cerebro es el epicentro del pensamiento, la memoria y el control motor. " +
      "Coordina señales eléctricas a través de ~86 mil millones de neuronas.",
    stats: [
      { label: "Conectividad sináptica", value: "100T", progress: 95 },
      { label: "Consumo metabólico", value: "20 %", progress: 20 },
    ],
    facts: [
      "Consume ~20 % del oxígeno total del cuerpo.",
      "Procesa información a velocidades de hasta 120 m/s.",
      "La plasticidad neuronal le permite reconfigurarse durante toda la vida.",
    ],
  },

  torso_chest: {
    type: "organCard",
    specialist: "pulso",
    topic: "Pecho · sistema cardiopulmonar",
    content:
      "La caja torácica protege el corazón y los pulmones, dos órganos que trabajan en sincronía " +
      "para oxigenar la sangre y bombearla a todo el organismo.",
    stats: [
      { label: "Frecuencia cardíaca", value: "72 bpm", progress: 50 },
      { label: "Frecuencia respiratoria", value: "14 / min", progress: 30 },
    ],
    facts: [
      "El corazón late ~100 000 veces al día.",
      "Los pulmones contienen ~480 millones de alvéolos.",
    ],
  },

  heart: {
    type: "organCard",
    specialist: "pulso",
    topic: "Corazón",
    content:
      "Bomba muscular de cuatro cámaras que impulsa sangre oxigenada al cuerpo " +
      "y la sangre venosa hacia los pulmones. Funciona ininterrumpidamente toda la vida.",
    stats: [
      { label: "Latidos por minuto", value: "60-100", progress: 50 },
      { label: "Volumen / latido", value: "70 ml", progress: 35 },
      { label: "Sangre / minuto", value: "5 L", progress: 70 },
    ],
    facts: [
      "Bombea ~7 600 litros de sangre al día.",
      "Tiene su propio sistema eléctrico (nodo SA).",
      "Tamaño aproximado del puño cerrado.",
    ],
    warning: "Cualquier dolor torácico opresivo > 10 min requiere atención inmediata.",
  },

  lungs: {
    type: "organCard",
    specialist: "aire",
    topic: "Pulmones",
    content:
      "Órganos esponjosos donde el oxígeno del aire pasa a la sangre y el CO₂ sale al exterior. " +
      "El alveolo es la unidad funcional del intercambio gaseoso.",
    stats: [
      { label: "Capacidad pulmonar", value: "6 L", progress: 60 },
      { label: "Alvéolos", value: "480 M", progress: 90 },
      { label: "Intercambio O₂/CO₂", value: "constante", progress: 100 },
    ],
    facts: [
      "El pulmón derecho tiene 3 lóbulos; el izquierdo, 2.",
      "Si extendieras los alvéolos cubrirían una cancha de tenis.",
      "Respiramos ~22 000 veces al día.",
    ],
  },

  torso_abdomen: {
    type: "organCard",
    specialist: "vesta",
    topic: "Abdomen · sistema digestivo",
    content:
      "Cavidad que contiene el aparato digestivo: estómago, hígado, páncreas, intestinos y riñones. " +
      "Procesa los alimentos, filtra toxinas y regula el metabolismo.",
    stats: [
      { label: "Tránsito digestivo", value: "24-72 h", progress: 50 },
      { label: "Absorción de nutrientes", value: "intestino", progress: 70 },
    ],
    facts: [
      "El intestino delgado mide ~7 metros.",
      "Contiene >100 millones de neuronas (sistema nervioso entérico).",
    ],
  },

  stomach: {
    type: "organCard",
    specialist: "vesta",
    topic: "Estómago",
    content:
      "Saco muscular que mezcla los alimentos con ácido clorhídrico y enzimas " +
      "para descomponerlos antes de pasar al intestino delgado.",
    stats: [
      { label: "pH gástrico", value: "1.5-3.5", progress: 25 },
      { label: "Capacidad", value: "1-1.5 L", progress: 40 },
    ],
    facts: [
      "Produce ~2 litros de jugo gástrico al día.",
      "Su mucosa se renueva cada 3-4 días.",
    ],
  },

  liver: {
    type: "organCard",
    specialist: "vesta",
    topic: "Hígado",
    content:
      "Glándula más grande del cuerpo. Filtra la sangre, sintetiza proteínas, " +
      "almacena glucógeno y metaboliza fármacos y toxinas.",
    stats: [
      { label: "Funciones conocidas", value: "500+", progress: 80 },
      { label: "Capacidad regenerativa", value: "alta", progress: 90 },
    ],
    facts: [
      "Puede regenerarse hasta el 70 % de su masa.",
      "Procesa ~1.5 litros de sangre por minuto.",
      "Produce bilis para digerir grasas.",
    ],
  },

  kidneys: {
    type: "organCard",
    specialist: "vesta",
    topic: "Riñones",
    content:
      "Par de órganos que filtran la sangre, eliminan desechos como orina " +
      "y regulan el balance de líquidos, electrolitos y presión arterial.",
    stats: [
      { label: "Sangre filtrada / día", value: "180 L", progress: 95 },
      { label: "Nefronas por riñón", value: "1 M", progress: 80 },
    ],
    facts: [
      "Producen 1-2 litros de orina al día.",
      "Regulan la presión arterial mediante el sistema renina-angiotensina.",
    ],
  },

  pelvis: {
    type: "organCard",
    specialist: "vitrum",
    topic: "Pelvis",
    content:
      "Anillo óseo que conecta el tronco con las extremidades inferiores y " +
      "protege la vejiga, los órganos reproductores y el final del intestino.",
    stats: [
      { label: "Huesos", value: "3 pares", progress: 30 },
      { label: "Soporte de carga", value: "axial", progress: 80 },
    ],
    facts: [
      "Formada por ilion, isquion y pubis fusionados.",
      "Diferente forma entre sexos (más ancha en mujeres).",
    ],
  },

  arm_left: {
    type: "organCard",
    specialist: "vitrum",
    topic: "Brazo izquierdo",
    content:
      "El miembro superior consta de húmero, cúbito y radio, articulados por hombro, codo y muñeca. " +
      "Inervado por el plexo braquial.",
    stats: [
      { label: "Huesos", value: "30", progress: 60 },
      { label: "Articulaciones", value: "3 mayores", progress: 50 },
    ],
    facts: [
      "El húmero es el hueso más largo del miembro superior.",
      "El radio gira alrededor del cúbito (pronación / supinación).",
    ],
  },

  arm_right: {
    type: "organCard",
    specialist: "vitrum",
    topic: "Brazo derecho",
    content:
      "El miembro superior consta de húmero, cúbito y radio, articulados por hombro, codo y muñeca. " +
      "Inervado por el plexo braquial.",
    stats: [
      { label: "Huesos", value: "30", progress: 60 },
      { label: "Articulaciones", value: "3 mayores", progress: 50 },
    ],
    facts: [
      "El húmero es el hueso más largo del miembro superior.",
      "El radio gira alrededor del cúbito (pronación / supinación).",
    ],
  },

  leg_left: {
    type: "organCard",
    specialist: "vitrum",
    topic: "Pierna izquierda",
    content:
      "El miembro inferior soporta el peso del cuerpo y permite la locomoción. " +
      "Compuesto por fémur, tibia y peroné, articulados por cadera, rodilla y tobillo.",
    stats: [
      { label: "Huesos", value: "30", progress: 60 },
      { label: "Soporte de carga", value: "100 % BW", progress: 100 },
    ],
    facts: [
      "El fémur es el hueso más largo y resistente del cuerpo.",
      "La rodilla soporta hasta 4× el peso corporal al correr.",
    ],
  },

  leg_right: {
    type: "organCard",
    specialist: "vitrum",
    topic: "Pierna derecha",
    content:
      "El miembro inferior soporta el peso del cuerpo y permite la locomoción. " +
      "Compuesto por fémur, tibia y peroné, articulados por cadera, rodilla y tobillo.",
    stats: [
      { label: "Huesos", value: "30", progress: 60 },
      { label: "Soporte de carga", value: "100 % BW", progress: 100 },
    ],
    facts: [
      "El fémur es el hueso más largo y resistente del cuerpo.",
      "La rodilla soporta hasta 4× el peso corporal al correr.",
    ],
  },

  hand_left: {
    type: "organCard",
    specialist: "vitrum",
    topic: "Mano izquierda",
    content:
      "27 huesos, 29 articulaciones y 34 músculos coordinan precisión y fuerza. " +
      "El pulgar oponible es una de las claves anatómicas humanas.",
    stats: [
      { label: "Huesos", value: "27", progress: 50 },
      { label: "Articulaciones", value: "29", progress: 60 },
    ],
    facts: [
      "La corteza somatosensorial dedica un área enorme a la mano.",
      "Las huellas dactilares se forman a las 17 semanas de gestación.",
    ],
  },

  hand_right: {
    type: "organCard",
    specialist: "vitrum",
    topic: "Mano derecha",
    content:
      "27 huesos, 29 articulaciones y 34 músculos coordinan precisión y fuerza. " +
      "El pulgar oponible es una de las claves anatómicas humanas.",
    stats: [
      { label: "Huesos", value: "27", progress: 50 },
      { label: "Articulaciones", value: "29", progress: 60 },
    ],
    facts: [
      "La corteza somatosensorial dedica un área enorme a la mano.",
      "Las huellas dactilares se forman a las 17 semanas de gestación.",
    ],
  },

  foot_left: {
    type: "organCard",
    specialist: "vitrum",
    topic: "Pie izquierdo",
    content:
      "26 huesos, 33 articulaciones y >100 ligamentos permiten soportar el peso del cuerpo " +
      "y absorber el impacto de cada paso.",
    stats: [
      { label: "Huesos", value: "26", progress: 50 },
      { label: "Articulaciones", value: "33", progress: 60 },
    ],
    facts: [
      "Los pies tienen ~250 000 glándulas sudoríparas.",
      "El arco plantar funciona como amortiguador natural.",
    ],
  },

  foot_right: {
    type: "organCard",
    specialist: "vitrum",
    topic: "Pie derecho",
    content:
      "26 huesos, 33 articulaciones y >100 ligamentos permiten soportar el peso del cuerpo " +
      "y absorber el impacto de cada paso.",
    stats: [
      { label: "Huesos", value: "26", progress: 50 },
      { label: "Articulaciones", value: "33", progress: 60 },
    ],
    facts: [
      "Los pies tienen ~250 000 glándulas sudoríparas.",
      "El arco plantar funciona como amortiguador natural.",
    ],
  },

  skeleton: {
    type: "organCard",
    specialist: "vitrum",
    topic: "Esqueleto",
    content:
      "Estructura de 206 huesos que da soporte, protege órganos vitales y " +
      "permite el movimiento mediante articulaciones y palancas musculares.",
    stats: [
      { label: "Huesos", value: "206", progress: 80 },
      { label: "Articulaciones", value: "360", progress: 90 },
    ],
    facts: [
      "El hueso más pequeño es el estribo (oído medio).",
      "Los huesos producen ~500 mil millones de células sanguíneas al día.",
      "Se renuevan completamente cada ~10 años.",
    ],
  },
};

// quick actions to show after picking a body region
export const REGION_QUICK_ACTIONS: Record<string, { label: string; icon?: string; value: string }[]> = {
  default: [
    { label: "Corazón", icon: "heart", value: "heart" },
    { label: "Cerebro", icon: "brain", value: "brain" },
    { label: "Pulmones", icon: "lung", value: "lungs" },
    { label: "Junta clínica", icon: "users", value: "__meeting" },
  ],
};
