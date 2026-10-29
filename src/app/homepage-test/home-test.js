"use client";
import dynamic from "next/dynamic";
import "./home-test.css";
const IslandScene = dynamic(() => import("./island-scene"), { ssr: false });

// Copy draws only on what the current site already says (bio and project list); edit freely.
export default function HomeTest() {
  return (
    <main className="ht">
      <section className="ht-hero" aria-label="Introduction">
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
            <a href="/projects/">See my work <span aria-hidden="true">→</span></a>
            <a href="mailto:brainilioir@gmail.com">Say hello <span aria-hidden="true">↗</span></a>
          </div>
        </div>
      </section>
    </main>
  );
}
