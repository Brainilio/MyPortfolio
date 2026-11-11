'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import ProjectThumbnail from '../project/project-thumbnail';
import TechChip, { Icon } from '../tech-chip';
import { techIcon } from '../../lib/tech-icons';

// Three card styles for the owner to compare; `?cards=1|2|3` picks one (read client-side: the site is a static export).
const STYLES = [['1', 'Glass bar'], ['2', 'Title below'], ['3', 'Blur reveal']];
// Ways to show the tech on style 2 (`?tech=`): icons over the corner on hover, a line of names, a row of icons,
// an overlapping icon stack beside the title, or a ticker of chips running along the thumbnail on hover.
const TECH = [['corner', 'Corner icons'], ['line', 'Name line'], ['row', 'Icon row'], ['stack', 'Icon stack'], ['ticker', 'Ticker']];
const STACK = 4;

// Every card carries each tech display; CSS shows the one picked. Screen readers get the chip list once (the visual
// variants are aria-hidden).
function Card({ project }) {
  const href = `/project/${project.slug}/`, tags = project.tags, iconTags = tags.filter(techIcon);
  return <article className="wk-card">
    <div className="wk-media"><ProjectThumbnail project={project} />
      {tags.length > 0 && <div className="wk-ticker" aria-hidden="true"><div>{[0, 1].map(copy =>
        <ul key={copy} className="ui-chips">{tags.map(tag => <TechChip key={tag} name={tag} />)}</ul>)}</div></div>}
    </div>
    <div className="wk-info">
      {/* The title link stretches over the whole card, so the card has one link and one name. */}
      <h3 className="wk-title"><Link href={href}>{project.name}</Link></h3>
      {tags.length > 0 && <ul className="ui-chips wk-chips" aria-label="Built with">{tags.map(tag => <TechChip key={tag} name={tag} />)}</ul>}
      {tags.length > 0 && <ul className="wk-icons" aria-hidden="true">{iconTags.map(tag => <li key={tag} title={tag}><Icon src={techIcon(tag)} /></li>)}</ul>}
      {tags.length > 0 && <p className="wk-line" aria-hidden="true">{tags.join(' · ')}</p>}
      {iconTags.length > 0 && <ul className="wk-stack" aria-hidden="true">{iconTags.slice(0, STACK).map(tag => <li key={tag} title={tag}><Icon src={techIcon(tag)} /></li>)}
        {iconTags.length > STACK && <li className="wk-stack-more">+{iconTags.length - STACK}</li>}</ul>}
    </div>
  </article>;
}

const Grid = ({ items }) => <div className="wk-grid">{items.map(project => <Card key={project.slug} project={project} />)}</div>;

export default function WorkArchive({ selected, early }) {
  const [style, setStyle] = useState('1'), [tech, setTech] = useState('corner');
  useEffect(() => {
    const params = new URLSearchParams(location.search), cards = params.get('cards'), how = params.get('tech');
    if (STYLES.some(([key]) => key === cards)) setStyle(cards);
    if (TECH.some(([key]) => key === how)) setTech(how);
  }, []);
  const remember = (param, key) => { const url = new URL(location.href); url.searchParams.set(param, key); history.replaceState(history.state, '', url); };
  const choose = key => { setStyle(key); remember('cards', key); };
  const chooseTech = key => { setTech(key); remember('tech', key); };
  return <div className="wk-archive" data-cards={style} data-tech={tech}>
    <div className="wk-switch" role="group" aria-label="Card style">
      {STYLES.map(([key, label]) => <button key={key} type="button" className="ui-btn ui-btn--secondary" aria-pressed={style === key} onClick={() => choose(key)}>{key}<span className="wk-switch-label"> · {label}</span></button>)}
    </div>
    {style === '2' && <div className="wk-switch wk-switch--tech" role="group" aria-label="How the tech is shown">
      {TECH.map(([key, label]) => <button key={key} type="button" className="ui-btn ui-btn--secondary" aria-pressed={tech === key} onClick={() => chooseTech(key)}>{label}</button>)}
    </div>}
    <Grid items={selected} />
    {early.length > 0 && <details className="wk-early">
      <summary><span>Early projects &amp; learning</span><span className="wk-count">{early.length}</span><Icon src="/icons/tech/tabler--arrow-right.svg" className="wk-chevron" /></summary>
      <Grid items={early} />
    </details>}
  </div>;
}
