"use client";
import ProjectThumbnail from "../project/project-thumbnail";
import { Icon } from "../tech-chip";
import { techIcon } from "../../lib/tech-icons";

// Big-card layouts for the homepage Work section (5–8 in work-showcase.js). Each card is the project's thumbnail loop,
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
  // 5 Big card: one large card at a time, crossfading and rising as the scroll moves on.
  if (layout === "5") return <ol className="wc wc-big">
    {work.map((p, i) => <li key={p.slug} data-pos={Math.sign(i - active)}><Card p={p} index={i} /></li>)}
  </ol>;
  // 6 Deck: the cards stacked behind each other; the front one flies up and away to reveal the next.
  if (layout === "6") return <ol className="wc wc-deck">
    {work.map((p, i) => <li key={p.slug} data-pos={Math.sign(i - active)} style={{ "--depth": Math.max(0, i - active), zIndex: work.length - i }}><Card p={p} index={i} info="inside" /></li>)}
  </ol>;
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
  // 8 Cover flow: the three side by side in 3D, the active one square on in front, the others turned away.
  if (layout === "8") return <ol className="wc wc-flow">
    {work.map((p, i) => <li key={p.slug} data-pos={i - active}><Card p={p} index={i} /></li>)}
  </ol>;
  return null;
}
