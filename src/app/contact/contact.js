'use client';
import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import './contact.css';
import { getStage } from '../(home)/stage';
import Heading from '../heading';
import SiteFooter from '../site-footer';
import { Icon, Roll } from '../tech-chip';
import ContactForm from './contact-form';
import { AVAILABILITY, EMAIL, LINKS, OFFER, scheduleHref } from '../../lib/contact';
const CoastScene = dynamic(() => import('../(home)/coast-scene'), { ssr: false });

function Intro() {
  return <div className="ct-intro">
    <p className="ui-availability"><i aria-hidden="true" />{AVAILABILITY}</p>
    <Heading id="ct-title">Let&apos;s make it real</Heading>
    <p className="ct-lede">I love working with curious people who care and are confident about what they're building. Whether it's a new idea, a technical challenge, or an opportunity to work together, I'd love to hear about it.</p>
    <div className="ct-actions">
      <a className="ui-btn" href={scheduleHref}><Roll>Book a call</Roll><Icon src="/icons/tech/tabler--calendar-event.svg" /></a>
      <a className="ui-btn ui-btn--secondary" href={`mailto:${EMAIL}`}><Roll>Email me</Roll><Icon src="/icons/tech/tabler--mail.svg" /></a>
    </div>
  </div>;
}
const Offer = () => <ul className="ct-offer" aria-label="What I can help with">
  {OFFER.map(([line, icon]) => <li key={line}><span className="ct-offer-icon"><Icon src={`/icons/tech/${icon}.svg`} /></span>{line}</li>)}
</ul>;
const Links = () => <ul className="ct-links">{LINKS.map(([label, href, icon]) => <li key={label}><a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}><Icon src={`/icons/tech/${icon}.svg`} /></a></li>)}</ul>;
const Form = () => <div className="ct-form-panel"><p className="ct-or">Or tell me here</p><ContactForm /></div>;

export default function Contact() {
  const main = useRef(null), state = useRef({ live: [4], section: 4, progress: [0, 0, 0, 0, 1], tilt: [0, 0, 0, 0, 0] });
  useEffect(() => {
    const world = getStage(); if (world && main.current) world.attach(main.current);
    return () => world?.detach();
  }, []);
  return <main ref={main} className="ct" data-section="contact">
    <div className="ct-sky" aria-hidden="true" />
    <section className="ct-stage" aria-hidden="true"><CoastScene state={state} slot={4} lite /></section>
    <section className="ct-shell ct-card ui-glass ui-glass--night" aria-labelledby="ct-title">
      <div className="ct-col"><Intro /><Offer /><Links /></div>
      <Form />
    </section>
    <SiteFooter />
  </main>;
}
