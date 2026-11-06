'use client';
import { useEffect, useRef } from 'react';

// Tall summaries scroll normally until their bottom is reachable, then remain beside the gallery.
export default function StickySummary({ children }) {
  const host = useRef(null);
  useEffect(() => {
    const element = host.current;
    const measure = () => element.style.setProperty('--summary-top', `${Math.min(24, window.innerHeight - element.offsetHeight - 24)}px`);
    const observer = new ResizeObserver(measure); observer.observe(element);
    window.addEventListener('resize', measure); measure();
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, []);
  return <aside className="case-summary" ref={host}>{children}</aside>;
}
