"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
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
const CabinScene = dynamic(() => import("./cabin-scene"), { ssr: false });
import { SKILLS } from "./content";
import Heading from "../heading";
import HeroHeadline from "./hero-headline";
import SkillStory from "./skill-card";
import SiteFooter from "../site-footer";
import { Icon, Roll } from "../tech-chip";
import { AVAILABILITY, scheduleHref, RESUME_URL as RESUME } from "../../lib/contact";
// The homepage shows three projects (the full list is on /projects/).
const FEATURED = ["crapp", "my-compassion", "karina-rodriguez"];
const work = FEATURED.map(slug => allProjects.find(project => project.slug === slug)).filter(Boolean);

// Every model the homepage loads (fetched up front by the loading screen).
const MODELS = ["kit", "stag", "deer", "fox", "bear", "eagle", "prairiedog", "wagon", "moose", "eagle-flying", "bison", "cabin", "cat"].map(name => `/models/island/${name}.glb`);
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
  ["#191335", "#35245c", "#754c8d", "#d08a94", "#f4b592"], // The end: dusk again, at the cabin
].map(stops => stops.map(hex => [1, 3, 5].map(k => parseInt(hex.slice(k, k + 2), 16))));
const mix = (a, b, t) => a.map((c, k) => Math.round(c + (b[k] - c) * t));
// No gaps between sections and no fading: each island holds while its section is pinned and travels up and away with
// the page as the next one rises into view (its stage is sticky). ARRIVE and DEPART tip each island's camera while it
// travels: steeper as it comes up, lower as it leaves.
const ARRIVE = 14, DEPART = 10;
// Which slot each scene reads in the shared scroll state.
const ABOUT = 1, WORK = 2, SKILLS_AT = 3;
const SKILLS_ARRIVAL = 40;
const skillsArrivalDistance = el => el.firstElementChild.offsetHeight * SKILLS_ARRIVAL / 100;
const clamp = v => Math.min(1, Math.max(0, v));

// A section heading that writes itself in as you arrive: once its section is a fifth of the way up the screen, each
// word is uncovered left to right, 0.08 s after the one before, then the violet full stop pops in. It resets when you
// scroll back above the section, so it plays again on the way down. Without JavaScript, or with reduced motion
// (see the CSS), it's simply there.
function RevealHeading({ id, text, arrive = 20 }) {
  const ref = useRef(null), [armed, setArmed] = useState(false), [shown, setShown] = useState(false), words = text.trim().replace(/[.!?]$/, "").split(/\s+/);
  const mark = text.trim().match(/[.!?]$/)?.[0] || ".";
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
    <Heading as="h2" id={id} ref={ref} mark={mark} markClassName="ht-dot" className={armed ? `ht-reveal${shown ? " is-revealed" : ""}` : undefined} style={{ "--n": words.length }}>
      {words.map((word, i) => <span key={i}><span className="ht-word" style={{ "--w": i }}>{word}</span>{i < words.length - 1 ? " " : ""}</span>)}
    </Heading>
  );
}

