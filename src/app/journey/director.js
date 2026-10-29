import { CHAPTERS, clamp, restS } from "./timeline";

// Scene director: the page moves one chapter at a time. A gesture past a chapter's edge starts a timed
// transition (the 3D plays it on its own clock); chapters taller than the viewport scroll internally first.
// `story` is shared with the 3D scene: {index, kind, start, duration, landing}.
export function createDirector({ sections, lenis, story, reduced, onIndex, onText }) {
  const top = i => sections[i].getBoundingClientRect().top + window.scrollY;
  const end = i => top(i) + Math.max(0, sections[i].offsetHeight - window.innerHeight);
  const last = CHAPTERS.length - 1;
  let settling = false, lastWheel = 0, push = 0, timers = [], settleTimer = 0;
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  // A transition is playing until its clock runs out (timers can be throttled; the clock can't).
  const busy = () => performance.now() < story.start + story.duration;
  const jump = y => lenis.scrollTo(y, { immediate: true, force: true });

  function go(i) {
    i = clamp(i, 0, last);
    const from = story.index;
    if (i === from || busy()) return;
    const forward = i > from, landing = forward ? 0 : 1;
    const kind = from === 0 && i === 1 ? "launch" : Math.abs(i - from) === 1 ? "tween" : "cut";
    const distance = Math.abs(restS(i, landing) - restS(from, forward ? 1 : 0));
    const duration = reduced() ? 0 : kind === "launch" ? 3800 : kind === "cut" ? 1400 : clamp(1100 + distance * 1100, 1100, 2300);
    // When the old chapter's text has faded, jump the page to the new chapter; reveal its text after.
    const [swap, show] = kind === "launch" ? [.8, .86] : kind === "cut" ? [.45, .5] : [.3, .45];
    Object.assign(story, { index: i, kind, start: performance.now(), duration, landing, mist: kind === "launch" || (kind === "cut" && Math.min(i, from) === 0) });
    settling = true; push = 0;
    onIndex(i); onText(false);
    const target = forward ? top(i) : end(i);
    if (!duration) { jump(target); onText(true); return; }
    later(() => jump(target), duration * swap);
    later(() => onText(true), duration * show);
  }

  const block = event => { if (event.cancelable) event.preventDefault(); return false; };
  // Lenis hook: everything wheel/touch passes through here first.
  function virtualScroll(data) {
    const { deltaY, event } = data, now = performance.now();
    if (event.ctrlKey) return true;
    if (event.type === "touchstart") { if (!busy()) settling = false; push = 0; return true; }
    // After a transition, wait for the trackpad's momentum to die down before listening again.
    if (busy() || (settling && event.type === "wheel" && now - lastWheel < 180)) { lastWheel = now; return block(event); }
    settling = false; lastWheel = now;
    const i = story.index, y = lenis.targetScroll, a = top(i), b = end(i);
    if ((deltaY > 0 && y >= b - 1) || (deltaY < 0 && y <= a + 1)) {
      push += deltaY;
      if (Math.abs(push) > 24) go(i + Math.sign(push));
      return block(event);
    }
    push = 0;
    // Inside a tall chapter: scroll, but never past its edges.
    // Reaching the edge mid-gesture stops there; handing off to the next chapter needs a fresh gesture.
    const next = clamp(y + deltaY, a, b);
    if (next === a || next === b) settling = true;
    data.deltaY = next - y;
    return data.deltaY === 0 ? block(event) : true;
  }

  function step(direction) {
    if (busy()) return;
    const i = story.index, y = lenis.targetScroll, a = top(i), b = end(i);
    if ((direction > 0 && y < b - 1) || (direction < 0 && y > a + 1)) lenis.scrollTo(clamp(y + direction * window.innerHeight * .8, a, b), { duration: .9 });
    else go(i + direction);
  }
  function onKey(event) {
    if (event.target.closest?.("input,textarea,select,[contenteditable]") || event.metaKey || event.ctrlKey || event.altKey) return;
    const keys = { ArrowDown: 1, PageDown: 1, ArrowUp: -1, PageUp: -1, " ": event.shiftKey ? -1 : 1 };
    if (event.key === "Home" || event.key === "End") { event.preventDefault(); go(event.key === "Home" ? 0 : last); return; }
    if (!(event.key in keys)) return;
    event.preventDefault(); step(keys[event.key]);
  }

  const sceneAt = y => { let j = 0; for (let i = 0; i <= last; i++) if (top(i) <= y + window.innerHeight / 2) j = i; return j; };
  // Scrolling we didn't drive (scrollbar, find-in-page, tabbing to a link): settle onto that chapter.
  function onScroll() {
    if (busy()) return;
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      const y = window.scrollY, i = story.index;
      if (y >= top(i) - 2 && y <= end(i) + 2) return;
      const j = sceneAt(y);
      if (j !== i) go(j); else jump(clamp(y, top(i), end(i)));
    }, 160);
  }
  const onResize = () => { if (!busy()) jump(clamp(window.scrollY, top(story.index), end(story.index))); };

  // Start on whichever chapter the page loaded at.
  story.index = sceneAt(window.scrollY); onIndex(story.index);
  jump(clamp(window.scrollY, top(story.index), end(story.index)));
  lenis.on("scroll", onScroll);
  window.addEventListener("keydown", onKey);
  window.addEventListener("resize", onResize);
  return {
    virtualScroll, go,
    destroy() { timers.forEach(clearTimeout); clearTimeout(settleTimer); window.removeEventListener("keydown", onKey); window.removeEventListener("resize", onResize); },
  };
}
