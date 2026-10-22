'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

const ease = [0.22, 1, 0.36, 1];
function Arrow({ diagonal = false }) { return <span aria-hidden="true">{diagonal ? '↗' : '↓'}</span>; }
function SocialIcon({ type }) {
  const paths = {
    github: <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.86c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0 1 12 6.82c.85 0 1.71.11 2.51.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.76c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7"/><path d="m3 6 9 7 9-7" fill="none" stroke="currentColor" strokeWidth="1.7"/></>,
  };
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">{paths[type]}</svg>;
}
function LocalTime() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () => setTime(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Denver', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date()));
    update(); const interval = setInterval(update, 1000 * 30); return () => clearInterval(interval);
  }, []);
  return <span className="local-time">{time || 'MOUNTAIN TIME'} <span className="time-dot" /></span>;
}
function Reveal({ children, className = '', delay = 0 }) {
  const reduced = useReducedMotion();
  return <motion.div className={className} initial={reduced ? false : { opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.9, delay, ease }}>{children}</motion.div>;
}
export default function Portfolio({ projects }) {
  const hero = useRef(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: hero, offset: ['start start', 'end start'] });
  const nameY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const portraitY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const sideY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const landscapeY = useTransform(scrollYProgress, [0, 1], ['0%', '35%']);
  useEffect(() => {
    if (reduced) return;
    const lenis = new Lenis({ autoRaf: true, lerp: 0.075, smoothWheel: true, anchors: true });
    return () => lenis.destroy();
  }, [reduced]);
  const intro = (delay = 0) => ({ initial: reduced ? false : { opacity: 0, y: 26 }, animate: { opacity: 1, y: 0 }, transition: { duration: 1, delay, ease } });
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <section ref={hero} className="hero" id="top" aria-label="Introduction">
      <motion.header className="header" {...intro(0.1)}>
        <a href="#top" className="wordmark">Brainilio<span className="brand-dot">.</span></a>
        <nav aria-label="Main navigation"><a href="#projects">Projects</a><a href="#about">About</a><a href="#now">Now <span className="nav-dot" /></a></nav>
        <a className="pill contact-link" href="mailto:brainilioir@gmail.com">Let’s talk <Arrow diagonal /></a>
      </motion.header>
      <main id="main" className="hero-main">
        <motion.div className="name-layer" style={reduced ? {} : { y: nameY }}>
          <h1 aria-label="Brainilio">{'Brainilio'.split('').map((letter, i) => <span className="letter-mask" key={i}><motion.span aria-hidden="true" initial={reduced ? false : { y: '110%', rotate: 5 }} animate={{ y: 0, rotate: 0 }} transition={{ duration: 1.35, delay: 0.2 + i * 0.055, ease }}>{letter}</motion.span></span>)}</h1>
        </motion.div>
        <motion.div className="landscape" aria-hidden="true" style={reduced ? {} : { y: landscapeY }}><img className="mountain-photo" src="/images/mountain-trees.webp" alt="" width="1536" height="1024"/><div className="landscape-glow"/></motion.div>
        <motion.div className="left-info" style={reduced ? {} : { y: sideY }}>
          <motion.p className="roles" {...intro(0.65)}>Developer.<br/>Builder.<br/>Explorer<span className="red-dot">.</span></motion.p>
          <motion.div className="socials" {...intro(0.85)}><a href="https://github.com/Brainilio" target="_blank" rel="noreferrer"><SocialIcon type="github"/>GitHub <Arrow diagonal/></a><a href="mailto:brainilioir@gmail.com"><SocialIcon type="mail"/>Email <Arrow diagonal/></a></motion.div>
        </motion.div>
        <motion.div className="portrait-layer" style={reduced ? {} : { y: portraitY }}>
          <motion.div className="portrait-reveal" initial={reduced ? false : { opacity: 0, y: 100, scale: 1.06 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 1.5, delay: 0.4, ease }}>
            <img className="portrait" src="/images/portrait-cutout.png" alt="Brainilio smiling, wearing glasses and a black shirt" width="584" height="564" fetchPriority="high"/>
          </motion.div>
        </motion.div>
        <motion.aside className="right-info" style={reduced ? {} : { y: sideY }} {...intro(0.95)}>
          <p>I enjoy exploring ideas,<br className="desktop-break"/> building products, and<br className="desktop-break"/> finding ways technology<br className="desktop-break"/> can make a positive impact.</p>
          <span className="short-rule"/>
          <div className="location">COLORADO SPRINGS, CO<LocalTime/></div>
        </motion.aside>
        <motion.a className="scroll-cue" href="#about" {...intro(1.2)}><span>SCROLL TO EXPLORE</span><Arrow/></motion.a>
        <motion.span className="hero-caption" {...intro(1.2)}>A LITTLE CURIOUS. ALWAYS BUILDING.</motion.span>
      </main>
    </section>
    <section id="about" className="about dark-section">
      <div className="section-label"><span>01 <i/></span><span>ABOUT ME</span></div>
      <Reveal className="about-statement"><h2>I’m a software developer who <span>builds digital products, explores new ideas,</span> and tries to leave the world a little better than I found it.</h2></Reveal>
      <Reveal className="about-detail"><p>I care about clean interfaces, thoughtful architecture, and meaningful experiences. I’m always learning, always building, and always curious about what’s next.</p><a href="mailto:brainilioir@gmail.com" className="pill light-pill">Get to know me <Arrow diagonal/></a></Reveal>
    </section>
    <section id="projects" className="projects dark-section">
      <div className="section-label"><span>02 <i/></span><span>SELECTED WORK</span></div>
      <div className="project-grid">{projects.map((project, i) => <Reveal delay={i * 0.1} key={project.slug}><Link className="project-card" href={`/project/${project.slug}/`}><div className="project-image"><img src={project.previewImage} alt={`${project.name} project preview`} loading="lazy" width="600" height="400"/><span className="project-open"><Arrow diagonal/></span></div><h3>{project.name}<Arrow diagonal/></h3><p>{project.shortDescription}</p><span className="project-tags">{project.tags.join('  /  ')}</span></Link></Reveal>)}</div>
      <Link href="/projects/" className="all-projects-link">Explore the project archive <Arrow diagonal/></Link>
    </section>
    <section className="now dark-section" id="now"><div className="section-label"><span>03 <i/></span><span>RIGHT NOW</span></div><Reveal><p className="now-heading">Always a work in progress<span>.</span></p><p className="now-copy">Exploring ideas. Building things. Staying curious.</p></Reveal></section>
    <footer className="footer"><span>Have something in mind?</span><a href="mailto:brainilioir@gmail.com">Let’s make it happen. <Arrow diagonal/></a><div><span>© {new Date().getFullYear()} Brainilio</span><a href="#top">BACK TO TOP ↑</a></div></footer>
  </>;
}
