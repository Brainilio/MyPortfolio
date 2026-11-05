"use client";
import { useEffect, useRef } from "react";
import ShineCard from "./shine-card";

// The Work section's card layouts (A·B·C·D, picked by the "Cards" pill in home.js). Every layout shows the same four
// project cards in the same design (the shader card from shine-card.js); only where they sit, how they arrive and how
// they answer the cursor change. Scroll-driven motion reads the shared scene state every frame (no React updates):
//   A: Orbit. The cards ride a ring round the island inside the 3D scene (work-ring.js), turning as you scroll; here
//      only the scroll length and, for keyboards and screen readers, the links themselves (visually hidden).
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
