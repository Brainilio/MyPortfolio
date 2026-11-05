"use client";
import { useEffect, useRef } from "react";
import ShineCard from "./shine-card";

// The Work section's card layouts (A·B·C·D, picked by the "Cards" pill in home.js). Every layout shows the same four
// project cards in the same design (the shader card from shine-card.js); only where they sit, how they arrive and how
// they answer the cursor change. Scroll-driven motion reads the shared scene state every frame (no React updates):
//   A: Orbit. The cards ride a ring round the island, passing behind the peaks (OrbitCards, below, placed by the
//      island's scene), turning as you scroll; here only the scroll length and, for keyboards and screen readers, the
//      links themselves (visually hidden).
//   B: Original. The cards scroll up past the island in one column, alternating left and right, each sliding in from
//      its own side and bending with the speed of the scroll.
//   C: Stacked deck. Each card pins on the right as it arrives and the next slides up over it; the ones underneath
//      settle back, smaller and dimmer, into a neat pile.
//   D: Focus. One big card at a time on the right, swapped each quarter of the section, with dots below.
// Phones: every layout is a plain full-width column, each card rising in as it comes on screen.

export default function WorkCards({ variant, work, scene, slot, playing }) {
  const root = useRef(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const cards = [...el.querySelectorAll("[data-card]")], dots = [...el.querySelectorAll(".ht-wc-d-dot")];
    const reduced = matchMedia("(prefers-reduced-motion: reduce)"), narrow = matchMedia("(max-width: 760px)");
    let frame = 0, current = -1;
    const seen = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("is-seen"); }), { threshold: .2 });
    cards.forEach(card => seen.observe(card));
    function loop() {
      frame = requestAnimationFrame(loop);
      const s = scene.current;
      if (narrow.matches || !s.live.includes(slot)) return;
      const progress = s.progress[slot], still = reduced.matches;
      if (variant === "C") {
        // How deep each card is in the pile: one for every card that has slid over it (fractions while one slides).
        const tops = cards.map(c => c.getBoundingClientRect().top), reach = innerHeight * .55;
        cards.forEach((card, i) => {
          let depth = 0;
          for (let j = i + 1; j < cards.length; j++) depth += Math.min(1, Math.max(0, 1 - (tops[j] - tops[i] - (j - i) * 22) / reach));
          card.style.setProperty("--depth", still ? Math.round(depth) : depth.toFixed(3));
        });
      } else if (variant === "D") {
        const at = Math.min(cards.length - 1, Math.floor(progress * 4));
        if (at !== current) {
          cards.forEach((card, i) => { card.classList.toggle("is-current", i === at); card.classList.toggle("is-out", i === current && current !== -1); card.classList.toggle("is-instant", still); });
          dots.forEach((dot, i) => dot.classList.toggle("is-current", i === at));
          current = at;
        }
      }
    }
    frame = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(frame); seen.disconnect(); };
  }, [variant, scene, slot]);

  const media = (project, video) => video && playing && project.previewVideo
    ? <video src={project.previewVideo} poster={project.previewImage} autoPlay muted loop playsInline />
    : <img src={project.previewImage} alt="" loading="lazy" decoding="async" />;
  // The card inside a layout's own link (the layout moves the link; the card inside stays the card).
  const card = (project, i, video = false) => <ShineCard index={i} tag="span" name={project.name}>{media(project, video)}</ShineCard>;
  const link = (project, i) => ({ href: `/project/${project.slug}/`, "aria-label": `${project.name}: view the project`, "data-card": i });

  if (variant === "B") return (
    <ol className="ht-cards" key="B">
      {work.map((project, i) => (
        <li key={project.slug}><ShineCard index={i} href={`/project/${project.slug}/`} name={project.name}>{media(project, true)}</ShineCard></li>
      ))}
    </ol>
  );
  return (
    <div className={`ht-wc ht-wc-${variant.toLowerCase()}`} ref={root} key={variant}>
      {variant === "A" && (
        <ul className="ht-sr">{work.map((project, i) => <li key={project.slug}><a {...link(project, i)}>{project.name}</a></li>)}</ul>
      )}
      {variant === "C" && work.map((project, i) => (
        <a key={project.slug} className="ht-wc-card ht-wc-c-card" style={{ "--i": i }} {...link(project, i)}>{card(project, i, true)}</a>
      ))}
      {variant === "D" && (
        <div className="ht-wc-pin">
          {work.map((project, i) => (
            <a key={project.slug} className="ht-wc-card ht-wc-d-card" {...link(project, i)}>
              <span className="ht-wc-d-float"><span className="ht-wc-d-body">{card(project, i, true)}</span></span>
            </a>
          ))}
          <span className="ht-wc-d-dots" aria-hidden="true">{work.map(project => <i key={project.slug} className="ht-wc-d-dot" />)}</span>
        </div>
      )}
    </div>
  );
}

