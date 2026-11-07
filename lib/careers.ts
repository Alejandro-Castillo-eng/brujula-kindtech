// Carreras con las que empieza el MVP. Para cada una:
// - areas: áreas que tienen sentido para la carrera, en orden de relevancia.
// - skills: conocimientos técnicos y herramientas (no habilidades blandas) que se
//   muestran en «¿Qué ya sabes hacer?», de la más
//   importante a la menos importante (las primeras no marcadas se sugieren en
//   «Podrías reforzar»).
// - keywords: palabras (sin tildes, en minúsculas) que, si aparecen en una
//   oportunidad, la hacen subir en las recomendaciones para esa carrera.
// Solo se incluyen carreras para las que el catálogo ya tiene oportunidades.
// Este archivo no importa lib/logic.ts para evitar una dependencia circular.

const MARKETING = 'Marketing y comunicación';
const DATOS = 'Datos y analítica';
const TECNOLOGIA = 'Tecnología';
const NEGOCIOS = 'Negocios y gestión';
const DISENO = 'Diseño y creatividad';
const IMPACTO = 'Impacto social';

const IA_TRABAJO = 'Usar IA en el trabajo (ChatGPT, Claude)';
const IA_PROGRAMAR = 'Programar con IA (Claude Code, Codex)';
const IA_CONTENIDO = 'Crear contenido con IA';

export type Career = { name: string; areas: string[]; skills: string[]; keywords: string[] };

export const CAREERS: Career[] = [
 { name: 'Administración', areas: [NEGOCIOS, MARKETING, DATOS, IMPACTO],
   skills: ['Excel', 'Power BI', 'Gestión de proyectos', 'Finanzas básicas', 'Contabilidad básica', IA_TRABAJO, 'ERP (SAP)', 'Marketing digital', 'Inglés'],
   keywords: ['gestion', 'liderazgo', 'negocios', 'excel', 'proyectos', 'agile', 'empleabilidad'] },
 { name: 'Contabilidad', areas: [DATOS, NEGOCIOS],
   skills: ['Excel avanzado', 'Software contable', 'Tributación', 'Análisis financiero', 'Power BI', 'SQL', IA_TRABAJO, 'Inglés'],
   keywords: ['excel', 'finanzas', 'datos', 'power bi', 'sql'] },
 { name: 'Economía', areas: [DATOS, NEGOCIOS],
   skills: ['Excel avanzado', 'Python para datos', 'R', 'Stata', 'Econometría', 'Power BI', IA_TRABAJO, 'Redacción de informes', 'Inglés'],
   keywords: ['datos', 'python', 'excel', 'analisis', 'power bi', 'sql'] },
 { name: 'Ingeniería Industrial', areas: [NEGOCIOS, DATOS, TECNOLOGIA],
   skills: ['Excel avanzado', 'Power BI', 'Gestión de proyectos', 'Lean y mejora continua', 'Gestión de procesos', 'Logística', 'SQL', 'Python para datos', IA_TRABAJO, 'Inglés'],
   keywords: ['gestion', 'proyectos', 'datos', 'excel', 'power bi', 'agile', 'sql'] },
 { name: 'Ingeniería de Sistemas', areas: [TECNOLOGIA, DATOS],
   skills: ['Programación', 'Python', 'Git y GitHub', IA_PROGRAMAR, 'SQL', 'Java', 'JavaScript', 'Redes', 'Ciberseguridad', 'Nube (AWS, Azure)', 'Inglés técnico'],
   keywords: ['python', 'programacion', 'codigo', 'software', 'git', 'ciberseguridad', 'redes', 'inteligencia artificial', 'cuantica', 'sql', 'hackathon'] },
 { name: 'Ingeniería de Software', areas: [TECNOLOGIA, DATOS],
   skills: ['Programación', 'JavaScript', 'Python', 'Git y GitHub', IA_PROGRAMAR, 'Desarrollo web', 'Bases de datos (SQL)', 'Pruebas de software', 'Metodologías ágiles', 'Nube (AWS, Azure)', 'Inglés técnico'],
   keywords: ['python', 'programacion', 'codigo', 'software', 'git', 'inteligencia artificial', 'sql', 'agile', 'hackathon'] },
 { name: 'Marketing', areas: [MARKETING, DISENO, DATOS],
   skills: ['Marketing digital', 'Redes sociales', 'Google Analytics', 'SEO y SEM', 'Publicidad en Meta y Google', 'Creación de contenido', 'Canva', IA_CONTENIDO, 'Excel', 'Inglés'],
   keywords: ['marketing', 'redes sociales', 'contenido', 'inbound', 'ventas', 'comunicacion'] },
 { name: 'Ciencias de la Comunicación', areas: [MARKETING, DISENO, IMPACTO],
   skills: ['Redacción periodística', 'Creación de contenido', 'Redes sociales', 'Edición de video', 'Fotografía', 'Producción de podcast', 'Google Analytics', 'Canva', IA_CONTENIDO, 'Inglés'],
   keywords: ['comunicacion', 'contenido', 'redes sociales', 'marketing', 'voluntariado'] },
 { name: 'Diseño Gráfico', areas: [DISENO, MARKETING],
   skills: ['Figma', 'Illustrator', 'Photoshop', 'Diseño UX/UI', 'Branding', 'Tipografía', 'Motion graphics', 'Portafolio', 'Diseño con IA', 'Inglés'],
   keywords: ['diseno', 'visual', 'contenido', 'creatividad', 'redes sociales'] },
];

// Para carreras que aún no cubrimos: áreas y habilidades que sirven en cualquier carrera.
export const TRANSVERSAL_AREAS = [DATOS, MARKETING, NEGOCIOS, IMPACTO];
export const TRANSVERSAL_SKILLS = ['Excel', IA_TRABAJO, 'PowerPoint', 'Inglés', 'Power BI', 'Análisis de datos', 'Google Workspace', 'Gestión de proyectos', 'Canva', 'Redacción de informes'];

const plain = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export function findCareer(career: string): Career | null {
 const c = plain(career);
 if (!c) return null;
 return CAREERS.find(k => c === plain(k.name) || c.startsWith(plain(k.name))) || null;
}

/** Áreas relacionadas con la carrera, o null si la carrera aún no está cubierta. */
export function areasForCareer(career: string): string[] | null { return findCareer(career)?.areas || null; }

/** Habilidades para mostrar según la carrera (o las transversales si no está cubierta). */
export function skillsForCareer(career: string): string[] { return findCareer(career)?.skills || TRANSVERSAL_SKILLS; }

/** Palabras que hacen subir una oportunidad para esa carrera. */
export function keywordsForCareer(career: string): string[] { return findCareer(career)?.keywords || []; }
