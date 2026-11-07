import type { Opportunity, Profile, Task } from './types';
import { keywordsForCareer } from './careers.ts';
export const normalize = (value:string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export const AREAS = ['Marketing y comunicación','Datos y analítica','Tecnología','Negocios y gestión','Diseño y creatividad','Impacto social'];
export const SKILLS = ['Excel','Power BI','Python','Marketing digital','Comunicación','Trabajo en equipo','Inglés','Diseño','Programación','Gestión de proyectos','Liderazgo','Análisis de datos'];
export const TYPES = ['Todos','Curso','Voluntariado','Programa','Evento'];
export const DEFAULT_PROFILE:Profile = {name:'',career:'',university:'',cycle:6,target:AREAS[0],skills:[],hours:4,bio:''};
const areaWords:Record<string,string[]> = {
 [AREAS[0]]:['marketing','contenido','comunicacion','redes','ventas'],
 [AREAS[1]]:['datos','analitica','excel','power bi','python'],
 [AREAS[2]]:['tecnologia','programacion','python','digital','software'],
 [AREAS[3]]:['negocios','gestion','liderazgo','emprendimiento','recursos humanos'],
 [AREAS[4]]:['diseno','creatividad','contenido','visual'],
 [AREAS[5]]:['voluntariado','social','comunidad','sostenibilidad'],
};
export function relevance(o:Opportunity,p:Profile|null) {
 if(!p) return 0;
 const text=normalize([o.title,o.description,...o.skills,...o.categories].join(' '));
 const area=(areaWords[p.target]||[]).reduce((n,w)=>n+(text.includes(w)?2:0),0);
 // La carrera también cuenta: sube lo que se relaciona con ella.
 const career=keywordsForCareer(p.career||'').reduce((n,w)=>n+(text.includes(w)?1:0),0);
 // Y lo que la persona marcó en «¿Qué ya sabes hacer?» (por su primera palabra: «Nube (AWS, Azure)» → nube).
 const skills=(p.skills||[]).map(s=>normalize(s).split(/[^a-z0-9]+/)[0]).filter(w=>w&&w.length>2).reduce((n,w)=>n+(text.includes(w)?2:0),0);
 return area+career+skills;
}
export function statusOf(o:Opportunity,now=new Date()) {
 if(o.deadline && /^\d{4}-\d{2}-\d{2}$/.test(o.deadline) && new Date(o.deadline+'T23:59:59-05:00').getTime()<now.getTime()) return 'Vencida';
 if(o.linkCheck && (o.linkCheck.code===404||o.linkCheck.code===410)) return 'Revisar fuente';
 if(o.availability==='próxima convocatoria') return 'Próxima convocatoria';
 if(o.availability==='permanente') return 'A tu ritmo';
 return 'Verificar convocatoria';
}
/** Fecha visible en cada tarjeta, o una indicación clara si no tiene fecha. */
export function dateLabelOf(o:Opportunity) {
 if(o.deadline) return 'Cierra el '+shortDate(o.deadline);
 if(o.dateLabel) return o.dateLabel;
 if(o.availability==='permanente') return 'Sin fecha · empieza cuando quieras';
 if(o.availability==='próxima convocatoria') return 'Fecha por anunciar';
 return 'Sin fecha publicada';
}
export function freshness(o:Opportunity,now=new Date()) {
 const t=new Date(o.lastVerified+'T00:00:00-05:00').getTime();
 return !Number.isFinite(t)||now.getTime()-t>14*86400000 ? 'Requiere revisión' : 'Fuente revisada';
}
export function searchCatalog(items:Opportunity[],query:string,type='Todos',free=false,remote=false,profile:Profile|null=null) {
 const q=normalize(query);
 const inferredFree=free||/\b(gratis|gratuito|gratuitos|gratuita|gratuitas|sin costo)\b/.test(q);
 const inferredRemote=remote||/\b(virtual|virtuales|remoto|remotos|online|en linea)\b/.test(q);
 let inferredType=type;
 if(type==='Todos') {
  if(/\b(curso|cursos)\b/.test(q)) inferredType='Curso';
  else if(/\b(voluntariado|voluntariados)\b/.test(q)) inferredType='Voluntariado';
 }
 const stop=new Set(['busco','buscar','quiero','muestrame','encuentra','oportunidades','oportunidad','para','de','en','y','con','que','me','un','una','los','las','el','la','soy','estudiante','estudiantes','curso','cursos','voluntariado','voluntariados','gratis','gratuito','gratuitos','gratuita','gratuitas','virtual','virtuales','remoto','remotos','online','sin','costo','practica','practicas','mi','aprender']);
 const terms=q.split(/[^a-z0-9]+/).filter(w=>w.length>1&&!stop.has(w));
 const matching=items.filter(o=>{
  if(o.status==='draft'||statusOf(o)==='Vencida')return false;
  if(inferredType!=='Todos'&&normalize(o.type)!==normalize(inferredType))return false;
  if(inferredFree&&!/gratis|gratuit|sin costo/.test(normalize(o.costLabel)))return false;
  if(inferredRemote&&!/virtual|remot|online|en linea/.test(normalize(o.format)))return false;
  const hay=normalize([o.title,o.organization,o.description,o.location,...o.skills,...o.categories].join(' '));
  return terms.every(t=>hay.includes(t));
 }).sort((a,b)=>relevance(b,profile)-relevance(a,profile));
 return {items:matching,filters:[...(inferredType!=='Todos'?[inferredType]:[]),...(inferredFree?['Sin costo']:[]),...(inferredRemote?['Virtual']:[])]};
}
export function buildRoute(profile:Profile|null,items:Opportunity[]):Task[] {
 if(!profile) return [];
 const recommendations=items.filter(o=>statusOf(o)!=='Vencida'&&o.status!=='draft').sort((a,b)=>relevance(b,profile)-relevance(a,profile));
 const course=recommendations.find(o=>normalize(o.type)==='curso');
 const volunteer=recommendations.find(o=>normalize(o.type)==='voluntariado');
 return [
  {id:'goal-'+normalize(profile.target),title:'Dale forma a tu objetivo',description:`Escribe qué te gustaría aportar en ${profile.target.toLowerCase()} y reúne dos ejemplos de tus fortalezas.`,kind:'Reflexión',week:1},
  {id:course?'learn-'+course.id:'learn-foundation',title:course?.title||'Fortalece una habilidad de tu área',description:course?`Reserva ${profile.hours} horas esta semana. Empieza por una lección y registra lo que aprendiste.`:'Elige una habilidad concreta que quieras practicar esta semana.',kind:'Aprendizaje',opportunityId:course?.id,week:1},
  {id:'project-'+normalize(profile.target),title:'Convierte lo aprendido en un proyecto',description:'Crea una pequeña muestra de trabajo: un análisis, una campaña o una solución. Cuenta qué problema resolviste y qué aprendiste.',kind:'Experiencia',week:2},
  {id:volunteer?'experience-'+volunteer.id:'connect-community',title:volunteer?'Explora una experiencia de voluntariado':'Conecta con alguien de tu área',description:volunteer?`Revisa requisitos y vigencia de ${volunteer.title}. Decide si encaja con tu disponibilidad.`:'Prepara dos preguntas y solicita orientación a una persona de la comunidad.',kind:'Conexión',opportunityId:volunteer?.id,week:3},
  {id:'review-'+normalize(profile.target),title:'Reconoce tu avance y ajusta tu perfil',description:'Añade lo aprendido a tu perfil. Guarda una evidencia y elige tu siguiente paso. Cada avance cuenta.',kind:'Progreso',week:4},
 ];
}
/** Solo perfiles personales de LinkedIn: https://www.linkedin.com/in/usuario */
export function isLinkedInProfile(value:string) { return /^https:\/\/(www\.|[a-z]{2}\.)?linkedin\.com\/in\/[A-Za-z0-9_%-]{3,100}\/?$/.test(value.trim()); }
export function safeUrl(value:string) {
 try {const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!/^(localhost|127\.|10\.|192\.168\.|169\.254\.|\[|0\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(u.hostname)&&u.hostname.includes('.');}catch{return false;}
}
export function shortDate(value:string|null) {if(!value)return 'Sin fecha publicada';return new Intl.DateTimeFormat('es-PE',{day:'numeric',month:'short',timeZone:'America/Lima'}).format(new Date(value.length===10?value+'T12:00:00-05:00':value));}
