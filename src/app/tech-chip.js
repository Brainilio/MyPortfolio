import { techIcon } from '../lib/tech-icons';
// A technology with its icon (see src/lib/tech-icons.js).
export function Icon({ src, className = '' }) {
  return <i className={`ui-icon ${className}`} style={{ '--icon': `url(${src})` }} aria-hidden="true" />;
}
export default function TechChip({ name }) {
  const src = techIcon(name);
  return <li className="ui-chip">{src && <Icon src={src} />}{name}</li>;
}
