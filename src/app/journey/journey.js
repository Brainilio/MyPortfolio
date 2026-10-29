"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import projects from "../../lib/projects";
import LaunchHero from "../launch-hero";
import SpaceAudio from "../space-audio";
import { CHAPTERS } from "./timeline";
import { trackStages } from "./stages";
import "./journey.css";
const JourneyScene = dynamic(() => import("./scene"), { ssr: false });

// Mock chapter content: placeholder copy only, so the 3D sections can be tuned first.
export default function Journey() {
  const sections = useRef([]), controls = useRef({ ending: 0, story: { index: 0, progress: [], leave: [] }, shots: [] }), flash = useRef(null), hud = useRef(null), score = useRef(null);
  const [phase, setPhase] = useState("");
  const [active, setActive] = useState(0);
  const [debug, setDebug] = useState(false);
  useEffect(() => {
    setDebug(new URLSearchParams(window.location.search).has("debug"));
    // Project cards flow along a gentle curve on the left: furthest out mid-screen, tucked in at the edges.
    const flow = () => {
      const vh = window.innerHeight;
      sections.current[3]?.querySelectorAll(".project").forEach(card => {
        const { top, height } = card.getBoundingClientRect(), t = Math.max(-1.4, Math.min(1.4, (top + height / 2 - vh / 2) / (vh / 2)));
        card.style.transform = `translate3d(${((1 - t * t) * 7).toFixed(2)}vw,0,0) rotate(${(t * -3).toFixed(2)}deg)`;
      });
    };
    window.addEventListener("scroll", flow, { passive: true }); window.addEventListener("resize", flow); flow();
    // Plain scrolling, only smoothed; the 3D follows whichever section is on screen.
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const lenis = preference.matches ? null : new Lenis({ autoRaf: true, lerp: 0.085, smoothWheel: true, anchors: true });
    const stop = trackStages({ sections: sections.current, story: controls.current.story, onIndex: setActive });
    return () => { window.removeEventListener("scroll", flow); window.removeEventListener("resize", flow); stop(); lenis?.destroy(); };
  }, []);
  const onPhase = useCallback(value => setPhase(value === "cancel" ? "" : value), []);
  const send = event => { event.preventDefault(); controls.current.ending = performance.now(); setPhase("sending"); };
  const reset = () => { controls.current.ending = 0; setPhase(""); };
  // The aliens game: clicks are queued for the 3D to test against the saucers.
  const shoot = event => { if (event.target.closest("a,button,input")) return; controls.current.shots.push({ x: event.clientX, y: event.clientY }); };
  const chapter = (i, children, className = "journey-chapter") => (
    <section key={CHAPTERS[i].id} ref={el => (sections.current[i] = el)} id={CHAPTERS[i].id} className={className} style={i ? { height: `${CHAPTERS[i].vh ?? 100}svh` } : undefined}>
      {children}
    </section>
  );
  return (
    <div className="journey" data-stage={active}>
      <a className="skip-link" href="#main">Skip to content</a>
      <JourneyScene controls={controls} flashRef={flash} hudRef={hud} scoreRef={score} onPhase={onPhase} />
      <div className="journey-flash" ref={flash} aria-hidden="true" />
      <header className="journey-top">
        <a href="#top" className="journey-wordmark" onClick={reset}>Brainilio<span>.</span></a>
        <span className="journey-available"><i aria-hidden="true" /> Available for work</span>
      </header>
      <nav className="journey-altimeter" aria-label="Chapters">
        {CHAPTERS.map((c, i) => (
          <a key={c.id} href={`#${c.id}`} aria-current={active === i ? "step" : undefined} onClick={reset}>
            <span>{c.altitude}</span><b>{c.label}</b>
          </a>
        ))}
      </nav>
      {debug && <output className="journey-debug" ref={hud} />}
      <SpaceAudio src="/audio/space-ambient.mp3" />

      <div className="journey-chapters">
        {chapter(0, <LaunchHero />, "journey-hero")}
        {chapter(1, <>
          <div className="type about-panel">
            <span className="eyebrow">01 — About</span>
            <h2>Lost my ride <em>somewhere up here.</em></h2>
            <p>Mock copy: who you are, what drives you, and the kind of work you love doing.</p>
          </div>
          <div className="about-cards">
            <img data-liquid data-depth=".06" className="about-card about-card-portrait" src="/images/portrait-original.png" alt="Brainilio" width="584" height="564" loading="lazy" />
            <img data-liquid data-depth=".14" className="about-card about-card-place" src="/images/mountain-trees.webp" alt="" width="1536" height="1024" loading="lazy" />
          </div>
        </>)}
        {chapter(2, <div className="type skills-panel">
          <span className="eyebrow">02 — What I do</span>
          <h2>Skills, <em>mostly.</em></h2>
          <p className="type-list">Skill one / Skill two / Skill three / Skill four / Skill five</p>
        </div>)}
        {chapter(3, <>
          {projects.slice(0, 4).map((project, i) => (
            <a key={project.slug} className="type project" style={{ top: `${10 + i * 22}%` }} href={`/project/${project.slug}/`}>
              <img data-liquid data-depth=".05" className="project-shot" src={project.previewImage} alt="" width="600" height="400" loading="lazy" />
              <span className="eyebrow">0{i + 1} — Selected work</span>
              <h3>{project.name}<span aria-hidden="true"> ↗</span></h3>
              <span className="type-tags">{project.tags.slice(0, 3).join(" / ")}</span>
            </a>
          ))}
        </>, "journey-chapter projects")}
        {/* Moon pass, parked for now:
        <section id="moon" className="journey-chapter moon-chapter"><div className="journey-rail" aria-label="Mock words">
          <div className="journey-rail-track">Curious — Builder — Explorer — Dreamer —</div>
        </div></section> */}
        {chapter(4, <div className="type aliens-panel" onPointerDown={shoot}>
          <span className="eyebrow">03 — Uninvited guests</span>
          <h2>They want <em>the ship.</em></h2>
          <p>Click the saucers to help out, or just keep scrolling and he'll handle it.</p>
          <output className="aliens-score" ref={score} aria-live="polite">0 zapped</output>
        </div>, "journey-chapter aliens-chapter")}
        {chapter(5, phase === "" && <div className="type contact">
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
        </div>, "journey-chapter contact-chapter")}
      </div>
      <div className="journey-final" role="status" data-visible={phase === "galaxy"}>
        {phase === "galaxy" && <>
          <h2>Signal received.<br /><em>See you out there.</em></h2>
          <a href="#top" onClick={reset}>Back to Earth ↑</a>
        </>}
      </div>
    </div>
  );
}
