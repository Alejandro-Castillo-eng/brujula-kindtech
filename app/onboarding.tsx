import { useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Check, Megaphone, ChartColumn, Laptop, Briefcase, Palette, HeartHandshake, Lock, Sparkles } from 'lucide-react';
import type { Opportunity, Profile } from '@/lib/types';
import { AREAS, SKILLS, DEFAULT_PROFILE, relevance, statusOf } from '@/lib/logic';

// Primer recorrido: bienvenida + 3 pasos cortos + resumen.
// Cada paso es una sola pregunta principal y casi todo se responde con toques.

const AREA_ICONS = [Megaphone, ChartColumn, Laptop, Briefcase, Palette, HeartHandshake];
const AREA_SHORT = ['Marketing', 'Datos', 'Tecnología', 'Negocios', 'Diseño', 'Impacto social'];
const AREA_SKILLS: Record<string, string[]> = {
 [AREAS[0]]: ['Marketing digital', 'Comunicación', 'Diseño'],
 [AREAS[1]]: ['Excel', 'Análisis de datos', 'Power BI', 'Python'],
 [AREAS[2]]: ['Programación', 'Python', 'Inglés'],
 [AREAS[3]]: ['Gestión de proyectos', 'Liderazgo', 'Excel'],
 [AREAS[4]]: ['Diseño', 'Comunicación', 'Marketing digital'],
 [AREAS[5]]: ['Trabajo en equipo', 'Liderazgo', 'Comunicación'],
};
const HOURS = [2, 4, 6, 10];
const CYCLES = Array.from({ length: 10 }, (_, i) => i + 1);
const TOTAL = 3;

export function suggestedSkills(target: string) { return AREA_SKILLS[target] || []; }

