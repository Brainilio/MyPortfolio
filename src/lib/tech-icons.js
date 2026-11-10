// Every technology shown on the site has an icon. Icons come from Iconbuddy (files.svgcdn.io): Tabler (MIT) first,
// Simple Icons (CC0) for brands Tabler lacks. They are downloaded into public/icons/tech/<set>--<name>.svg by
// `node scripts/fetch-tech-icons.mjs` and drawn as a CSS mask, so they take the text colour.
// Keys are matched case-insensitively; add a line here (and run the script) when a new technology appears.
export const TECH_ICONS = {
  "react": "tabler/brand-react", "reactjs": "tabler/brand-react", "react hooks": "tabler/brand-react",
  "react native": "tabler/brand-react-native", "expo": "simple-icons/expo",
  "next.js": "tabler/brand-nextjs", "nextjs": "tabler/brand-nextjs",
  "typescript": "tabler/brand-typescript", "tscript": "tabler/brand-typescript", "javascript": "tabler/brand-javascript",
  "node.js": "tabler/brand-nodejs", "nodejs": "tabler/brand-nodejs", "node": "tabler/brand-nodejs",
  "express": "simple-icons/express", "expressjs": "simple-icons/express",
  "graphql": "simple-icons/graphql", "graphql / appsync": "simple-icons/graphql", "appsync": "simple-icons/graphql",
  "react query": "simple-icons/reactquery", "tanstack query": "simple-icons/reactquery",
  "redux": "tabler/brand-redux", "react router": "simple-icons/reactrouter",
  "aws": "tabler/brand-aws", "aws ec2 & s3": "tabler/brand-aws", "aws lambda": "simple-icons/awslambda", "lambda": "simple-icons/awslambda",
  "cognito": "simple-icons/amazoncognito", "dynamodb": "simple-icons/amazondynamodb", "elasticache": "simple-icons/amazonelasticache", "eas": "simple-icons/expo", "testflight": "tabler/brand-apple", "sst": "simple-icons/sst",
  "redis": "simple-icons/redis", "salesforce": "simple-icons/salesforce", "supabase": "simple-icons/supabase", "firebase": "tabler/brand-firebase",
  "mongodb": "tabler/brand-mongodb", "mysql": "simple-icons/mysql", "nx": "simple-icons/nx",
  "tailwind css": "tabler/brand-tailwind", "tailwind": "tabler/brand-tailwind", "gsap": "simple-icons/greensock",
  "three.js": "tabler/brand-threejs", "threejs": "tabler/brand-threejs", "framer motion": "tabler/brand-framer-motion",
  "prismic": "simple-icons/prismic", "netlify": "simple-icons/netlify", "mapbox": "simple-icons/mapbox",
  "stencil": "simple-icons/stencil", "stencil web components": "simple-icons/stencil", "storybook": "simple-icons/storybook",
  "stripe": "tabler/brand-stripe", "apple pay": "simple-icons/applepay", "apple sign-in": "tabler/brand-apple",
  "figma": "tabler/brand-figma", "adobe xd": "tabler/brand-adobe", "adobexd": "tabler/brand-adobe",
  "python": "tabler/brand-python", "fastapi": "simple-icons/fastapi", "scikit": "simple-icons/scikitlearn", "ml": "tabler/brain",
  "php": "tabler/brand-php", "laravel": "tabler/brand-laravel", "java": "tabler/coffee", "android": "tabler/brand-android",
  "material": "simple-icons/mui", "google api": "tabler/brand-google", "google analytics": "tabler/brand-google-analytics",
  "docker": "tabler/brand-docker", "github actions": "tabler/brand-github", "jest": "simple-icons/jest",
  "ux/ui": "tabler/layout", "web design": "tabler/layout", "animation": "tabler/sparkles", "user research": "tabler/users", "pitching": "tabler/presentation",
  "competitor research": "tabler/chart-bar", "brand concept": "tabler/palette", "e-commerce": "tabler/shopping-cart",
  "performance": "tabler/gauge", "architecture": "tabler/topology-star-3", "mvc": "tabler/stack-2", "multer": "tabler/upload",
  "unit testing": "tabler/test-pipe", "oop": "tabler/code", "dpatterns": "tabler/topology-star", "game": "tabler/device-gamepad-2",
  "design patterns": "tabler/topology-star", "materialize": "simple-icons/materialdesign", "machine learning": "tabler/brain", "scikit-learn": "simple-icons/scikitlearn",
  "jwt": "simple-icons/jsonwebtokens", "apollo": "simple-icons/apollographql", "oauth": "tabler/key",
  "mobile": "tabler/device-mobile", "agile": "tabler/refresh", "ci/cd": "tabler/git-merge", "lighthouse": "simple-icons/lighthouse", "serverless": "tabler/cloud",
};
export const techIcon = name => {
  const ref = TECH_ICONS[String(name).trim().toLowerCase()];
  return ref ? `/icons/tech/${ref.replace("/", "--")}.svg` : null;
};
