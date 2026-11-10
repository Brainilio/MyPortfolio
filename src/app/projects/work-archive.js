'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import ProjectThumbnail from '../project/project-thumbnail';
import TechChip, { Icon } from '../tech-chip';
import { techIcon } from '../../lib/tech-icons';

// Three card styles for the owner to compare; `?cards=1|2|3` picks one (read client-side: the site is a static export).
const STYLES = [['1', 'Glass bar'], ['2', 'Title below'], ['3', 'Blur reveal']];

function Card({ project }) {
  const href = `/project/${project.slug}/`;
  return <article className="wk-card">
    <div className="wk-media"><ProjectThumbnail project={project} /></div>
    <div className="wk-info">
      {/* The title link stretches over the whole card, so the card has one link and one name. */}
      <h3 className="wk-title"><Link href={href}>{project.name}</Link></h3>
      {project.tags.length > 0 && <ul className="ui-chips wk-chips" aria-label="Built with">{project.tags.map(tag => <TechChip key={tag} name={tag} />)}</ul>}
      {project.tags.length > 0 && <ul className="wk-icons" aria-label="Built with">{project.tags.map(tag => <li key={tag} title={tag}>{techIcon(tag) && <Icon src={techIcon(tag)} />}<span className="wk-sr">{tag}</span></li>)}</ul>}
    </div>
  </article>;
}

const Grid = ({ items }) => <div className="wk-grid">{items.map(project => <Card key={project.slug} project={project} />)}</div>;

export default function WorkArchive({ selected, early }) {
  const [style, setStyle] = useState('1');
  useEffect(() => {
    const value = new URLSearchParams(location.search).get('cards');
    if (STYLES.some(([key]) => key === value)) setStyle(value);
  }, []);
  const choose = key => {
    setStyle(key);
    const url = new URL(location.href); url.searchParams.set('cards', key);
    history.replaceState(history.state, '', url);
  };
  return <div className="wk-archive" data-cards={style}>
    <div className="wk-switch" role="group" aria-label="Card style">
      {STYLES.map(([key, label]) => <button key={key} type="button" className="ui-btn ui-btn--secondary" aria-pressed={style === key} onClick={() => choose(key)}>{key}<span className="wk-switch-label"> · {label}</span></button>)}
    </div>
    <Grid items={selected} />
    {early.length > 0 && <details className="wk-early">
      <summary><span>Early projects &amp; learning</span><span className="wk-count">{early.length}</span><Icon src="/icons/tech/tabler--arrow-right.svg" className="wk-chevron" /></summary>
      <Grid items={early} />
    </details>}
  </div>;
}
