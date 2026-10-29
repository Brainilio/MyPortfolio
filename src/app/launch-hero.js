"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import Icon from "./iconbuddy-icon";

// The opening hero (name, portrait, mountains), shared by the homepage and /journey. Its runway lets the
// page scroll on while the hero lifts away, revealing the space scene behind it.
const ease = [0.22, 1, 0.36, 1];
function Arrow() {
  return (
    <span aria-hidden="true">
      <Icon name="arrow-up-right" />
    </span>
  );
}
function SocialIcon({ type }) {
  return <Icon name={type} />;
}
export default function LaunchHero() {
  const hero = useRef(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: hero,
    offset: ["start start", "end start"],
  });
  const liftPointer = useTransform(scrollYProgress, value => value > .1 ? "none" : "auto");
  const liftOpacity = useTransform(scrollYProgress, [.16, .38], [1, 0]);
  const foregroundOpacity = useTransform(scrollYProgress, [.01, .13], [1, 0]);
  const nameY = useTransform(scrollYProgress, [0, .15], ["0%", "-8%"]);
  const portraitY = useTransform(scrollYProgress, [0, .15], ["0%", "12%"]);
  const sideY = useTransform(scrollYProgress, [0, .15], [0, -35]);
  const landscapeY = useTransform(scrollYProgress, [0, .17, .4], ["0%", "0%", "65%"]);
  const landscapeScale = useTransform(scrollYProgress, [0, .18], [1, 1.85]);
  const intro = (delay = 0) => ({
    initial: reduced ? false : { opacity: 0, y: 26 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 1, delay, ease },
  });
  return (
    <div ref={hero} className="launch-runway" id="top">
    <motion.section className="hero" aria-label="Introduction" style={reduced ? {} : { opacity: liftOpacity, pointerEvents: liftPointer }}>
      <motion.header className="header" {...intro(0.1)}>
        <a href="#top" className="wordmark">
          Brainilio<span className="brand-dot">.</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#projects">Projects</a>
          <a href="#about">About</a>
          <a href="#contact">Contact <span className="nav-dot" /></a>
        </nav>
        <a className="pill contact-link" href="#contact">
          Let’s talk <Arrow diagonal />
        </a>
      </motion.header>
      <main id="main" className="hero-main">
        <motion.div
          className="name-layer"
          style={reduced ? {} : { y: nameY, opacity: foregroundOpacity }}
        >
          <h1 aria-label="Brainilio">
            {"Brainilio".split("").map((letter, i) => (
              <span className="letter-mask" key={i}>
                <motion.span
                  aria-hidden="true"
                  initial={reduced ? false : { y: "110%", rotate: 5 }}
                  animate={{ y: 0, rotate: 0 }}
                  transition={{
                    duration: 1.35,
                    delay: 0.2 + i * 0.055,
                    ease,
                  }}
                >
                  {letter}
                </motion.span>
              </span>
            ))}
          </h1>
        </motion.div>
        <motion.div
          className="landscape"
          aria-hidden="true"
          style={reduced ? {} : { y: landscapeY, scale: landscapeScale }}
        >
          <img
            className="mountain-photo"
            src="/images/mountain-trees.webp"
            alt=""
            width="1536"
            height="1024"
          />
          <div className="landscape-glow" />
        </motion.div>
        <motion.div className="left-info" style={reduced ? {} : { y: sideY, opacity: foregroundOpacity }}>
          <motion.p className="roles" {...intro(0.65)}>
            Developer.
            <br />
            Builder.
            <br />
            Explorer<span className="red-dot">.</span>
          </motion.p>
          <motion.div className="socials" {...intro(0.85)}>
            <a
              href="https://github.com/Brainilio"
              target="_blank"
              rel="noreferrer"
            >
              <SocialIcon type="github" />
              GitHub <Arrow diagonal />
            </a>
            <a href="mailto:brainilioir@gmail.com">
              <SocialIcon type="mail" />
              Email <Arrow diagonal />
            </a>
          </motion.div>
        </motion.div>
        <motion.div
          className="portrait-layer"
          style={reduced ? {} : { y: portraitY, opacity: foregroundOpacity }}
        >
          <motion.div
            className="portrait-reveal"
            initial={reduced ? false : { opacity: 0, y: 100, scale: 1.06 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.5, delay: 0.4, ease }}
          >
            <img
              className="portrait"
              src="/images/portrait-cutout.png"
              alt="Brainilio smiling, wearing glasses and a black shirt"
              width="584"
              height="564"
              fetchPriority="high"
            />
          </motion.div>
        </motion.div>
        <motion.aside
          className="right-info"
          style={reduced ? {} : { y: sideY, opacity: foregroundOpacity }}
          {...intro(0.95)}
        >
          <p>
            I enjoy exploring ideas,
            <br className="desktop-break" /> building products, and
            <br className="desktop-break" /> finding ways technology
            <br className="desktop-break" /> can make a positive impact.
          </p>
        </motion.aside>
      </main>
    </motion.section>
    </div>
  );
}
