'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import './thumbnail.css';

export default function ProjectThumbnail({ project, href }) {
  const host = useRef(null), movie = useRef(null);
  const [paused, setPaused] = useState(false), [ready, setReady] = useState(false), [reduced, setReduced] = useState(false);
  useEffect(() => {
    const video = movie.current;
    if (!video || !project.thumbnailVideo) return;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false, disposed = false;
    const sync = () => {
      setReduced(preference.matches);
      if (visible && !document.hidden && !preference.matches && !paused) {
        if (video.getAttribute('src') !== project.thumbnailVideo) { setReady(false); video.src = project.thumbnailVideo; video.load(); }
        video.play().catch(() => {});
      } else video.pause();
    };
    const observer = new IntersectionObserver(([entry]) => { if (!disposed) { visible = entry.isIntersecting; sync(); } });
    observer.observe(host.current); preference.addEventListener('change', sync); document.addEventListener('visibilitychange', sync); sync();
    return () => { disposed = true; observer.disconnect(); preference.removeEventListener('change', sync); document.removeEventListener('visibilitychange', sync); video.pause(); };
  }, [project.thumbnailVideo, paused]);
  return <div className="motion-thumb" ref={host}>
    <Link className="motion-thumb-link" href={href} aria-label={`${project.name}: view project`}>
      <img src={project.previewImage} alt={`${project.name} screen composition`} loading="lazy" width="1280" height="800" />
      {project.thumbnailVideo && <video ref={movie} className={ready && !reduced ? 'is-ready' : ''} muted loop playsInline preload="none" aria-hidden="true" onLoadedData={() => setReady(true)} />}
    </Link>
    {project.thumbnailVideo && ready && !reduced && <button className="motion-thumb-toggle" type="button" aria-label={`${paused ? 'Play' : 'Pause'} ${project.name} preview`} aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? '▶' : 'Ⅱ'}</button>}
  </div>;
}
