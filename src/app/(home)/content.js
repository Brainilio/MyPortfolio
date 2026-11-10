// The homepage's words that more than one page uses (the Lab's road trip reads the skills too).

// Skill groups, drawn from the stacks in the project list. Each one is a roadside sign on the road trip; as the
// wagon pulls up to a sign, its `lead` and `blurb` are shown large beside the road.
export const SKILLS = [
  { title: "Front end", items: ["React", "Next.js", "TypeScript", "React Query", "Tailwind CSS", "Framer Motion"],
    lead: "Interfaces that are quick and clear.",
    blurb: "React and Next.js in TypeScript, React Query for server state, and motion where it helps someone follow what changed." },
  { title: "Mobile", items: ["React Native", "Expo", "Supabase", "GraphQL", "Stripe"],
    lead: "Apps from first screen to the store.",
    blurb: "React Native and Expo apps with their back end: auth, payments, push notifications and the data behind them." },
  { title: "Cloud", items: ["AWS", "SST", "AWS Lambda", "AppSync", "Cognito", "Redis"],
    lead: "Serverless on AWS.",
    blurb: "Lambdas, GraphQL on AppSync, Cognito sign-in and Redis caching, defined in code with SST." },
  { title: "Architecture", items: ["Architecture", "NX", "Node.js", "CI/CD", "Storybook", "Stencil"],
    lead: "Systems that stay easy to change.",
    blurb: "Monorepos, shared component libraries and design systems, APIs with a clear shape, and pipelines that catch problems early." },
  { title: "Design", items: ["Figma", "UX/UI", "User research"],
    lead: "Designing what I build.",
    blurb: "From research and Figma to the shipped screen, so the design and the code don't drift apart." },
];
// (Each tool's icon comes from src/lib/tech-icons.js.)
