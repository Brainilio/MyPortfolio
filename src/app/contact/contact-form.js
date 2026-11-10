'use client';
import { useEffect, useRef, useState } from 'react';
import { Icon, Roll } from '../tech-chip';
import { EMAIL } from '../../lib/contact';

// A three-step enquiry: what it's about, the main goal, then how to reach you (email or phone, at least one).
// It posts to Netlify Forms. Netlify finds the form at deploy time through the static copy in public/__forms.html,
// so any field added here must be added there too. Locally (next dev) there is no Netlify endpoint, so sending fails
// and the message offers email instead.
const FORM_NAME = 'contact';
const TOPICS = [
  { id: 'website', label: 'A new website', hint: 'Designed and built from scratch.', icon: 'tabler--browser',
    question: 'What should the site do for you?',
    goals: ['Launch a new business or brand', 'Replace a site that has aged', 'Bring in more leads or bookings', 'Sell online'] },
  { id: 'app', label: 'A new app', hint: 'Turn an app idea into a mobile or web app.', icon: 'tabler--device-mobile',
    question: 'Where is the idea now?',
    goals: ['Build an MVP to test the idea', 'Turn an existing product into an app', 'Launch on the App Store and Google Play', 'Not sure yet, let’s talk it through'] },
  { id: 'freelance', label: 'Freelance or contract work', hint: 'Improve your site or app, or build a new feature.', icon: 'tabler--components',
    question: 'What do you need help with?',
    goals: ['Build a new feature', 'Make the site or app faster', 'Fix bugs and tidy up the code', 'Extra hands on an ongoing project'] },
  { id: 'design', label: 'Design', hint: 'A new look, interface or design system.', icon: 'tabler--palette',
    question: 'What needs designing?',
    goals: ['A website', 'An app', 'A refreshed brand or look', 'A design system'] },
  { id: 'job', label: 'A full-time role', hint: 'You have a position I might be a fit for.', icon: 'tabler--briefcase',
    question: 'What kind of role is it?',
    goals: ['Front end', 'Full stack', 'Mobile', 'Senior or lead'] },
];
const STEPS = ['What can I help with?', '', 'How can I reach you?'];

const encode = data => new URLSearchParams(data).toString();

function Choice({ name, value, checked, onChange, label, hint, icon }) {
  return <label className={`ct-choice${checked ? ' is-on' : ''}`}>
    <input type="radio" name={name} value={value} checked={checked} onChange={onChange} />
    {icon && <Icon src={`/icons/tech/${icon}.svg`} />}
    <span><b>{label}</b>{hint && <small>{hint}</small>}</span>
  </label>;
}

export default function ContactForm() {
  const [step, setStep] = useState(0), [status, setStatus] = useState('idle'), [error, setError] = useState('');
  const [data, setData] = useState({ topic: '', goal: '', details: '', name: '', email: '', phone: '' });
  const title = useRef(null), first = useRef(true);
  const topic = TOPICS.find(t => t.id === data.topic);
  const set = key => event => { setData(d => ({ ...d, [key]: event.target.value, ...(key === 'topic' ? { goal: '' } : {}) })); setError(''); };

  // Move focus to the new step's question so screen readers and keyboards follow along (not on first render).
  useEffect(() => { if (first.current) { first.current = false; return; } title.current?.focus(); }, [step]);

  const next = () => {
    if (step === 0 && !data.topic) return setError('Pick one to continue.');
    if (step === 1 && !data.goal) return setError('Pick the closest one to continue.');
    setError(''); setStep(s => s + 1);
  };
  const submit = async event => {
    event.preventDefault();
    if (step < 2) return next();
    if (!data.name.trim()) return setError('Add your name.');
    if (!data.email.trim() && !data.phone.trim()) return setError('Add an email address or a phone number, so I can get back to you.');
    if (data.email && !event.currentTarget.querySelector('input[name=email]').checkValidity()) return setError('That email address doesn’t look right.');
    setStatus('sending'); setError('');
    try {
      const response = await fetch('/__forms.html', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encode({ 'form-name': FORM_NAME, ...data, topic: topic?.label || data.topic, 'bot-field': event.currentTarget.elements['bot-field'].value }),
      });
      if (!response.ok) throw new Error(String(response.status));
      setStatus('sent');
    } catch { setStatus('idle'); setError(`That didn’t go through. Email me at ${EMAIL} instead.`); }
  };

  if (status === 'sent') return <div className="ct-form ct-sent" role="status"><Icon src="/icons/tech/tabler--circle-check.svg" />
    <p><b>Thanks{data.name ? `, ${data.name.trim().split(' ')[0]}` : ''}.</b> I&apos;ll get back to you soon.</p></div>;

  return <form className="ct-form" name={FORM_NAME} onSubmit={submit} noValidate>
    <p className="ct-hidden"><label>Leave this empty<input name="bot-field" tabIndex={-1} autoComplete="off" /></label></p>
    <div className="ct-progress" aria-hidden="true">{STEPS.map((_, i) => <i key={i} className={i <= step ? 'is-on' : ''} />)}</div>
    <p className="ct-step-count">Step {step + 1} of 3</p>

    <fieldset className="ct-step" key={step}>
      <legend ref={title} tabIndex={-1}>{step === 1 ? topic.question : STEPS[step]}</legend>
      {step === 0 && <div className="ct-choices">{TOPICS.map(t =>
        <Choice key={t.id} name="topic" value={t.id} checked={data.topic === t.id} onChange={set('topic')} label={t.label} hint={t.hint} icon={t.icon} />)}</div>}
      {step === 1 && <>
        <div className="ct-choices ct-choices--goals">{topic.goals.map(g =>
          <Choice key={g} name="goal" value={g} checked={data.goal === g} onChange={set('goal')} label={g} />)}</div>
        <label className="ct-field"><span>Anything else I should know? <em>Optional</em></span>
          <textarea name="details" rows={3} value={data.details} onChange={set('details')} placeholder={data.topic === 'job' ? 'The company, the team, a link to the role' : 'Timeline, budget, a link to your current site or app'} /></label>
      </>}
      {step === 2 && <>
        <label className="ct-field"><span>Name</span><input type="text" name="name" autoComplete="name" value={data.name} onChange={set('name')} required /></label>
        <div className="ct-row">
          <label className="ct-field"><span>Email</span><input type="email" name="email" autoComplete="email" value={data.email} onChange={set('email')} /></label>
          <label className="ct-field"><span>Phone</span><input type="tel" name="phone" autoComplete="tel" value={data.phone} onChange={set('phone')} /></label>
        </div>
        <p className="ct-note">Email or phone, whichever you prefer. One is enough.</p>
      </>}
    </fieldset>

    {error && <p className="ct-error" role="alert">{error}</p>}
    <div className="ct-nav">
      {step > 0 && <button type="button" className="ui-btn ui-btn--secondary" onClick={() => { setError(''); setStep(s => s - 1); }}>
        <Icon src="/icons/tech/tabler--arrow-left.svg" /><Roll>Back</Roll></button>}
      <button className="ui-btn" type="submit" disabled={status === 'sending'}>
        <Roll>{step < 2 ? 'Next' : status === 'sending' ? 'Sending…' : 'Send'}</Roll><Icon src={`/icons/tech/tabler--${step < 2 ? 'arrow-right' : 'send'}.svg`} /></button>
    </div>
  </form>;
}
