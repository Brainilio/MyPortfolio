import './globals.css';
export const metadata = {
  title: 'Brainilio — Developer. Builder. Explorer.',
  description: 'Exploring ideas, building digital products, and finding ways technology can make a positive impact.',
};
export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
