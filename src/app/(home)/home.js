"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import allProjects from "../../lib/projects";
import "./home.css";
import { getStage } from "./stage";
import LiquidCard from "./liquid-card";
const IslandScene = dynamic(() => import("./island-scene"), { ssr: false });
const AboutScene = dynamic(() => import("./about-scene"), { ssr: false });
const WorkScene = dynamic(() => import("./work-scene"), { ssr: false });
const SkillsScene = dynamic(() => import("./skills-scene"), { ssr: false });
const CoastScene = dynamic(() => import("./coast-scene"), { ssr: false });
import { MODEL_CREDITS } from "./model-credits";
import { SKILLS } from "./content";
const work = allProjects.filter(project => project.slug && project.previewImage).slice(0, 4);
// The Work cards are placed one by one as the section's scroll passes each of these points (then the links), and stay.
const PLACE_AT = [.15, .35, .55, .75, .85], TILTS = [1.5, -2, .8, -1.2];

// Every model the homepage loads (fetched up front by the loading screen).
const MODELS = ["kit", "stag", "deer", "fox", "bear", "eagle", "bison", "prairiedog", "wagon", "buttes", "moose", "orca", "shark", "sealion", "kayak"].map(name => `/models/island/${name}.glb`);
const LOADING_LINES = ["Raising the island", "Stoking the campfire", "Rounding up the bison", "Packing the wagon", "Lighting the lighthouse"];

// One long page. Each section is a floating diorama that holds still (sticky) while its words scroll past on the other
// side, alternating right, left, right; the coast closes the page full width. Behind everything one fixed sky
// shifts colour continuously with the scroll. Inside a section its own progress (0 → 1 while it's pinned) deals the
// Work cards and drives the Skills wagon.
const SECTIONS = [
  { id: "home", label: "Home", steps: 1 },
  { id: "about", label: "About", steps: 1 },
  { id: "work", label: "Work", steps: work.length },
  { id: "skills", label: "Skills", steps: SKILLS.length },
  { id: "contact", label: "Contact", steps: 1 },
];
// One sky for the whole page: a five-colour gradient (top to bottom) that shifts continuously with how far down
// the page you are. Each stop belongs to a section and sits where that section is settled on screen; the last two
// are the coast as you arrive and at the very end.
const SKY = [
  ["#1b1335", "#33225a", "#6e4a8f", "#c9849c", "#f3b89c"], // Home: dusk
  ["#120e2c", "#1f1846", "#3d2c66", "#7a4f86", "#b27390"], // About: blue hour by the fire
  ["#5f5d8c", "#b57796", "#f5a389", "#f9c195", "#f2b98f"], // Work: prairie sunset
  ["#e9bfa0", "#f1cba8", "#f6d8b5", "#f6d6b4", "#f0cba6"], // Skills: warm valley morning
  ["#4f8cc6", "#86b1d8", "#c4d7e5", "#d4e0e7", "#d4e0e7"], // Contact: Big Sur, arriving
  ["#4f8cc6", "#86b1d8", "#c4d7e5", "#d4e0e7", "#d4e0e7"], // Contact, the end
].map(stops => stops.map(hex => [1, 3, 5].map(k => parseInt(hex.slice(k, k + 2), 16))));
const mix = (a, b, t) => a.map((c, k) => Math.round(c + (b[k] - c) * t));
// No gaps between sections and no fading: each island holds while its section is pinned and travels up and away with
// the page as the next one rises into view (its stage is sticky). ARRIVE and DEPART tip each island's camera while it
// travels: steeper as it comes up, lower as it leaves.
const ARRIVE = 14, DEPART = 10;
// Which slot each scene reads in the shared scroll state.
const ABOUT = 1, WORK = 2, SKILLS_AT = 3, CONTACT = 4;
const clamp = v => Math.min(1, Math.max(0, v));

