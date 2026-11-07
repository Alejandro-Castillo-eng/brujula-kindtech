// Carreras con las que empieza el MVP y las áreas que tienen sentido para cada una.
// Solo se incluyen carreras para las que el catálogo ya tiene oportunidades.
// Para añadir una carrera: agrégala aquí con sus áreas (en orden de relevancia)
// y asegúrate de que lib/catalog.json tenga oportunidades para esas áreas.
import { AREAS, normalize } from './logic.ts';

const [MARKETING, DATOS, TECNOLOGIA, NEGOCIOS, DISENO, IMPACTO] = AREAS;

export const CAREERS: { name: string; areas: string[] }[] = [
 { name: 'Administración', areas: [NEGOCIOS, MARKETING, DATOS, IMPACTO] },
 { name: 'Contabilidad', areas: [DATOS, NEGOCIOS] },
 { name: 'Economía', areas: [DATOS, NEGOCIOS] },
 { name: 'Ingeniería Industrial', areas: [NEGOCIOS, DATOS, TECNOLOGIA] },
 { name: 'Ingeniería de Sistemas', areas: [TECNOLOGIA, DATOS] },
 { name: 'Ingeniería de Software', areas: [TECNOLOGIA, DATOS] },
 { name: 'Marketing', areas: [MARKETING, DISENO, DATOS] },
 { name: 'Ciencias de la Comunicación', areas: [MARKETING, DISENO, IMPACTO] },
 { name: 'Diseño Gráfico', areas: [DISENO, MARKETING] },
];

// Para carreras que aún no cubrimos: áreas con habilidades que sirven en cualquier carrera.
export const TRANSVERSAL_AREAS = [DATOS, MARKETING, NEGOCIOS, IMPACTO];

/** Áreas relacionadas con la carrera, o null si la carrera aún no está cubierta. */
export function areasForCareer(career: string): string[] | null {
 const c = normalize(career.trim());
 if (!c) return null;
 const match = CAREERS.find(k => c === normalize(k.name) || c.startsWith(normalize(k.name)));
 return match ? match.areas : null;
}
