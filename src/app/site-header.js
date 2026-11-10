'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, Roll } from './tech-chip';

// The top navigation on every page (rendered once in the root layout): the wordmark on the left edge, the links in a
// centred glass pill, "Let's talk" on the right edge. Scrolling down fades it up and away; scrolling up, 3 seconds
// without scrolling, or tabbing into it brings it back.
const LINKS = [['/projects/', 'Work'], ['/#about', 'About', true], ['/journey/', 'Lab', true], ['/contact/', 'Contact', true]];
const IDLE_MS = 3000;

export default function SiteHeader() {
  const path = usePathname();
  const [hidden, setHidden] = useState(false);
  const last = useRef(0), idle = useRef(0);

  useEffect(() => {
    last.current = scrollY; setHidden(false);
    const onScroll = () => {
      const y = scrollY, delta = y - last.current;
      if (Math.abs(delta) > 4) {
        setHidden(delta > 0 && y > 80);
        last.current = y;
      }
      clearTimeout(idle.current);
      idle.current = setTimeout(() => setHidden(false), IDLE_MS);
    };
    addEventListener('scroll', onScroll, { passive: true });
    return () => { removeEventListener('scroll', onScroll); clearTimeout(idle.current); };
  }, [path]);

  return <header className={`ui-header${hidden ? ' is-hidden' : ''}`} onFocus={() => setHidden(false)}>
    <Link className="ui-wordmark" href="/">Brainilio<span>.</span></Link>
    <nav className="ui-glass" aria-label="Main">
      {LINKS.map(([href, label, small]) => <Link key={href} href={href} className={small ? 'ui-hide-sm' : undefined} aria-current={path === href ? 'page' : undefined}>{label}</Link>)}
    </nav>
    <Link className="ui-btn ui-header-cta" href="/contact/"><Roll>Let&apos;s talk</Roll><Icon src="/icons/tech/tabler--arrow-up-right.svg" /></Link>
  </header>;
}
