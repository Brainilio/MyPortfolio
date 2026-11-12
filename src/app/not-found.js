import Link from 'next/link';
import Heading from './heading';
export default function NotFound() { return <main className="not-found"><p>404 / A little off the beaten path.</p><Heading size="display">Let’s head home</Heading><Link className="ui-btn" href="/">Back to Brainilio ↗</Link></main>; }
