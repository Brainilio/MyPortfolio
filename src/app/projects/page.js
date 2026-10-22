import Link from 'next/link';
import projects from '../../lib/projects';
export const metadata = { title: 'Project archive — Brainilio' };
export default function Projects() { return <main className="archive"><Link href="/">← Back to homepage</Link><h1>Project archive.</h1><div className="project-grid">{projects.filter(p => p.category === 'Development').map(p => <Link className="project-card" href={`/project/${p.slug}/`} key={p.slug}><div className="project-image"><img src={p.previewImage} alt={p.name} width="600" height="400" loading="lazy"/></div><h3>{p.name}<span aria-hidden="true">↗</span></h3><p>{p.shortDescription}</p><span className="project-tags">{p.tags.join(' / ')}</span></Link>)}</div></main>; }
