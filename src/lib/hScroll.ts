import { useRef, type MouseEvent, type PointerEvent, type WheelEvent } from "react";

// Edition-picker rows are overflow-x-auto but only respond to horizontal
// trackpad gestures — a plain vertical mouse wheel does nothing, which reads
// as "stuck" on desktop. Redirect vertical wheel delta to horizontal scroll.
export function onWheelHorizontal(e: WheelEvent<HTMLDivElement>) {
  if (e.deltaY === 0 || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
  e.currentTarget.scrollLeft += e.deltaY;
  e.preventDefault();
}

// Click-and-drag (mouse) to scroll the same rows horizontally. Touch pointers
// are left alone — they already pan natively and capturing them here would
// fight the browser's own momentum scroll.
export function useDragScroll() {
  const drag = useRef({ active: false, startX: 0, startScrollLeft: 0, moved: false });

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "touch") return;
    // Start tracking on the whole row, including buttons. We only capture the
    // pointer after it moves, so a tap still reaches the button while a drag on
    // that same button scrolls the strip.
    drag.current = { active: true, startX: e.clientX, startScrollLeft: e.currentTarget.scrollLeft, moved: false };
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 2 && !drag.current.moved) {
      drag.current.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      e.currentTarget.style.cursor = "grabbing";
    }
    e.currentTarget.scrollLeft = drag.current.startScrollLeft - dx;
  }

  function endDrag(e: PointerEvent<HTMLDivElement>) {
    if (!drag.current.active) return;
    drag.current.active = false;
    e.currentTarget.style.cursor = "";
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* already released */ }
  }

  // A drag that actually moved the row shouldn't also fire the button underneath it.
  function onClickCapture(e: MouseEvent<HTMLDivElement>) {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  }

  return { onPointerDown, onPointerMove, onPointerUp: endDrag, onPointerLeave: endDrag, onClickCapture };
}
