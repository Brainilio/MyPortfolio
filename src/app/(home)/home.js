"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import allProjects from "../../lib/projects";
import "./home.css";
const IslandScene = dynamic(() => import("./island-scene"), { ssr: false });
const PrairieScene = dynamic(() => import("./prairie-scene"), { ssr: false });
const RoadTripScene = dynamic(() => import("./roadtrip-scene"), { ssr: false });
const HikeScene = dynamic(() => import("./hike-scene"), { ssr: false });
const CoastScene = dynamic(() => import("./coast-scene"), { ssr: false });
import { MODEL_CREDITS } from "./model-credits";
const work = allProjects.filter(project => project.slug && project.previewImage).slice(0, 5);

// Skill groups, drawn from the stacks in the project list. Each one is a roadside sign on the road trip.
export const SKILLS = [
  { title: "Frontend", items: ["React", "Redux", "Next.js", "GSAP"] },
  { title: "Backend", items: ["Node", "Express", "MongoDB", "Laravel"] },
  { title: "3D & motion", items: ["Three.js", "WebGL", "Shaders"] },
  { title: "Languages", items: ["TypeScript", "JavaScript", "PHP", "Java", "Python"] },
  { title: "Product", items: ["UX/UI", "User research", "Pitching"] },
];

// Every model the homepage loads (fetched up front by the loading screen).
const MODELS = ["kit", "stag", "deer", "fox", "bear", "eagle", "bison", "boulder", "prairiedog", "hawk", "wagon", "antelope", "wolf", "moose", "cougar", "rabbit", "squirrel", "orca", "shark", "sealion", "kayak"].map(name => `/models/island/${name}.glb`);
const LOADING_LINES = ["Raising the island", "Rounding up the bison", "Packing the wagon", "Lacing up the boots", "Lighting the lighthouse"];

// Career, newest first. PLACEHOLDER entries: replace each with the real role, company, dates and a line on the work.
export const EXPERIENCE = [
  { years: "20XX — Now", role: "Current role", org: "Company", summary: "Placeholder: one line on what you build there and the difference it makes.", tags: ["React", "Node"] },
  { years: "20XX — 20XX", role: "Previous role", org: "Company", summary: "Placeholder: the product, your part in it, one result worth naming.", tags: ["TypeScript", "Three.js"] },
  { years: "20XX — 20XX", role: "Earlier role", org: "Company", summary: "Placeholder: what you shipped and what you learned.", tags: ["Laravel", "MongoDB"] },
  { years: "20XX — 20XX", role: "First role", org: "Company or school", summary: "Placeholder: where it started.", tags: ["JavaScript"] },
];

// Sections are full-screen worlds stacked on top of each other, driven by ordinary page scrolling. Each one owns a
// stretch of scroll (in viewport heights); where two meet, a crossover zone scrubs the hand-off: the outgoing scene
// drifts up and fades, the next rises in, the giant titles move slower (parallax) and the skies crossfade.
// Inside Work the carousel turns with the scroll; inside Skills the wagon drives with it.
const SECTIONS = [
  { id: "home", label: "Home", length: 1.2, steps: 1 },
  { id: "work", label: "Work", length: .8 + work.length * .6, steps: work.length },
  // Skills holds longer after the last sign, so the geyser and the wagon's skid have time to play.
  { id: "skills", label: "Skills", length: 1 + SKILLS.length * .6, steps: SKILLS.length, tail: 1.1, finale: true },
  { id: "experience", label: "Experience", length: 1 + EXPERIENCE.length * .55, steps: EXPERIENCE.length, fadeIn: 2.5 },
  { id: "contact", label: "Contact", length: 1.6, steps: 1 },
];
const CROSS = .8;
// Dwell (in viewport heights) at each end of a section's own scroll: the first and last stops (card, sign, role) hold
// still for a moment before the hand-off to the neighbouring section begins, so a small scroll back doesn't leave.
const HOLD = .35;
const lead = i => (i ? HOLD : 0), tail = i => (i === SECTIONS.length - 1 ? 0 : SECTIONS[i].tail ?? HOLD);
// Length of a section's stepping stretch (where its progress runs 0 → 1).
const span = i => SECTIONS[i].length - (i === SECTIONS.length - 1 ? 1 : CROSS);
const sectionLength = i => SECTIONS[i].length + lead(i) + tail(i);
const START = SECTIONS.reduce((list, section, i) => [...list, i ? list[i - 1] + sectionLength(i - 1) : 0], []);
const TOTAL = START.at(-1) + sectionLength(SECTIONS.length - 1);
// Scroll position (in viewport heights) where a section's internal progress reaches q.
const scrollFor = (s, q) => START[s] + lead(s) + q * span(s);

