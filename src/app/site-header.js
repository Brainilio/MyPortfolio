import Link from 'next/link';
import { Icon, Roll } from './tech-chip';
// The top navigation on every page: the wordmark on the left edge, the links in a centred glass pill.
const LINKS = [['/projects/', 'Work'], ['/#about', 'About', true], ['/journey/', 'Lab', true], ['/contact/', 'Contact', true]];
export default function SiteHeader({ current }) {
  return <header className="ui-header">
    <Link className="ui-wordmark" href="/">Brainilio<span>.</span></Link>
    <nav className="ui-glass" aria-label="Main">
      {LINKS.map(([href, label, small]) => <Link key={href} href={href} className={small ? 'ui-hide-sm' : undefined} aria-current={current === href ? 'page' : undefined}>{label}</Link>)}
      <Link className="ui-btn" href="/contact/"><Roll>Let&apos;s talk</Roll><Icon src="/icons/tech/tabler--arrow-up-right.svg" /></Link>
    </nav>
  </header>;
}
