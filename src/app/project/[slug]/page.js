import Link from 'next/link';
import { notFound } from 'next/navigation';
import projects from '../../../lib/projects';
export function generateStaticParams() { return projects.map(p => ({ slug: p.slug })); }
export async function generateMetadata({ params }) { const { slug } = await params; const p = projects.find(p => p.slug === slug); return { title: `${p?.name || 'Project'} — Brainilio` }; }
export default async function Project({ params }) {
  const { slug } = await params;
  const project = projects.find(p => p.slug === slug);
  if (!project) notFound();
  return <main className="archive"><Link href="/projects/">← Project archive</Link><h1>{project.name}</h1><p className="project-tags">{project.dateCreated} · {project.tags.join(' / ')}</p><p className="detail-copy">{project.description}</p><div className="detail-links">{project.gitHub && <a className="pill light-pill" href={project.gitHub} target="_blank" rel="noreferrer">View code ↗</a>}{project.livePreview && <a className="pill light-pill" href={project.livePreview} target="_blank" rel="noreferrer">Visit project ↗</a>}</div><img className="detail-hero" src={project.previewImage} alt={`${project.name} overview`}/>{[['The process', project.process], ['The challenges', project.challenges], ['What I’d do differently', project.differently], ['The takeaway', project.takeaway]].map(([title, text]) => text && <section className="detail-section" key={title}><h2>{title}</h2><p>{text}</p></section>)}<div className="detail-gallery">{project.fullImages?.map((image, i) => <img key={image} src={image} alt={`${project.name} screenshot ${i + 1}`} loading="lazy"/>)}</div></main>;
}
