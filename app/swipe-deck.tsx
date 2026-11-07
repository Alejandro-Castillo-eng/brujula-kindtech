import { useRef, useState } from 'react';
import type { ReactNode, PointerEvent as ReactPointerEvent, KeyboardEvent } from 'react';
import { Check, X } from 'lucide-react';

export type SwipeDir = 'left' | 'right';

// Mazo de tarjetas al estilo «match»: se arrastra la tarjeta superior a la derecha
// (conectar) o a la izquierda (pasar). También funciona con los botones y con las
// flechas del teclado.
export function SwipeDeck<T>({ items, keyOf, render, onSwipe, labels = { left: 'Pasar', right: 'Conectar' } }: {
 items: T[];
 keyOf: (item: T) => string;
 render: (item: T) => ReactNode;
 onSwipe: (item: T, dir: SwipeDir) => void | Promise<void>;
 labels?: { left: string; right: string };
}) {
 const [dx, setDx] = useState(0);
 const [leaving, setLeaving] = useState<SwipeDir | null>(null);
 const drag = useRef<{ x: number; y: number; id: number; active: boolean } | null>(null);
 const top = items[0];
 const THRESHOLD = 100;

 const fly = (dir: SwipeDir) => {
  if (!top || leaving) return;
  setLeaving(dir);
  window.setTimeout(async () => { await onSwipe(top, dir); setLeaving(null); setDx(0); }, 280);
 };

 const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
  if (leaving || (e.target as HTMLElement).closest('a,button')) return;
  drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId, active: false };
 };
 const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
  const d = drag.current; if (!d) return;
  const mx = e.clientX - d.x, my = e.clientY - d.y;
  if (!d.active) {
   if (Math.abs(mx) < 6) return;
   if (Math.abs(my) > Math.abs(mx)) { drag.current = null; return; } // gesto vertical: dejar desplazar la página
   d.active = true; e.currentTarget.setPointerCapture(e.pointerId);
  }
  setDx(mx);
 };
 const onPointerUp = () => {
  const d = drag.current; drag.current = null;
  if (!d?.active) return;
  if (dx > THRESHOLD) fly('right'); else if (dx < -THRESHOLD) fly('left'); else setDx(0);
 };
 const onKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowRight') { e.preventDefault(); fly('right'); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); fly('left'); }
 };

 if (!top) return null;
 const offset = leaving ? (leaving === 'right' ? 520 : -520) : dx;
 const progress = Math.max(-1, Math.min(1, offset / THRESHOLD));
 return <div className="swipe-deck" tabIndex={0} onKeyDown={onKeyDown} aria-label={`Tarjetas: ${items.length}. Flecha derecha para ${labels.right.toLowerCase()}, flecha izquierda para ${labels.left.toLowerCase()}.`}>
  <div className="swipe-stack">
   {items[1] ? <div className="swipe-card is-next" aria-hidden="true" key={keyOf(items[1])}>{render(items[1])}</div> : null}
   <div className={'swipe-card is-top' + (dx === 0 && !leaving ? ' is-resting' : '')} key={keyOf(top)}
    style={{ transform: `translateX(${offset}px) rotate(${offset / 18}deg)` }}
    onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
    <span className="swipe-stamp right" style={{ opacity: Math.max(0, progress) }}>{labels.right}</span>
    <span className="swipe-stamp left" style={{ opacity: Math.max(0, -progress) }}>{labels.left}</span>
    {render(top)}
   </div>
  </div>
  <div className="swipe-actions">
   <button className="swipe-btn pass" onClick={() => fly('left')} aria-label={labels.left} disabled={!!leaving}><X size={26} /></button>
   <span className="swipe-count">{items.length} {items.length === 1 ? 'persona' : 'personas'}</span>
   <button className="swipe-btn like" onClick={() => fly('right')} aria-label={labels.right} disabled={!!leaving}><Check size={26} /></button>
  </div>
 </div>;
}