// The contact form posts to Formspree with fetch, so the card stays put and thanks you in place.
// Replace REPLACE_WITH_ID with your Formspree form ID from formspree.io; until then the form says to email instead.
const FORMSPREE = "https://formspree.io/f/REPLACE_WITH_ID";
function ContactForm() {
  const [status, setStatus] = useState("idle");
  const submit = async event => {
    event.preventDefault();
    if (FORMSPREE.endsWith("REPLACE_WITH_ID")) { setStatus("error"); return; }
    setStatus("sending");
    try {
      const response = await fetch(FORMSPREE, { method: "POST", body: new FormData(event.currentTarget), headers: { Accept: "application/json" } });
      setStatus(response.ok ? "sent" : "error");
    } catch { setStatus("error"); }
  };
  if (status === "sent") return <p className="ht-form-sent" role="status">Got it. I&apos;ll be in touch.</p>;
  return (
    <form className="ht-form" onSubmit={submit}>
      <input type="text" name="name" placeholder="Your name" aria-label="Your name" autoComplete="name" required />
      <input type="email" name="email" placeholder="Your email" aria-label="Your email" autoComplete="email" required />
      <textarea name="message" placeholder="What are you building?" aria-label="What are you building?" rows={4} required />
      <button type="submit" disabled={status === "sending"}>{status === "sending" ? "Sending…" : <>Send it <span aria-hidden="true">→</span></>}</button>
      {status === "error" && <p className="ht-form-error" role="alert">That didn&apos;t go through. Email me instead, below.</p>}
    </form>
  );
}

// A section heading that writes itself in as you arrive: once its section is a fifth of the way up the screen, each
// word is uncovered left to right, 0.08 s after the one before, then the violet full stop pops in. It resets when you
// scroll back above the section, so it plays again on the way down. Without JavaScript, or with reduced motion
// (see the CSS), it's simply there.
function RevealHeading({ id, text, arrive = 20 }) {
  const ref = useRef(null), [armed, setArmed] = useState(false), [shown, setShown] = useState(false), words = text.split(" ");
  useEffect(() => {
    const section = ref.current?.closest("section");
    if (!section) return;
    setArmed(true);
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setShown(true);
      else if (entry.boundingClientRect.top > 0) setShown(false);
    }, { rootMargin: `0px 0px -${arrive}% 0px` });
    observer.observe(section);
    return () => observer.disconnect();
  }, [arrive]);
  return (
    <h2 id={id} ref={ref} className={armed ? `ht-reveal${shown ? " is-revealed" : ""}` : undefined} style={{ "--n": words.length }}>
      {words.map((word, i) => <span key={i}><span className="ht-word" style={{ "--w": i }}>{word}</span>{i < words.length - 1 ? " " : ""}</span>)}
      <span className="ht-dot">.</span>
    </h2>
  );
}

