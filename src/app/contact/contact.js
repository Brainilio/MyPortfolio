'use client';
import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import '../(home)/home.css';
import './contact.css';
import { getStage } from '../(home)/stage';
import SiteFooter from '../site-footer';
import { Icon, Roll } from '../tech-chip';
import ContactForm from './contact-form';
import { EMAIL, LINKS, OFFER, scheduleHref } from '../../lib/contact';
const CoastScene = dynamic(() => import('../(home)/coast-scene'), { ssr: false });
const OFFER_ICONS = ['tabler--device-mobile', 'tabler--browser', 'tabler--cloud', 'tabler--components'];

// The contact page: the Big Sur coast fills the screen behind a frosted card.
export default function Contact() {
  const main = useRef(null), state = useRef({ live: [4], section: 4, progress: [0, 0, 0, 0, 1], tilt: [0, 0, 0, 0, 0] });
  useEffect(() => {
    const world = getStage(); if (world && main.current) world.attach(main.current);
    return () => world?.detach();
  }, []);
  return <main ref={main} className="ht ct" data-section="contact">
    <div className="ct-sky" aria-hidden="true" />
    <section className="ct-stage" aria-hidden="true"><CoastScene state={state} slot={4} lite /></section>
    <section className="ct-card ui-glass" aria-labelledby="ct-title">
      <p className="ht-badge"><i aria-hidden="true" />Available for freelance projects</p>
      <h1 id="ct-title">Let&apos;s build something<span>.</span></h1>
      <p className="ct-lede">Tell me about the product, the role or the idea.</p>
      <ul className="ct-offer" aria-label="What I take on">
        {OFFER.map((line, i) => <li key={line}><Icon src={`/icons/tech/${OFFER_ICONS[i]}.svg`} />{line}</li>)}
      </ul>
      <div className="ct-actions">
        <a className="ui-btn" href={scheduleHref}><Roll>Book a call</Roll><Icon src="/icons/tech/tabler--calendar-event.svg" /></a>
        <a className="ui-btn ui-btn--secondary" href={`mailto:${EMAIL}`}><Roll>Email me</Roll><Icon src="/icons/tech/tabler--mail.svg" /></a>
      </div>
      <p className="ct-or">or tell me what you have in mind</p>
      <ContactForm />
      <ul className="ct-links">{LINKS.map(([label, href]) => <li key={label}><a href={href} target="_blank" rel="noopener noreferrer">{label}<Icon src="/icons/tech/tabler--arrow-up-right.svg" /></a></li>)}</ul>
    </section>
    <SiteFooter />
  </main>;
}
