'use client';

import { useEffect, useRef, useState } from 'react';
import './project-loop.css';

export default function ProjectLoop({ src, active = true }) {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!active) return;

    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    const sync = () => {
      if (visible && !document.hidden && !reducedMotion.matches) {
        if (!video.hasAttribute('src')) video.src = src;
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(video.parentElement);
    reducedMotion.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);

    return () => {
      observer.disconnect();
      reducedMotion.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
      video.pause();
    };
  }, [src, active]);

  return <video ref={ref} className="project-loop" data-ready={ready} muted loop playsInline preload="none"
    aria-hidden="true" onPlaying={() => setReady(true)} onError={() => setReady(false)} />;
}
