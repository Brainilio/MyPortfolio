'use client';

import { useEffect, useRef } from 'react';
import ProjectLoop from './project-loop';

export default function ProjectMedia({ item, size: [width, height], priority = false }) {
  const figure = useRef(null);
  useEffect(() => {
    const element = figure.current;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    if (priority || reducedMotion.matches || element.getBoundingClientRect().top < window.innerHeight) return;

    element.dataset.reveal = 'pending';
    const show = () => {
      element.dataset.reveal = 'shown';
      observer.disconnect();
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) show();
    }, { rootMargin: '0px 0px -8% 0px' });
    const onPreferenceChange = () => { if (reducedMotion.matches) show(); };
    observer.observe(element);
    reducedMotion.addEventListener('change', onPreferenceChange);
    return () => {
      observer.disconnect();
      reducedMotion.removeEventListener('change', onPreferenceChange);
      delete element.dataset.reveal;
    };
  }, [priority]);

  return <figure ref={figure}
    className={`case-media case-media--${item.layout || 'wide'} case-media--${item.presentation || 'plain'}`}
    style={{ '--media-tone': item.tone || '#e9e5ee' }}>
    <div className="case-media-surface">
      <div className="case-media-frame">
        <div className="case-media-content">
          <img src={item.src} alt={item.alt} width={width} height={height} loading={priority ? 'eager' : 'lazy'} decoding="async" />
          {item.videoSrc && <ProjectLoop key={item.videoSrc} src={item.videoSrc} />}
        </div>
      </div>
    </div>
  </figure>;
}
