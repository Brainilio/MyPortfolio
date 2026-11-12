"use client";

import { useEffect, useState } from "react";
import { HeadingMark } from "../heading";

const PHRASES = ["products with purpose", "experiences people enjoy", "across the stack", "apps for the real world", "systems built to last"];
const HOLD_MS = 4400;

export default function HeroHeadline({ active }) {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!active || hovered || focused) return;

    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let timer;
    const sync = () => {
      clearInterval(timer);
      if (!document.hidden && !preference.matches) {
        timer = setInterval(() => setIndex(current => (current + 1) % PHRASES.length), HOLD_MS);
      }
    };
    sync();
    preference.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      clearInterval(timer);
      preference.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [active, hovered, focused]);

  return <div className="ht-hero-headline">
    <p className="ht-roles" tabIndex={0} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      onPointerEnter={event => { if (event.pointerType !== "touch") setHovered(true); }}
      onPointerLeave={() => setHovered(false)}>
      <span className="ht-sr">I build products with purpose. I build across the stack.</span>
      <span aria-hidden="true">I build </span>
      <span className="ht-hero-phrases" aria-hidden="true">
        {PHRASES.map((phrase, i) => (
          <span key={phrase} data-current={i === index}>{phrase}<HeadingMark /></span>
        ))}
      </span>
    </p>
  </div>;
}
