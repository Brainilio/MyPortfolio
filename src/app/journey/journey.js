"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import projects from "../../lib/projects";
import { CHAPTERS } from "./timeline";
import "./journey.css";
const JourneyScene = dynamic(() => import("./scene"), { ssr: false });

// Mock chapter content: placeholder copy only, so the 3D journey can be tuned first.
export default function Journey() {
  const sections = useRef([]), controls = useRef({ ending: 0 }), flash = useRef(null), hud = useRef(null), about = useRef(null), lenisRef = useRef(null);
  const [phase, setPhase] = useState("");
  const [active, setActive] = useState(0);
  const [debug, setDebug] = useState(false);
  useEffect(() => {
    const debugging = new URLSearchParams(window.location.search).has("debug");
    setDebug(debugging);
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) setActive(sections.current.indexOf(entry.target));
    }), { rootMargin: "-50% 0px -50% 0px" });
    sections.current.forEach(section => section && observer.observe(section));
    // The Moon pass rail slides sideways with that chapter's progress.
    const rail = () => {
      const el = sections.current[5]; if (!el) return;
      const { top, height } = el.getBoundingClientRect();
      el.style.setProperty("--rail", Math.min(1, Math.max(0, -top / (height - window.innerHeight))).toFixed(4));
    };
    window.addEventListener("scroll", rail, { passive: true }); rail();
    if (debugging || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => { observer.disconnect(); window.removeEventListener("scroll", rail); };
    const lenis = new Lenis({ autoRaf: true, lerp: 0.08, smoothWheel: true, anchors: true });
    lenisRef.current = lenis;
    if (new URLSearchParams(window.location.search).has("nosnap")) return () => { observer.disconnect(); window.removeEventListener("scroll", rail); lenis.destroy(); };
    // Snap: when scrolling stops, glide to the nearest composed beat (biased toward the scroll direction),
    // so the journey never rests on an in-between frame.
    const beats = () => CHAPTERS.flatMap((_, i) => chapterBeats(i)).sort((a, b) => a - b);
    let timer = 0, direction = 1, snapping = false;
    const snap = () => {
      if (controls.current.ending) return;
      const y = window.scrollY, list = beats(), prev = list.filter(b => b <= y + 1).at(-1), next = list.find(b => b >= y - 1);
      if (prev === undefined && next === undefined) return;
      // Only ever continue in the direction you were scrolling; never pull you back.
      const target = direction > 0 ? next : prev;
      if (target === undefined) return;
      // Gentle: only settle when a beat is reasonably close; otherwise leave the scroll where it is.
      const distance = Math.abs(target - y);
      if (distance < 4 || distance > window.innerHeight * 2.4) return;
      snapping = true;
      lenis.scrollTo(target, { duration: Math.min(2.6, 1.2 + distance / window.innerHeight * 1.2), easing: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2), onComplete: () => { snapping = false; } });
    };
    lenis.on("scroll", ({ direction: d }) => { if (d) direction = d; if (snapping) return; clearTimeout(timer); timer = setTimeout(snap, 450); });
    // Any new user input takes over from an in-flight snap.
    const release = () => { snapping = false; };
    for (const type of ["wheel", "touchstart", "keydown"]) window.addEventListener(type, release, { passive: true });
    return () => { clearTimeout(timer); for (const type of ["wheel", "touchstart", "keydown"]) window.removeEventListener(type, release); window.removeEventListener("scroll", rail); observer.disconnect(); lenis.destroy(); lenisRef.current = null; };
  }, []);
  // Scroll positions of a chapter's composed beats (chapter beats plus any [data-beat] cards inside it).
  const chapterBeats = i => {
    const el = sections.current[i]; if (!el) return [];
    const top = el.getBoundingClientRect().top + window.scrollY, runway = i === CHAPTERS.length - 1 ? el.offsetHeight - window.innerHeight : el.offsetHeight;
    const cards = [...el.querySelectorAll("[data-beat]")].map(card => { const r = card.getBoundingClientRect(); return r.top + window.scrollY - (window.innerHeight - r.height) / 2; });
    return [...CHAPTERS[i].beats.map(t => top + t * runway), ...cards].sort((a, b) => a - b);
  };
  // Chapter links glide to the chapter's first beat, so you always land on a composed frame.
  const goTo = (event, i) => {
    event.preventDefault(); reset();
    const target = chapterBeats(i)[0] ?? 0, lenis = lenisRef.current;
    if (!lenis) { window.scrollTo({ top: target }); return; }
    const distance = Math.abs(target - window.scrollY) / window.innerHeight;
    lenis.scrollTo(target, { duration: Math.min(3.5, 1.2 + distance * 0.18), easing: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) });
  };
  const onPhase = useCallback(value => setPhase(value === "cancel" ? "" : value), []);
  const send = event => { event.preventDefault(); controls.current.ending = performance.now(); setPhase("sending"); };
  const reset = () => { controls.current.ending = 0; setPhase(""); };
  const chapter = (i, children, className = "") => (
    <section key={CHAPTERS[i].id} ref={el => (sections.current[i] = el)} id={CHAPTERS[i].id} className={`journey-chapter ${className}`} style={{ height: `${CHAPTERS[i].vh}svh` }}>
      {children}
    </section>
  );
  return (
    <div className="journey">
      <JourneyScene sectionsRef={sections} controls={controls} flashRef={flash} hudRef={hud} aboutRef={about} onPhase={onPhase} />
      <div className="journey-flash" ref={flash} aria-hidden="true" />
      {/* A holographic photo that appears beside the helmet during the About close-up. */}
      <div className="journey-hologram" ref={about} aria-hidden="true">
        <figure className="holo-photo"><img src="/images/portrait-cutout.png" alt="" width="1277" height="1232" /></figure>
      </div>
      <header className="journey-top">
        <a href="#summit" className="journey-wordmark" onClick={event => goTo(event, 0)}>Brainilio<span>.</span></a>
        <span className="journey-available"><i aria-hidden="true" /> Available for work</span>
      </header>
      <nav className="journey-altimeter" aria-label="Chapters">
        {CHAPTERS.map((c, i) => (
          <a key={c.id} href={`#${c.id}`} aria-current={active === i ? "step" : undefined} onClick={event => goTo(event, i)}>
            <span>{c.altitude}</span><b>{c.label}</b>
          </a>
        ))}
      </nav>
      {debug && <output className="journey-debug" ref={hud} />}

      <main className="journey-chapters">
        {chapter(0, <div className="type intro">
          <span className="eyebrow">Mock · Software developer — open for work</span>
          <h1>Brainilio</h1>
          <span className="journey-scroll">Scroll to launch</span>
        </div>)}
        {chapter(1, null)}
        {chapter(2, <div className="type about-panel">
          <span className="eyebrow">01 — About</span>
          <h2>Lost my ride <em>somewhere up here.</em></h2>
          <p>Mock copy: who you are, what drives you, and the kind of work you love doing.</p>
        </div>)}
        {chapter(3, <div className="type">
          <span className="eyebrow">02 — What I do</span>
          <h2>The chase <em>begins.</em></h2>
          <p className="type-list">Skill one / Skill two / Skill three / Skill four / Skill five</p>
        </div>)}
        {chapter(4, <>
          {projects.slice(0, 4).map((project, i) => (
            <a key={project.slug} data-beat className={`type project ${i % 2 ? "right" : ""}`} style={{ top: `${12 + i * 21}%` }} href={`/project/${project.slug}/`}>
              <span className="eyebrow">0{i + 1} — Selected work</span>
              <h3>{project.name}<span aria-hidden="true"> ↗</span></h3>
              <span className="type-tags">{project.tags.slice(0, 3).join(" / ")}</span>
            </a>
          ))}
        </>, "projects")}
        {chapter(5, <div className="journey-rail" aria-label="Mock words">
          <div className="journey-rail-track">Curious — Builder — Explorer — Dreamer —</div>
        </div>, "moon-chapter")}
        {chapter(6, <div className="type">
          <span className="eyebrow">03 — Somewhere else</span>
          <h2>Through <em>the portal.</em></h2>
        </div>)}
        {chapter(7, phase === "" && <div className="type contact">
          <form onSubmit={send}>
            <span className="eyebrow">04 — Contact · mock, nothing is sent</span>
            <h2>Throw me <em>a line.</em></h2>
            <div className="fields">
              <input aria-label="Name" placeholder="Name" />
              <input aria-label="Email" type="email" placeholder="Email" />
            </div>
            <input aria-label="Message" placeholder="What are we building?" />
            <button type="submit">Send signal <span aria-hidden="true">→</span></button>
          </form>
        </div>, "contact-chapter")}
      </main>
      <div className="journey-final" role="status" data-visible={phase === "galaxy"}>
        {phase === "galaxy" && <>
          <h2>Signal received.<br /><em>See you out there.</em></h2>
          <a href="#summit" onClick={event => goTo(event, 0)}>Back to Earth ↑</a>
        </>}
      </div>
    </div>
  );
}
