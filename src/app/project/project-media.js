'use client';

import { useEffect, useRef, useState } from 'react';

// Each block gets a scroll motion (rise, zoom, parallax, tilt or a slide); `--p` runs from 1 (below the fold) through 0
// (centred) to -1 (above), updated only while the block is on screen. Reduced motion turns all of it off in CSS.
// No captions: the media speaks for itself (alt text still describes each one).
// Videos autoplay (muted, looping) while on screen and pause when they leave or the tab hides; reduced motion keeps them still.
export default function ProjectMedia({ item, priority = false, motion = 'rise' }) {
  const figure = useRef(null), video = useRef(null);
  // Tall screenshots read as phone screens, unless the item says otherwise (cards, long page designs).
  const phoneLike = !item.flat && item.presentation !== "longpage";
  const [portrait, setPortrait] = useState(phoneLike && item.layout === "portrait");
  const [shown, setShown] = useState(priority);
  const kind = item.motion || (item.type === 'video' && (motion === 'zoom' || motion === 'parallax') ? 'rise' : motion);

  useEffect(() => {
    const element = figure.current;
    if (!element) return;
    let frame = 0, visible = false;
    const update = () => {
      frame = 0;
      const box = element.getBoundingClientRect(), centre = box.top + box.height / 2, half = innerHeight / 2 + box.height / 2;
      element.style.setProperty('--p', Math.max(-1, Math.min(1, (centre - innerHeight / 2) / half)).toFixed(3));
    };
    const onScroll = () => { if (visible && !frame) frame = requestAnimationFrame(update); };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) { setShown(true); update(); if (video.current && !matchMedia('(prefers-reduced-motion: reduce)').matches) video.current.play().catch(() => {}); }
      else video.current?.pause();
    }, { rootMargin: '0px 0px -8% 0px' });
    observer.observe(element);
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    const pauseHidden = () => { if (document.hidden) video.current?.pause(); };
    document.addEventListener('visibilitychange', pauseHidden);
    return () => {
      observer.disconnect(); removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll);
      document.removeEventListener('visibilitychange', pauseHidden); cancelAnimationFrame(frame); video.current?.pause();
    };
  }, []);

  return <figure ref={figure} data-motion={kind} data-shown={shown ? '' : undefined}
    className={`case-media case-media--${item.layout || 'wide'} case-media--${item.presentation || 'plain'}${portrait ? " case-media--compact" : ""}`}
    style={{ '--media-tone': item.tone || '#e9e5ee' }}>
    <div className="case-media-surface">
      <div className="case-media-frame">
        {item.type === 'video'
          ? <video ref={video} src={item.src} poster={item.poster} muted loop playsInline preload="metadata" aria-label={item.alt} />
          : <img onLoad={event => setPortrait(phoneLike && event.currentTarget.naturalHeight > event.currentTarget.naturalWidth * 1.2)} src={item.src} alt={item.alt} loading={priority ? 'eager' : 'lazy'} decoding="async" />}
      </div>
    </div>
  </figure>;
}
