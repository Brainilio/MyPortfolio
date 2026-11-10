'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import './thumbnail.css';

export default function ProjectThumbnail({ project, href }) {
  const host = useRef(null), movie = useRef(null);
  const [ready, setReady] = useState(false), [reduced, setReduced] = useState(false);
  useEffect(() => {
    const video = movie.current;
    if (!video || !project.thumbnailVideo) return;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false, disposed = false;
    const sync = () => {
      setReduced(preference.matches);
      if (visible && !document.hidden && !preference.matches) {
        if (video.getAttribute('src') !== project.thumbnailVideo) { setReady(false); video.src = project.thumbnailVideo; video.load(); }
        video.play().catch(() => {});
      } else video.pause();
    };
    const observer = new IntersectionObserver(([entry]) => { if (!disposed) { visible = entry.isIntersecting; sync(); } });
    observer.observe(host.current); preference.addEventListener('change', sync); document.addEventListener('visibilitychange', sync); sync();
    return () => { disposed = true; observer.disconnect(); preference.removeEventListener('change', sync); document.removeEventListener('visibilitychange', sync); video.pause(); };
  }, [project.thumbnailVideo]);
  const media = <>
    <img src={project.previewImage} alt={href ? `${project.name} screen composition` : ''} loading="lazy" width="1280" height="800" />
    {project.thumbnailVideo && <video ref={movie} className={ready && !reduced ? 'is-ready' : ''} muted loop playsInline preload="none" aria-hidden="true" onLoadedData={() => setReady(true)} />}
  </>;
  return <div className="motion-thumb" ref={host}>
    {/* Without href the picture is decorative: the card around it carries the link and the name. */}
    {href ? <Link className="motion-thumb-link" href={href} aria-label={`${project.name}: view project`}>{media}</Link> : <div className="motion-thumb-link">{media}</div>}
  </div>;
}
