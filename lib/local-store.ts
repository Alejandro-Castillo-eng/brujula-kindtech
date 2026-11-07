// Almacenamiento local de Brújula. Sustituye a la antigua API con servidor:
// todos los datos del usuario viven en el navegador (localStorage) y nunca se
// envían a ningún servidor. Así la app puede publicarse como sitio estático.
import { z } from 'zod';
import { safeUrl, AREAS, buildRoute, isLinkedInProfile } from './logic.ts';
import type { Bootstrap, Mentor, MentorRequest, Opportunity, Profile } from './types';

export const STORAGE_KEY = 'brujula:v1';
export const LOCAL_USER_ID = 'local';

export type KeyValueStorage = { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void };

type CustomOpportunity = { id: string; data: Opportunity; status: string; createdAt: string };
type SavedEntry = { opportunity_id: string; stage: string; created_at: string };
type MentorData = { role: string; bio: string; topics: string[]; name: string; organization: string; area: string; career?: string; cycle?: number; linkedin?: string };
type StoredRequest = Omit<MentorRequest, 'incoming'>;
type State = {
 profile: Profile | null;
 opportunities: CustomOpportunity[];
 saved: SavedEntry[];
 progress: Record<string, boolean>;
 mentor: MentorData | null;
 requests: StoredRequest[];
 feedback: { id: string; rating: number; message: string; createdAt: string }[];
};

export class StoreError extends Error {}

const text = z.string().trim().max(500);
const profileSchema = z.object({ name: z.string().trim().min(2).max(60), career: z.string().trim().min(2).max(100), university: z.string().trim().max(100), cycle: z.number().int().min(1).max(14), target: z.string().refine(x => AREAS.includes(x)), skills: z.array(z.string().max(60)).max(20), hours: z.number().int().min(1).max(40), bio: text });
const opportunitySchema = z.object({ title: z.string().trim().min(5).max(140), organization: z.string().trim().min(2).max(100), type: z.enum(['curso', 'voluntariado', 'programa', 'evento']), url: z.string().max(2000).refine(safeUrl), description: z.string().trim().min(20).max(1500), skills: z.array(z.string().trim().min(1).max(60)).max(15), categories: z.array(z.string().max(80)).max(10), costLabel: z.string().trim().min(2).max(100), format: z.enum(['Virtual', 'Presencial', 'Híbrido']), location: z.string().trim().min(2).max(100), deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => !isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v).nullable(), availability: z.enum(['permanente', 'verificar convocatoria']), lastVerified: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), status: z.enum(['draft', 'published']) });
const mentorSchema = z.object({ role: z.string().trim().min(3).max(80), bio: z.string().trim().min(20).max(500), topics: z.array(z.string().max(60)).min(1).max(6), linkedin: z.string().trim().max(200).refine(v => v === '' || isLinkedInProfile(v), 'Usa el enlace de tu perfil: https://www.linkedin.com/in/tu-usuario').optional() });
const id = z.string().max(200);

