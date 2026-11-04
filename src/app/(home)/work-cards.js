"use client";
import { useEffect, useRef } from "react";
import ShineCard from "./shine-card";

// The Work section's card-layout tester (A·B·C·D, picked by the "Cards" pill in home.js). Every layout shows the same
// four project cards in the same design (the shader card from shine-card.js, or in A the same picture and pill bent
// round the ring); only where they sit, how they arrive and how they answer the cursor change. On wide screens the
// cards ride a full-screen layer pinned over the island while the section scrolls (its progress drives them, read
// every frame from the shared scene state: no React updates per frame):
//   A: a 3D carousel: the cards curved round a cylinder, seen from a little above, turning as you scroll (25° per
//      100px); the cards facing away are dimmed; hovering the front one lifts it and holds the ring still.
//   B: a strip along the bottom of the screen that slides left as the section scrolls.
//   C: a staggered column to the right of the island, one card dealt in per quarter of the section.
//   D: one big card at a time on the right, swapped each quarter, with dots below.
// Phones: every layout is a plain full-width column, each card rising in as it comes on screen.
const pad = i => String(i + 1).padStart(2, "0");
const STAGGER = [[0, -1.5], [24, 2], [-12, -.8], [16, 1.5]];
// A: each card is cut into this many vertical strips, each turned to sit on the cylinder, so the card curves.
const STRIPS = 14, TILT = -15;

