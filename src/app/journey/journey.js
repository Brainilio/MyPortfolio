"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Heading from "../heading";
import SpaceAudio from "../space-audio";
import { CHAPTERS } from "./timeline";
import { EXPERIMENTS } from "./experiments";
import { ScrollIndicator, useScrollPlay } from "./scroll-play";
import "./journey.css";
const JourneyScene = dynamic(() => import("./scene"), { ssr: false });

// A space experiment's page: the shared 3D scene parked on one chapter. Chapters with a `scroll` length play as
// you scroll (see scroll-play.js) and hold at the end, with an indicator until played through.
// The page itself never scrolls.
export default function SpaceExperiment({ slug }) {
  const experiment = EXPERIMENTS.find(e => e.slug === slug), at = EXPERIMENTS.indexOf(experiment);
  const next = EXPERIMENTS[(at + 1) % EXPERIMENTS.length];
  const index = CHAPTERS.findIndex(c => c.id === experiment.chapter), chapter = CHAPTERS[index];
  const controls = useRef({ ending: 0, story: { index, progress: [] }, shots: [] }), flash = useRef(null), hud = useRef(null), score = useRef(null);
  const root = useRef(null), indicator = useRef(null);
  const [phase, setPhase] = useState("");
  const [debug, setDebug] = useState(false);

  useEffect(() => { setDebug(new URLSearchParams(window.location.search).has("debug")); }, []);
  const play = useScrollPlay(chapter.scroll, (p, target) => {
    controls.current.story.progress[index] = p;
    // Liftoff starts on a bright, snowy summit: dark type until the rocket climbs into the dark.
    if (root.current) root.current.dataset.tone = chapter.id === "launch" && p < .8 ? "light" : "dark";
    if (indicator.current) { indicator.current.style.setProperty("--progress", p.toFixed(4)); indicator.current.dataset.done = String(target >= .999); }
  });
  const replay = () => { play.current.target = 0; };

  const onPhase = useCallback(value => setPhase(value === "cancel" ? "" : value), []);
  const dive = () => { controls.current.ending = performance.now(); setPhase("sending"); };
  const resetDive = () => { controls.current.ending = 0; setPhase(""); };
  // Defend: clicks anywhere off the controls are queued for the 3D to test against the saucers.
  const shoot = event => { if (chapter.id !== "aliens" || event.target.closest("a,button")) return; controls.current.shots.push({ x: event.clientX, y: event.clientY }); };

  return (
    <div className="journey lab" ref={root} data-stage={chapter.id} onPointerDown={shoot}>
      <JourneyScene controls={controls} flashRef={flash} hudRef={hud} scoreRef={score} onPhase={onPhase} />
      <div className="journey-flash" ref={flash} aria-hidden="true" />
      {debug && <output className="journey-debug" ref={hud} />}
      <SpaceAudio src="/audio/space-ambient.mp3" />

      <main className="lab-panel" id="main">
        <Heading size="display">{experiment.title}</Heading>
        <p className="lab-note">{experiment.note}</p>
        <div className="lab-actions">
          {chapter.scroll && <button type="button" className="ui-btn ui-btn--secondary ui-btn--compact" onClick={replay}>Start over</button>}
          {chapter.id === "contact" && (phase === "" ? <button type="button" className="ui-btn ui-btn--secondary ui-btn--compact" onClick={dive}>Dive in</button> : phase === "galaxy" && <button type="button" className="ui-btn ui-btn--secondary ui-btn--compact" onClick={resetDive}>Back out</button>)}
          {chapter.id === "aliens" && <output className="lab-score" ref={score} aria-live="polite" />}
        </div>
      </main>

      {chapter.scroll && <ScrollIndicator indicator={indicator} />}

      <nav className="lab-nav" aria-label="Lab">
        <Link href="/journey/">← All experiments</Link>
        <Link href={`/journey/${next.slug}/`}>Next: {next.title} →</Link>
      </nav>
    </div>
  );
}
