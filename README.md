# Brainilio Portfolio

Next.js portfolio with a scrollable 3D homepage, a project archive and case studies, a contact form, and a Lab of standalone experiments.

## Run locally

Use the Node version in `.nvmrc`, then run `npm install` and `npm run dev`. Netlify runs `npm run build` and serves the static export in `out/`. To verify a build while the dev server is running, use `NEXT_BUILD_DIR=.next-verify npm run build`.

## Content and styles

- `src/app/(home)/` contains the homepage and its scenes.
- `src/lib/projects.js` holds project copy and media. Project videos loop muted when in view and use still images as fallbacks.
- `src/app/globals.css` defines the type and page rails; `ui.css` defines shared heading styles and controls; `scenes.css` contains scene framing reused by Home, Contact, and Lab.
- `docs/prismic.md` explains the homepage copy integration.
- `public/models/CREDITS.md` documents 3D sources, licenses, and asset preparation.
- `docs/archive/portfolio-prototypes.css` preserves the older portrait and space-story styles outside the active app.

## Before shipping

`npm run check` validates project and Lab slugs, published still and video paths, intrinsic image dimensions, the Iconbuddy manifest assets, and the Netlify contact form declaration. The build runs it automatically. After adding or replacing a still, run `npm run measure:images` with FFmpeg's `ffprobe` installed, then include the updated dimensions file with the change. Netlify submission delivery must be verified on a deployed site.
