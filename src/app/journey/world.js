"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Heading from "../heading";
import { SKILLS } from "../(home)/content";
import allProjects from "../../lib/projects";
import { EXPERIMENTS } from "./experiments";
import { ScrollIndicator, useScrollPlay } from "./scroll-play";
import "./journey.css";
const PrairieScene = dynamic(() => import("../(home)/prairie-scene"), { ssr: false });
const RoadTripScene = dynamic(() => import("../(home)/roadtrip-scene"), { ssr: false });
const HikeScene = dynamic(() => import("../(home)/hike-scene"), { ssr: false });
const CoastScene = dynamic(() => import("../(home)/coast-scene"), { ssr: false });
const WorkScene = dynamic(() => import("../(home)/work-scene"), { ssr: false });
import { getStage } from "../(home)/stage";

// The full-size worlds that used to be homepage sections, each on its own. The scenes read the same shared state
// the homepage gives them, here with a single slot: always on screen, never sliding, and (for the road trip)
// with progress driven by scroll input (the road trip's drive, the prairie's ring of project cards).
const work = allProjects.filter(project => project.slug && project.previewImage).slice(0, 5);
const WORLDS = {
  prairie: { sky: "ht-prairie-sky", scroll: 3, tone: "light" },
  "road-trip": { sky: "ht-valley-sky", scroll: 3, tone: "light" },
  hike: { sky: "ht-mountain-sky", tone: "light" },
  lighthouse: { sky: "ht-coast-sky", tone: "dark" },
  meadow: { sky: "ht-meadow-sky", tone: "light" },
};

export default function WorldExperiment({ slug }) {
  const experiment = EXPERIMENTS.find(e => e.slug === slug), at = EXPERIMENTS.indexOf(experiment);
  const next = EXPERIMENTS[(at + 1) % EXPERIMENTS.length], world = WORLDS[experiment.world];
  const state = useRef({ section: 0, live: [0], progress: [experiment.world === "meadow" ? 1 : 0], shift: [0], tilt: [0] }), indicator = useRef(null), altitude = useRef(null);
  const [spotted, setSpotted] = useState([]), [bare, setBare] = useState(false);
  useEffect(() => { setBare(new URLSearchParams(window.location.search).has("bare")); }, []);
  const play = useScrollPlay(world.scroll, (p, target) => {
    state.current.progress[0] = p;
    if (indicator.current) { indicator.current.style.setProperty("--progress", p.toFixed(4)); indicator.current.dataset.done = String(target >= .999); }
  });
  // Clicking the wagon drives on to the next sign (or back to the first from the last).
  const onCar = () => {
    const n = SKILLS.length, stop = Math.round(play.current.target * (n - 1));
    play.current.target = stop >= n - 1 ? 0 : (stop + 1) / (n - 1);
  };

  return (
    <div className="journey lab lab-world" data-tone={world.tone} data-bare={bare}>
      <div className={world.sky} aria-hidden="true" />
      {experiment.world === "prairie" && <PrairieScene state={state} projects={work} slot={0} />}
      {experiment.world === "road-trip" && <RoadTripScene state={state} skills={SKILLS} onCar={onCar} slot={0} />}
      {experiment.world === "hike" && <HikeScene state={state} altitude={altitude} slot={0} />}
      {experiment.world === "lighthouse" && <CoastScene state={state} onSpot={setSpotted} slot={0} />}
      {experiment.world === "meadow" && <MeadowStage state={state} />}

      <main className="lab-panel" id="main">
        <Heading size="display">{experiment.title}</Heading>
        <p className="lab-note">{experiment.note}</p>
        <div className="lab-actions">
          {world.scroll && <button type="button" className="ui-btn ui-btn--secondary ui-btn--compact" onClick={() => { play.current.target = 0; }}>Start over</button>}
          {experiment.world === "hike" && <output className="lab-score lab-altitude">▲ <b ref={altitude}>4,200 ft</b></output>}
          {experiment.world === "lighthouse" && <output className="lab-score" aria-live="polite">Spotted {spotted.length}/4{spotted.length ? `: ${spotted.join(", ")}` : ""}</output>}
        </div>
      </main>

      {world.scroll && <ScrollIndicator indicator={indicator} />}

      <nav className="lab-nav" aria-label="Lab">
        <Link href="/journey/">← All experiments</Link>
        <Link href={`/journey/${next.slug}/`}>Next: {next.title} →</Link>
      </nav>
    </div>
  );
}

// The meadow (the homepage's Work island until it moved here) draws on the page's shared canvas (stage.js), into the
// rectangle of its stage: a full-screen one here, with the island in the middle.
function MeadowStage({ state }) {
  const host = useRef(null);
  useEffect(() => {
    const stage = getStage(); if (!stage || !host.current) return;
    stage.attach(host.current);
    return () => stage.detach();
  }, []);
  return <div className="lab-stage" ref={host}><div className="lab-stage-frame"><WorkScene state={state} slot={0} side="center" /></div></div>;
}
