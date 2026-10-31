// Everything in the lab, in grid order. Each experiment gets its own page at /journey/<slug>/.
// `kind` is shown on its card. Space experiments name the `chapter` they play in the shared 3D scene (timeline.js);
// other kinds (little UI pieces, tricks, animations) will add their own component when they arrive.
export const EXPERIMENTS = [
  { slug: "liftoff", title: "Liftoff", kind: "3D", chapter: "launch", note: "From the summit pad to the edge of space." },
  { slug: "close-up", title: "Close-up", kind: "3D", chapter: "about", note: "He keeps an eye on your cursor." },
  { slug: "flyby", title: "Flyby", kind: "3D", chapter: "skills", note: "A rocket streaks past, and he goes after it." },
  { slug: "rocket-cam", title: "Rocket cam", kind: "3D", chapter: "projects", note: "Riding behind the rocket through two figure-eights." },
  { slug: "defend", title: "Defend", kind: "3D", chapter: "aliens", note: "Click the saucers. Whatever you miss, he zaps." },
  { slug: "black-hole", title: "Black hole", kind: "3D", chapter: "contact", note: "Dive in and fall through to the other side." },
].map(experiment => ({ ...experiment, thumb: `/lab/${experiment.slug}.jpg` }));

export const findExperiment = slug => EXPERIMENTS.find(experiment => experiment.slug === slug);
