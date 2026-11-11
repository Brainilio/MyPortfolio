"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence, MotionConfig } from "motion/react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import allProjects from "../../lib/projects";
import { copyText } from "../../lib/homepage-copy";
import "./home.css";
import { getStage } from "./stage";
const IslandScene = dynamic(() => import("./island-scene"), { ssr: false });
const AboutScene = dynamic(() => import("./about-scene"), { ssr: false });
const WorkShowcase = dynamic(() => import("./work-showcase"), { ssr: false });
const SkillsScene = dynamic(() => import("./skills-scene"), { ssr: false });
import { SKILLS } from "./content";
import SiteFooter from "../site-footer";
import { Icon, Roll } from "../tech-chip";
import { techIcon } from "../../lib/tech-icons";
import { scheduleHref, RESUME_URL as RESUME } from "../../lib/contact";
// The homepage shows three projects (the full list is on /projects/).
const FEATURED = ["crapp", "my-compassion", "karina-rodriguez"];
const work = FEATURED.map(slug => allProjects.find(project => project.slug === slug)).filter(Boolean);

// Every model the homepage loads (fetched up front by the loading screen).
const MODELS = ["kit", "stag", "deer", "fox", "bear", "eagle", "prairiedog", "wagon", "moose", "eagle-flying", "bison"].map(name => `/models/island/${name}.glb`);
const LOADING_LINES = ["Raising the island", "Stoking the campfire", "Rounding up the bison", "Packing the wagon"];

// One long page. Each section is a floating diorama that holds still (sticky) while its words scroll past on the other
// side, alternating right, left, right; the coast closes the page full width. Behind everything one fixed sky
// shifts colour continuously with the scroll. Inside a section its own progress (0 → 1 while it's pinned) deals the
// Work cards and drives the Skills wagon.
const SECTIONS = [
  { id: "home", label: "Home", steps: 1 },
  { id: "about", label: "About", steps: 1 },
  { id: "work", label: "Work", steps: work.length },
  { id: "skills", label: "Skills", steps: SKILLS.length },
];
// One sky for the whole page: a five-colour gradient (top to bottom) that shifts continuously with how far down
// the page you are. Each stop belongs to a section and sits where that section is settled on screen; the last two
// are the coast as you arrive and at the very end.
const SKY = [
  ["#1b1335", "#33225a", "#6e4a8f", "#c9849c", "#f3b89c"], // Home: dusk
  ["#120e2c", "#1f1846", "#3d2c66", "#7a4f86", "#b27390"], // About: blue hour by the fire
  ["#5f5d8c", "#b57796", "#f5a389", "#f9c195", "#f2b98f"], // Work: prairie sunset
  ["#e9bfa0", "#f1cba8", "#f6d8b5", "#f6d6b4", "#f0cba6"], // Skills: warm valley morning
  ["#c98f96", "#dfa79f", "#eebda8", "#f3c9ad", "#f0c2a2"], // The end: the same valley, the light turning rosy
].map(stops => stops.map(hex => [1, 3, 5].map(k => parseInt(hex.slice(k, k + 2), 16))));
const mix = (a, b, t) => a.map((c, k) => Math.round(c + (b[k] - c) * t));
// No gaps between sections and no fading: each island holds while its section is pinned and travels up and away with
// the page as the next one rises into view (its stage is sticky). ARRIVE and DEPART tip each island's camera while it
// travels: steeper as it comes up, lower as it leaves.
const ARRIVE = 14, DEPART = 10;
// Which slot each scene reads in the shared scroll state.
const ABOUT = 1, WORK = 2, SKILLS_AT = 3;
// Each line of the Skills story: rising in out of a soft blur, lifting away (quicker) for the next.
const STORY_LINE = {
  hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
  shown: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: .7, ease: [.2, .8, .2, 1] } },
  gone: { opacity: 0, y: -12, filter: "blur(4px)", transition: { duration: .28, ease: [.6, 0, .9, .4] } },
};
const clamp = v => Math.min(1, Math.max(0, v));

// A line whose last words slide up and away, one phrase after another (still with reduced motion).
const SLIDES = ["cross-platform apps", "full-stack platforms", "serverless back ends", "design systems", "3D on the web"];
function SlidingWords() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setI(k => (k + 1) % SLIDES.length), 2600);
    return () => clearInterval(timer);
  }, []);
  return <span className="ht-slide" aria-hidden="true">
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span key={i} initial={{ y: "100%", opacity: 0 }} animate={{ y: "0%", opacity: 1 }} exit={{ y: "-100%", opacity: 0 }} transition={{ duration: .55, ease: [.2, .8, .2, 1] }}>{SLIDES[i]}</motion.span>
    </AnimatePresence>
  </span>;
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

