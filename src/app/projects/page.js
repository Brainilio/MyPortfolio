import Link from 'next/link';
import projects from '../../lib/projects';
import ProjectThumbnail from '../project/project-thumbnail';
export const metadata = { title: 'Project archive — Brainilio' };

function ProjectGrid({ items }) {
  return <div className="project-grid">{items.map(project => (
    <article className="project-card" key={project.slug}>
      <div className="project-image"><ProjectThumbnail project={project} href={`/project/${project.slug}/`} toggle={false} /></div>
      <h3><Link href={`/project/${project.slug}/`}>{project.name}</Link><span aria-hidden="true">↗</span></h3>
      <p>{project.highlight || project.shortDescription}</p>
      {(project.company || project.role || project.dateCreated) && <span className="archive-card-context">{[project.dateCreated, project.company, project.role].filter(Boolean).join(" · ")}</span>}
      <ul className="archive-tech" aria-label="Technologies">{project.tags.slice(0,5).map(tag=><li key={tag}>{tag}</li>)}</ul>
    </article>
  ))}</div>;
}

export default function Projects() {
  const available = projects.filter(project => ['Development', 'Design'].includes(project.category));
  return <main className="archive">
    <Link href="/">← Back to homepage</Link>
    <h1>Project archive.</h1>
    <section className="archive-group" aria-labelledby="selected-projects">
      <h2 id="selected-projects">Selected work</h2>
      <ProjectGrid items={available.filter(project => !project.earlyWork)} />
    </section>
    <section className="archive-group" aria-labelledby="early-projects">
      <h2 id="early-projects">Early projects &amp; learning</h2>
      <p className="archive-context">A look back at the experiments, coursework and early builds that helped me learn. These reflect an earlier stage of my practice.</p>
      <ProjectGrid items={available.filter(project => project.earlyWork)} />
    </section>
  </main>;
}
