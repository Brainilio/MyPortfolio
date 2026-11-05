"use client";
import { useEffect, useRef } from "react";
import ShineCard from "./shine-card";

// The Work section's projects: one at a time, large, on the right of the island, while the section scrolls (its
// progress picks the project, in step with the counter in the section pill). Each is just its picture (the shader
// card, turned a little toward the island, straightening and shining under the cursor), which opens the project. As the next one takes its place, the outgoing project lifts away
// and the incoming one's parts rise into place one after another (the other way round when scrolling back). Only the
// current one can be reached by the pointer, keyboard and screen readers (the others are inert). Phones: a plain list
// of all four, each rising in as it comes on screen. Reduced motion: no movement, just the swap.

export default function WorkProjects({ work, scene, slot, playing }) {
  const root = useRef(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const items = [...el.querySelectorAll(".ht-wp-item")];
    const narrow = matchMedia("(max-width: 760px)"), n = items.length;
    let frame = 0, current = -1, wasNarrow = null;
    const seen = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("is-seen"); }), { threshold: .15 });
    items.forEach(item => seen.observe(item));
    const show = at => {
      items.forEach((item, i) => {
        item.classList.toggle("is-current", i === at); item.classList.toggle("is-before", i < at); item.classList.toggle("is-after", i > at);
        item.inert = i !== at; item.setAttribute("aria-hidden", i === at ? "false" : "true");
      });
      current = at;
    };
    function loop() {
      frame = requestAnimationFrame(loop);
      if (narrow.matches !== wasNarrow) {
        wasNarrow = narrow.matches;
        // On phones every project is shown and reachable.
        if (wasNarrow) { items.forEach(item => { item.inert = false; item.removeAttribute("aria-hidden"); }); current = -1; }
      }
      if (wasNarrow) return;
      const at = Math.min(n - 1, Math.round(scene.current.progress[slot] * (n - 1)));
      if (at !== current) show(at);
    }
    frame = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(frame); seen.disconnect(); };
  }, [scene, slot]);

  return (
    <div className="ht-wp" ref={root}>
      <div className="ht-wp-pin">
        <div className="ht-wp-stack">
          {work.map((project, i) => {
            const href = `/project/${project.slug}/`;
            return (
              <article key={project.slug} className="ht-wp-item" aria-labelledby={`ht-wp-${project.slug}`}>
                <a className="ht-wp-media" href={href} aria-label={`${project.name}: view the project`}>
                  <ShineCard index={i} tag="span" name={project.name}>
                    {playing && project.previewVideo
                      ? <video src={project.previewVideo} poster={project.previewImage} autoPlay muted loop playsInline />
                      : <img src={project.previewImage} alt="" decoding="async" />}
                  </ShineCard>
                </a>
                {/* The name for screen readers (the picture says it for everyone else). */}
                <h3 className="ht-sr" id={`ht-wp-${project.slug}`}>{project.name}</h3>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
