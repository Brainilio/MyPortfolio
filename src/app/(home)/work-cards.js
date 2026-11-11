"use client";
import ProjectThumbnail from "../project/project-thumbnail";
import { Icon } from "../tech-chip";
import { techIcon } from "../../lib/tech-icons";

// HTML layers for the homepage Work section layouts 7 and 9–16 (see work-showcase.js). Each card is the project's thumbnail loop,
// with just the name (smaller), what I did, and the tech as icons. The scroll picks the active project (`active`);
// everything else is CSS transitions on data attributes, so nothing re-renders per frame.
const STACK = 3;

export function Tech({ tags = [] }) {
  const icons = tags.filter(techIcon), rest = icons.length - STACK;
  return <ul className="wc-tech" aria-label="Built with">
    {icons.slice(0, STACK).map(tag => <li key={tag} title={tag}><Icon src={techIcon(tag)} /><span className="wc-sr">{tag}</span></li>)}
    {rest > 0 && <li className="wc-more" title={icons.slice(STACK).join(", ")}>+{rest}</li>}
  </ul>;
}

const Info = ({ p, index }) => <div className="wc-info">
  <div>
    {index != null && <span className="wc-num">{String(index + 1).padStart(2, "0")}</span>}
    <strong className="wc-name">{p.name}</strong>
    {p.role && <span className="wc-role">{p.role}</span>}
  </div>
  <Tech tags={p.tags} />
</div>;

function Card({ p, index, info = "below" }) {
  const href = `/project/${p.slug}/`;
  return <article className="wc-card">
    <a className="wc-media" href={href} aria-label={`${p.name}: view the project`}><ProjectThumbnail project={p} /></a>
    {info === "inside" && <div className="wc-glass"><Info p={p} index={index} /></div>}
    {info === "below" && <Info p={p} index={index} />}
  </article>;
}

export default function WorkCards({ layout, work, active }) {
  // 7 Index: the names as a big numbered list on the left (the active one lit), its card large on the right.
  if (layout === "7") return <div className="wc wc-index">
    <ol className="wc-list">
      {work.map((p, i) => <li key={p.slug} className={i === active ? "is-on" : undefined}>
        <a href={`/project/${p.slug}/`}><span className="wc-num">{String(i + 1).padStart(2, "0")}</span>{p.name}</a>
      </li>)}
    </ol>
    <ol className="wc-stage">
      {work.map((p, i) => <li key={p.slug} data-pos={Math.sign(i - active)}><Card p={p} info="inside" /></li>)}
    </ol>
  </div>;
  // 9 Index + sheets: the numbered list on the left with the active project's role and tech; its screenshots hang
  // on the right as sheets (drawn in the section's canvas, see LAYOUTS[9] in work-showcase.js).
  if (layout === "9" || layout === "13") return <div className={`wc wc-index wc-index--sheets${layout === "13" ? " wc-index--right" : ""}`}>
    <div>
      <ol className="wc-list">
        {work.map((p, i) => <li key={p.slug} className={i === active ? "is-on" : undefined}>
          <a href={`/project/${p.slug}/`}><span className="wc-num">{String(i + 1).padStart(2, "0")}</span>{p.name}</a>
        </li>)}
      </ol>
      <div className="wc-active" key={work[active]?.slug}>
        {work[active]?.role && <span className="wc-role">{work[active].role}</span>}
        <Tech tags={work[active]?.tags} />
      </div>
    </div>
  </div>;
  // 10 Big index: the names huge, one per line (the active one solid, the rest outlined); a small card with its
  // thumbnail loop slides along beside the active name.
  if (layout === "10" || layout === "14") return <div className={`wc wc-mega${layout === "14" ? " wc-mega--sheets" : ""}`} style={{ "--i": active }}>
    <ol className="wc-mega-list">
      {work.map((p, i) => <li key={p.slug} className={i === active ? "is-on" : undefined}>
        <a href={`/project/${p.slug}/`}>{p.name}</a>
      </li>)}
    </ol>
    {layout === "14" && <div className="wc-active wc-mega-active" key={work[active]?.slug}>
      {work[active]?.role && <span className="wc-role">{work[active].role}</span>}
      <Tech tags={work[active]?.tags} />
    </div>}
    {layout === "10" && <div className="wc-mega-card">
      {work.map((p, i) => <div key={p.slug} className="wc-mega-slide" data-pos={Math.sign(i - active)}>
        <ProjectThumbnail project={p} />
        <div className="wc-mega-meta">{p.role && <span className="wc-role">{p.role}</span>}<Tech tags={p.tags} /></div>
      </div>)}
    </div>}
  </div>;
  // 11 Big sheet: the sheets do the showing (LAYOUTS[11]); the name sits small at the bottom left with what I did and the tech.
  if (["11", "12", "15", "16"].includes(layout)) return <div className="wc wc-caption">
    {work.map((p, i) => <a key={p.slug} href={`/project/${p.slug}/`} className="wc-caption-item" data-pos={Math.sign(i - active)}>
      <span className="wc-num">{String(i + 1).padStart(2, "0")} / {String(work.length).padStart(2, "0")}</span>
      <strong className="wc-name">{p.name}</strong>
      {p.role && <span className="wc-role">{p.role}</span>}
      <Tech tags={p.tags} />
    </a>)}
  </div>;
  return null;
}
