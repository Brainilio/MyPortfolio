'use client';

import { useEffect, useRef, useState } from 'react';

// Native controls keep playback optional; leaving the viewport always stops it.
export default function ProjectMedia({ item, priority = false }) {
  const video = useRef(null);
  const [portrait, setPortrait] = useState(item.layout === "portrait");
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) element.pause(); });
    observer.observe(element);
    const pauseHidden = () => { if (document.hidden) element.pause(); };
    document.addEventListener('visibilitychange', pauseHidden);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', pauseHidden); element.pause(); };
  }, []);
  return <figure className={`case-media case-media--${item.layout || 'wide'} case-media--${item.presentation || 'plain'}${portrait ? " case-media--compact" : ""}`} style={{ '--media-tone': item.tone || '#e9e5ee' }}>
    <div className="case-media-surface">
      <div className="case-media-frame">
        {item.type === 'video'
          ? <video ref={video} src={item.src} poster={item.poster} controls muted loop playsInline preload="none" aria-label={item.alt} />
          : <img onLoad={event => setPortrait(event.currentTarget.naturalHeight > event.currentTarget.naturalWidth * 1.2)} src={item.src} alt={item.alt} loading={priority ? 'eager' : 'lazy'} decoding="async" />}
      </div>
    </div>
    {item.caption && <figcaption>{item.caption}</figcaption>}
  </figure>;
}