export default function Home({ copy = {} }) {
  const [where, setWhere] = useState({ section: 0, stop: 0 }), [menu, setMenu] = useState(false);
  // Shared with the 3D scenes (read every frame): which sections are on screen and how far through each one we are.
  const scene = useRef({ section: 0, live: [0], progress: [0, 0, 0, 0, 0], tilt: [0, 0, 0, 0, 0] });
  const [still, setStill] = useState(false);
  // Reduced motion, and phones: the Work postcard shows its still image instead of playing its preview.
  useEffect(() => {
    const queries = [matchMedia("(prefers-reduced-motion: reduce)"), matchMedia("(max-width: 760px)")], sync = () => setStill(queries.some(q => q.matches));
    sync(); queries.forEach(q => q.addEventListener("change", sync));
    return () => queries.forEach(q => q.removeEventListener("change", sync));
  }, []);
  const pill = useRef(null), bar = useRef(null);
  // The section pill steps aside once the footer comes into view, so it never covers the footer's links.
  const [atFooter, setAtFooter] = useState(false);
  useEffect(() => {
    const footer = document.querySelector(".ht-outro .ui-footer"); if (!footer) return;
    const seen = new IntersectionObserver(([entry]) => { setAtFooter(entry.isIntersecting); if (entry.isIntersecting) setMenu(false); }, { rootMargin: "0px 0px 40px 0px" });
    seen.observe(footer); return () => seen.disconnect();
  }, []);
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
        stops[i] = i ? top + run * .5 : 0;
      });
      // The sky: find the two section stops either side of this scroll position and blend between them.
      const end = Math.max(1, document.documentElement.scrollHeight - vh), marks = [...stops.map(v => v / end), 1], p = clamp(y / end);
      let k = 0; while (k < marks.length - 2 && p > marks[k + 1]) k++;
      const blend = clamp((p - marks[k]) / Math.max(1e-6, marks[k + 1] - marks[k])), colors = SKY[k].map((c, n) => mix(c, SKY[k + 1][n], blend));
      if (sky.current) sky.current.style.background = `linear-gradient(180deg,${colors.map((c, n) => `rgb(${c}) ${[0, 30, 55, 80, 100][n]}%`).join(",")})`;
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

      <section className="ht-zone ht-home" id="home" ref={el => (zones.current[0] = el)} aria-label="Introduction">
        <div className="ht-stage"><IslandScene active={scene} onReady={onReady(0)} /></div>
        {/* The name comes in letter by letter, each rising into view through its own little window. */}
        <h1 className="ht-name" aria-label="Brainilio">{"Brainilio".split("").map((letter, i) => <span key={i} className="ht-name-window" aria-hidden="true" style={{ "--c": i }}><span>{letter}</span></span>)}</h1>
        <div className="ht-intro">
          <p className="ht-roles"><span className="ht-sr">I build cross-platform apps, full-stack platforms, serverless back ends, design systems and 3D on the web.</span><span aria-hidden="true">I build</span> <SlidingWords /></p>
          <p className="ht-lede">{("Software engineer with five years of shipping production products, from architecture to launch: React and React Native up front, serverless AWS behind them, and a designer’s eye for the details. Originally from the Netherlands, now in Colorado.")}</p>
          <div className="ht-links">
            <a className="ui-btn" href="#work" onClick={event => { event.preventDefault(); jump(WORK); }}><Roll>See my work</Roll><Icon src="/icons/tech/tabler--arrow-down.svg" /></a>
            <a className="ui-btn ui-btn--secondary" href="/contact/"><Roll>Let&apos;s talk</Roll><Icon src="/icons/tech/tabler--arrow-up-right.svg" /></a>
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
          <RevealHeading id="ht-about-title" text={copyText(copy.about_heading, "Around the fire")} />
          <p>{("By day I’m a software engineer. On the side I build my own products, like Crapp, and design and build sites and apps for people with an idea. I like owning the whole thing: the design, the code, the cloud it runs on, and the small details that make it feel good to use. When I’m not at my desk, I’m on a trail, on a road trip through a national park, or by a campfire.")}</p>
          <div className="ht-links"><a className="ui-btn ui-btn--secondary" href={RESUME} target="_blank" rel="noopener noreferrer"><Roll>Resume</Roll><Icon src="/icons/tech/tabler--arrow-up-right.svg" /></a></div>
        </div>
      </section>

      {/* Work: no diorama; one pinned screen, the scroll picking the project, a bald eagle circling in front of its
          name (work-showcase.js). The bison meadow that used to be here is now a Lab experiment (/journey/meadow/). */}
      <section className="ht-zone ht-work" id="work" data-side="left" ref={el => (zones.current[WORK] = el)} aria-labelledby="ht-work-title">
        {built[WORK] && <WorkShowcase work={work} scene={scene} slot={WORK} onReady={onReady(WORK)} />}
      </section>

      {/* Skills: the park road on the right; the wagon drives sign to sign as the list scrolls past. */}
      <section className="ht-zone ht-skills ht-pinned" id="skills" data-side="right" style={{ "--steps": SKILLS.length }} ref={el => (zones.current[SKILLS_AT] = el)} aria-labelledby="ht-skills-title">
        <div className="ht-stage">{built[SKILLS_AT] && <SkillsScene state={scene} skills={SKILLS} onCar={onCar} slot={SKILLS_AT} side="right" onReady={onReady(SKILLS_AT)} />}</div>
        <div className="ht-copy">
          <RevealHeading id="ht-skills-title" text={copyText(copy.skills_heading, "What I bring along")} />
          {/* The whole list, for screen readers; on screen each stop is spelled out on its own as the wagon pulls up. */}
          <ol className="ht-sr">
            {SKILLS.map(skill => (
              <li key={skill.title}>{skill.title}: {skill.items.join(", ")}. {skill.lead} {skill.blurb}</li>
            ))}
          </ol>
          {/* Pulling up at a sign, it's spelled out in big plain text in the open sky on the right, level with the
              heading, its tools beneath it. (Read once in the list above, so it's hidden from screen readers here.) */}
          <div className="ht-skill-story" aria-hidden="true">
            <MotionConfig reducedMotion="user">
              <AnimatePresence mode="wait">
                {section === SKILLS_AT && SKILLS[stop] && (
                  <motion.div className="ht-skill-panel ui-glass" key={stop} initial="hidden" animate="shown" exit="gone"
                    variants={{ shown: { transition: { delayChildren: .2, staggerChildren: .09 } }, gone: { transition: { staggerChildren: .04 } } }}>
                    <motion.p className="ht-skill-lead" variants={STORY_LINE}>{SKILLS[stop].lead}</motion.p>
                    <motion.p className="ht-skill-blurb" variants={STORY_LINE}>{SKILLS[stop].blurb}</motion.p>
                    <motion.ul className="ht-skill-tools ui-chips" variants={{ shown: { transition: { staggerChildren: .05 } } }}>
                      {SKILLS[stop].items.map(tool => (
                        <motion.li key={tool} className="ui-chip" variants={STORY_LINE}>{techIcon(tool) && <Icon src={techIcon(tool)} />}{tool}</motion.li>
                      ))}
                    </motion.ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </MotionConfig>
          </div>
        </div>
      </section>

      {/* The end: the valley's light turns rosy behind a frosted card; the full contact page has the coast. */}
      <section className="ht-outro" aria-labelledby="ht-outro-title">
        <div className="ht-outro-card ui-glass">
          <p className="ht-badge"><i aria-hidden="true" />Available for freelance projects</p>
          <h2 id="ht-outro-title">Got an idea?</h2>
          <p>An app, a website, or the feature your product is missing. I&apos;d love to hear about it.</p>
          <div className="ht-links">
            <a className="ui-btn" href="/contact/"><Roll>Let&apos;s talk</Roll><Icon src="/icons/tech/tabler--arrow-up-right.svg" /></a>
            <a className="ui-btn ui-btn--secondary" href={scheduleHref}><Roll>Book a call</Roll><Icon src="/icons/tech/tabler--calendar-event.svg" /></a>
          </div>
        </div>
        <SiteFooter />
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
      <nav className={`ht-pill${atFooter ? " is-away" : ""}`} aria-label="Sections" ref={pill} inert={atFooter ? true : undefined}>
        <button type="button" aria-expanded={menu} onClick={() => setMenu(open => !open)}>
          <span className="ht-pill-dot" aria-hidden="true" />{SECTIONS[section].label}{counter && <em>{counter}</em>}<span aria-hidden="true" className="ht-pill-caret">▲</span>
        </button>
        {menu && <ul>{SECTIONS.map((x, s) => <li key={x.id}><button type="button" aria-current={s === section ? "true" : undefined} onClick={() => jump(s)}>{x.label}</button></li>)}</ul>}
      </nav>
    </main>
  );
}
