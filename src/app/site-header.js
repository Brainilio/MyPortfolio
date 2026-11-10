import Link from 'next/link';
import { Icon } from './tech-chip';
// The top navigation on every page: links to the pages; the homepage keeps its own section pill bottom-right.
const LINKS = [['/projects/', 'Work'], ['/#about', 'About', true], ['/journey/', 'Lab', true], ['/contact/', 'Contact', true]];
export default function SiteHeader({ current }) {
  return <header className="ui-header ui-glass">
    <Link className="ui-wordmark" href="/">Brainilio<span>.</span></Link>
    <nav aria-label="Main">
      {LINKS.map(([href, label, small]) => <Link key={href} href={href} className={small ? 'ui-hide-sm' : undefined} aria-current={current === href ? 'page' : undefined}>{label}</Link>)}
      <Link className="ui-btn" href="/contact/">Let&apos;s talk<Icon src="/icons/tech/tabler--arrow-up-right.svg" /></Link>
    </nav>
  </header>;
}
