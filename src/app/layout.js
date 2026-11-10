import './globals.css';
import './ui.css';
import SiteHeader from './site-header';
export const metadata = {
  title: 'Brainilio — Developer. Builder. Explorer.',
  description: 'Exploring ideas, building digital products, and finding ways technology can make a positive impact.',
};
export default function RootLayout({ children }) {
  return <html lang="en"><body><SiteHeader />{children}</body></html>;
}