const empty = (): State => ({ profile: null, opportunities: [], saved: [], progress: {}, mentor: null, requests: [], feedback: [] });
const randomId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export function createStore(storage: KeyValueStorage, catalog: Opportunity[], demoMentors: Mentor[], now: () => Date = () => new Date()) {
 const read = (): State => {
  try { const raw = storage.getItem(STORAGE_KEY); return raw ? { ...empty(), ...JSON.parse(raw) } : empty(); } catch { return empty(); }
 };
 const write = (state: State) => {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { throw new StoreError('No pudimos guardar en este navegador. Revisa que el almacenamiento local esté permitido.'); }
 };
 const visible = (state: State): Opportunity[] => [
  ...catalog.map(o => ({ ...o, own: false, status: 'published' })),
  ...[...state.opportunities].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)).map(o => ({ ...o.data, id: o.id, own: true, status: o.status })),
 ];

 function load(): Bootstrap {
  const state = read();
  const mentors: Mentor[] = [...(state.mentor ? [{ ...state.mentor, id: LOCAL_USER_ID, demo: false, own: true }] : []), ...demoMentors];
  return {
   user: { id: LOCAL_USER_ID, name: state.profile?.name || 'Invitado', email: '' },
   profile: state.profile,
   opportunities: visible(state),
   saved: [...state.saved].sort((a, b) => b.created_at.localeCompare(a.created_at)),
   progress: state.progress,
   mentors,
   requests: [...state.requests].sort((a, b) => b.created_at.localeCompare(a.created_at)).map(r => ({ ...r, incoming: false })),
   feedbackCount: state.feedback.length,
  };
 }

 function apply(b: Record<string, unknown>): void {
  const state = read();
  const stamp = now().toISOString();
  switch (b.action) {
   case 'profile': state.profile = profileSchema.parse(b.profile); break;
   case 'save': {
    const oid = id.parse(b.id);
    if (!visible(state).some(o => o.id === oid)) throw new StoreError('Oportunidad no disponible.');
    if (b.saved === false) state.saved = state.saved.filter(s => s.opportunity_id !== oid);
    else {
     const stage = z.enum(['guardada', 'en proceso', 'postulada', 'completada']).parse(b.stage || 'guardada');
     const existing = state.saved.find(s => s.opportunity_id === oid);
     if (existing) existing.stage = stage; else state.saved.push({ opportunity_id: oid, stage, created_at: stamp });
    }
    break;
   }
   case 'progress': {
    const tid = id.parse(b.id); const done = z.boolean().parse(b.done);
    if (!state.profile) throw new StoreError('Completa primero tu perfil.');
    const published = visible(state).filter(o => o.status === 'published');
    if (!buildRoute(state.profile, published).some(t => t.id === tid)) throw new StoreError('Este paso ya no pertenece a tu ruta. Actualiza la página.');
    state.progress[tid] = done;
    break;
   }
   case 'catalog': {
    const op = opportunitySchema.parse(b.opportunity);
    if (b.id) {
     const oid = id.parse(b.id); const existing = state.opportunities.find(o => o.id === oid);
     if (!existing) throw new StoreError('Solo puedes editar oportunidades añadidas por ti.');
     existing.data = { ...op, id: oid }; existing.status = op.status;
    } else {
     const oid = randomId();
     state.opportunities.push({ id: oid, data: { ...op, id: oid }, status: op.status, createdAt: stamp });
    }
    break;
   }
   case 'delete-opportunity': {
    const oid = id.parse(b.id);
    if (!state.opportunities.some(o => o.id === oid)) throw new StoreError('No puedes eliminar esta oportunidad.');
    state.opportunities = state.opportunities.filter(o => o.id !== oid);
    state.saved = state.saved.filter(s => s.opportunity_id !== oid);
    break;
   }
   case 'mentor-profile': {
    if (b.enabled === false) { state.mentor = null; break; }
    if (!state.profile) throw new StoreError('Completa primero tu perfil.');
    const details = mentorSchema.parse(b.mentor);
    state.mentor = { ...details, name: state.profile.name, organization: state.profile.university || 'Comunidad Brújula', area: state.profile.target, career: state.profile.career, cycle: state.profile.cycle };
    break;
   }
   case 'mentor-request': {
    const mid = id.parse(b.id); const message = z.string().trim().min(15).max(800).parse(b.message);
    if (mid === LOCAL_USER_ID) throw new StoreError('Este es tu propio perfil.');
    if (!demoMentors.some(m => m.id === mid)) throw new StoreError('Este perfil ya no está disponible.');
    if (state.requests.some(r => r.mentor_id === mid && (r.status === 'pendiente' || r.status === 'aceptada'))) throw new StoreError('Ya tienes una solicitud activa con esta persona.');
    if (!state.profile) throw new StoreError('Completa tu perfil antes de solicitar orientación.');
    state.requests.push({ id: randomId(), user_id: LOCAL_USER_ID, mentor_id: mid, sender_name: state.profile.name, message, status: 'pendiente', is_demo: 1, created_at: stamp });
    break;
   }
   case 'request-status': {
    const rid = id.parse(b.id); const status = z.enum(['aceptada', 'rechazada', 'cancelada']).parse(b.status);
    const row = state.requests.find(r => r.id === rid);
    if (!row) throw new StoreError('Solicitud no encontrada.');
    if (status !== 'cancelada' && !row.is_demo) throw new StoreError('No tienes permiso para cambiar esta solicitud.');
    if (row.status !== 'pendiente' && status !== 'cancelada') throw new StoreError('La solicitud ya fue respondida.');
    row.status = status;
    break;
   }
   case 'feedback': {
    const v = z.object({ rating: z.number().int().min(1).max(5), message: z.string().trim().min(3).max(1500) }).parse(b);
    state.feedback.push({ id: randomId(), rating: v.rating, message: v.message, createdAt: stamp });
    break;
   }
   case 'delete-account': storage.removeItem(STORAGE_KEY); return;
   default: throw new StoreError('Acción no disponible.');
  }
  write(state);
 }

 return { load, apply };
}

export function describeError(e: unknown): string {
 if (e instanceof z.ZodError) return 'Revisa los campos del formulario.';
 if (e instanceof Error && e.message) return e.message;
 return 'No pudimos guardar los cambios. Inténtalo nuevamente.';
}
