import { clamp } from "./timeline";

// Which section the page is on, and how far through it. Scrolling stays native (Lenis only smooths it);
// the 3D reads `story` and eases into each section's composition on its own.
// `progress[i]`: through a tall section's internal scroll (sticky copy); `leave[i]`: until it hands off
// to the next section (its bottom passing the middle of the viewport).
export function trackStages({ sections, story, onIndex }) {
  let raf = 0;
  function update() {
    raf = 0;
    const vh = window.innerHeight, mid = vh / 2;
    let index = 0;
    sections.forEach((el, i) => {
      if (!el) return;
      const { top } = el.getBoundingClientRect(), height = el.offsetHeight;
      if (top <= mid) index = i;
      const runway = height - vh;
      story.progress[i] = runway < 2 ? 0 : clamp(-top / runway, 0, 1);
      story.leave[i] = clamp(-top / Math.max(1, height - mid), 0, 1);
    });
    if (index !== story.index) { story.index = index; onIndex(index); }
  }
  const request = () => { if (!raf) raf = requestAnimationFrame(update); };
  update(); onIndex(story.index);
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", request); window.removeEventListener("resize", request); };
}
