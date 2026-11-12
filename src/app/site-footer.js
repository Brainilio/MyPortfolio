'use client';
import { useRef } from 'react';
import { MODEL_CREDITS } from './(home)/model-credits';
// The footer on every page. "Credits" opens a dialog with the 3D model attributions (CC BY 3.0 requires them).
export default function SiteFooter() {
  const dialog = useRef(null);
  return <footer className="ui-footer">
    <span>© {new Date().getFullYear()} Brainilio Rodrigues Imambaks</span>
    <nav aria-label="Elsewhere">
      <a href="mailto:brainilioir@gmail.com">Email</a>
      <a href="https://linkedin.com/in/brainilio" target="_blank" rel="noopener noreferrer">LinkedIn</a>
      <a href="https://github.com/Brainilio" target="_blank" rel="noopener noreferrer">GitHub</a>
      <button type="button" onClick={() => dialog.current?.showModal()}>Credits</button>
    </nav>
    <dialog ref={dialog} className="ui-credits" aria-labelledby="ui-credits-title" onClick={event => { if (event.target === dialog.current) dialog.current.close(); }}>
      <h2 id="ui-credits-title">Credits</h2>
      <p>The 3D models on this site. These are <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener noreferrer">CC BY 3.0</a>, via Poly Pizza; the rest are CC0 (Quaternius, Kenney, CreativeTrio) or made in code. No endorsement implied.</p>
      <ul>{MODEL_CREDITS.map(group => <li key={group.author}>{group.works.map(([title, id], i) => <span key={id}><a href={`https://poly.pizza/m/${id}`} target="_blank" rel="noopener noreferrer">{title}</a>{i < group.works.length - 1 ? ', ' : ''}</span>)} <span>by {group.author}</span></li>)}</ul>
      <p>Icons: Tabler (MIT) and Simple Icons (CC0), via Iconbuddy.</p>
      <form method="dialog"><button className="ui-btn" type="submit">Close</button></form>
    </dialog>
  </footer>;
}
