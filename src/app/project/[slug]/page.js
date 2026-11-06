import Link from 'next/link';
import { notFound } from 'next/navigation';
import projects from '../../../lib/projects';
import ProjectMedia from '../project-media';
import Woodland from '../woodland';
import StickySummary from '../sticky-summary';
import '../project.css';

export function generateStaticParams() { return projects.map(project => ({ slug: project.slug })); }
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const project = projects.find(project => project.slug === slug);
  return { title: `${project?.name || 'Project'} — Brainilio`, description: project?.highlight || project?.shortDescription };
}

export default async function Project({ params }) {
  const { slug } = await params;
  const project = projects.find(project => project.slug === slug);
  if (!project) notFound();
  const peers = projects.filter(p => Boolean(p.earlyWork) === Boolean(project.earlyWork));
  const next = peers[(peers.indexOf(project) + 1) % peers.length];
  const media = project.media || [
    { type:'image', src:project.previewImage, alt:`${project.name} overview` },
    ...(project.previewVideo ? [{type:'video',src:project.previewVideo,poster:project.previewImage,alt:`${project.name} preview`,caption:'A closer look. Play the film to explore the interface.'}] : []),
    ...(project.fullImages || []).map((src,i)=>({type:'image',src,alt:`${project.name} screen ${i+1}`,layout:i%3===0?'wide':'half'})),
  ];
  return <main className="case-page">
    <nav className="case-nav" aria-label="Project navigation"><Link href="/">Brainilio<span>.</span></Link><Link href="/projects/">All projects ↗</Link></nav>
    <div className="case-layout">
      <StickySummary>
        <Link className="case-back" href="/projects/">← Back to work</Link>
        {project.earlyWork && <p className="case-era">Early projects &amp; learning</p>}
        <h1>{project.name}</h1>
        <p className="case-highlight">{project.highlight || project.shortDescription}</p>
        <dl className="case-facts">
          {project.dateCreated && <div><dt>When</dt><dd>{project.dateCreated}</dd></div>}
          {project.company && <div><dt>Working with</dt><dd>{project.company}</dd></div>}
          {project.role && <div><dt>My role</dt><dd>{project.role}</dd></div>}
        </dl>
        {project.responsibilities?.length > 0 && <section className="case-responsibilities"><h2>My contribution</h2><ul>{project.responsibilities.map(text=><li key={text}>{text}</li>)}</ul></section>}
        <ul className="case-pills" aria-label="Technologies">{project.tags.map(tag=><li key={tag}>{tag}</li>)}</ul>
        {project.description && <details className="case-description"><summary>About the project</summary><p>{project.description}</p></details>}
        {(project.gitHub || project.livePreview) && <div className="case-links">{project.gitHub && <a href={project.gitHub} target="_blank" rel="noreferrer">View code ↗</a>}{project.livePreview && <a href={project.livePreview} target="_blank" rel="noreferrer">Visit website ↗</a>}</div>}
      </StickySummary>
      <section className="case-gallery" aria-label={`${project.name} gallery`}>
        {media.map((item,i)=><ProjectMedia key={`${item.src}-${i}`} item={item} priority={i===0} />)}
        {[['The process',project.process],['The challenges',project.challenges],['What I’d do differently',project.differently],['The takeaway',project.takeaway]].map(([title,text])=>text&&<section className="case-story" key={title}><h2>{title}</h2><p>{text}</p></section>)}
      </section>
    </div>
    <section className="case-contact" aria-labelledby="case-contact-title">
      <div><p className="case-note">There’s always room for another good idea.</p><h2 id="case-contact-title">Like what you see?<br/>Let’s build something<span>.</span></h2><p>A project, a role, or a spark of an idea. I’d love to hear about it.</p><div className="case-contact-links"><a href="mailto:brainilioir@gmail.com">Say hello ↗</a><Link href="/#contact">Meet me by the coast →</Link></div></div>
      <Woodland />
    </section>
    <footer className="case-end"><Link href="/projects/">← All projects</Link>{next && next!==project && <Link href={`/project/${next.slug}/`}>Next: {next.name} →</Link>}</footer>
  </main>;
}
