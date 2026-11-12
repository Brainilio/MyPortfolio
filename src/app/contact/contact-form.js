'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Icon, Roll } from '../tech-chip';
import { EMAIL } from '../../lib/contact';

// Netlify registers this form from public/__forms.html. Keep the field names in sync.
const FORM_NAME = 'contact';
const TOPICS = [
  { label: 'Build something new', hint: 'An app, website, or early-stage idea.', icon: 'tabler--browser' },
  { label: 'Improve a product', hint: 'Better experiences, performance, or architecture.', icon: 'tabler--gauge' },
  { label: 'Explore an idea', hint: 'Let’s think through a challenge or possibility.', icon: 'tabler--palette' },
  { label: 'Work together', hint: 'Freelance, collaboration, or a full-time role.', icon: 'tabler--components' },
  { label: 'Something else', hint: 'Have another idea or just want to connect?', icon: 'tabler--mail' },
];
const STEPS = [
  ['What brings you here?', 'Tell me a little about what you have in mind.'],
  ['Tell me about it.', 'No need to have everything figured out.'],
  ['Let’s connect.', 'Where can I reach you?'],
];

export default function ContactForm() {
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [data, setData] = useState({ topic: '', details: '', reference: '', name: '', email: '', company: '' });
  const title = useRef(null);
  const previousStep = useRef(step);
  const confirmation = useRef(null);
  const sending = useRef(false);

  useEffect(() => {
    if (previousStep.current !== step) title.current?.focus();
    previousStep.current = step;
  }, [step]);
  useEffect(() => {
    if (status === 'sent') confirmation.current?.focus();
  }, [status]);

  const set = key => event => {
    setData(current => ({ ...current, [key]: event.target.value }));
    setError('');
  };

  const submit = async event => {
    event.preventDefault();
    if (sending.current) return;
    if (step === 0 && !data.topic) return setError('Choose an option to continue.');
    if (step === 1 && !data.details.trim()) return setError('Add a few details to continue.');
    if (step < 2) {
      setError('');
      setStep(step + 1);
      return;
    }
    if (!data.name.trim()) return setError('Add your name.');
    if (!data.email.trim()) return setError('Add an email address so I can get back to you.');
    if (!event.currentTarget.elements.email.checkValidity()) return setError('That email address doesn’t look right.');

    sending.current = true;
    setStatus('sending');
    setError('');
    try {
      const response = await fetch('/__forms.html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          'form-name': FORM_NAME,
          ...data,
          'bot-field': event.currentTarget.elements['bot-field'].value,
        }),
      });
      if (!response.ok) throw new Error(String(response.status));
      setStatus('sent');
    } catch {
      setStatus('idle');
      setError(`That didn’t go through. Email me at ${EMAIL} instead.`);
    } finally {
      sending.current = false;
    }
  };

  if (status === 'sent') return <div className="ct-form ct-confirmation">
    <Icon src="/icons/tech/tabler--circle-check.svg" />
    <h2 ref={confirmation} tabIndex={-1}>Message sent!</h2>
    <p>Thanks for reaching out. I appreciate you sharing your idea, and I look forward to connecting.</p>
    <Link className="ui-btn ui-btn--secondary" href="/"><Roll>Back to home</Roll></Link>
  </div>;

  return <form className="ct-form" name={FORM_NAME} onSubmit={submit} noValidate>
    <p className="ct-hidden"><label>Leave this empty<input name="bot-field" tabIndex={-1} autoComplete="off" /></label></p>
    <div className="ct-progress" aria-hidden="true">{STEPS.map(([heading], i) => <i key={heading} className={i <= step ? 'is-on' : ''} />)}</div>
    <p className="ct-step-count">Step {step + 1} of 3</p>

    <fieldset className="ct-step" key={step}>
      <legend ref={title} tabIndex={-1}>{STEPS[step][0]}</legend>
      <p className="ct-step-intro">{STEPS[step][1]}</p>
      {step === 0 && <div className="ct-choices">{TOPICS.map(({ label, hint, icon }) =>
        <label className={`ct-choice${data.topic === label ? ' is-on' : ''}`} key={label}>
          <input type="radio" name="topic" value={label} checked={data.topic === label} onChange={set('topic')} />
          <Icon src={`/icons/tech/${icon}.svg`} />
          <span><b>{label}</b><small>{hint}</small></span>
        </label>)}</div>}
      {step === 1 && <>
        <label className="ct-field"><span>What’s on your mind?</span>
          <textarea name="details" rows={3} value={data.details} onChange={set('details')} required
            placeholder="Tell me about your idea, challenge, or opportunity..." /></label>
        <label className="ct-field"><span>Have something I can look at? <em>Optional</em></span>
          <input name="reference" type="text" inputMode="url" value={data.reference} onChange={set('reference')}
            placeholder="Website, prototype, project brief, or job posting URL" /></label>
      </>}
      {step === 2 && <>
        <label className="ct-field"><span>Your name</span><input type="text" name="name" autoComplete="name" value={data.name} onChange={set('name')} required /></label>
        <label className="ct-field"><span>Email address</span><input type="email" name="email" autoComplete="email" value={data.email} onChange={set('email')} required /></label>
        <label className="ct-field"><span>Company or organization <em>Optional</em></span><input type="text" name="company" autoComplete="organization" value={data.company} onChange={set('company')} /></label>
      </>}
    </fieldset>

    {error && <p className="ct-error" role="alert">{error}</p>}
    <div className="ct-nav">
      {step > 0 && <button type="button" className="ui-btn ui-btn--secondary" disabled={status === 'sending'} onClick={() => { setError(''); setStep(step - 1); }}>
        <Icon src="/icons/tech/tabler--arrow-left.svg" /><Roll>Back</Roll></button>}
      <button className="ui-btn" type="submit" disabled={status === 'sending'}>
        <Roll>{step < 2 ? 'Next' : status === 'sending' ? 'Sending…' : 'Send message'}</Roll><Icon src={`/icons/tech/tabler--${step < 2 ? 'arrow-right' : 'send'}.svg`} /></button>
    </div>
  </form>;
}
