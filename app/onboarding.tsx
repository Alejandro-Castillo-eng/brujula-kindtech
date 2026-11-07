import { useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Check, Megaphone, ChartColumn, Laptop, Briefcase, Palette, HeartHandshake, Sparkles } from 'lucide-react';
import type { Profile } from '@/lib/types';
import { AREAS, DEFAULT_PROFILE } from '@/lib/logic';
import { CAREERS, TRANSVERSAL_AREAS, UNIVERSITIES, areasForCareer, skillsForCareer } from '@/lib/careers';

// Primer recorrido: bienvenida + 3 pasos cortos + resumen.
// Cada paso es una sola pregunta principal y casi todo se responde con toques.

const AREA_ICONS = [Megaphone, ChartColumn, Laptop, Briefcase, Palette, HeartHandshake];
const AREA_SHORT = ['Marketing', 'Datos', 'Tecnología', 'Negocios', 'Diseño', 'Impacto social'];
// Nombres de las áreas cuando se muestran como habilidades para cualquier carrera.
const TRANSVERSAL_LABEL: Record<string, string> = { [AREAS[1]]: 'Excel y datos', [AREAS[0]]: 'Comunicación', [AREAS[3]]: 'Gestión y liderazgo', [AREAS[5]]: 'Voluntariado' };
const HOURS = [2, 4, 6, 10];
const CYCLES = Array.from({ length: 10 }, (_, i) => i + 1);
const TOTAL = 3;


export function Onboarding({ initialStep = 0, busy, art, onSave, onSkip, onFinish }: {
 initialStep?: number;
 busy: boolean;
 art: ReactNode;
 onSave: (p: Profile) => Promise<boolean>;
 onSkip: () => void;
 onFinish: (to: 'route' | 'explore' | 'referents') => void;
}) {
 const [step, setStep] = useState(initialStep);
 const [value, setValue] = useState<Profile>({ ...DEFAULT_PROFILE, career: '', target: '' });
 const [otherCareer, setOtherCareer] = useState(false);
 const careerAreas = areasForCareer(value.career);
 const areaOptions = careerAreas || TRANSVERSAL_AREAS;
 const pickCareer = (name: string) => { setOtherCareer(false); setValue(p => ({ ...p, career: name, target: '' })); };
 const change = <K extends keyof Profile>(key: K, v: Profile[K]) => setValue(p => ({ ...p, [key]: v }));
 const toggleSkill = (s: string) => change('skills', value.skills.includes(s) ? value.skills.filter(x => x !== s) : [...value.skills, s]);

 const aboutReady = value.name.trim().length >= 2 && value.career.trim().length >= 2;
 const pickArea = (a: string) => { change('target', a); window.setTimeout(() => setStep(3), 220); };
 async function finish() { if (await onSave({ ...value, name: value.name.trim(), career: value.career.trim(), university: value.university.trim() })) setStep(4); }

 if (step === 0) return <div className="ob ob-welcome">
  <div className="ob-scroll">
   <section className="ob-hero">{art}</section>
   <span className="ob-pill">TU FUTURO, A TU RITMO</span>
   <h1>Tu talento tiene un camino.</h1>
   <p className="ob-lead">Responde 3 preguntas rápidas y te mostramos por dónde empezar.</p>
  </div>
  <div className="ob-footer">
   <button className="button full" onClick={() => setStep(1)}>Empezar <ArrowRight size={16} /></button>
   <button className="ob-link" onClick={onSkip}>Solo quiero explorar</button>
  </div>
 </div>;

 if (step === 4) {
  const toGrow = skillsForCareer(value.career).filter(s => !value.skills.includes(s)).slice(0, 2);
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
   </div>
   <div className="ob-footer">
    <button className="button full" onClick={() => onFinish('explore')}>Explorar oportunidades <ArrowRight size={16} /></button>
    <button className="ob-link" onClick={() => onFinish('referents')}>Ver referentes</button>
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
   <label className="field">¿En qué universidad estudias? <span className="optional">opcional</span><input list="ob-universities" autoComplete="organization" maxLength={100} value={value.university} onChange={e => change('university', e.target.value)} placeholder="Escribe o elige tu universidad" /><datalist id="ob-universities">{UNIVERSITIES.map(u => <option key={u} value={u} />)}</datalist></label>
   <span className="field-title">¿Qué estudias?</span>
   <div className="ob-careers">{CAREERS.map(c => <button type="button" key={c.name} className={'ob-tag' + (!otherCareer && value.career === c.name ? ' on' : '')} aria-pressed={!otherCareer && value.career === c.name} onClick={() => pickCareer(c.name)}>{c.name}</button>)}<button type="button" className={'ob-tag' + (otherCareer ? ' on' : '')} aria-pressed={otherCareer} onClick={() => { setOtherCareer(true); setValue(p => ({ ...p, career: '', target: '' })); }}>Otra carrera</button></div>
   {otherCareer ? <label className="field">Escribe tu carrera<input autoFocus required minLength={2} maxLength={100} value={value.career} onChange={e => setValue(p => ({ ...p, career: e.target.value, target: '' }))} placeholder="Ej. Psicología" /></label> : null}
   <span className="field-title">¿En qué ciclo estás?</span>
   <div className="ob-cycles">{CYCLES.map(c => <button type="button" key={c} className={value.cycle === c ? 'on' : ''} aria-pressed={value.cycle === c} onClick={() => change('cycle', c)}>{c}</button>)}</div>
  </form> : null}

  {step === 2 ? <div className="ob-scroll">
   <span className="ob-step">PASO 2 DE 3</span>
   <h1>¿Hacia dónde quieres crecer?</h1>
   {careerAreas ? <p className="ob-lead">Áreas que se relacionan con {value.career}.</p> : <div className="ob-heads-up"><b>Aún no tenemos una ruta para {value.career}.</b> Empezamos con pocas carreras. Mientras tanto, elige algo que sirve en cualquier carrera.</div>}
   <div className="ob-areas">{areaOptions.map(a => { const i = AREAS.indexOf(a); const Icon = AREA_ICONS[i]; const label = careerAreas ? AREA_SHORT[i] : TRANSVERSAL_LABEL[a]; return <button type="button" key={a} className={value.target === a ? 'on' : ''} aria-pressed={value.target === a} aria-label={label} onClick={() => pickArea(a)}><Icon size={23} /><span>{label}</span></button>; })}</div>
  </div> : null}

  {step === 3 ? <div className="ob-scroll">
   <span className="ob-step">PASO 3 DE 3</span>
   <h1>¿Qué ya sabes hacer?</h1>
   <p className="ob-lead">{careerAreas ? `Lo más usado en ${value.career}.` : 'Útil en cualquier carrera.'} Toca lo que ya manejas o sigue sin marcar.</p>
   <div className="ob-tags pick">{skillsForCareer(value.career).map(s => <button type="button" key={s} className={'ob-tag' + (value.skills.includes(s) ? ' on' : '')} aria-pressed={value.skills.includes(s)} onClick={() => toggleSkill(s)}>{value.skills.includes(s) ? <Check size={14} /> : null}{s}</button>)}</div>
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