export function Onboarding({ initialStep = 0, opportunities, busy, art, onSave, onSkip, onFinish }: {
 initialStep?: number;
 opportunities: Opportunity[];
 busy: boolean;
 art: ReactNode;
 onSave: (p: Profile) => Promise<boolean>;
 onSkip: () => void;
 onFinish: (to: 'route' | 'explore') => void;
}) {
 const [step, setStep] = useState(initialStep);
 const [value, setValue] = useState<Profile>({ ...DEFAULT_PROFILE, target: '' });
 const change = <K extends keyof Profile>(key: K, v: Profile[K]) => setValue(p => ({ ...p, [key]: v }));
 const toggleSkill = (s: string) => change('skills', value.skills.includes(s) ? value.skills.filter(x => x !== s) : [...value.skills, s]);

 const aboutReady = value.name.trim().length >= 2 && value.career.trim().length >= 2;
 const pickArea = (a: string) => { change('target', a); window.setTimeout(() => setStep(3), 220); };
 async function finish() { if (await onSave({ ...value, name: value.name.trim(), career: value.career.trim() })) setStep(4); }

 if (step === 0) return <div className="ob ob-welcome">
  <div className="ob-scroll">
   <section className="ob-hero">{art}</section>
   <span className="ob-pill">TU FUTURO, A TU RITMO</span>
   <h1>Tu talento tiene un camino.</h1>
   <p className="ob-lead">Responde 3 preguntas rápidas y te mostramos por dónde empezar.</p>
   <ul className="ob-facts"><li><Sparkles size={16} /> Menos de 1 minuto</li><li><Lock size={16} /> Sin cuenta: tus datos se borran al cerrar la página</li></ul>
  </div>
  <div className="ob-footer">
   <button className="button full" onClick={() => setStep(1)}>Empezar <ArrowRight size={16} /></button>
   <button className="ob-link" onClick={onSkip}>Solo quiero explorar</button>
  </div>
 </div>;

 if (step === 4) {
  const published = opportunities.filter(o => o.status !== 'draft' && statusOf(o) !== 'Vencida');
  const picks = [...published].sort((a, b) => relevance(b, value) - relevance(a, value)).slice(0, 2);
  const toGrow = suggestedSkills(value.target).filter(s => !value.skills.includes(s)).slice(0, 2);
  const idx = AREAS.indexOf(value.target); const Icon = AREA_ICONS[idx] || Sparkles;
  return <div className="ob">
   <div className="ob-scroll">
    <span className="ob-done"><Check size={24} /></span>
    <h1>Listo, {value.name.split(' ')[0]}.</h1>
    <p className="ob-lead">Este es tu punto de partida. Puedes cambiarlo cuando quieras.</p>
    <div className="ob-summary">
     <div className="ob-summary-head"><span className="ob-area-icon"><Icon size={21} /></span><div><small>Quieres crecer en</small><b>{value.target}</b></div></div>
     <div className="ob-summary-row"><small>Tus fortalezas</small><div className="ob-tags">{value.skills.length ? value.skills.slice(0, 6).map(s => <span key={s} className="ob-tag on">{s}</span>) : <span className="ob-muted">Las descubriremos en el camino.</span>}</div></div>
     {toGrow.length ? <div className="ob-summary-row"><small>Podrías reforzar</small><div className="ob-tags">{toGrow.map(s => <span key={s} className="ob-tag">{s}</span>)}</div></div> : null}
     <div className="ob-summary-row"><small>Tu ritmo</small><span>{value.hours} horas por semana</span></div>
    </div>
    {picks.length ? <><h2 className="ob-subtitle">Para empezar</h2><div className="ob-picks">{picks.map(o => <div className="ob-pick" key={o.id}><b>{o.title}</b><small>{o.organization} · {o.costLabel}</small></div>)}</div></> : null}
   </div>
   <div className="ob-footer">
    <button className="button full" onClick={() => onFinish('route')}>Ver mi ruta <ArrowRight size={16} /></button>
    <button className="ob-link" onClick={() => onFinish('explore')}>Explorar oportunidades</button>
   </div>
  </div>;
 }

 return <div className="ob">
  <div className="ob-top">
   <button className="icon-button" aria-label="Atrás" onClick={() => setStep(step - 1)}><ArrowLeft size={18} /></button>
   <div className="ob-progress" role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL} aria-valuenow={step} aria-label={`Paso ${step} de ${TOTAL}`}>{Array.from({ length: TOTAL }, (_, i) => <span key={i} className={i < step ? 'on' : ''} />)}</div>
   <button className="ob-skip" onClick={onSkip}>Ahora no</button>
  </div>

  {step === 1 ? <form className="ob-scroll" id="ob-about" onSubmit={e => { e.preventDefault(); if (aboutReady) setStep(2); }}>
   <span className="ob-step">PASO 1 DE 3</span>
   <h1>Cuéntanos de ti</h1>
   <label className="field">¿Cómo te llamas?<input autoFocus autoComplete="given-name" required minLength={2} maxLength={60} value={value.name} onChange={e => change('name', e.target.value)} placeholder="Tu nombre" /></label>
   <label className="field">¿Qué estudias?<input required minLength={2} maxLength={100} value={value.career} onChange={e => change('career', e.target.value)} placeholder="Ej. Administración" /></label>
   <span className="field-title">¿En qué ciclo estás?</span>
   <div className="ob-cycles">{CYCLES.map(c => <button type="button" key={c} className={value.cycle === c ? 'on' : ''} aria-pressed={value.cycle === c} onClick={() => change('cycle', c)}>{c}</button>)}</div>
  </form> : null}

  {step === 2 ? <div className="ob-scroll">
   <span className="ob-step">PASO 2 DE 3</span>
   <h1>¿Hacia dónde quieres crecer?</h1>
   <p className="ob-lead">Elige una. Podrás explorar todas las áreas igual.</p>
   <div className="ob-areas">{AREAS.map((a, i) => { const Icon = AREA_ICONS[i]; return <button type="button" key={a} className={value.target === a ? 'on' : ''} aria-pressed={value.target === a} aria-label={a} onClick={() => pickArea(a)}><Icon size={23} /><span>{AREA_SHORT[i]}</span></button>; })}</div>
  </div> : null}

  {step === 3 ? <div className="ob-scroll">
   <span className="ob-step">PASO 3 DE 3</span>
   <h1>¿Qué ya sabes hacer?</h1>
   <p className="ob-lead">Toca las que apliquen. Si aún no sabes, puedes seguir.</p>
   <div className="ob-tags pick">{[...suggestedSkills(value.target), ...SKILLS.filter(s => !suggestedSkills(value.target).includes(s))].map(s => <button type="button" key={s} className={'ob-tag' + (value.skills.includes(s) ? ' on' : '')} aria-pressed={value.skills.includes(s)} onClick={() => toggleSkill(s)}>{value.skills.includes(s) ? <Check size={14} /> : null}{s}</button>)}</div>
   <span className="field-title">¿Cuánto tiempo tienes por semana?</span>
   <div className="ob-hours">{HOURS.map(h => <button type="button" key={h} className={value.hours === h ? 'on' : ''} aria-pressed={value.hours === h} onClick={() => change('hours', h)}>{h} h</button>)}</div>
  </div> : null}

  <div className="ob-footer">
   {step === 1 ? <button className="button full" form="ob-about" disabled={!aboutReady}>Continuar <ArrowRight size={16} /></button> : null}
   {step === 2 ? <button className="button full" disabled={!value.target} onClick={() => setStep(3)}>Continuar <ArrowRight size={16} /></button> : null}
   {step === 3 ? <button className="button full" disabled={busy} onClick={() => void finish()}>{busy ? 'Guardando…' : 'Listo'} <ArrowRight size={16} /></button> : null}
  </div>
 </div>;
}
