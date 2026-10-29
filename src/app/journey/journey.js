"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import projects from "../../lib/projects";
import { CHAPTERS } from "./timeline";
import { createDirector } from "./director";
import "./journey.css";
const JourneyScene = dynamic(() => import("./scene"), { ssr: false });

// Mock chapter content: placeholder copy only, so the 3D journey can be tuned first.
export default function Journey() {
  const sections = useRef([]), controls = useRef({ ending: 0, story: { index: 0, start: 0, duration: 0 } }), flash = useRef(null), hud = useRef(null), about = useRef(null), main = useRef(null), director = useRef(null);
  const [phase, setPhase] = useState("");
  const [active, setActive] = useState(0);
  const [debug, setDebug] = useState(false);
  useEffect(() => {
    const debugging = new URLSearchParams(window.location.search).has("debug");
    setDebug(debugging);
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    // The Moon pass rail slides sideways with that chapter's internal scroll.
    const rail = () => {
      const el = sections.current[4]; if (!el) return;
      const { top, height } = el.getBoundingClientRect();
      el.style.setProperty("--rail", Math.min(1, Math.max(0, -top / (height - window.innerHeight))).toFixed(4));
    };
    window.addEventListener("scroll", rail, { passive: true }); rail();
    // Lenis smooths internal scrolling; the director decides when a gesture becomes a chapter change.
    const lenis = new Lenis({ autoRaf: true, lerp: 0.1, smoothWheel: true, syncTouch: true, virtualScroll: data => director.current?.virtualScroll(data) ?? true });
    director.current = createDirector({
      sections: sections.current, lenis, story: controls.current.story, reduced: () => preference.matches,
      onIndex: setActive, onText: visible => { if (main.current) main.current.dataset.hidden = String(!visible); },
    });
    if (debugging) window.__journeyGo = i => director.current?.go(i);
    return () => { window.removeEventListener("scroll", rail); director.current?.destroy(); director.current = null; lenis.destroy(); delete window.__journeyGo; };
  }, []);
  // Chapter links play the transition to that chapter.
  const goTo = (event, i) => { event.preventDefault(); reset(); director.current?.go(i); };
  const onPhase = useCallback(value => setPhase(value === "cancel" ? "" : value), []);
  const send = event => { event.preventDefault(); controls.current.ending = performance.now(); setPhase("sending"); };
  const reset = () => { controls.current.ending = 0; setPhase(""); };
  const chapter = (i, children, className = "") => (
    <section key={CHAPTERS[i].id} ref={el => (sections.current[i] = el)} id={CHAPTERS[i].id} className={`journey-chapter ${className}`} style={{ height: `${CHAPTERS[i].vh ?? 100}svh` }}>
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

      <main className="journey-chapters" ref={main}>
        {chapter(0, <div className="type intro">
          <span className="eyebrow">Mock · Software developer — open for work</span>
          <h1>Brainilio</h1>
          <span className="journey-scroll">Scroll to launch ↓</span>
        </div>)}
        {chapter(1, <div className="type about-panel">
          <span className="eyebrow">01 — About</span>
          <h2>Lost my ride <em>somewhere up here.</em></h2>
          <p>Mock copy: who you are, what drives you, and the kind of work you love doing.</p>
        </div>)}
        {chapter(2, <div className="type">
          <span className="eyebrow">02 — What I do</span>
          <h2>The chase <em>begins.</em></h2>
          <p className="type-list">Skill one / Skill two / Skill three / Skill four / Skill five</p>
        </div>)}
        {chapter(3, <>
          {projects.slice(0, 4).map((project, i) => (
            <a key={project.slug} className={`type project ${i % 2 ? "right" : ""}`} style={{ top: `${12 + i * 21}%` }} href={`/project/${project.slug}/`}>
              <span className="eyebrow">0{i + 1} — Selected work</span>
              <h3>{project.name}<span aria-hidden="true"> ↗</span></h3>
              <span className="type-tags">{project.tags.slice(0, 3).join(" / ")}</span>
            </a>
          ))}
        </>, "projects")}
        {chapter(4, <div className="journey-rail" aria-label="Mock words">
          <div className="journey-rail-track">Curious — Builder — Explorer — Dreamer —</div>
        </div>, "moon-chapter")}
        {chapter(5, <div className="type">
          <span className="eyebrow">03 — Somewhere else</span>
          <h2>Through <em>the portal.</em></h2>
        </div>)}
        {chapter(6, phase === "" && <div className="type contact">
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