export default function Home() {
  const [where, setWhere] = useState({ section: 0, stop: 0 }), [menu, setMenu] = useState(false);
  // Shared with the 3D scenes (read every frame): which sections are on screen and how far through each one we are.
  const scene = useRef({ section: 0, live: [0], progress: [0, 0, 0, 0, 0], tilt: [0, 0, 0, 0, 0] });
  const [spotted, setSpotted] = useState([]), [still, setStill] = useState(false), [placed, setPlaced] = useState(0);
  // Reduced motion, and phones: the Work postcard shows its still image instead of playing its preview.
  useEffect(() => {
    const queries = [matchMedia("(prefers-reduced-motion: reduce)"), matchMedia("(max-width: 760px)")], sync = () => setStill(queries.some(q => q.matches));
    sync(); queries.forEach(q => q.addEventListener("change", sync));
    return () => queries.forEach(q => q.removeEventListener("change", sync));
  }, []);
  const pill = useRef(null), bar = useRef(null);
  const zones = useRef([]), sky = useRef(null), mainRef = useRef(null);
  const { section, stop } = where;
  // Loading: every model is fetched up front (to warm the cache) while the dioramas are built one after another
  // behind the loading screen, each as soon as the previous one reports it's ready. The screen lifts when all are
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
  // The entrance: once the loading screen lifts, the hero island rises into place and its camera lands (see the CSS and
  // island-scene), starting 0.3 s in.
  useEffect(() => { if (loaded) scene.current.introAt = performance.now() + 300; }, [loaded]);

  // Smooth scrolling (Lenis), off with reduced motion. Menu and header links glide to a section's top, or to a point
  // inside it (q: how far through its pinned stretch).
  const lenisRef = useRef(null);
  const scrollToSection = useCallback((s, q = 0) => {
    const el = zones.current[s];
    if (!el) return;
    const top = el.offsetTop + q * Math.max(0, el.offsetHeight - window.innerHeight), lenis = lenisRef.current;
    setMenu(false);
    if (lenis) lenis.scrollTo(top, { duration: 1.4 }); else window.scrollTo({ top, behavior: "auto" });
  }, []);
  useEffect(() => { lenisRef.current?.[loaded ? "start" : "stop"](); }, [loaded]);
  const jump = useCallback(s => scrollToSection(s, 0), [scrollToSection]);

  useEffect(() => {
    let frame = 0, last = "";
    const update = () => {
      frame = 0;
      const y = window.scrollY, vh = window.innerHeight, middle = y + vh / 2, live = [];
      let dominant = 0;
      const stops = [], last_ = zones.current.length - 1;
      zones.current.forEach((el, i) => {
        if (!el) return;
        const top = el.offsetTop, height = el.offsetHeight, run = Math.max(1, height - vh);
        scene.current.progress[i] = clamp((y - top) / run);
        if (top < y + vh && top + height > y) live.push(i);
        if (middle >= top) dominant = i;
        // How far its island has still to travel in (from below) and has travelled out (above), 0 → 1 a screen each.
        const arriving = i ? clamp((top - y) / vh) : 0, leaving = i < last_ ? clamp((y - (top + height - vh)) / vh) : 0;
        scene.current.tilt[i] = ARRIVE * arriving - DEPART * leaving;
        stops[i] = i === CONTACT ? top - vh * .6 : i ? top + run * .5 : 0;
      });
      // The sky: find the two section stops either side of this scroll position and blend between them.
      const end = Math.max(1, document.documentElement.scrollHeight - vh), marks = [...stops.slice(0, 5).map(v => v / end), 1], p = clamp(y / end);
      let k = 0; while (k < marks.length - 2 && p > marks[k + 1]) k++;
      const blend = clamp((p - marks[k]) / Math.max(1e-6, marks[k + 1] - marks[k])), colors = SKY[k].map((c, n) => mix(c, SKY[k + 1][n], blend));
      if (sky.current) sky.current.style.background = `linear-gradient(180deg,${colors.map((c, n) => `rgb(${c}) ${[0, 30, 55, 80, 100][n]}%`).join(",")})`;
      { const q = scene.current.progress[WORK], n = PLACE_AT.filter(t => q >= t).length; if (n) setPlaced(was => Math.max(was, n)); }
      scene.current.live = live;scene.current.section = dominant;
      pill.current?.style.setProperty("--progress", scene.current.progress[dominant].toFixed(4));
      bar.current?.style.setProperty("--progress", clamp(y / Math.max(1, document.documentElement.scrollHeight - vh)).toFixed(4));
      // If someone gets ahead of the background builds, build the neighbours now.
      setBuilt(was => was.some((b, i) => !b && Math.abs(i - dominant) <= 1) ? was.map((b, i) => b || Math.abs(i - dominant) <= 1) : was);
      const q = scene.current.progress[dominant], steps = SECTIONS[dominant].steps, at = Math.min(steps - 1, Math.round(q * (steps - 1)));
      const key = `${dominant}:${at}`;
      if (key !== last) {
        last = key; setWhere({ section: dominant, stop: at });
        history.replaceState(null, "", dominant ? `#${SECTIONS[dominant].id}` : location.pathname + location.search);
      }
    };
    // The one WebGL canvas, behind the page.
    const world = getStage(); if (world && mainRef.current) world.attach(mainRef.current);
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    // Start on the section in the URL, if any (and don't let the browser restore an old scroll position over it).
    history.scrollRestoration = "manual";
    const fromHash = SECTIONS.findIndex(x => `#${x.id}` === location.hash);
    if (fromHash > 0) window.scrollTo(0, zones.current[fromHash]?.offsetTop ?? 0);
    // (Also off with ?debug, so tests can jump straight to a scroll position.)
    const lenis = matchMedia("(prefers-reduced-motion: reduce)").matches || new URLSearchParams(location.search).has("debug") ? null : new Lenis({ autoRaf: true, lerp: .09, smoothWheel: true });
    lenisRef.current = lenis;lenis?.stop();
    update();
    // Sections change height as fonts load and the layout settles; keep the measurements fresh.
    const resize = new ResizeObserver(onScroll);resize.observe(document.body);
    window.addEventListener("scroll", onScroll, { passive: true }); window.addEventListener("resize", onScroll);
    return () => { world?.detach(); cancelAnimationFrame(frame); resize.disconnect(); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); lenis?.destroy(); lenisRef.current = null; };
  }, []);

  // Clicking the wagon glides the page on to the next sign (or back to the first from the last).
  const onCar = useCallback(() => {
    const n = SKILLS.length, at = Math.round(scene.current.progress[SKILLS_AT] * (n - 1)), next = at >= n - 1 ? 0 : at + 1;
    scrollToSection(SKILLS_AT, next / (n - 1));
  }, [scrollToSection]);
  const counter = SECTIONS[section].steps > 1 ? `${stop + 1}/${SECTIONS[section].steps}` : null;

  return (
    <main ref={mainRef} className={`ht${loaded ? " is-entered" : ""}`} data-section={SECTIONS[section].id}>
      <div className="ht-skies" aria-hidden="true"><div className="ht-sky-live" ref={sky} /></div>
      <div className="ht-finish" aria-hidden="true" />
      <header className="ht-header">
        <a href="#" className="ht-wordmark" onClick={event => { event.preventDefault(); jump(0); }}>Brainilio<span>.</span></a>
        <nav aria-label="Main">
          <a href="#about" onClick={event => { event.preventDefault(); jump(ABOUT); }}>About</a>
          <a href="#work" onClick={event => { event.preventDefault(); jump(WORK); }}>Work</a>
          <a href="#skills" onClick={event => { event.preventDefault(); jump(SKILLS_AT); }}>Skills</a>
          <a href="/journey/">Lab</a>
          <a href="#contact" onClick={event => { event.preventDefault(); jump(CONTACT); }}>Contact</a>
        </nav>
      </header>

      <section className="ht-zone ht-home" id="home" ref={el => (zones.current[0] = el)} aria-label="Introduction">
        <div className="ht-stage"><IslandScene active={scene} onReady={onReady(0)} /></div>
        {/* The name comes in letter by letter, each rising into view through its own little window. */}
        <h1 className="ht-name" aria-label="Brainilio">{"Brainilio".split("").map((letter, i) => <span key={i} className="ht-name-window" aria-hidden="true" style={{ "--c": i }}><span>{letter}</span></span>)}</h1>
        <div className="ht-intro">
          <p className="ht-roles">I build digital products<span>,</span> and the odd little world<span>.</span></p>
          <p className="ht-lede">Full-stack, from REST APIs to 3D on the web. I explore new ideas and try to leave the world a little better than I found it.</p>
          <p className="ht-stack">React · Node · TypeScript · Three.js</p>
          <div className="ht-links">
            <a className="ht-button" href="#work" onClick={event => { event.preventDefault(); jump(WORK); }}>See my work <span aria-hidden="true">↓</span></a>
            <a className="ht-button ht-button-ghost" href="mailto:brainilioir@gmail.com">Say hello <span aria-hidden="true">↗</span></a>
          </div>
        </div>
      </section>

      {/* About: an evening by the campfire, the diorama on the right. The bear roasts a marshmallow and the fire crackles on
          their own; on the left, just the person behind it. The words hold in the middle while the island does. */}
      <section className="ht-zone ht-about" id="about" data-side="right" ref={el => (zones.current[ABOUT] = el)} aria-labelledby="ht-about-title">
        <div className="ht-stage">{built[ABOUT] && <AboutScene state={scene} slot={ABOUT} side="right" onReady={onReady(ABOUT)} />}</div>
        <div className="ht-copy">
          {/* Replace with: <Image src="/me.jpg" alt="Brainilio" width={120} height={120} /> (drop me.jpg into /public) */}
          <div className="ht-portrait" aria-hidden="true" />
          <RevealHeading id="ht-about-title" text="Around the fire" />
          {/* PLACEHOLDER copy: replace the companies with your own. */}
          <p>I&apos;m a software developer who likes building things people enjoy using — from the API to the last bit of motion. Away from the keyboard you&apos;ll find me on a trail, on a road trip through a national park, or by a campfire with a marshmallow on a stick. <span className="ht-now">Currently at [Company] · previously [Company].</span></p>
          <p className="ht-drive">Tap the bear for a marshmallow, or the fire to stoke it</p>
          {/* Drop resume.pdf into /public */}
          <p className="ht-drive"><a className="ht-resume" href="/resume.pdf" target="_blank" rel="noopener noreferrer">Full experience <span aria-hidden="true">→</span></a></p>
        </div>
      </section>

      {/* Work: Monument Valley in the middle, its heading above it, and the projects placed round it as polaroids, one
          per step of the scroll, alternating right and left, building up a little constellation that stays. */}
      <section className="ht-zone ht-work ht-pinned" id="work" data-side="left" style={{ "--steps": work.length, "--step": "50svh" }} ref={el => (zones.current[WORK] = el)} aria-labelledby="ht-work-title">
        <div className="ht-stage">{built[WORK] && <WorkScene state={scene} slot={WORK} side="center" onReady={onReady(WORK)} />}</div>
        <div className="ht-copy">
          <div className="ht-work-head">
            <RevealHeading id="ht-work-title" text="Things I’ve built" arrive={50} />
            <p className="ht-drive">Click the basket to feed the herd</p>
          </div>
          <ol className="ht-cards">
            {work.map((project, i) => {
              const shown = i < placed;
              return (
                <li key={project.slug} className={`ht-card ${i % 2 ? "is-left" : "is-right"}${shown ? " is-placed" : ""}`} style={{ "--r": `${TILTS[i % TILTS.length]}deg`, zIndex: i + 1 }}>
                  <LiquidCard id={`ht-liquid-${i}`} href={`/project/${project.slug}/`} label={`${project.name}: view the project`} placed={shown}>
                    {shown && section === WORK && !still && project.previewVideo
                      ? <video src={project.previewVideo} poster={project.previewImage} autoPlay muted loop playsInline />
                      : <img src={project.previewImage} alt="" loading="lazy" decoding="async" />}
                  </LiquidCard>
                </li>
              );
            })}
          </ol>
          <p className={`ht-more${placed > work.length ? " is-shown" : ""}`}>
            <a href="/projects/">All projects <span aria-hidden="true">→</span></a>
            <a href="/journey/">Lab experiments <span aria-hidden="true">→</span></a>
          </p>
        </div>
      </section>

      {/* Skills: the park road on the right; the wagon drives sign to sign as the list scrolls past. */}
      <section className="ht-zone ht-skills ht-pinned" id="skills" data-side="right" style={{ "--steps": SKILLS.length }} ref={el => (zones.current[SKILLS_AT] = el)} aria-labelledby="ht-skills-title">
        <div className="ht-stage">{built[SKILLS_AT] && <SkillsScene state={scene} skills={SKILLS} onCar={onCar} slot={SKILLS_AT} side="right" onReady={onReady(SKILLS_AT)} />}</div>
        <div className="ht-copy">
          <RevealHeading id="ht-skills-title" text="What I bring along" />
          <p className="ht-drive">Scroll or click the wagon to drive on</p>
          <ol className="ht-list">
            {SKILLS.map((skill, i) => (
              <li key={skill.title} className={section === SKILLS_AT && stop === i ? "is-here" : undefined}>
                <b>{skill.title}</b><span>{skill.items.join(" · ")}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Contact: the end of the road, on the Big Sur coast, full width. The pointer steers the lighthouse beam. */}
      <section className="ht-zone ht-contact" id="contact" ref={el => (zones.current[CONTACT] = el)} aria-labelledby="ht-contact-title">
        <div className="ht-stage">{built[CONTACT] && <CoastScene state={scene} onSpot={setSpotted} slot={CONTACT} lite onReady={onReady(CONTACT)} />}</div>
        <div className="ht-contact-card">
          <RevealHeading id="ht-contact-title" text="Let’s build something" />
          <p>Have a project, a role or an idea worth exploring? I&apos;d love to hear about it.</p>
          <ContactForm />
          <p className="ht-contact-or">or email directly</p>
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
      </section>

      {/* The loading screen: a little sun rising over the ridges while the worlds are built. */}
      <div className={`ht-loader${loaded ? " is-done" : ""}`} aria-hidden={loaded} role="status" aria-live="polite">
        <div className="ht-loader-art" aria-hidden="true"><i className="ht-loader-sun" /><i className="ht-loader-ridge" /><i className="ht-loader-ridge ht-loader-ridge-2" /></div>
        <span className="ht-loader-name">Brainilio<span>.</span></span>
        <span className="ht-loader-line">{LOADING_LINES[Math.min(LOADING_LINES.length - 1, Math.floor(progress * LOADING_LINES.length))]}</span>
        <span className="ht-loader-bar" aria-hidden="true"><i style={{ transform: `scaleX(${progress})` }} /></span>
        <span className="ht-sr">Loading {Math.round(progress * 100)}%</span>
      </div>

      <div className="ht-progress" ref={bar} aria-hidden="true" />
      {/* Where you are, and a way to jump anywhere. */}
      <nav className="ht-pill" aria-label="Sections" ref={pill}>
        <button type="button" aria-expanded={menu} onClick={() => setMenu(open => !open)}>
          <span className="ht-pill-dot" aria-hidden="true" />{SECTIONS[section].label}{counter && <em>{counter}</em>}<span aria-hidden="true" className="ht-pill-caret">▲</span>
        </button>
        {menu && <ul>{SECTIONS.map((x, s) => <li key={x.id}><button type="button" aria-current={s === section ? "true" : undefined} onClick={() => jump(s)}>{x.label}</button></li>)}</ul>}
      </nav>
    </main>
  );
}
