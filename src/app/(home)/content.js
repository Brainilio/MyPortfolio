// The homepage's words that more than one page uses (the Lab's road trip reads the skills too).

// Skill groups, drawn from the stacks in the project list. Each one is a roadside sign on the road trip; as the
// wagon pulls up to a sign, its `lead` and `blurb` are shown large beside the road.
// DRAFT copy (lead and blurb): written only from the tools listed here; replace with your own words.
export const SKILLS = [
  { title: "Frontend", items: ["React", "Redux", "Next.js", "React Query", "GSAP"],
    lead: "Interfaces that feel quick and read clearly.",
    blurb: "React and Next.js for the structure, Redux and React Query to keep state and data predictable, and GSAP when motion helps someone see what just changed." },
  { title: "Backend", items: ["Node", "Express", "MongoDB", "Laravel"],
    lead: "APIs that are easy to build on.",
    blurb: "Node and Express services, MongoDB where documents fit the data, and Laravel when a project lives in PHP." },
  { title: "3D & motion", items: ["Three.js", "WebGL", "Shaders"],
    lead: "Small worlds in the browser, like this one.",
    blurb: "Three.js and WebGL with hand-written shaders: low-poly, light on the GPU, and made to run smoothly on an ordinary laptop." },
  { title: "Languages", items: ["TypeScript", "JavaScript", "PHP", "Java", "Python"],
    lead: "Mostly TypeScript, at home in others.",
    blurb: "TypeScript and JavaScript on the web, with PHP, Java and Python when a project calls for them." },
  { title: "Product", items: ["UX/UI", "User research", "Pitching", "Stakeholder communication", "Agile"],
    lead: "Building the right thing, not only building it right.",
    blurb: "UX and UI design, user research and Agile delivery, and the conversations around them: pitching ideas and keeping stakeholders in the loop." },
];

// Career, newest first. PLACEHOLDER entries: replace each with the real role, company, dates and a line on the work.
// Each tool's icon (Tabler, via Iconbuddy; see iconbuddy.json), file name without ".svg". Tools with no fitting
// icon show their name alone.
export const TOOL_ICONS = {
  "React": "brand-react", "Redux": "brand-redux", "Next.js": "brand-nextjs", "Node": "brand-nodejs", "MongoDB": "brand-mongodb",
  "Laravel": "brand-laravel", "Three.js": "brand-threejs", "WebGL": "3d-cube-sphere", "Shaders": "color-filter",
  "TypeScript": "brand-typescript", "JavaScript": "brand-javascript", "PHP": "brand-php", "Java": "coffee", "Python": "brand-python",
  "UX/UI": "layout", "User research": "users", "Pitching": "presentation", "Stakeholder communication": "messages", "Agile": "refresh",
};

export const EXPERIENCE = [
  { years: "20XX — Now", role: "Current role", org: "Company", summary: "Placeholder: one line on what you build there and the difference it makes.", tags: ["React", "Node"] },
  { years: "20XX — 20XX", role: "Previous role", org: "Company", summary: "Placeholder: the product, your part in it, one result worth naming.", tags: ["TypeScript", "Three.js"] },
  { years: "20XX — 20XX", role: "Earlier role", org: "Company", summary: "Placeholder: what you shipped and what you learned.", tags: ["Laravel", "MongoDB"] },
  { years: "20XX — 20XX", role: "First role", org: "Company or school", summary: "Placeholder: where it started.", tags: ["JavaScript"] },
];