// A: the orbit's cards, drawn twice: once in a layer under the island's canvas and once over it. Each frame every card
// is placed at its anchor on the ring (worked out by the island's scene, work-ring.js), sized to how near it is,
// turned to follow the ring, and shown in whichever layer it belongs to right now: going round the back it's in the lower
// layer, so the peaks pass in front of it, darkened, its face turned toward the island; round the front, in the
// upper one, where the cursor can reach it (hover lifts it and holds the ring; click opens the project). Decorative
// copies: the accessible links are the visually hidden list in WorkCards.
export function OrbitCards({ layer, work, scene }) {
  const root = useRef(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const cards = [...el.children], front = layer === "front";
    let frame = 0;
    const enter = i => () => { scene.current.ringHold = i; }, leave = () => { scene.current.ringHold = -1; };
    const handlers = cards.map((card, i) => { const on = enter(i); card.addEventListener("pointerenter", on); card.addEventListener("pointerleave", leave); return on; });
    function loop() {
      frame = requestAnimationFrame(loop);
      const anchors = scene.current.ring;
      if (!anchors) return;
      cards.forEach((card, i) => {
        const a = anchors[i];
        if (!a) return;
        // In front of the island's middle (with a little overlap at the sides): the upper layer.
        const mine = (a.facing > -.12) === front;
        card.style.visibility = mine ? "visible" : "hidden";
        if (!mine) return;
        card.style.width = `${(a.h * 1.6).toFixed(1)}px`;
        card.style.zIndex = String(Math.round(10 + a.facing * 10));
        // (Turned away, it shows its face to the island instead of a mirror image, like the back row of a carousel.)
        const turn = a.facing < 0 ? a.deg - Math.sign(a.deg) * 180 : a.deg;
        card.style.transform = `translate(${a.x.toFixed(1)}px,${a.y.toFixed(1)}px) translate(-50%,-50%) perspective(${(a.h * 6).toFixed(0)}px) rotateY(${turn.toFixed(2)}deg)`;
        card.style.setProperty("--dim", (.6 * Math.max(0, -a.facing)).toFixed(3));
      });
    }
    frame = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(frame); cards.forEach((card, i) => { card.removeEventListener("pointerenter", handlers[i]); card.removeEventListener("pointerleave", leave); }); if (front) scene.current.ringHold = -1; };
  }, [layer, scene]);
  return (
    <div className={`ht-orbit ht-orbit-${layer}`} ref={root} aria-hidden="true">
      {work.map((project, i) => (
        <a key={project.slug} className="ht-orbit-card" href={`/project/${project.slug}/`} tabIndex={-1}>
          <span className="ht-orbit-lift">
            {layer === "front"
              ? <ShineCard index={i} tag="span" name={project.name}><img src={project.previewImage} alt="" decoding="async" /></ShineCard>
              : <span className="ht-orbit-plain"><img src={project.previewImage} alt="" decoding="async" /><span className="ht-shine-pill">{String(i + 1).padStart(2, "0")} · {project.name} →</span></span>}
          </span>
        </a>
      ))}
    </div>
  );
}
