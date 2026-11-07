import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowUp, Sparkles } from 'lucide-react';
import type { Opportunity, Profile } from '@/lib/types';
import { askCatalog, ASK_SUGGESTIONS } from '@/lib/assistant';
import type { AskResult } from '@/lib/assistant';
import { dateLabelOf } from '@/lib/logic';

export type AskTurn = { q: string; res: AskResult };

// Conversación del asistente de Explorar. Responde solo con oportunidades del catálogo.
export function AskPanel({ opportunities, profile, thread, setThread, onOpen }: {
 opportunities: Opportunity[];
 profile: Profile | null;
 thread: AskTurn[];
 setThread: (t: AskTurn[]) => void;
 onOpen: (o: Opportunity) => void;
}) {
 const [q, setQ] = useState('');
 const end = useRef<HTMLDivElement>(null);
 useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [thread.length]);
 const ask = (text: string) => {
  const question = text.trim(); if (!question) return;
  setThread([...thread, { q: question, res: askCatalog(opportunities, question, profile) }].slice(-6));
  setQ('');
 };
 const submit = (e: FormEvent) => { e.preventDefault(); ask(q); };

 return <div className="ask">
  {!thread.length ? <div className="ask-hello"><span className="ask-avatar"><Sparkles size={20} /></span><p>¿Qué te gustaría encontrar? Pregúntame en tus palabras.</p></div> : null}
  <div className="ask-thread">
   {thread.map((t, i) => <div className="ask-turn" key={i}>
    <div className="ask-bubble me">{t.q}</div>
    <div className="ask-bubble bot"><span className="ask-avatar small"><Sparkles size={14} /></span><div>
     <p>{t.res.answer}</p>
     {t.res.items.length ? <div className="ask-results">{t.res.items.slice(0, 5).map(o => <button key={o.id} className="ask-result" onClick={() => onOpen(o)}><b>{o.title}</b><small>{o.organization} · {dateLabelOf(o)}</small></button>)}</div> : null}
     {t.res.items.length > 5 ? <small className="ask-more">Y {t.res.items.length - 5} más. Afina tu pregunta para ver otras.</small> : null}
    </div></div>
   </div>)}
   <div ref={end} />
  </div>
  <div className="ask-suggestions">{ASK_SUGGESTIONS.map(s => <button key={s} onClick={() => ask(s)}>{s}</button>)}</div>
  <form className="ask-input" onSubmit={submit}>
   <input value={q} onChange={e => setQ(e.target.value)} maxLength={200} placeholder="Ej. programas gratis de IA" aria-label="Escribe tu pregunta" autoFocus />
   <button aria-label="Preguntar" disabled={!q.trim()}><ArrowUp size={18} /></button>
  </form>
 </div>;
}
