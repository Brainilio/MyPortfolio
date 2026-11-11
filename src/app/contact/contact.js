'use client';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import '../(home)/home.css';
import './contact.css';
import { getStage } from '../(home)/stage';
import SiteFooter from '../site-footer';
import { Icon, Roll } from '../tech-chip';
import ContactForm from './contact-form';
import { EMAIL, LINKS, OFFER, scheduleHref } from '../../lib/contact';
const CoastScene = dynamic(() => import('../(home)/coast-scene'), { ssr: false });

// Three layouts for the owner to compare (?layout=1|2|3, with a switcher bottom-left):
// 1 Split: one card, the intro on the left and the form on the right.
// 2 Open: the intro straight on the scene (over a dark wash), the form in its own card on the right.
// 3 Docked: one wide card along the bottom (intro, what I take on, form), the coast open above it.
const LAYOUTS = [['1', 'Split'], ['2', 'Open'], ['3', 'Docked']];

function Intro() {
  return <div className="ct-intro">
    <p className="ht-badge"><i aria-hidden="true" />Available for freelance projects</p>
    <h1 id="ct-title">Let&apos;s make it real<span>.</span></h1>
    <p className="ct-lede">Got a site, an app idea, a feature that needs building, or a role you think I&apos;d fit? Tell me a bit about it and I&apos;ll get back to you.</p>
    <div className="ct-actions">
      <a className="ui-btn" href={scheduleHref}><Roll>Book a call</Roll><Icon src="/icons/tech/tabler--calendar-event.svg" /></a>
      <a className="ui-btn ui-btn--secondary" href={`mailto:${EMAIL}`}><Roll>Email me</Roll><Icon src="/icons/tech/tabler--mail.svg" /></a>
    </div>
  </div>;
}
const Offer = () => <ul className="ct-offer" aria-label="What I take on">
  {OFFER.map(([line, icon]) => <li key={line}><span className="ct-offer-icon"><Icon src={`/icons/tech/${icon}.svg`} /></span>{line}</li>)}
</ul>;
const Links = () => <ul className="ct-links">{LINKS.map(([label, href, icon]) => <li key={label}><a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}><Icon src={`/icons/tech/${icon}.svg`} /></a></li>)}</ul>;
const Form = () => <div className="ct-form-panel"><p className="ct-or">Or tell me here</p><ContactForm /></div>;

export default function Contact() {
  const main = useRef(null), state = useRef({ live: [4], section: 4, progress: [0, 0, 0, 0, 1], tilt: [0, 0, 0, 0, 0] });
  const [layout, setLayout] = useState('1');
  useEffect(() => {
    const world = getStage(); if (world && main.current) world.attach(main.current);
    const value = new URLSearchParams(location.search).get('layout');
    if (LAYOUTS.some(([key]) => key === value)) setLayout(value);
    return () => world?.detach();
  }, []);
  const choose = key => { setLayout(key); const url = new URL(location.href); url.searchParams.set('layout', key); history.replaceState(history.state, '', url); };

  return <main ref={main} className="ht ct" data-section="contact" data-layout={layout}>
    <div className="ct-sky" aria-hidden="true" />
    <section className="ct-stage" aria-hidden="true"><CoastScene state={state} slot={4} lite /></section>
    {layout === '1' && <section className="ct-shell ct-card ui-glass" aria-labelledby="ct-title">
      <div className="ct-col"><Intro /><Offer /><Links /></div>
      <Form />
    </section>}
    {layout === '2' && <section className="ct-shell" aria-labelledby="ct-title">
      <div className="ct-col ct-open"><Intro /><Offer /><Links /></div>
      <div className="ct-card ui-glass"><Form /></div>
    </section>}
    {layout === '3' && <section className="ct-shell ct-card ui-glass" aria-labelledby="ct-title">
      <div className="ct-col"><Intro /><Links /></div>
      <div className="ct-col"><p className="ct-offer-title">What I take on</p><Offer /></div>
      <Form />
    </section>}
    <div className="ct-switch ui-glass" role="group" aria-label="Contact layout">
      {LAYOUTS.map(([key, label]) => <button key={key} type="button" aria-pressed={layout === key} onClick={() => choose(key)}>{key} · {label}</button>)}
    </div>
    <SiteFooter />
  </main>;
}
