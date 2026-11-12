import projects from '../../lib/projects';
import Heading from '../heading';
import SiteFooter from '../site-footer';
import WorkArchive from './work-archive';

export const metadata = { title: 'Work' };

export default function Projects() {
  // Cards need only the name, the tech and the thumbnail.
  const available = projects.filter(project => ['Development', 'Design'].includes(project.category))
    .map(({ slug, name, role, tags, previewImage, thumbnailVideo, earlyWork }) => ({ slug, name, role: role || null, tags, previewImage, thumbnailVideo, earlyWork: Boolean(earlyWork) }));
  return <div className="wk-page">
    <main className="wk-main">
      <Heading size="display" className="wk-heading">Work</Heading>
      <WorkArchive selected={available.filter(project => !project.earlyWork)} early={available.filter(project => project.earlyWork)} />
    </main>
    <SiteFooter />
  </div>;
}
