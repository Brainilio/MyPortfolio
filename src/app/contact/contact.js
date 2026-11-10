'use client';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import '../(home)/home.css';
import './contact.css';
import { getStage } from '../(home)/stage';
import SiteHeader from '../site-header';
import SiteFooter from '../site-footer';
import { Icon } from '../tech-chip';
import { EMAIL, LINKS, OFFER, scheduleHref } from '../../lib/contact';
const CoastScene = dynamic(() => import('../(home)/coast-scene'), { ssr: false });
const OFFER_ICONS = ['tabler--device-mobile', 'tabler--browser', 'tabler--cloud', 'tabler--components'];

// The form posts to Formspree with fetch and thanks you in place. Replace REPLACE_WITH_ID with the form's ID from
// formspree.io; until then it asks you to email instead.
const FORMSPREE = 'https://formspree.io/f/REPLACE_WITH_ID';
function ContactForm() {
  const [status, setStatus] = useState('idle');
  const submit = async event => {
    event.preventDefault();
    if (FORMSPREE.endsWith('REPLACE_WITH_ID')) { setStatus('error'); return; }
    setStatus('sending');
    try {
      const response = await fetch(FORMSPREE, { method: 'POST', body: new FormData(event.currentTarget), headers: { Accept: 'application/json' } });
      setStatus(response.ok ? 'sent' : 'error');
    } catch { setStatus('error'); }
  };
  if (status === 'sent') return <p className="ct-sent" role="status">Got it. I&apos;ll be in touch.</p>;
  return <form className="ct-form" onSubmit={submit}>
    <div className="ct-row">
      <label><span>Name</span><input type="text" name="name" autoComplete="name" required /></label>
      <label><span>Email</span><input type="email" name="email" autoComplete="email" required /></label>
    </div>
    <label><span>What are you building?</span><textarea name="message" rows={4} required /></label>
    <button className="ui-btn" type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : 'Send message'}<Icon src="/icons/tech/tabler--arrow-right.svg" /></button>
    {status === 'error' && <p className="ct-error" role="alert">That didn&apos;t go through. Email me at {EMAIL} instead.</p>}
  </form>;
}

// The contact page: the Big Sur coast fills the screen behind a frosted card.
export default function Contact() {
  const main = useRef(null), state = useRef({ live: [4], section: 4, progress: [0, 0, 0, 0, 1], tilt: [0, 0, 0, 0, 0] });
  useEffect(() => {
    const world = getStage(); if (world && main.current) world.attach(main.current);
    return () => world?.detach();
  }, []);
  return <main ref={main} className="ht ct" data-section="contact">
    <div className="ct-sky" aria-hidden="true" />
    <SiteHeader current="/contact/" />
    <section className="ct-stage" aria-hidden="true"><CoastScene state={state} slot={4} lite /></section>
    <section className="ct-card ui-glass" aria-labelledby="ct-title">
      <p className="ht-badge"><i aria-hidden="true" />Available for freelance projects</p>
      <h1 id="ct-title">Let&apos;s build something<span>.</span></h1>
      <p className="ct-lede">Tell me about the product, the role or the idea.</p>
      <ul className="ct-offer" aria-label="What I take on">
        {OFFER.map((line, i) => <li key={line}><Icon src={`/icons/tech/${OFFER_ICONS[i]}.svg`} />{line}</li>)}
      </ul>
      <div className="ct-actions">
        <a className="ui-btn" href={scheduleHref}>Book a call<Icon src="/icons/tech/tabler--calendar-event.svg" /></a>
        <a className="ui-btn ui-btn--secondary" href={`mailto:${EMAIL}`}>Email me<Icon src="/icons/tech/tabler--mail.svg" /></a>
      </div>
      <p className="ct-or">or send a message</p>
      <ContactForm />
      <ul className="ct-links">{LINKS.map(([label, href]) => <li key={label}><a href={href} target="_blank" rel="noopener noreferrer">{label}<Icon src="/icons/tech/tabler--arrow-up-right.svg" /></a></li>)}</ul>
    </section>
    <SiteFooter />
  </main>;
}
