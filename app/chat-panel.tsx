import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowUp } from 'lucide-react';
import type { MentorRequest } from '@/lib/types';

// Conversación con una persona que aceptó la solicitud. Con perfiles de ejemplo,
// las respuestas son automáticas y se marcan como tales.
export function ChatPanel({ request, name, busy, onSend }: { request: MentorRequest; name: string; busy: boolean; onSend: (text: string) => Promise<boolean> }) {
 const [text, setText] = useState('');
 const end = useRef<HTMLDivElement>(null);
 const msgs = request.messages || [];
 useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs.length]);
 const submit = async (e: FormEvent) => { e.preventDefault(); const t = text.trim(); if (!t) return; if (await onSend(t)) setText(''); };
 return <div className="chat">
  <div className="chat-thread">
   <div className="chat-bubble me first">{request.message}</div>
   {msgs.map((m, i) => <div key={i} className={'chat-bubble ' + m.from}>{m.text}{m.example ? <small>Respuesta de ejemplo</small> : null}</div>)}
   {!msgs.length ? <p className="chat-empty">{name} aceptó tu solicitud. Escríbele para empezar.</p> : null}
   <div ref={end} />
  </div>
  <form className="ask-input" onSubmit={submit}>
   <input value={text} onChange={e => setText(e.target.value)} maxLength={1000} placeholder={`Escribe a ${name}…`} aria-label="Escribe tu mensaje" autoFocus />
   <button aria-label="Enviar mensaje" disabled={busy || !text.trim()}><ArrowUp size={18} /></button>
  </form>
 </div>;
}
