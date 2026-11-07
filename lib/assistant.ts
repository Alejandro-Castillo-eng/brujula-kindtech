// Asistente de búsqueda de Explorar: interpreta una pregunta en lenguaje natural
// («programas gratis de IA», «eventos en Lima», «cursos de datos con insignia»)
// y responde solo con oportunidades del catálogo. No inventa resultados.
// Funciona con reglas en el navegador; está pensado para que más adelante un
// modelo de IA (en un servidor) produzca los mismos filtros (ver docs/RECOMENDACION_IA.md).
import { normalize, relevance, statusOf } from './logic.ts';
import type { Opportunity, Profile } from './types';

export type AskFilters = { type?: string; free?: boolean; certificate?: boolean; virtual?: boolean; inPerson?: boolean; city?: string; topics: string[]; keywords?: string[] };
export type AskResult = { filters: AskFilters; items: Opportunity[]; answer: string };

const TYPE_WORDS: [RegExp, string][] = [
 [/\b(cursos?|clases?|aprender|capacitacion(es)?|rutas? de aprendizaje)\b/, 'curso'],
 [/\b(programas?|bootcamps?|escuelas? de (verano|invierno)|summer school|winter school|becas?|fellowships?)\b/, 'programa'],
 [/\b(eventos?|hackathon(es|s)?|hackatones?|meetups?|devfest|conferencias?|congresos?|charlas?|talleres?)\b/, 'evento'],
 [/\b(voluntariados?|voluntari[oa]s?|ayudar|impacto social)\b/, 'voluntariado'],
];
const PLURAL: Record<string, string> = { curso: 'cursos', programa: 'programas', evento: 'eventos', voluntariado: 'voluntariados' };
const SINGULAR: Record<string, string> = { curso: 'curso', programa: 'programa', evento: 'evento', voluntariado: 'voluntariado' };

// Temas: palabra en la pregunta → palabras que deben aparecer en la oportunidad.
const TOPICS: [RegExp, string, string[]][] = [
 [/\b(ia|inteligencia artificial|ai|genai|ia generativa|chatgpt|claude|agentes?)\b/, 'IA', ['inteligencia artificial', 'ia generativa', 'agentes', 'claude', 'openai', 'gemini', 'machine learning']],
 [/\b(datos|data|analitica|analisis de datos|power bi|bi)\b/, 'datos', ['datos', 'analitica', 'power bi', 'sql', 'databricks']],
 [/\b(python)\b/, 'Python', ['python']],
 [/\b(sql|bases? de datos)\b/, 'SQL', ['sql']],
 [/\b(programacion|programar|codigo|software|desarrollo)\b/, 'programación', ['programacion', 'python', 'codigo', 'software', 'git']],
 [/\b(nube|cloud|google cloud|aws|azure)\b/, 'nube', ['nube', 'cloud']],
 [/\b(cuantica|cuantico|quantum|qiskit)\b/, 'computación cuántica', ['cuantica', 'qiskit']],
 [/\b(ciberseguridad|seguridad informatica|hacking)\b/, 'ciberseguridad', ['ciberseguridad']],
 [/\b(marketing|redes sociales|contenido|publicidad)\b/, 'marketing', ['marketing', 'redes sociales', 'contenido', 'inbound']],
 [/\b(diseno|ux|ui|figma|creatividad)\b/, 'diseño', ['diseno', 'visual', 'creatividad']],
 [/\b(excel)\b/, 'Excel', ['excel']],
 [/\b(hackathon(es|s)?|hackatones?|hack week)\b/, 'hackathons', ['hackathon', 'hack week', 'hackaton']],
 [/\b(liderazgo|lider|gestion|proyectos|agile|scrum)\b/, 'liderazgo y gestión', ['liderazgo', 'gestion', 'proyectos', 'agile']],
 [/\b(clima|climatico|sostenibilidad|ambiente)\b/, 'sostenibilidad', ['sostenibilidad', 'clima']],
 [/\b(robotica|electronica|ingenieria electrica|ieee)\b/, 'ingeniería', ['robotica', 'ieee', 'ingenieria']],
 [/\b(ciencia|stem|investigacion)\b/, 'ciencia', ['ciencia', 'investigacion']],
 [/\b(empleo|empleabilidad|cv|curriculum|entrevistas?)\b/, 'empleabilidad', ['empleabilidad', 'curriculum', 'entrevista']],
];
const STOP = new Set(['quiero','busco','buscar','necesito','dame','muestrame','encuentra','hay','algun','alguna','algunos','algunas','para','sobre','donde','puedo','asistir','participar','tengo','quisiera','gustaria','opciones','oportunidades','cosas','mejores','nuevo','nueva','este','esta','estos','estas','mes','ano','universitarios','estudiantes','peru','vivo','hacer','aprender','estudiar','empezar','mejorar','cerca','ciudad','gratuitamente']);
const CITIES = ['lima', 'arequipa', 'piura', 'tacna', 'cusco', 'huancayo', 'ica', 'trujillo', 'chiclayo'];

const textOf = (o: Opportunity) => normalize([o.title, o.organization, o.description, o.costLabel, o.format, o.location, ...o.skills, ...o.categories].join(' '));

