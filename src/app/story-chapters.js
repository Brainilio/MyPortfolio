"use client";
import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import projects from '../lib/projects';

function Chapter({id,side='',children,className=''}) {
  const ref=useRef(null),reduced=useReducedMotion();
  const {scrollYProgress}=useScroll({target:ref,offset:['start end','end start']});
  const opacity=useTransform(scrollYProgress,[0,.23,.7,.94],[0,1,1,0]);
  const y=useTransform(scrollYProgress,[0,.3,.7,1],[65,0,0,-45]);
  const scale=useTransform(scrollYProgress,[0,.3,.7,1],[.9,1,1,1.06]);
  return <section ref={ref} id={id} className={`story-chapter ${className}`}><motion.div className={`story-panel ${side}`} style={reduced?{}:{opacity,y,scale}}>{children}</motion.div></section>;
}
export default function StoryChapters({ending,onEnding}) {
  return <div className="story-chapters">
    <Chapter id="about" className="story-about" side="left">
      <span className="story-eyebrow">01 / A LITTLE FAR FROM HOME</span>
      <h2>Led by<br/><em>curiosity.</em></h2>
      <p>I’m a software developer who builds digital products, explores new ideas, and tries to leave the world a little better than I found it.</p>
      <small className="story-credit">Astronaut by <a href="https://modelviewer.dev/examples/stagingandcameras/">Poly</a> · <a href="https://creativecommons.org/licenses/by/2.0/">CC BY 2.0</a></small>
    </Chapter>
    <Chapter id="signal" className="story-signal" side="left">
      <span className="story-eyebrow">02 / SOMETHING OUT THERE</span>
      <h2>A signal.<br/><em>A direction.</em></h2>
      <p>Something worth following.</p>
    </Chapter>
    <div id="projects" className="story-projects">
      {projects.slice(0,3).map((project,i)=><Chapter key={project.slug} className={`story-project story-project-${i}`} side={i===1?'right':'left'}>
        <a className="story-project-card" href={`/project/${project.slug}/`}>
          <span className="story-eyebrow">0{i+3} / SELECTED PROJECT</span>
          <img src={project.previewImage} alt={`${project.name} preview`} width="600" height="400" loading="lazy"/>
          <h2>{project.name}<span aria-hidden="true">↗</span></h2>
          <p>{project.shortDescription}</p>
          <span className="story-tags">{project.tags.slice(0,3).join(' / ')}</span>
        </a>
      </Chapter>)}
    </div>
    <Chapter id="now" className="story-return" side="left">
      <span className="story-eyebrow">06 / FINDING A WAY FORWARD</span>
      <h2>Still exploring.<br/><em>A little closer.</em></h2>
      <p>Always learning, always building, and curious about what’s next.</p>
    </Chapter>
    <section id="contact" className="story-contact">
      <div className="story-contact-panel">
        <span className="story-eyebrow">07 / THE NEXT DESTINATION</span>
        <h2>Every journey starts<br/>with <em>a hello.</em></h2>
        <a className="pill light-pill" href="mailto:brainilioir@gmail.com">Send me a signal ↗</a>
        <button className="story-ending" onClick={onEnding}>{ending?"Replay ending":"Try the ending"} <span aria-hidden="true">↗</span></button>
        <p className="story-demo-note" role="status">{ending?'Through the unknown. On to the next adventure.':'Animation preview · no message is sent.'}</p>
        <a className="story-back" href="#top">Back to Earth ↑</a>
      </div>
    </section>
  </div>;
}
