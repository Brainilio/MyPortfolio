import ProjectLoop from './project-loop';
import './thumbnail.css';

export default function ProjectThumbnail({ project, active = true }) {
  return <div className="motion-thumb">
    <img src={project.previewImage} alt="" loading="lazy" width="1280" height="800" />
    {project.thumbnailVideo && <ProjectLoop key={project.thumbnailVideo} src={project.thumbnailVideo} active={active} />}
  </div>;
}
