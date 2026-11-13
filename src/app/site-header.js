'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, Roll } from './tech-chip';

// The top navigation on every page (rendered once in the root layout): the wordmark on the left edge, the links in a
// centred glass pill, "Let's talk" on the right edge. Scrolling down fades it up and away; scrolling up, 3 seconds
// without scrolling, or tabbing into it brings it back.
const LINKS = [['/projects/', 'Work'], ['/#about', 'About'], ['/#skills', 'Skills', true], ['/journey/', 'Lab'], ['/contact/', 'Contact']];
const IDLE_MS = 3000;

export default function SiteHeader() {
  const path = usePathname();
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const last = useRef(0), idle = useRef(0);
  const nav = useRef(null), toggle = useRef(null);

  useEffect(() => {
    last.current = scrollY; setHidden(false); setOpen(false);
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

  useEffect(() => {
    if (!open) return;
    const onPointerDown = event => {
      if (!nav.current?.contains(event.target) && !toggle.current?.contains(event.target)) setOpen(false);
    };
    const onEscape = event => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      toggle.current?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  return <header className={`ui-header${hidden && !open ? ' is-hidden' : ''}`} onFocus={() => setHidden(false)}>
    <Link className="ui-wordmark" href="/" onClick={() => setOpen(false)}>Brainilio<span>.</span></Link>
    <div className="ui-header-actions">
      <Link className="ui-btn ui-header-cta" href="/contact/" onClick={() => setOpen(false)}><Roll>Let&apos;s talk</Roll><Icon src="/icons/tech/tabler--arrow-up-right.svg" /></Link>
      <button ref={toggle} type="button" className="ui-btn ui-btn--secondary ui-menu-toggle" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="main-navigation" onClick={() => setOpen(value => !value)}>
        <Icon src="/icons/tech/tabler--menu-2.svg" />
      </button>
    </div>
    <nav ref={nav} id="main-navigation" className="ui-glass" aria-label="Main" data-open={open}>
      {LINKS.map(([href, label, mobileOnly]) => <Link key={href} href={href} className={mobileOnly ? 'ui-mobile-link' : undefined} onNavigate={event => {
        setOpen(false);
        if (path === '/' && href.startsWith('/#') && !window.dispatchEvent(new CustomEvent('portfolio:navigate', { cancelable: true, detail: href.slice(2) }))) {
          event.preventDefault();
        }
      }} aria-current={path === href ? 'page' : undefined}>{label}</Link>)}
    </nav>
  </header>;
}
