// Tabler icons by Paweł Kuna (MIT), sourced through Iconbuddy.
const icons = {
  'github': <><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2c2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2a4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6c-.6.6-.6 1.2-.5 2V21" /></>,
  'mail': <><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" /><path d="m3 7l9 6l9-6" /></g></>,
  'arrow-up-right': <><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 7L7 17M8 7h9v9" /></>,
};
export default function Icon({ name, className = '' }) {
  return <svg className={`iconbuddy-icon ${className}`} viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false">{icons[name]}</svg>;
}
