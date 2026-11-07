import { useEffect, useRef, useState } from 'react';
import type { ReactNode, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';

// Fila horizontal que se puede arrastrar con el mouse (en celular ya se desliza
// con el dedo), mover con la rueda y que difumina el borde cuando hay más opciones.
export function DragScroll({ className, children }: { className: string; children: ReactNode }) {
 const ref = useRef<HTMLDivElement>(null);
 const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: false });
 const [edges, setEdges] = useState({ left: false, right: false });

 const update = () => {
  const el = ref.current; if (!el) return;
  setEdges({ left: el.scrollLeft > 2, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 2 });
 };

 useEffect(() => {
  const el = ref.current; if (!el) return;
  update();
  const onWheel = (e: WheelEvent) => {
   if (el.scrollWidth <= el.clientWidth || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
   e.preventDefault(); el.scrollLeft += e.deltaY;
  };
  el.addEventListener('wheel', onWheel, { passive: false });
  const ro = new ResizeObserver(update); ro.observe(el);
  return () => { el.removeEventListener('wheel', onWheel); ro.disconnect(); };
 }, []);

 const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
  if (e.pointerType !== 'mouse' || e.button !== 0 || !ref.current) return;
  drag.current = { active: true, startX: e.clientX, startLeft: ref.current.scrollLeft, moved: false };
 };
 const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
  const d = drag.current, el = ref.current; if (!d.active || !el) return;
  const dx = e.clientX - d.startX;
  if (!d.moved && Math.abs(dx) > 4) { d.moved = true; el.setPointerCapture(e.pointerId); el.classList.add('dragging'); }
  if (d.moved) el.scrollLeft = d.startLeft - dx;
 };
 const end = (e: ReactPointerEvent<HTMLDivElement>) => {
  const el = ref.current; drag.current.active = false;
  if (el?.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
  el?.classList.remove('dragging');
 };
 // Si se arrastró, el clic que llega al soltar no debe activar un filtro.
 const onClickCapture = (e: ReactMouseEvent) => { if (drag.current.moved) { e.stopPropagation(); e.preventDefault(); drag.current.moved = false; } };

 return <div ref={ref} className={`${className} drag-scroll${edges.left ? ' more-left' : ''}${edges.right ? ' more-right' : ''}`}
  onScroll={update} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={end} onPointerCancel={end} onClickCapture={onClickCapture}>{children}</div>;
}
