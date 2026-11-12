"use client";
import Link from "next/link";
import { useId, useState } from "react";
import ProjectThumbnail from "../project/project-thumbnail";
import { Icon } from "../tech-chip";
import { techIcon } from "../../lib/tech-icons";

// The homepage Work section's index: the project names huge on the left (the one the scroll is on solid, the others
// faded), its role and tech under them, and its thumbnail loop as a big screen on the right. The scroll picks the
// active project (`active`); everything else is CSS transitions, so nothing re-renders per frame.
const STACK = 3;

export function WorkTech({ tags = [], label }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const extra = tags.slice(STACK);

  const renderIcon = (tag, index) => {
    const src = techIcon(tag);
    return <span key={tag} className="wc-tech-icon" title={tag} style={{ "--reveal-index": index }}>
      {src ? <Icon src={src} /> : <span aria-hidden="true">{tag.slice(0, 2)}</span>}
      <span className="wc-sr">{tag}</span>
    </span>;
  };

  return <div className="wc-tech" role="group" aria-label={`Built with, ${label}`}>
    {tags.slice(0, STACK).map(renderIcon)}
    {extra.length > 0 && <>
      <button className="ui-tech-overflow wc-more" type="button" aria-expanded={open} aria-controls={id}
        aria-label={open ? `Hide extra tools for ${label}` : `Show ${extra.length} more tools for ${label}`}
        onClick={() => setOpen(value => !value)}>{open ? `−${extra.length}` : `+${extra.length}`}</button>
      <span className="wc-tech-extra" id={id} hidden={!open}>
        {open && extra.map(renderIcon)}
      </span>
    </>}
  </div>;
}

export default function WorkIndex({ work, active, intro, sheetAnchor }) {
  const current = work[active];
  return <div className="wc wc-bigscreen">
    <div className="wc-bigscreen-index">
      {intro}
      <div className="wc-projects">
        <ol className="wc-names">
          {work.map((p, i) => <li key={p.slug} className={i === active ? "is-on" : undefined}><Link href={`/project/${p.slug}/`}>{p.name}</Link></li>)}
        </ol>
        <div className="wc-active" key={current?.slug}>
          {current?.role && <span className="wc-role">{current.role}</span>}
          {current?.tags?.length > 0 && <WorkTech tags={current.tags} label={current.name} />}
        </div>
      </div>
    </div>
    <div className={`wc-previews${sheetAnchor ? " wc-sheet" : ""}`} ref={sheetAnchor}
      style={sheetAnchor && current ? { "--work-poster": `url(${current.previewImage})` } : undefined}>
      {!sheetAnchor && work.map((p, i) => <div key={p.slug} className="wc-preview" data-pos={Math.sign(i - active)} aria-hidden="true"><ProjectThumbnail project={p} active={i === active} /></div>)}
      {current && <Link className="wc-preview-link" href={`/project/${current.slug}/`} aria-label={`View ${current.name} project`} />}
    </div>
  </div>;
}
