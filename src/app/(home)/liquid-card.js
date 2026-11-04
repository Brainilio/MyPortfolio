"use client";
import { useEffect, useRef } from "react";

// A project card as a piece of liquid: just the preview, no frame or caption, its rounded outline slowly breathing.
// When the pointer moves across it (or when it first lands) the picture ripples like water, through an SVG
// turbulence + displacement filter whose strength rises with the pointer's speed and settles back to still. The
// filter is only applied while it's rippling, and its frame loop only runs then. Reduced motion: no ripple.
export default function LiquidCard({ id, href, label, placed, children }) {
  const media = useRef(null), map = useRef(null), noise = useRef(null);
  const state = useRef({ amount: 0, frame: 0, phase: Math.random() * 100, x: 0, y: 0, t: 0 });

  const run = () => {
    const s = state.current;
    if (s.frame || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let previous = performance.now();
    const step = now => {
      const dt = Math.min((now - previous) / 1000, .05); previous = now;
      s.amount *= Math.exp(-dt * 2.4); s.phase += dt * (1 + s.amount * .08);
      const el = media.current;
      if (s.amount < .4) { s.amount = 0; s.frame = 0; if (el) el.style.filter = ""; return; }
      map.current?.setAttribute("scale", s.amount.toFixed(2));
      noise.current?.setAttribute("baseFrequency", `${(.011 + Math.sin(s.phase * .7) * .002).toFixed(4)} ${(.016 + Math.cos(s.phase) * .003).toFixed(4)}`);
      noise.current?.setAttribute("seed", String(Math.floor(s.phase * 3) % 50));
      if (el) el.style.filter = `url(#${id})`;
      s.frame = requestAnimationFrame(step);
    };
    s.frame = requestAnimationFrame(step);
  };
  const stir = amount => { const s = state.current; s.amount = Math.min(34, Math.max(s.amount, amount)); run(); };

  // A splash when it first lands.
  useEffect(() => { if (placed) stir(26); }, [placed]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => cancelAnimationFrame(state.current.frame), []);

  const onMove = event => {
    const s = state.current, now = performance.now(), dt = Math.max(16, now - s.t);
    const speed = Math.hypot(event.clientX - s.x, event.clientY - s.y) / dt;
    s.x = event.clientX; s.y = event.clientY; s.t = now;
    stir(Math.min(34, 8 + speed * 22));
  };

  return (
    <a href={href} aria-label={label} className="ht-liquid" onPointerEnter={() => stir(18)} onPointerMove={onMove}>
      <svg className="ht-liquid-filter" aria-hidden="true" width="0" height="0">
        <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence ref={noise} type="fractalNoise" baseFrequency=".011 .016" numOctaves="2" seed="3" result="noise" />
          <feDisplacementMap ref={map} in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <span className="ht-liquid-media" ref={media}>{children}</span>
    </a>
  );
}