export default function Home({ copy = {} }) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const query = matchMedia("(max-width: 760px), (max-width: 960px) and (max-height: 500px)");
    const sync = () => setMobile(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  const [where, setWhere] = useState({ section: 0, stop: 0 }), [menu, setMenu] = useState(false);
  // Shared with the 3D scenes (read every frame): which sections are on screen and how far through each one we are.
  const scene = useRef({ section: 0, live: [0], progress: [0, 0, 0, 0, 0], tilt: [0, 0, 0, 0, 0] });
  const pill = useRef(null), bar = useRef(null);
  // The section pill steps aside once the footer comes into view, so it never covers the footer's links.
  const [atFooter, setAtFooter] = useState(false);
  useEffect(() => {
    const footer = document.querySelector(".ht-outro"); if (!footer) return;
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
  useEffect(() => {
    document.documentElement.classList.toggle("ht-locked", !loaded);
    return () => document.documentElement.classList.remove("ht-locked");
  }, [loaded]);
  // The entrance: once the loading screen lifts, the hero island rises into place and its camera lands (see the CSS and
  // island-scene), starting 0.3 s in.
  useEffect(() => { if (loaded) scene.current.introAt = performance.now() + 300; }, [loaded]);

  // Smooth scrolling (Lenis), off with reduced motion. Menu and header links glide to a section's top, or to a point
  // inside it (q: how far through its pinned stretch).
  const lenisRef = useRef(null);
  const scrollToSection = useCallback((s, q = 0) => {
    const el = zones.current[s];
    if (!el) return;
    const run = Math.max(0, el.offsetHeight - window.innerHeight);
    const arrival = s === SKILLS_AT && q > 0 ? skillsArrivalDistance(el) : 0;
    let top = el.offsetTop + arrival + q * Math.max(0, run - arrival);
    if (s === SKILLS_AT && matchMedia("(max-width: 760px), (max-width: 960px) and (max-height: 500px)").matches) {
      const cards = el.querySelectorAll(".ht-skill-panel");
      const card = cards[Math.round(q * (cards.length - 1))];
      if (card) top = scrollY + card.getBoundingClientRect().top - innerHeight * .36;
    }
    const lenis = lenisRef.current;
    setMenu(false);
    if (lenis) lenis.scrollTo(top, { duration: 1.4 }); else window.scrollTo({ top, behavior: "auto" });
  }, []);
  useEffect(() => { lenisRef.current?.[loaded ? "start" : "stop"](); }, [loaded]);
  const jump = useCallback(s => scrollToSection(s, 0), [scrollToSection]);
  useEffect(() => {
    const showSection = event => {
      const target = SECTIONS.findIndex(section => section.id === event.detail);
      if (!loaded || target < 0) return;
      event.preventDefault();
      jump(target);
    };
    window.addEventListener("portfolio:navigate", showSection);
    return () => window.removeEventListener("portfolio:navigate", showSection);
  }, [jump, loaded]);

  useEffect(() => {
    let frame = 0, last = "";
    const mobileQuery = matchMedia("(max-width: 760px), (max-width: 960px) and (max-height: 500px)");
    const update = () => {
      frame = 0;
      const y = window.scrollY, vh = window.innerHeight, middle = y + vh / 2, live = [];
      let dominant = 0;
      const stops = [], last_ = zones.current.length - 1;
      zones.current.forEach((el, i) => {
        if (!el) return;
        const top = el.offsetTop, height = el.offsetHeight, run = Math.max(1, height - vh);
        // Keep the first sign in place while the Skills scene settles into view.
        const arrival = i === SKILLS_AT ? skillsArrivalDistance(el) : 0;
        scene.current.progress[i] = clamp((y - top - arrival) / Math.max(1, run - arrival));
        if (top < y + vh && top + height > y) live.push(i);
        if (middle >= top) dominant = i;
        // How far its island has still to travel in (from below) and has travelled out (above), 0 → 1 a screen each.
        const arriving = i ? clamp((top - y) / vh) : 0, leaving = i < last_ ? clamp((y - (top + height - vh)) / vh) : 0;
        scene.current.tilt[i] = mobileQuery.matches ? 0 : ARRIVE * arriving - DEPART * leaving;
        stops[i] = i ? top + run * .5 : 0;
      });
      if (mobileQuery.matches) {
        const cards = [...zones.current[SKILLS_AT].querySelectorAll(".ht-skill-panel")];
        const target = vh * .5;
        let selected = 0;
        for (let i = 0; i < cards.length; i++) {
          if (cards[i].getBoundingClientRect().top <= target) selected = i;
        }
        scene.current.progress[SKILLS_AT] = selected / Math.max(1, cards.length - 1);
      }
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
    const lenis = mobileQuery.matches || matchMedia("(prefers-reduced-motion: reduce)").matches || new URLSearchParams(location.search).has("debug") ? null : new Lenis({ autoRaf: true, lerp: .09, smoothWheel: true });
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
          <HeroHeadline active={loaded && section === 0} />
          <p className="ht-lede">I'm a full-stack software engineer with 5+ years of experience building products from early ideas to production. From intuitive interfaces to secure, scalable systems, I love connecting the pieces and working with people to create experiences that are thoughtful, reliable, and genuinely useful.</p>
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
          <div className="ht-about-intro">
          <img className="ht-portrait" src="/me.jpg" alt="Brainilio, smiling, outdoors under a tree" width="120" height="120" loading="lazy" decoding="async" />
          <RevealHeading id="ht-about-title" text={copyText(copy.about_heading, "Around the fire")} />
          </div>
          <div className="ht-about-text">
            <p>Born in Brazil, raised in the Netherlands, and now living in the United States, I've learned to appreciate different perspectives, cultures, and ways of thinking. That curiosity carries into everything I do.</p>
            <p>I love getting involved early by understanding problems, challenging assumptions, exploring possibilities, and bringing ideas to life. I've helped deliver large-scale digital platforms, shaped engineering foundations, and turned early prototypes into working products.</p>
            <p>What motivates me most is building things that make a difference. I'm especially drawn to ideas that create opportunities, strengthen communities, and improve people's lives.</p>
            <p>And creativity doesn't stop at my desk. Whether I'm drawing, playing guitar, trying a new recipe, exploring a national park with my wife, or helping my church and community bring an idea to life, I'm always looking for something new to explore.</p>
            <div className="ht-links"><a className="ui-btn ui-btn--secondary" href={RESUME} target="_blank" rel="noopener noreferrer"><Roll>Resume</Roll><Icon src="/icons/tech/tabler--arrow-up-right.svg" /></a></div>
          </div>
        </div>
      </section>

      {/* Work: no diorama; one pinned screen, the scroll picking the project, a bald eagle circling in front of its
          name (work-showcase.js). The bison meadow that used to be here is now a Lab experiment (/journey/meadow/). */}
      <section className="ht-zone ht-work" id="work" data-side="left" ref={el => (zones.current[WORK] = el)} aria-label="Latest work">
        {built[WORK] && <WorkShowcase work={work} scene={scene} slot={WORK} onReady={onReady(WORK)} />}
      </section>

      {/* Skills: the park road on the right; the wagon drives sign to sign as the list scrolls past. */}
      <section className="ht-zone ht-skills ht-pinned" id="skills" data-side="right" style={{ "--steps": SKILLS.length, "--section-arrival": `${SKILLS_ARRIVAL}svh` }} ref={el => (zones.current[SKILLS_AT] = el)} aria-labelledby="ht-skills-title">
        <div className="ht-stage">{built[SKILLS_AT] && <SkillsScene state={scene} skills={SKILLS} onCar={onCar} slot={SKILLS_AT} side="right" onReady={onReady(SKILLS_AT)} />}</div>
        <div className="ht-copy">
          <RevealHeading id="ht-skills-title" text={copyText(copy.skills_heading, "What I bring along")} />
          {/* The whole list, for screen readers; on screen each stop is spelled out on its own as the wagon pulls up. */}
          <ol className="ht-sr">
            {SKILLS.map(skill => (
              <li key={skill.title}>{skill.title}: {skill.items.join(", ")}. {skill.lead} {skill.blurb}</li>
            ))}
          </ol>
          {/* The copy moves past the selected stop inside a fixed panel. */}
          <SkillStory skills={SKILLS} stop={stop} visible={section === SKILLS_AT} fluid={mobile} />
        </div>
      </section>

      {/* The end: dusk at a cabin in the pines (cabin-scene.js) behind a frosted card; the full contact page has the coast. */}
      <section className="ht-outro" aria-labelledby="ht-outro-title">
        {built[SKILLS_AT] && <CabinScene />}
        <div className="ht-outro-card ui-glass">
          <p className="ui-availability"><i aria-hidden="true" />{AVAILABILITY}</p>
          <Heading as="h2" id="ht-outro-title" mark="?">Got something worth building</Heading>
          <p>Whether you're bringing a new idea to life, improving a product, or growing a team, I'd love to hear about it. I'm especially excited by meaningful challenges and people who care about what they're creating.</p>
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
