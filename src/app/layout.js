import './globals.css';
import './ui.css';
import './scenes.css';
import SiteHeader from './site-header';
export const metadata = {
  title: { default: 'Brainilio Rodrigues Imambaks | Software Engineer', template: '%s | Brainilio' },
  description: 'I’m Brainilio, a creative full-stack developer with five years of experience building web and mobile apps.',
};
export default function RootLayout({ children }) {
  return <html lang="en"><body><SiteHeader />{children}</body></html>;
}
