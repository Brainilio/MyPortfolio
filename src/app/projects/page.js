import projects from '../../lib/projects';
import SiteFooter from '../site-footer';
import WorkArchive from './work-archive';
import './projects.css';

export const metadata = { title: 'Work — Brainilio' };

export default function Projects() {
  // Cards need only the name, the tech and the thumbnail.
  const available = projects.filter(project => ['Development', 'Design'].includes(project.category))
    .map(({ slug, name, tags, previewImage, thumbnailVideo, earlyWork }) => ({ slug, name, tags, previewImage, thumbnailVideo: thumbnailVideo || null, earlyWork: Boolean(earlyWork) }));
  return <div className="wk-page">
    <main className="wk-main">
      <h1 className="wk-heading">Work</h1>
      <WorkArchive selected={available.filter(project => !project.earlyWork)} early={available.filter(project => project.earlyWork)} />
    </main>
    <SiteFooter />
  </div>;
}