export default function Home() {
  const [where, setWhere] = useState({ section: 0, stop: 0 }), [menu, setMenu] = useState(false);
  // Shared with the 3D scenes (read every frame): which sections are on screen and how far through each one we are.
  const scene = useRef({ section: 0, live: [0], progress: [0, 0, 0, 0, 0] });
  const [spotted, setSpotted] = useState([]);
  const altitude = useRef(null);
  const layers = useRef([]);
  const { section, stop } = where;
  // Loading: every model is fetched up front (to warm the cache) while the worlds are built one after another behind
  // the loading screen, each as soon as the previous one reports it's ready. Building a world is the expensive part
  // (terrain, thousands of trees), so doing it here means scrolling never pays for it. The screen lifts when all are
  // built, or after a few seconds regardless (the rest then finish in the background).
  const [built, setBuilt] = useState(() => SECTIONS.map((_, i) => i === 0));
  const [loading, setLoading] = useState({ fetched: 0, ready: 0, done: false });
  const onReady = useCallback(i => () => {
    setLoading(was => ({ ...was, ready: Math.max(was.ready, i + 1) }));
    setTimeout(() => setBuilt(was => was.map((b, k) => b || k === i + 1)), 60);
  }, []);
  useEffect(() => {
    let cancelled = false;
    Promise.all(MODELS.map(url => fetch(url).then(r => r.arrayBuffer()).catch(() => null).then(() => { if (!cancelled) setLoading(was => ({ ...was, fetched: was.fetched + 1 })); })));
    const cap = setTimeout(() => setLoading(was => ({ ...was, done: true })), 7000);
    return () => { cancelled = true; clearTimeout(cap); };
  }, []);
  const progress = Math.min(1, (loading.fetched / MODELS.length) * .3 + (loading.ready / SECTIONS.length) * .7);
  const loaded = loading.done || progress >= 1;
  useEffect(() => { document.documentElement.classList.toggle("ht-locked", !loaded); }, [loaded]);

  // Smooth scrolling (Lenis) and the section gate: inside a section you scroll freely, but a scroll that carries you
  // over a boundary glides you to the next section's first stop (or the previous one's last) and holds for a beat,
  // swallowing the leftover momentum, so even a hard flick moves one section at a time. Menu and header jumps go
  // straight to their section. With reduced motion there's no smoothing and no gate.
  const lenisRef = useRef(null), gate = useRef({ section: 0, busy: false, heldEnd: false });
  const scrollToSection = useCallback((s, q = 0) => {
    const top = scrollFor(s, q) * window.innerHeight + 2, lenis = lenisRef.current;
    setMenu(false);
    if (!lenis) { window.scrollTo({ top, behavior: "auto" }); return; }
    gate.current.busy = true;
    lenis.scrollTo(top, { duration: Math.min(2.2, .9 + Math.abs(s - gate.current.section) * .3), lock: true, force: true, onComplete: () => { gate.current.section = s; gate.current.busy = false; } });
  }, []);
  useEffect(() => { lenisRef.current?.[loaded ? "start" : "stop"](); }, [loaded]);
  const jump = useCallback(s => scrollToSection(s, 0), [scrollToSection]);

  useEffect(() => {
    let frame = 0, last = "";
    const update = () => {
      frame = 0;
      const p = window.scrollY / window.innerHeight, live = [];
      let dominant = 0, best = -1;
      SECTIONS.forEach((x, i) => {
        const begin = START[i], end = begin + sectionLength(i), isLast = i === SECTIONS.length - 1;
        // 0 → fully on screen; negative → still rising in from below; positive → drifting up and out.
        const enter = i === 0 ? 1 : Math.min(1, Math.max(0, (p - (begin - CROSS)) / CROSS));
        const leave = isLast ? 0 : Math.min(1, Math.max(0, (p - (end - CROSS)) / CROSS));
        const amount = Math.min(1, Math.min(enter * (x.fadeIn ?? 1), 1 - leave)), shift = leave > 0 ? leave : enter < 1 ? -(1 - enter) : 0;
        const q = Math.min(1, Math.max(0, (p - begin - lead(i)) / span(i)));
        scene.current.progress[i] = q;
        // Scenes that fill the frame do the slide with their own camera (see .ht-move-3d), so no canvas edge shows.
        (scene.current.shift ??= [])[i] = shift;
        if (amount > 0.001) live.push(i);
        if (amount > best) { best = amount; dominant = i; }
        const el = layers.current[i];
        if (el) { el.style.opacity = amount.toFixed(3); el.style.visibility = amount > 0.001 ? "visible" : "hidden"; el.style.setProperty("--shift", shift.toFixed(4)); el.style.setProperty("--enter", enter.toFixed(4)); el.style.setProperty("--q", q.toFixed(4)); }
      });
      scene.current.live = live;scene.current.section = dominant;
      // The gate: which section's stretch the scroll is in (boundaries at the middle of each hand-off).
      const lenis = lenisRef.current, g = gate.current;
      if (lenis && !g.busy) {
        let region = 0;for (let i = 1; i < SECTIONS.length; i++) if (p >= START[i] - CROSS * .5) region = i;
        // A section with a finale (the geyser at the end of Skills) is never skipped past: scrolling down past its last
        // stop brings you back to rest on it for a moment; the next scroll moves on.
        const endStop = scrollFor(g.section, 1);
        if (p < endStop - .3) g.heldEnd = false;
        if (SECTIONS[g.section].finale && !g.heldEnd && p > endStop + .05) {
          g.busy = true;g.heldEnd = true;
          lenis.scrollTo(endStop * window.innerHeight + 2, { duration: .9, lock: true, force: true, onComplete: () => { lenis.stop(); setTimeout(() => { lenis.start(); g.busy = false; }, 1400); } });
        } else if (region !== g.section) {
          const up = region < g.section, next = g.section + (up ? -1 : 1), top = scrollFor(next, up ? 1 : 0) * window.innerHeight + 2;
          g.busy = true;
          // Arriving on a section's last stop from below counts as having rested there.
          lenis.scrollTo(top, { duration: 1.1, lock: true, force: true, onComplete: () => { g.section = next; g.heldEnd = up; lenis.stop(); setTimeout(() => { lenis.start(); g.busy = false; }, 450); } });
        }
      }
      // If someone gets ahead of the background builds, build the neighbours now.
      setBuilt(was => was.some((b, i) => !b && Math.abs(i - dominant) <= 1) ? was.map((b, i) => b || Math.abs(i - dominant) <= 1) : was);
      const q = scene.current.progress[dominant], steps = SECTIONS[dominant].steps, at = Math.min(steps - 1, Math.round(q * (steps - 1)));
      const key = `${dominant}:${at}`;
      if (key !== last) {
        last = key; setWhere({ section: dominant, stop: at });
        history.replaceState(null, "", dominant ? `#${SECTIONS[dominant].id}` : location.pathname + location.search);
      }
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    // Start on the section in the URL, if any (and don't let the browser restore an old scroll position over it).
    history.scrollRestoration = "manual";
    const fromHash = SECTIONS.findIndex(x => `#${x.id}` === location.hash);
    if (fromHash > 0) { window.scrollTo(0, scrollFor(fromHash, 0) * window.innerHeight + 2); gate.current.section = fromHash; }
    const lenis = matchMedia("(prefers-reduced-motion: reduce)").matches ? null : new Lenis({ autoRaf: true, lerp: .085, smoothWheel: true, wheelMultiplier: .9 });
    lenisRef.current = lenis;lenis?.stop();
    update();
    window.addEventListener("scroll", onScroll, { passive: true }); window.addEventListener("resize", onScroll);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); lenis?.destroy(); lenisRef.current = null; };
  }, []);

  // Clicking the wagon glides the page on to the next sign (or back to the first from the last).
  const onCar = useCallback(() => {
    const n = SKILLS.length, at = Math.round(scene.current.progress[2] * (n - 1)), next = at >= n - 1 ? 0 : at + 1;
    scrollToSection(2, next / (n - 1));
  }, [scrollToSection]);
  const counter = SECTIONS[section].steps > 1 ? `${stop + 1}/${SECTIONS[section].steps}` : null;

  return (
    <main className="ht" data-section={SECTIONS[section].id}>
      {/* The page's scroll length; the sections themselves are fixed layers. */}
      <div className="ht-runway" style={{ height: `${TOTAL * 100}svh` }} aria-hidden="true" />
      <header className="ht-header">
        <a href="#" className="ht-wordmark" onClick={event => { event.preventDefault(); jump(0); }}>Brainilio<span>.</span></a>
        <nav aria-label="Main">
          <a href="#work" onClick={event => { event.preventDefault(); jump(1); }}>Work</a>
          <a href="#skills" onClick={event => { event.preventDefault(); jump(2); }}>Skills</a>
          <a href="#experience" onClick={event => { event.preventDefault(); jump(3); }}>Experience</a>
          <a href="/journey/">Lab</a>
          <a href="#contact" onClick={event => { event.preventDefault(); jump(4); }}>Contact</a>
        </nav>
        {/* <span className="ht-available"><i aria-hidden="true" /> Available for work</span> */}
      </header>

      <section className="ht-layer ht-home" ref={el => (layers.current[0] = el)} aria-label="Introduction">
        <div className="ht-sky" aria-hidden="true" />
        <div className="ht-move"><IslandScene active={scene} onReady={onReady(0)} /></div>
        <h1 className="ht-name ht-title">Brainilio</h1>
        <div className="ht-move ht-intro-wrap">
          <div className="ht-intro">
            <span className="ht-eyebrow">Software developer</span>
            <p className="ht-roles">I build digital products<span>,</span> and the odd little world<span>.</span></p>
            <p className="ht-lede">Full-stack, from REST APIs to 3D on the web. I explore new ideas and try to leave the world a little better than I found it.</p>
            <p className="ht-stack">React · Node · TypeScript · Three.js</p>
            <div className="ht-links">
              <a className="ht-button" href="#work" onClick={event => { event.preventDefault(); jump(1); }}>See my work <span aria-hidden="true">↓</span></a>
              <a className="ht-button ht-button-ghost" href="mailto:brainilioir@gmail.com">Say hello <span aria-hidden="true">↗</span></a>
            </div>
          </div>
        </div>
        <div className="ht-finish" aria-hidden="true" />
      </section>

      <section className="ht-layer ht-work" ref={el => (layers.current[1] = el)} aria-labelledby="ht-work-title">
        <div className="ht-prairie-sky" aria-hidden="true" />
        <p className="ht-ghost ht-title" aria-hidden="true">Work</p>
        <div className="ht-move ht-move-3d">{built[1] && <PrairieScene state={scene} projects={work} onReady={onReady(1)} />}</div>
        <div className="ht-head ht-move-soft">
          <span className="ht-eyebrow">Selected work</span>
          <h2 id="ht-work-title">Things I&apos;ve built<span>.</span></h2>
        </div>
        <div className="ht-finish" aria-hidden="true" />
        <ul className="ht-sr">{work.map(project => <li key={project.slug}><a href={`/project/${project.slug}/`}>{project.name}</a></li>)}</ul>
      </section>

      <section className="ht-layer ht-skills" ref={el => (layers.current[2] = el)} aria-labelledby="ht-skills-title">
        <div className="ht-valley-sky" aria-hidden="true" />
        <p className="ht-ghost ht-title" aria-hidden="true">Skills</p>
        <div className="ht-move ht-move-3d">{built[2] && <RoadTripScene state={scene} skills={SKILLS} onCar={onCar} onReady={onReady(2)} />}</div>
        <div className="ht-head ht-move-soft">
          <span className="ht-eyebrow">On the road</span>
          <h2 id="ht-skills-title">What I bring along<span>.</span></h2>
          <p className="ht-drive">Scroll or click the car to drive on</p>
        </div>
        <div className="ht-finish" aria-hidden="true" />
        <ul className="ht-sr">{SKILLS.map(skill => <li key={skill.title}>{skill.title}: {skill.items.join(", ")}</li>)}</ul>
      </section>

      {/* Experience: the hike. The scene runs on its own; scrolling moves the trail log on the left. Arriving, the
          valley goes dark for a beat before the mountain fades up. */}
      <section className="ht-layer ht-experience" ref={el => (layers.current[3] = el)} aria-labelledby="ht-experience-title">
        <div className="ht-mountain-sky" aria-hidden="true" />
        <div className="ht-move ht-move-3d">{built[3] && <HikeScene state={scene} altitude={altitude} onReady={onReady(3)} />}</div>
        <div className="ht-scrim" aria-hidden="true" />
        <div className="ht-head ht-move-soft">
          <span className="ht-eyebrow">The trail so far</span>
          <h2 id="ht-experience-title">My experience<span>.</span></h2>
        </div>
        <div className="ht-trail-log">
          <ol className="ht-log">
            {EXPERIENCE.map((job, i) => (
              <li key={i} className={section === 3 && stop === i ? "is-here" : undefined}>
                <span className="ht-log-years">{job.years}</span>
                <h3>{job.role} <em>· {job.org}</em></h3>
                <p>{job.summary}</p>
                <span className="ht-log-tags">{job.tags.join(" · ")}</span>
              </li>
            ))}
          </ol>
        </div>
        <span className="ht-altitude" aria-hidden="true">▲ <b ref={altitude}>4,200 ft</b></span>
        <div className="ht-finish" aria-hidden="true" />
        <div className="ht-blackout" aria-hidden="true" />
      </section>

      {/* Contact: the end of the road, on the Big Sur coast. The pointer steers the lighthouse beam through the fog. */}
      <section className="ht-layer ht-contact" ref={el => (layers.current[4] = el)} aria-labelledby="ht-contact-title">
        <div className="ht-coast-sky" aria-hidden="true" />
        <div className="ht-move ht-move-3d">{built[4] && <CoastScene state={scene} onSpot={setSpotted} onReady={onReady(4)} />}</div>
        <div className="ht-contact-card ht-move-soft">
          <span className="ht-eyebrow">End of the road</span>
          <h2 id="ht-contact-title">Let&apos;s build something<span>.</span></h2>
          <p>Have a project, a role or an idea worth exploring? I&apos;d love to hear about it.</p>
          <a className="ht-contact-email" href="mailto:brainilioir@gmail.com">brainilioir@gmail.com <span aria-hidden="true">↗</span></a>
          <ul className="ht-contact-links">
            <li><a href="https://github.com/Brainilio" target="_blank" rel="noopener noreferrer">GitHub</a></li>
            <li><a href="https://linkedin.com/in/brainilio" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
            <li><a href="https://twitter.com/brainilio" target="_blank" rel="noopener noreferrer">X / Twitter</a></li>
          </ul>
        </div>
        <div className="ht-beam-hint" aria-hidden="true">
          <span>Move your cursor to steer the lighthouse beam</span>
          <b>Spotted {spotted.length}/4{spotted.length ? `: ${spotted.join(", ")}` : ""}</b>
        </div>
        <footer className="ht-credits">
          3D models: {MODEL_CREDITS.map((group, g) => (
            <span key={group.author}>{group.works.map(([title, id], i) => (
              <span key={id}><a href={`https://poly.pizza/m/${id}`} target="_blank" rel="noopener noreferrer">{title}</a>{i < group.works.length - 1 ? ", " : ""}</span>
            ))} by {group.author}{g < MODEL_CREDITS.length - 1 ? "; " : ""}</span>
          ))}. All <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener noreferrer">CC BY 3.0</a>, via Poly Pizza; other models CC0 (Quaternius) or made in code. No endorsement implied.
        </footer>
        <div className="ht-finish" aria-hidden="true" />
      </section>

      {/* The loading screen: a little sun rising over the ridges while the worlds are built. */}
      <div className={`ht-loader${loaded ? " is-done" : ""}`} aria-hidden={loaded} role="status" aria-live="polite">
        <div className="ht-loader-art" aria-hidden="true"><i className="ht-loader-sun" /><i className="ht-loader-ridge" /><i className="ht-loader-ridge ht-loader-ridge-2" /></div>
        <span className="ht-loader-name">Brainilio<span>.</span></span>
        <span className="ht-loader-line">{LOADING_LINES[Math.min(LOADING_LINES.length - 1, Math.floor(progress * LOADING_LINES.length))]}</span>
        <span className="ht-loader-bar" aria-hidden="true"><i style={{ transform: `scaleX(${progress})` }} /></span>
        <span className="ht-sr">Loading {Math.round(progress * 100)}%</span>
      </div>

      {/* Where you are, and a way to jump anywhere. */}
      <nav className="ht-pill" aria-label="Sections">
        <button type="button" aria-expanded={menu} onClick={() => setMenu(open => !open)}>
          <span className="ht-pill-dot" aria-hidden="true" />{SECTIONS[section].label}{counter && <em>{counter}</em>}<span aria-hidden="true" className="ht-pill-caret">▲</span>
        </button>
        {menu && <ul>{SECTIONS.map((x, s) => <li key={x.id}><button type="button" aria-current={s === section ? "true" : undefined} onClick={() => jump(s)}>{x.label}</button></li>)}</ul>}
      </nav>
    </main>
  );
}
