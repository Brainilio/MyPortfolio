import { techIcon } from '../lib/tech-icons';
// A technology with its icon (see src/lib/tech-icons.js).
export function Icon({ src, className = '' }) {
  if (src.startsWith('/icons/tech/logos--')) {
    return <img className={`ui-icon ui-icon--brand ${className}`} src={src} alt="" aria-hidden="true" />;
  }
  return <i className={`ui-icon ${className}`} style={{ '--icon': `url(${src})` }} aria-hidden="true" />;
}
// A button label that rolls on hover (ui.css): the second copy is hidden from screen readers.
export function Roll({ children }) { return <span className="ui-roll"><span><span>{children}</span><span aria-hidden="true">{children}</span></span></span>; }

export default function TechChip({ name, hiddenFromAT, className = '', ...props }) {
  const src = techIcon(name);
  return <li className={`ui-chip ${className}`} aria-hidden={hiddenFromAT} {...props}>{src && <Icon src={src} />}{name}</li>;
}
