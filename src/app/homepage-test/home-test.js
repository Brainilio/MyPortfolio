"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import allProjects from "../../lib/projects";
import "./home-test.css";
const IslandScene = dynamic(() => import("./island-scene"), { ssr: false });
const PrairieScene = dynamic(() => import("./prairie-scene"), { ssr: false });
const RoadTripScene = dynamic(() => import("./roadtrip-scene"), { ssr: false });
const HikeScene = dynamic(() => import("./hike-scene"), { ssr: false });
const work = allProjects.filter(project => project.slug && project.previewImage).slice(0, 5);

// Skill groups, drawn from the stacks in the project list. Each one is a roadside sign on the road trip.
export const SKILLS = [
  { title: "Frontend", items: ["React", "Redux", "Next.js", "GSAP"] },
  { title: "Backend", items: ["Node", "Express", "MongoDB", "Laravel"] },
  { title: "3D & motion", items: ["Three.js", "WebGL", "Shaders"] },
  { title: "Languages", items: ["TypeScript", "JavaScript", "PHP", "Java", "Python"] },
  { title: "Product", items: ["UX/UI", "User research", "Pitching"] },
];

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
  { id: "skills", label: "Skills", length: 1 + SKILLS.length * .6, steps: SKILLS.length },
  { id: "experience", label: "Experience", length: 1 + EXPERIENCE.length * .55, steps: EXPERIENCE.length, fadeIn: 2.5 },
];
const CROSS = .8;
const START = SECTIONS.reduce((list, section, i) => [...list, i ? list[i - 1] + SECTIONS[i - 1].length : 0], []);
const TOTAL = START.at(-1) + SECTIONS.at(-1).length;
// Scroll position (in viewport heights) where a section's internal progress reaches q.
const scrollFor = (s, q) => START[s] + q * (SECTIONS[s].length - (s === SECTIONS.length - 1 ? 1 : CROSS));

export default function HomeTest() {
  const [where, setWhere] = useState({ section: 0, stop: 0 }), [menu, setMenu] = useState(false);
  // Shared with the 3D scenes (read every frame): which sections are on screen and how far through each one we are.
  const scene = useRef({ section: 0, live: [0], progress: [0, 0, 0, 0] });
  const altitude = useRef(null);
  const layers = useRef([]);
  const { section, stop } = where;
  // Each 3D scene is built only once its section is next door to the one on screen (then kept), so the first load
  // builds just the island and the prairie.
  const [built, setBuilt] = useState(() => SECTIONS.map((_, i) => i < 2));

  const scrollToSection = useCallback((s, q = 0) => {
    window.scrollTo({ top: scrollFor(s, q) * window.innerHeight + 2, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    setMenu(false);
  }, []);
  const jump = useCallback(s => scrollToSection(s, 0), [scrollToSection]);

  useEffect(() => {
    let frame = 0, last = "";
    const update = () => {
      frame = 0;
      const p = window.scrollY / window.innerHeight, live = [];
      let dominant = 0, best = -1;
      SECTIONS.forEach((x, i) => {
        const begin = START[i], end = begin + x.length, isLast = i === SECTIONS.length - 1;
        // 0 → fully on screen; negative → still rising in from below; positive → drifting up and out.
        const enter = i === 0 ? 1 : Math.min(1, Math.max(0, (p - (begin - CROSS)) / CROSS));
        const leave = isLast ? 0 : Math.min(1, Math.max(0, (p - (end - CROSS)) / CROSS));
        const amount = Math.min(1, Math.min(enter * (x.fadeIn ?? 1), 1 - leave)), shift = leave > 0 ? leave : enter < 1 ? -(1 - enter) : 0;
        const q = Math.min(1, Math.max(0, (p - begin) / (x.length - (isLast ? 1 : CROSS))));
        scene.current.progress[i] = q;
        if (amount > 0.001) live.push(i);
        if (amount > best) { best = amount; dominant = i; }
        const el = layers.current[i];
        if (el) { el.style.opacity = amount.toFixed(3); el.style.visibility = amount > 0.001 ? "visible" : "hidden"; el.style.setProperty("--shift", shift.toFixed(4)); el.style.setProperty("--enter", enter.toFixed(4)); el.style.setProperty("--q", q.toFixed(4)); }
      });
      scene.current.live = live;scene.current.section = dominant;
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
    if (fromHash > 0) window.scrollTo(0, scrollFor(fromHash, 0) * window.innerHeight + 2);
    update();
    window.addEventListener("scroll", onScroll, { passive: true }); window.addEventListener("resize", onScroll);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
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
          <a href="mailto:brainilioir@gmail.com">Contact</a>
        </nav>
        {/* <span className="ht-available"><i aria-hidden="true" /> Available for work</span> */}
      </header>

      <section className="ht-layer ht-home" ref={el => (layers.current[0] = el)} aria-label="Introduction">
        <div className="ht-sky" aria-hidden="true" />
        <div className="ht-move"><IslandScene active={scene} /></div>
        <h1 className="ht-name ht-title">Brainilio</h1>
        <div className="ht-move ht-intro-wrap">
          <div className="ht-intro">
            <span className="ht-eyebrow">Software developer</span>
            <p className="ht-roles">I build digital products<span>,</span> and the odd little world<span>.</span></p>
            <p className="ht-lede">Full-stack, from REST APIs to 3D on the web. I explore new ideas and try to leave the world a little better than I found it.</p>
            <p className="ht-stack">React · Node · TypeScript · Three.js</p>
            <div className="ht-links">
              <a href="#work" onClick={event => { event.preventDefault(); jump(1); }}>See my work <span aria-hidden="true">↓</span></a>
              <a href="mailto:brainilioir@gmail.com">Say hello <span aria-hidden="true">↗</span></a>
            </div>
          </div>
        </div>
        <div className="ht-finish" aria-hidden="true" />
      </section>

      <section className="ht-layer ht-work" ref={el => (layers.current[1] = el)} aria-labelledby="ht-work-title">
        <div className="ht-prairie-sky" aria-hidden="true" />
        <p className="ht-ghost ht-title" aria-hidden="true">Work</p>
        <div className="ht-move"><PrairieScene state={scene} projects={work} /></div>
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
        <div className="ht-move">{built[2] && <RoadTripScene state={scene} skills={SKILLS} onCar={onCar} />}</div>
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
        <div className="ht-move">{built[3] && <HikeScene state={scene} altitude={altitude} />}</div>
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
