"use client";
import { useEffect, useRef } from "react";
import ShineCard from "./shine-card";

// The Work section's projects: one at a time, large, on the right of the island, while the section scrolls (its
// progress picks the project, in step with the counter in the section pill). Each shows its picture (the shader card,
// with its shine under the cursor), its category and year, its name, its short description, a few of its tags and a
// link to the project, with dots for where you are. As the next one takes its place, the outgoing project lifts away
// and the incoming one's parts rise into place one after another (the other way round when scrolling back). Only the
// current one can be reached by the pointer, keyboard and screen readers (the others are inert). Phones: a plain list
// of all four, each rising in as it comes on screen. Reduced motion: no movement, just the swap.
const pad = n => String(n).padStart(2, "0");

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
            // (Just the year: some dates are stored as "OCTOBER, 2020".)
            const href = `/project/${project.slug}/`, year = String(project.dateCreated ?? "").match(/\d{4}/)?.[0];
            return (
              <article key={project.slug} className="ht-wp-item" aria-labelledby={`ht-wp-${project.slug}`}>
                <a className="ht-wp-media" href={href} tabIndex={-1} aria-hidden="true">
                  <ShineCard index={i} tag="span" name={project.name}>
                    {playing && project.previewVideo
                      ? <video src={project.previewVideo} poster={project.previewImage} autoPlay muted loop playsInline />
                      : <img src={project.previewImage} alt="" decoding="async" />}
                  </ShineCard>
                </a>
                <p className="ht-wp-meta"><span>{project.category}{year ? ` · ${year}` : ""}</span><span>{pad(i + 1)} / {pad(work.length)}</span></p>
                <h3 className="ht-wp-name" id={`ht-wp-${project.slug}`}>{project.name}</h3>
                <p className="ht-wp-desc">{project.shortDescription}</p>
                {project.tags?.length > 0 && <ul className="ht-wp-tags">{project.tags.slice(0, 4).map(tag => <li key={tag}>{tag}</li>)}</ul>}
                <div className="ht-wp-foot">
                  <a className="ht-wp-cta" href={href}>View project <span aria-hidden="true">→</span></a>
                  <span className="ht-wp-dots" aria-hidden="true">{work.map((other, k) => <i key={other.slug} className={k === i ? "is-current" : undefined} />)}</span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
