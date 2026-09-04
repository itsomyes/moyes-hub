/**
 * PROTOCOLO INICIO
 *
 * Una tarea marcada como "bloqueada" no se negocia: se parte hasta que el
 * primer paso dure entre 10 y 60 segundos. Sin conexion, sin modelo: un
 * diccionario de verbos en espanol y una plantilla por categoria.
 *
 * Regla de oro de cada micro-paso: se puede terminar de pie, sin decidir nada,
 * y deja el terreno preparado para que continuar cueste menos que parar.
 */

export interface MicroStep {
  text: string;
  seconds: number;
}

interface Pattern {
  keywords: string[];
  steps: MicroStep[];
}

const PATTERNS: Pattern[] = [
  {
    keywords: ['llamar', 'llamada', 'telefono', 'telefonear'],
    steps: [
      { text: 'Coge el movil y busca el contacto. No llames todavia.', seconds: 20 },
      { text: 'Escribe en voz alta la primera frase que vas a decir.', seconds: 30 },
      { text: 'Pulsa llamar y aguanta los tres primeros segundos.', seconds: 10 },
    ],
  },
  {
    keywords: ['email', 'correo', 'mail', 'escribir a', 'responder'],
    steps: [
      { text: 'Abre el correo y crea el borrador vacio con el destinatario.', seconds: 25 },
      { text: 'Escribe solo el asunto. Nada del cuerpo.', seconds: 30 },
      { text: 'Escribe la primera linea, aunque sea fea.', seconds: 45 },
    ],
  },
  {
    keywords: ['mensaje', 'whatsapp', 'contestar', 'hablar con'],
    steps: [
      { text: 'Abre el chat y dejalo abierto delante de ti.', seconds: 10 },
      { text: 'Escribe la primera frase sin enviarla.', seconds: 30 },
    ],
  },
  {
    keywords: ['papeles', 'papeleo', 'factura', 'hacienda', 'gestoria', 'documento', 'formulario'],
    steps: [
      { text: 'Pon el documento fisico o el PDF encima de la mesa / en pantalla.', seconds: 30 },
      { text: 'Rellena solo el primer campo: tu nombre.', seconds: 20 },
      { text: 'Localiza el unico dato que te falta y apuntalo.', seconds: 45 },
    ],
  },
  {
    keywords: ['estudiar', 'leer', 'curso', 'aprender', 'repasar', 'examen'],
    steps: [
      { text: 'Abre el material por la pagina exacta donde lo dejaste.', seconds: 20 },
      { text: 'Lee un solo parrafo en voz alta.', seconds: 45 },
      { text: 'Escribe una frase con lo que acabas de leer.', seconds: 40 },
    ],
  },
  {
    keywords: ['entrenar', 'gimnasio', 'correr', 'ejercicio', 'pesas', 'deporte'],
    steps: [
      { text: 'Ponte las zapatillas. Solo eso.', seconds: 40 },
      { text: 'Deja la ropa de entrenar sobre la cama.', seconds: 30 },
      { text: 'Haz 10 repeticiones de lo primero que toque, aqui mismo.', seconds: 45 },
    ],
  },
  {
    keywords: ['limpiar', 'ordenar', 'recoger', 'fregar', 'lavadora', 'casa', 'basura'],
    steps: [
      { text: 'Coge una bolsa y mete cinco cosas. Cuenta hasta cinco.', seconds: 45 },
      { text: 'Despeja solo la superficie que tienes delante.', seconds: 60 },
    ],
  },
  {
    keywords: ['codigo', 'programar', 'bug', 'app', 'web', 'repo', 'desarrollar'],
    steps: [
      { text: 'Abre el editor en el archivo exacto que hay que tocar.', seconds: 25 },
      { text: 'Escribe un comentario con lo que va a hacer el cambio.', seconds: 40 },
      { text: 'Ejecuta el proyecto y mira que arranca.', seconds: 45 },
    ],
  },
  {
    keywords: ['presupuesto', 'cuentas', 'dinero', 'banco', 'pagar', 'gasto', 'cobrar'],
    steps: [
      { text: 'Abre la app del banco y mira el saldo. Sin juzgar.', seconds: 25 },
      { text: 'Apunta un solo importe, el primero que veas.', seconds: 30 },
    ],
  },
  {
    keywords: ['comprar', 'pedido', 'supermercado', 'lista'],
    steps: [
      { text: 'Escribe tres productos en la lista. Para ahi.', seconds: 40 },
      { text: 'Coge las llaves y ponlas en el bolsillo.', seconds: 10 },
    ],
  },
  {
    keywords: ['cita', 'medico', 'reservar', 'reserva', 'gestion'],
    steps: [
      { text: 'Busca el telefono o la web y dejalo abierto.', seconds: 30 },
      { text: 'Decide un solo dia posible y apuntalo.', seconds: 25 },
    ],
  },
  {
    keywords: ['planificar', 'organizar', 'decidir', 'pensar', 'proyecto'],
    steps: [
      { text: 'Escribe en una linea como se ve esto terminado.', seconds: 45 },
      { text: 'Escribe los tres primeros trozos. Sin ordenarlos.', seconds: 60 },
    ],
  },
];

const GENERIC: MicroStep[] = [
  { text: 'Coloca delante de ti la unica cosa que necesitas para empezar.', seconds: 30 },
  { text: 'Escribe en una linea que significa exactamente "hecho" aqui.', seconds: 45 },
  { text: 'Haz la version mas ridicula y pequena de esta tarea. Ahora.', seconds: 60 },
  { text: 'Pon un cronometro de 60 segundos y toca la tarea hasta que suene.', seconds: 60 },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Devuelve los micro-pasos candidatos para un titulo, del mas corto al mas
 * largo. Siempre devuelve al menos dos: no existe "no se me ocurre nada".
 */
export function suggestMicroSteps(title: string): MicroStep[] {
  const haystack = normalize(title);
  const matched: MicroStep[] = [];

  for (const pattern of PATTERNS) {
    if (pattern.keywords.some((keyword) => haystack.includes(normalize(keyword)))) {
      matched.push(...pattern.steps);
    }
  }

  const pool = matched.length > 0 ? matched : GENERIC;
  const seen = new Set<string>();
  const unique = pool.filter((step) => {
    if (seen.has(step.text)) return false;
    seen.add(step.text);
    return true;
  });

  // Siempre dejamos un comodin generico al final como via de escape.
  const escape = GENERIC[GENERIC.length - 1];
  const withEscape = unique.some((s) => s.text === escape.text) ? unique : [...unique, escape];

  return withEscape.sort((a, b) => a.seconds - b.seconds).slice(0, 4);
}
