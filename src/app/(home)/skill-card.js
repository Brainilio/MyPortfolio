"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import TechChip from "../tech-chip";

const VISIBLE_TOOLS = 6;

function SkillCard({ skill, index, active, position, fluid }) {
  const [phase, setPhase] = useState("closed");
  const open = active && phase === "open";
  const closing = active && phase === "closing";
  useEffect(() => {
    if (phase !== "closing") return;
    const finish = setTimeout(() => setPhase("closed"), 260);
    return () => clearTimeout(finish);
  }, [phase]);
  const toggle = () => {
    if (!open) setPhase("open");
    else setPhase(matchMedia("(prefers-reduced-motion: reduce)").matches ? "closed" : "closing");
  };
  const extra = skill.items.slice(VISIBLE_TOOLS);
  const toolsId = `skill-tools-${index}`;

  return <div className="ht-skill-panel" data-position={position} data-active={active} inert={!active}
    data-lenis-prevent={active && !fluid ? "" : undefined}>
    <p className="ht-skill-lead" aria-hidden="true">{skill.lead}</p>
    <div className="ht-skill-blurb" aria-hidden="true">
      {skill.blurb.split("\n\n").map(paragraph => <p key={paragraph}>{paragraph}</p>)}
    </div>
    <ul className="ht-skill-tools ui-chips" id={toolsId}>
      {skill.items.slice(0, VISIBLE_TOOLS).map(name => <TechChip key={name} name={name} hiddenFromAT />)}
      {extra.map((name, i) => <TechChip key={name} name={name}
        hidden={!open && !closing} hiddenFromAT={!open}
        className={closing ? "ht-skill-extra-out" : open ? "ht-skill-extra" : undefined}
        style={{ "--reveal-index": open ? i : extra.length - 1 - i }} />)}
      {extra.length > 0 && <li>
        <button type="button" className="ui-tech-overflow ht-skill-more" aria-expanded={open} aria-controls={toolsId}
          aria-label={open ? `Hide extra ${skill.title.toLowerCase()} tools` : `Show ${extra.length} more ${skill.title.toLowerCase()} tools`}
          onClick={toggle}>
          {open ? `−${extra.length}` : `+${extra.length}`}
        </button>
      </li>}
    </ul>
  </div>;
}

export default function SkillStory({ skills, stop, visible, fluid = false }) {
  const content = useRef(null);
  useLayoutEffect(() => {
    const wrapper = content.current;
    if (fluid) {
      wrapper.style.removeProperty("--skill-height");
      return;
    }
    const panel = wrapper.querySelector("[data-active=true]");
    if (!panel) return;
    const resize = () => wrapper.style.setProperty("--skill-height", `${panel.getBoundingClientRect().height}px`);
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [stop, visible, fluid]);

  return <div className="ht-skill-story ui-glass ui-glass--night" data-visible={fluid || visible} data-fluid={fluid}>
    <div className="ht-skill-story-content" ref={content}>
      {skills.map((skill, index) => (
        <SkillCard key={skill.title} skill={skill} index={index} position={Math.sign(index - stop)}
          active={fluid || (stop === index && visible)} fluid={fluid} />
      ))}
    </div>
  </div>;
}
