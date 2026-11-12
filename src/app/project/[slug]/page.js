import Link from 'next/link';
import { notFound } from 'next/navigation';
import projects from '../../../lib/projects';
import ProjectMedia from '../project-media';
import { projectGallery } from '../../../lib/project-gallery.mjs';
import imageSizes from '../../../lib/project-image-sizes.json';
import StickySummary from '../sticky-summary';
import Heading from '../../heading';
import SiteFooter from '../../site-footer';
import TechChip, { Icon, Roll } from '../../tech-chip';
import '../project.css';

// `projects` already leaves out hidden projects, so they get no page.
export function generateStaticParams() { return projects.map(project => ({ slug: project.slug })); }
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const project = projects.find(project => project.slug === slug);
  return { title: project?.name || 'Project', description: project?.highlight || project?.shortDescription || undefined };
}

export default async function Project({ params }) {
  const { slug } = await params;
  const project = projects.find(project => project.slug === slug);
  if (!project) notFound();
  const early = Boolean(project.earlyWork);
  const peers = projects.filter(p => Boolean(p.earlyWork) === early);
  const next = peers[(peers.indexOf(project) + 1) % peers.length];
  const media = projectGallery(project);
  const intro = !early && (project.highlight || project.shortDescription);
  return <div className="case-page">
    <main className="case-layout">
      <StickySummary>
        <Link className="case-back" href="/projects/"><Icon src="/icons/tech/tabler--arrow-left.svg" />All work</Link>
        {early && <p className="case-era">Early projects &amp; learning</p>}
        <Heading size="detail">{project.name}</Heading>
        {intro && <p className="case-highlight">{intro}</p>}
        {!early && <dl className="case-facts">
          {project.dateCreated && <div><dt>Year</dt><dd>{project.dateCreated}</dd></div>}
          {project.company && <div><dt>{project.companyLabel || 'Company'}</dt><dd>{project.company}</dd></div>}
          {project.role && <div><dt>Role</dt><dd>{project.role}</dd></div>}
        </dl>}
        {!early && project.responsibilities?.length > 0 && <section className="case-responsibilities"><h2>What I did</h2><ul>{project.responsibilities.map(text => <li key={text}>{text}</li>)}</ul></section>}
        {project.tags.length > 0 && <ul className="ui-chips case-chips" aria-label="Built with">{project.tags.map(tag => <TechChip key={tag} name={tag} />)}</ul>}
        {!early && project.description && <section className="case-description"><h2>About</h2><p>{project.description}</p></section>}
        {!early && project.quote && <figure className="case-quote"><blockquote><p>{project.quote.text}</p></blockquote><figcaption>{project.quote.by}</figcaption></figure>}
      </StickySummary>
      <section className="case-gallery" aria-label={`${project.name} gallery`}>
        {media.map((item, i) => <ProjectMedia key={`${item.src}-${i}`} item={item} size={imageSizes[item.src]} priority={i === 0} />)}
      </section>
    </main>
    <section className="case-close" aria-label="What next">
      <div className="ui-glass case-talk">
        <Heading as="h2" mark="?">Have something in mind</Heading>
        <p>A project, a role or an idea: I&apos;d like to hear about it.</p>
        <div className="case-talk-actions">
          <Link className="ui-btn" href="/contact/"><Roll>Let&apos;s talk</Roll><Icon src="/icons/tech/tabler--arrow-up-right.svg" /></Link>
          <a className="ui-btn ui-btn--secondary" href="mailto:brainilioir@gmail.com"><Icon src="/icons/tech/tabler--mail.svg" /><Roll>Email me</Roll></a>
        </div>
      </div>
      {next && next !== project && <Link className="case-next" href={`/project/${next.slug}/`}>
        <img src={next.previewImage} alt="" loading="lazy" className={next.earlyWork ? 'is-whole' : undefined} />
        <span className="case-next-text"><span>Next project</span><strong>{next.name}</strong></span>
        <Icon src="/icons/tech/tabler--arrow-right.svg" className="case-next-arrow" />
      </Link>}
    </section>
    <SiteFooter />
  </div>;
}
