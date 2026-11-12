'use client';
import Link from 'next/link';
import ProjectThumbnail from '../project/project-thumbnail';
import TechChip, { Icon } from '../tech-chip';
import { techIcon } from '../../lib/tech-icons';
import './projects.css';

const STACK = 2; // tech icons shown before the +N

// A card: the thumbnail, then the name with what I did under it, and a small stack of tech icons beside it.
// Screen readers get the full tech list (visually hidden); the stack is decorative.
export function ProjectCard({ project, tools }) {
  const href = `/project/${project.slug}/`, tags = project.tags ?? [], iconTags = tools ? [] : tags.filter(techIcon);
  return <article className="wk-card">
    <div className="wk-media"><ProjectThumbnail project={project} /></div>
    <div className="wk-info">
      {/* The title link stretches over the whole card, so the card has one link and one name. */}
      <div className="wk-head">
        <h3 className="wk-title"><Link href={href}>{project.name}</Link></h3>
        {project.role && <p className="wk-role">{project.role}</p>}
      </div>
      {tools}
      {!tools && tags.length > 0 && <ul className="wk-sr" aria-label="Built with">{tags.map(tag => <TechChip key={tag} name={tag} />)}</ul>}
      {iconTags.length > 0 && <ul className="wk-stack" aria-hidden="true">{iconTags.slice(0, STACK).map(tag => <li key={tag} title={tag}><Icon src={techIcon(tag)} /></li>)}
        {iconTags.length > STACK && <li className="ui-tech-overflow">+{iconTags.length - STACK}</li>}</ul>}
    </div>
  </article>;
}

const Grid = ({ items }) => <div className="wk-grid">{items.map(project => <ProjectCard key={project.slug} project={project} />)}</div>;

export default function WorkArchive({ selected, early }) {
  return <div className="wk-archive">
    <Grid items={selected} />
    {early.length > 0 && <details className="wk-early">
      <summary><span>Early projects &amp; learning</span><span className="wk-count">{early.length}</span><Icon src="/icons/tech/tabler--arrow-right.svg" className="wk-chevron" /></summary>
      <Grid items={early} />
    </details>}
  </div>;
}
