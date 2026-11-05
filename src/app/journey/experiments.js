// Everything in the lab, in grid order. Each experiment gets its own page at /journey/<slug>/.
// `kind` is shown on its card. Space experiments name the `chapter` they play in the shared 3D scene (timeline.js),
// worlds name the homepage-born `world` they show (world.js);
// other kinds (little UI pieces, tricks, animations) will add their own component when they arrive.
export const EXPERIMENTS = [
  { slug: "liftoff", title: "Liftoff", kind: "3D", chapter: "launch", note: "From the summit pad to the edge of space." },
  { slug: "close-up", title: "Close-up", kind: "3D", chapter: "about", note: "He keeps an eye on your cursor." },
  { slug: "flyby", title: "Flyby", kind: "3D", chapter: "skills", note: "A rocket streaks past, and he goes after it." },
  { slug: "rocket-cam", title: "Rocket cam", kind: "3D", chapter: "projects", note: "Riding behind the rocket through two figure-eights." },
  { slug: "defend", title: "Defend", kind: "3D", chapter: "aliens", note: "Click the saucers. Whatever you miss, he zaps." },
  { slug: "black-hole", title: "Black hole", kind: "3D", chapter: "contact", note: "Dive in and fall through to the other side." },
  // Worlds that started as homepage sections, at full size (see world.js).
  { slug: "prairie", title: "Prairie", kind: "3D", world: "prairie", note: "Golden hour among the bison. Scroll turns the ring of cards; fill the basket and they come running." },
  { slug: "meadow", title: "Meadow", kind: "3D", world: "meadow", note: "Yellowstone at golden hour: a bison herd, a river into the lake, a prismatic hot spring and two geysers. Fill the basket and the herd comes running." },
  { slug: "road-trip", title: "Road trip", kind: "3D", world: "road-trip", note: "Drive the wagon through the park, sign by sign, to the geyser." },
  { slug: "the-hike", title: "The hike", kind: "3D", world: "hike", note: "The ranger bear climbs the switchbacks to the summit, in his own time." },
  { slug: "lighthouse", title: "Lighthouse", kind: "3D", world: "lighthouse", note: "Big Sur in the fog. Steer the beam and see what turns up." },
].map(experiment => ({ ...experiment, thumb: `/lab/${experiment.slug}.jpg` }));

export const findExperiment = slug => EXPERIMENTS.find(experiment => experiment.slug === slug);