export function parseQuestion(question: string): AskFilters {
 const q = ` ${normalize(question)} `;
 const f: AskFilters = { topics: [] };
 for (const [re, t] of TYPE_WORDS) if (re.test(q)) { f.type = t; break; }
 if (/\b(gratis|gratuit[oa]s?|sin costo|free)\b/.test(q)) f.free = true;
 if (/\b(certificad[oa]s?|certificacion(es)?|insignias?|badges?|constancia)\b/.test(q)) f.certificate = true;
 if (/\b(virtual(es)?|remot[oa]s?|online|en linea|desde casa)\b/.test(q)) f.virtual = true;
 if (/\b(presencial(es)?)\b/.test(q)) f.inPerson = true;
 const city = CITIES.find(c => new RegExp(`\\b${c}\\b`).test(q));
 if (city) { f.city = city; f.inPerson = true; }
 for (const [re, label] of TOPICS) if (re.test(q)) f.topics.push(label);
 // Palabras que no reconocemos (p. ej., «astrología»): deben aparecer en la oportunidad.
 const known = [...TYPE_WORDS.map(([re]) => re), ...TOPICS.map(([re]) => re), /\b(gratis|gratuit[oa]s?|costo|free|certificad[oa]s?|certificacion(es)?|insignias?|badges?|constancia|virtual(es)?|remot[oa]s?|online|linea|casa|presencial(es)?)\b/];
 const keywords = q.split(/[^a-z0-9]+/).filter(w => w.length > 3 && !STOP.has(w) && !CITIES.includes(w) && !known.some(re => re.test(` ${w} `)));
 if (keywords.length) f.keywords = keywords;
 return f;
}

export function askCatalog(items: Opportunity[], question: string, profile: Profile | null = null): AskResult {
 const filters = parseQuestion(question);
 const exact = runFilters(items, filters, profile);
 if (exact.length) return { filters, items: exact, answer: describe(exact.length, filters) };
 // Sin coincidencias exactas: se relajan condiciones (primero las secundarias) y se dice con claridad.
 const relaxations: (keyof AskFilters)[][] = [['certificate'], ['free'], ['virtual', 'inPerson', 'city'], ['type'], ['certificate', 'free', 'virtual', 'inPerson', 'city']];
 for (const drop of relaxations) {
  if (!drop.some(k => filters[k])) continue;
  const relaxed = { ...filters }; for (const k of drop) delete (relaxed as Record<string, unknown>)[k];
  const near = runFilters(items, relaxed, profile);
  if (near.length) return { filters, items: near, answer: `${describe(0, filters).split('.')[0]}, pero ${near.length === 1 ? 'esta opción se acerca' : `estas ${near.length} opciones se acercan`}.` };
 }
 return { filters, items: [], answer: describe(0, filters) };
}

function runFilters(items: Opportunity[], filters: AskFilters, profile: Profile | null): Opportunity[] {
 const topicWords = TOPICS.filter(([, label]) => filters.topics.includes(label));
 const pool = items.filter(o => o.status !== 'draft' && statusOf(o) !== 'Vencida');
 const scored = pool.map(o => {
  const t = textOf(o);
  if (filters.type && normalize(o.type) !== filters.type) return null;
  if (filters.free && !/gratis|gratuit|sin costo/.test(normalize(o.costLabel))) return null;
  if (filters.certificate && !/certific|insignia|badge/.test(t)) return null;
  if (filters.virtual && !/virtual|remot|online|en linea/.test(normalize(o.format + ' ' + o.location))) return null;
  if (filters.inPerson && !/presencial/.test(normalize(o.format))) return null;
  if (filters.city && !normalize(o.location + ' ' + o.format + ' ' + o.description).includes(filters.city)) return null;
  const topicHits = topicWords.filter(([, , words]) => words.some(w => t.includes(w))).length;
  if (topicWords.length && !topicHits) return null;
  if (!topicWords.length && filters.keywords?.length && !filters.keywords.some(k => t.includes(k))) return null;
  return { o, score: topicHits * 10 + relevance(o, profile) };
 }).filter((x): x is { o: Opportunity; score: number } => !!x).sort((a, b) => b.score - a.score);
 return scored.map(x => x.o);
}

function describe(n: number, f: AskFilters): string {
 const what = f.type ? PLURAL[f.type] : 'opciones';
 const parts = [f.free ? 'gratis' : '', f.topics.length ? `de ${f.topics.join(' y ')}` : (f.keywords?.length ? `sobre «${f.keywords.join(' ')}»` : ''), f.certificate ? 'con certificado o insignia' : '', f.virtual ? 'virtuales' : '', f.city ? `en ${f.city[0].toUpperCase() + f.city.slice(1)}` : (f.inPerson ? 'presenciales' : '')].filter(Boolean).join(' ');
 if (!n) return `No encontré ${what}${parts ? ' ' + parts : ''} en el catálogo. Prueba con menos condiciones o explora por categoría.`;
 const one = f.type ? SINGULAR[f.type] : 'opción';
 return `Encontré ${n} ${n === 1 ? one : what}${parts ? ' ' + parts : ''}.`;
}

export const ASK_SUGGESTIONS = ['Programas gratis de IA', 'Eventos en Lima', 'Cursos de datos con insignia', 'Voluntariados virtuales'];
