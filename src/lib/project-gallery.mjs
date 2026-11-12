export function projectGallery(project) {
  const images = project.fullImages ?? [];
  const overview = { src: project.previewImage, alt: `${project.name} overview` };
  if (project.earlyWork) {
    return [...new Set([project.previewImage, ...images].filter(Boolean))].map((src, i) => ({
      src, alt: `${project.name}, screen ${i + 1}`, layout: 'natural',
    }));
  }
  return project.media
    ? project.media.map(({ type, src, poster, alt, layout, presentation, tone }) => ({
      src: type === 'video' ? poster || project.previewImage : src,
      videoSrc: type === 'video' ? src : undefined, alt, layout, presentation, tone,
    }))
    : [overview, ...images.map((src, i) => ({ src, alt: `${project.name}, screen ${i + 1}`, layout: i % 3 === 0 ? 'wide' : 'half' }))];
}
