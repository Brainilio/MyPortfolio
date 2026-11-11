"use client";
import ProjectThumbnail from "../project/project-thumbnail";
import { Icon } from "../tech-chip";
import { techIcon } from "../../lib/tech-icons";

// The homepage Work section's index: the project names huge on the left (the one the scroll is on solid, the others
// faded), its role and tech under them, and its thumbnail loop as a big screen on the right. The scroll picks the
// active project (`active`); everything else is CSS transitions, so nothing re-renders per frame.
const STACK = 3;

function Tech({ tags = [] }) {
  const icons = tags.filter(techIcon), rest = icons.length - STACK;
  return <ul className="wc-tech" aria-label="Built with">
    {icons.slice(0, STACK).map(tag => <li key={tag} title={tag}><Icon src={techIcon(tag)} /><span className="wc-sr">{tag}</span></li>)}
    {rest > 0 && <li className="wc-more" title={icons.slice(STACK).join(", ")}>+{rest}</li>}
  </ul>;
}

export default function WorkIndex({ work, active }) {
  const current = work[active];
  return <div className="wc wc-bigscreen">
    <div className="wc-bigscreen-index">
      <ol className="wc-names">
        {work.map((p, i) => <li key={p.slug} className={i === active ? "is-on" : undefined}><a href={`/project/${p.slug}/`}>{p.name}</a></li>)}
      </ol>
      <div className="wc-active" key={current?.slug}>
        {current?.role && <span className="wc-role">{current.role}</span>}
        <Tech tags={current?.tags} />
      </div>
    </div>
    <div className="wc-previews">
      {work.map((p, i) => <a key={p.slug} href={`/project/${p.slug}/`} className="wc-preview" data-pos={Math.sign(i - active)} aria-label={`${p.name}: view the project`}><ProjectThumbnail project={p} /></a>)}
    </div>
  </div>;
}
