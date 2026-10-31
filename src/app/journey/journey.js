"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import SpaceAudio from "../space-audio";
import { CHAPTERS } from "./timeline";
import { EXPERIMENTS } from "./experiments";
import "./journey.css";
const JourneyScene = dynamic(() => import("./scene"), { ssr: false });

// A space experiment's page: the shared 3D scene parked on one chapter. Chapters with a `scroll` length play as
// you scroll (wheel, touch drag, ↑/↓/Page keys) and hold at the end, with an indicator until played through.
// The page itself never scrolls.
export default function SpaceExperiment({ slug }) {
  const experiment = EXPERIMENTS.find(e => e.slug === slug), at = EXPERIMENTS.indexOf(experiment);
  const next = EXPERIMENTS[(at + 1) % EXPERIMENTS.length];
  const index = CHAPTERS.findIndex(c => c.id === experiment.chapter), chapter = CHAPTERS[index];
  const controls = useRef({ ending: 0, story: { index, progress: [] }, shots: [] }), flash = useRef(null), hud = useRef(null), score = useRef(null);
  const play = useRef({ target: 0, value: 0 }), root = useRef(null), indicator = useRef(null);
  const [phase, setPhase] = useState("");
  const [debug, setDebug] = useState(false);
  const replay = () => { play.current.target = 0; };

  useEffect(() => {
    setDebug(new URLSearchParams(window.location.search).has("debug"));
    // Scroll input moves a target; progress glides after it, so wheel notches and flicks read as one smooth move.
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const advance = pixels => {
      if (chapter.scroll) play.current.target = Math.min(1, Math.max(0, play.current.target + pixels / (chapter.scroll * window.innerHeight)));
    };
    let raf = 0, last = performance.now();
    const tick = now => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      const state = play.current;
      state.value = reduced.matches ? state.target : state.value + (state.target - state.value) * (1 - Math.exp(-dt * 5));
      const p = controls.current.story.progress[index] = chapter.scroll ? state.value : 0;
      // Liftoff starts on a bright, snowy summit: dark type until the rocket climbs into the dark.
      if (root.current) root.current.dataset.tone = chapter.id === "launch" && p < .8 ? "light" : "dark";
      if (indicator.current) { indicator.current.style.setProperty("--progress", p.toFixed(4)); indicator.current.dataset.done = String(state.target >= .999); }
    };
    raf = requestAnimationFrame(tick);
    const onWheel = event => advance(event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1));
    let touchY = null;
    const onTouchStart = event => { touchY = event.touches[0].clientY; };
    const onTouchMove = event => { if (touchY === null) return; const y = event.touches[0].clientY; advance((touchY - y) * 1.6); touchY = y; };
    const onTouchEnd = () => { touchY = null; };
    const onKey = event => {
      const step = { ArrowDown: .25, PageDown: .9, " ": .9, ArrowUp: -.25, PageUp: -.9 }[event.key];
      if (step === undefined || (event.key === " " && event.target.closest?.("button,a"))) return;
      event.preventDefault(); advance(step * window.innerHeight);
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true }); window.addEventListener("touchmove", onTouchMove, { passive: true }); window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart); window.removeEventListener("touchmove", onTouchMove); window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
    };
  }, [chapter, index]);

  const onPhase = useCallback(value => setPhase(value === "cancel" ? "" : value), []);
  const dive = () => { controls.current.ending = performance.now(); setPhase("sending"); };
  const resetDive = () => { controls.current.ending = 0; setPhase(""); };
  // Defend: clicks anywhere off the controls are queued for the 3D to test against the saucers.
  const shoot = event => { if (chapter.id !== "aliens" || event.target.closest("a,button")) return; controls.current.shots.push({ x: event.clientX, y: event.clientY }); };

  return (
    <div className="journey lab" ref={root} data-stage={chapter.id} onPointerDown={shoot}>
      <JourneyScene controls={controls} flashRef={flash} hudRef={hud} scoreRef={score} onPhase={onPhase} />
      <div className="journey-flash" ref={flash} aria-hidden="true" />
      <header className="lab-top">
        <Link href="/" className="journey-wordmark">Brainilio<span>.</span></Link>
        <Link href="/journey/" className="lab-name">Lab</Link>
      </header>
      {debug && <output className="journey-debug" ref={hud} />}
      <SpaceAudio src="/audio/space-ambient.mp3" />

      <main className="lab-panel" id="main">
        <h1>{experiment.title}</h1>
        <p className="lab-note">{experiment.note}</p>
        <div className="lab-actions">
          {chapter.scroll && <button type="button" onClick={replay}>Start over</button>}
          {chapter.id === "contact" && (phase === "" ? <button type="button" onClick={dive}>Dive in</button> : phase === "galaxy" && <button type="button" onClick={resetDive}>Back out</button>)}
          {chapter.id === "aliens" && <output className="lab-score" ref={score} aria-live="polite" />}
        </div>
      </main>

      {chapter.scroll && (
        <div className="lab-scroll" ref={indicator} aria-hidden="true">
          <span className="lab-scroll-track"><i /></span>
          <span className="lab-scroll-label">Scroll</span>
        </div>
      )}

      <nav className="lab-nav" aria-label="Lab">
        <Link href="/journey/">← All experiments</Link>
        <Link href={`/journey/${next.slug}/`}>Next: {next.title} →</Link>
      </nav>
    </div>
  );
}
