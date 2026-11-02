"use client";
import { useEffect, useRef } from "react";

// Scroll input for a page that never scrolls: wheel, touch drag and ↑/↓/Page keys move a target between 0 and 1
// (a full play takes `length` screen heights of scrolling) and the value glides after it, so wheel notches and
// flicks read as one smooth move. `onFrame(value, target)` runs every frame. Without a length, input is ignored.
export function useScrollPlay(length, onFrame) {
  const play = useRef({ target: 0, value: 0 }), frame = useRef(onFrame);
  frame.current = onFrame;
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const advance = pixels => {
      if (length) play.current.target = Math.min(1, Math.max(0, play.current.target + pixels / (length * window.innerHeight)));
    };
    let raf = 0, last = performance.now();
    const tick = now => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      const state = play.current;
      state.value = reduced.matches ? state.target : state.value + (state.target - state.value) * (1 - Math.exp(-dt * 5));
      frame.current?.(length ? state.value : 0, state.target);
    };
    raf = requestAnimationFrame(tick);
    const onWheel = event => advance(event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1));
    let touchY = null;
    const onTouchStart = event => { touchY = event.touches[0].clientY; };
    const onTouchMove = event => { if (touchY === null) return; const y = event.touches[0].clientY; advance((touchY - y) * 1.6); touchY = y; };
    const onTouchEnd = () => { touchY = null; };
    const onKey = event => {
      const step = { ArrowDown: .25, PageDown: .9, " ": .9, ArrowUp: -.25, PageUp: -.9 }[event.key];
      if (step === undefined || (event.key === " " && event.target.closest?.("button,a"))) return;
      event.preventDefault(); advance(step * window.innerHeight);
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true }); window.addEventListener("touchmove", onTouchMove, { passive: true }); window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart); window.removeEventListener("touchmove", onTouchMove); window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
    };
  }, [length]);
  return play;
}

// The scroll indicator for experiments that play as you scroll (styles in journey.css).
export function ScrollIndicator({ indicator }) {
  return (
    <div className="lab-scroll" ref={indicator} aria-hidden="true">
      <span className="lab-scroll-track"><i /></span>
      <span className="lab-scroll-label">Scroll</span>
    </div>
  );
}
