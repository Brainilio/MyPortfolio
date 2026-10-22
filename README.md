# Brainilio Portfolio

Modern Next.js App Router portfolio with a layered portrait hero, staggered intro, scroll parallax, Lenis smooth scrolling, and reduced-motion support.

## Run locally

Use Node.js 24 (`nvm use`), then:

```sh
npm install
npm run dev
```

`npm run build` creates the static website in `out/`. Netlify is configured to build and serve that directory. Preview the export with any static server, for example `python3 -m http.server 3000 --directory out`.

## Content and assets

- `src/app/portfolio.js`: home page, motion, social links, and Mountain Time clock.
- `src/app/globals.css`: responsive styling and reduced-motion treatment.
- `src/lib/projects.js`: preserved project archive and case-study content.
- `public/legacy/projects/`: preserved project imagery.
- `public/images/portrait-cutout.png`: transparent portrait derived from the supplied photo using built-in imagegen. Prompt: “Remove only the entire background to genuine transparency. Preserve the exact man's identity, face, glasses, hair, expression, skin, black shirt, pose and framing. Clean natural hair edges. No retouching, changed features or added elements.”
- `public/images/portrait-original.png`: original supplied photo.

The original 2022 React application source, including pre-existing local edits, is preserved in `legacy/src-2022/` for reference; it is not bundled by Next.js. Obsolete CRA, node-sass, React Router, Three.js, and unused dependencies have been removed from the active package manifest.

The homepage uses the existing GitHub address and contact email. Colorado Springs and the Mountain Time clock follow the supplied design. Update these if needed before publication. Existing historical project content is preserved as supplied.

Hero scenery: `public/images/mountain-trees.webp`, generated with built-in imagegen. Prompt: Photorealistic Colorado foothills with blue-gray Rocky Mountain ridgelines, evergreen pines and sunlit golden-green trees along the lower edge; warm near-white sky for typography; muted natural colors, clear landscape texture, no people, buildings or text.

Active checkout: `/Users/brainiliorodrigues/Desktop/MyPortfolio2022`. Original 2022 application source is preserved in `legacy/src-2022/`.