export default function WorkCards({ variant, work, scene, slot, playing }) {
  const root = useRef(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const cards = [...el.querySelectorAll("[data-card]")], strip = el.querySelector(".ht-wc-b-strip"), dots = [...el.querySelectorAll(".ht-wc-d-dot")], ring = el.querySelector(".ht-wc-ring");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)"), narrow = matchMedia("(max-width: 760px)");
    let frame = 0, angle = null, bias = 0, held = null, shift = null, current = -1, wasNarrow = null, radius = 0;
    const seen = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("is-seen"); }), { threshold: .2 });
    cards.forEach(card => seen.observe(card));
    // A: lay the strips round the cylinder for the current screen size (card width W, radius R: each card covers
    // W / R radians of the ring).
    function layRing() {
      if (!ring) return;
      const W = Math.min(540, Math.max(260, innerWidth * .3)), H = W * 10 / 16, sw = W / STRIPS;
      radius = W * 1.02;
      ring.style.setProperty("--w", `${W}px`); ring.style.setProperty("--h", `${H}px`);
      cards.forEach((card, i) => {
        const base = i * 360 / cards.length;
        card.querySelectorAll(".ht-wc-a-strip").forEach((s, k) => {
          const turn = base + ((k + .5 - STRIPS / 2) * sw / radius) * 180 / Math.PI;
          s.style.width = `${sw + .8}px`; s.style.backgroundSize = `${W}px ${H}px`; s.style.backgroundPosition = `${-k * sw}px 0`;
          s.style.transform = `translate(-50%,-50%) rotateY(${turn}deg) translateZ(${radius}px)`;
        });
        const pill = card.querySelector(".ht-wc-pill"), at = base + (-(W / 2 - 18) / radius) * 180 / Math.PI;
        pill.style.transform = `translateY(-50%) rotateY(${at}deg) translateZ(${radius + 3}px) translateY(${H / 2 - 30}px)`;
      });
    }
    layRing(); addEventListener("resize", layRing);
    const hold = event => { if (event.currentTarget.classList.contains("is-active")) held = angle; };
    const release = () => { held = null; };
    if (variant === "A") cards.forEach(card => { card.addEventListener("pointerenter", hold); card.addEventListener("pointerleave", release); });

    function loop() {
      frame = requestAnimationFrame(loop);
      const s = scene.current, small = narrow.matches;
      if (small !== wasNarrow) { wasNarrow = small; if (small) { cards.forEach(c => c.classList.remove("is-in", "is-current", "is-out", "is-active")); if (strip) strip.style.transform = ""; if (ring) ring.style.transform = ""; current = -1; } }
      if (small || !s.live.includes(slot)) return;
      const progress = s.progress[slot], still = reduced.matches;
      if (variant === "A" && ring) {
        // How far into the section, in pixels, at 25° per 100px; the angle eases after it (unless held by a hover).
        const run = Math.max(1, el.closest("section").offsetHeight - innerHeight), goal = -progress * run / 100 * 25;
        if (held !== null) bias = held - goal;
        const target = goal + bias;
        angle = angle === null || still ? target : angle + (target - angle) * .08;
        ring.style.transform = `translateZ(${-radius}px) rotateX(${TILT}deg) rotateY(${angle.toFixed(2)}deg)`;
        // Each card's facing: 1 straight at you, -1 straight away; the ones turned away darken.
        let front = 0, best = -2;
        cards.forEach((card, i) => {
          const facing = Math.cos((i * 360 / cards.length + angle) * Math.PI / 180);
          if (facing > best) { best = facing; front = i; }
          card.style.setProperty("--dim", (.62 * (1 - Math.max(0, facing)) ** 1.5).toFixed(3));
        });
        cards.forEach((card, i) => card.classList.toggle("is-active", i === front));
      } else if (variant === "B" && strip) {
        // Card 1 at the left edge at the start of the section, card 4 at the right edge at its end.
        const overflow = Math.max(0, strip.scrollWidth - strip.parentElement.clientWidth), goal = -progress * overflow;
        shift = shift === null || still ? goal : shift + (goal - shift) * .1;
        strip.style.transform = `translateX(${shift.toFixed(1)}px)`;
      } else if (variant === "C") {
        cards.forEach((card, i) => card.classList.toggle("is-in", progress >= [.15, .35, .55, .75][i]));
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
    return () => {
      cancelAnimationFrame(frame); seen.disconnect(); removeEventListener("resize", layRing);
      cards.forEach(card => { card.removeEventListener("pointerenter", hold); card.removeEventListener("pointerleave", release); });
    };
  }, [variant, scene, slot]);

  // The original card (picture or preview, shader, numbered pill), as a span inside the layout's own link.
  const card = (project, i, video = false) => (
    <ShineCard index={i} tag="span" name={project.name}>
      {video && playing && project.previewVideo
        ? <video src={project.previewVideo} poster={project.previewImage} autoPlay muted loop playsInline />
        : <img src={project.previewImage} alt="" loading="lazy" decoding="async" />}
    </ShineCard>
  );
  const link = (project, i) => ({ href: `/project/${project.slug}/`, "aria-label": `${project.name}: view the project`, "data-card": i });
  return (
    <div className={`ht-wc ht-wc-${variant.toLowerCase()}`} ref={root} key={variant}>
      <div className="ht-wc-pin">
        {variant === "A" && (
          <div className="ht-wc-stage"><div className="ht-wc-ring">
            {work.map((project, i) => (
              <a key={project.slug} className="ht-wc-card ht-wc-a-card" {...link(project, i)}>
                {Array.from({ length: STRIPS }, (_, k) => (
                  <span key={k} className={`ht-wc-a-strip${k === 0 ? " is-first" : k === STRIPS - 1 ? " is-last" : ""}`} style={{ backgroundImage: `url(${project.previewImage})` }} />
                ))}
                <span className="ht-wc-pill" aria-hidden="true">{pad(i)} · {project.name} →</span>
              </a>
            ))}
          </div></div>
        )}
        {variant === "B" && (
          <div className="ht-wc-b-clip"><div className="ht-wc-b-strip">
            {work.map((project, i) => <a key={project.slug} className="ht-wc-card ht-wc-b-card" {...link(project, i)}>{card(project, i)}</a>)}
          </div></div>
        )}
        {variant === "C" && (
          <div className="ht-wc-c-col">
            {work.map((project, i) => (
              <a key={project.slug} className="ht-wc-card ht-wc-c-card" style={{ "--x": `${STAGGER[i][0]}px`, "--r": `${STAGGER[i][1]}deg` }} {...link(project, i)}>{card(project, i)}</a>
            ))}
          </div>
        )}
        {variant === "D" && (
          <>
            {work.map((project, i) => (
              <a key={project.slug} className="ht-wc-card ht-wc-d-card" {...link(project, i)}>
                <span className="ht-wc-d-float"><span className="ht-wc-d-body">{card(project, i, true)}</span></span>
              </a>
            ))}
            <span className="ht-wc-d-dots" aria-hidden="true">{work.map(project => <i key={project.slug} className="ht-wc-d-dot" />)}</span>
          </>
        )}
      </div>
    </div>
  );
}
