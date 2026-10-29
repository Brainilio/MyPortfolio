"use client";
import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import allProjects from "../../lib/projects";
import "./home-test.css";
const IslandScene = dynamic(() => import("./island-scene"), { ssr: false });
const PrairieScene = dynamic(() => import("./prairie-scene"), { ssr: false });
const work = allProjects.filter(project => project.slug && project.previewImage).slice(0, 5);

// Copy draws only on what the current site already says (bio and project list); edit freely.
export default function HomeTest() {
  const prairie = useRef(null), hero = useRef(null);
  // Leaving the hero: how far it has scrolled out (--leave, set on <main>) fades the intro a touch early.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = hero.current; if (!el) return;
      const { top, height } = el.getBoundingClientRect();
      el.parentElement?.style.setProperty("--leave", Math.min(1, Math.max(0, -top / Math.max(1, height))).toFixed(4));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener("scroll", onScroll, { passive: true }); window.addEventListener("resize", onScroll); update();
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, []);
  return (
    <main className="ht">
      <section className="ht-hero" aria-label="Introduction" ref={hero}>
        <div className="ht-sky" aria-hidden="true" />
        <IslandScene />
        <h1 className="ht-name">Brainilio</h1>
        <div className="ht-finish" aria-hidden="true" />
        <header className="ht-header">
          <a href="/homepage-test/" className="ht-wordmark">Brainilio<span>.</span></a>
          <nav aria-label="Main">
            <a href="/projects/">Work</a>
            <a href="/journey/">Lab</a>
            <a href="mailto:brainilioir@gmail.com">Contact</a>
          </nav>
          <span className="ht-available"><i aria-hidden="true" /> Available for work</span>
        </header>
        <div className="ht-intro">
          <span className="ht-eyebrow">Software developer</span>
          <p className="ht-roles">I build digital products<span>,</span> and the odd little world<span>.</span></p>
          <p className="ht-lede">Full-stack, from REST APIs to 3D on the web. I explore new ideas and try to leave the world a little better than I found it.</p>
          <p className="ht-stack">React · Node · TypeScript · Three.js</p>
          <div className="ht-links">
            <a href="#work">See my work <span aria-hidden="true">↓</span></a>
            <a href="mailto:brainilioir@gmail.com">Say hello <span aria-hidden="true">↗</span></a>
          </div>
        </div>
      </section>
      {/* Work: the cards ride a slow carousel among the prairie's rocks; scrolling turns it. */}
      <section className="ht-prairie" id="work" ref={prairie} style={{ "--cards": work.length }} aria-labelledby="ht-work-title">
        {/* Clouds on top of the prairie, starting where the hero ends: they scroll away and reveal the scene below. */}
        <div className="ht-cloudband" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
        <div className="ht-prairie-stage">
          <div className="ht-prairie-sky" aria-hidden="true" />
          <PrairieScene sectionRef={prairie} projects={work} />
          <div className="ht-prairie-head">
            <span className="ht-eyebrow">Selected work</span>
            <h2 id="ht-work-title">Things I&apos;ve built<span>.</span></h2>
          </div>
          <div className="ht-finish" aria-hidden="true" />
        </div>
        <ul className="ht-sr">
          {work.map(project => <li key={project.slug}><a href={`/project/${project.slug}/`}>{project.name}</a></li>)}
        </ul>
      </section>
    </main>
  );
}
