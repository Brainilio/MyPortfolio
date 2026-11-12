# Brainilio portfolio handoff for Claude

Snapshot from November 11, 2026.

## Start here

- Open `/Users/brainiliorodrigues/Desktop/MyPortfolio2022`. The active branch is `feat/next-portfolio-hero`, with `ba726bd4` as the last commit at handoff.
- Run `git status --short --branch` and review the working tree. The latest changes are local and include untracked source files and SVGs that the app uses. A checkout of the branch tip alone will show an older site. Preserve unrelated edits, and leave committing, pushing, and deploying for an explicit request.
- Read [AGENTS.md](../AGENTS.md) and the [current README](../README.md). The root `HANDOFF.md` and `docs/HANDOFF-CODEX.md` are earlier snapshots. Use this document and the current code for the active path, copy, and layout.
- Node 24 is specified in `.nvmrc`. The app uses Next.js 16.4.2 App Router with static export, React, vanilla Three.js, and Lenis. Read the relevant Next guide in `node_modules/next/dist/docs/` before changing Next-specific code.

## Run and verify

- The dev server was listening on [port 3000](http://127.0.0.1:3000/) at handoff. Run `npm run dev` if it is down. The last verified static preview was [port 3031](http://127.0.0.1:3031/), serving `work/mobile-layout-release/`.
- Use `NEXT_BUILD_DIR=work/<unique-folder> npm run build` to verify changes alongside the dev server. The production Netlify configuration publishes `out/`. `npm run build` runs `npm run check` first.
- Use the homepage’s **Sections** control to jump between scenes. Add `?debug` to disable Lenis for repeatable layout checks. Use the default URL to assess the actual scroll feel. Use `?work=sheet` to review the alternate desktop Work preview.

## Homepage and responsive behavior

The order is Hero, Around the fire, Latest work, What I bring along, and the contact outro. [home.js](../src/app/(home)/home.js) coordinates section progress, scroll stops, sky changes, and scene lifecycles. [stage.js](../src/app/(home)/stage.js) owns the shared renderer. Latest Work has its own scene and hands the eagle to Skills through [eagle-handoff.js](../src/app/(home)/eagle-handoff.js).

- **Header.** [site-header.js](../src/app/site-header.js) renders the shared header. At 760 px and below, the hamburger sits to the right of “Let’s talk.” The popover closes on navigation, outside click, or Escape. The About link uses the homepage scroll routine when Home is already mounted. Desktop keeps its centered navigation.
- **Hero.** The mobile name is larger, the island sits higher, and the intro and two buttons center below it. A compact layout keeps both buttons on one row at 320 px. [hero-headline.js](../src/app/(home)/hero-headline.js) holds the rotating phrases for 4.4 seconds each. Hover or keyboard focus pauses the headline, and reduced motion uses the first phrase. There is no visible pause button.
- **Around the fire.** On mobile the portrait and heading come first, then the campfire island, then the prose and Resume link in one pane. Keep the desktop copy column wide and the mobile copy readable over the scene.
- **Latest work.** Desktop keeps the pinned preview, looping project videos, stacked tech icons, and eagle handoff. [work-showcase.js](../src/app/(home)/work-showcase.js) uses [work-cards.js](../src/app/(home)/work-cards.js) for the default desktop layout and [work-sheet.js](../src/app/(home)/work-sheet.js) for the opt-in Three.js shader version. At 960 px wide or less, or 620 px tall or less, Home reuses `ProjectCard` from [work-archive.js](../src/app/projects/work-archive.js). Mobile cards have no white backing, year, or description. They retain the project title, role, looping thumbnail, and expandable tech icons. Preserve the stack order and overlap.
- **What I bring along.** [content.js](../src/app/(home)/content.js) owns the five skill stops and tech lists. [skill-card.js](../src/app/(home)/skill-card.js) follows the selected scroll stop, slides and fades between panels, and measures the active card for content-driven height. Six tools are visible by default. Extra tools stagger in and out, and the collapse control follows the last tool. Long panels can scroll internally on phones. The mobile panel is bottom-aligned, with the heading and wagon above it. Keep the first stop’s scroll runway so it has time to read.

## Shared UI, content, and media

- [globals.css](../src/app/globals.css), [ui.css](../src/app/ui.css), and [scenes.css](../src/app/scenes.css) hold typography, content widths, button states, glass treatments, and scene framing. Use Inter, natural heading spacing, and the shared violet punctuation via [Heading](../src/app/heading.js). Older prototype styles are archived under [docs/archive](./archive/).
- Write first-person copy for engineering recruiters and potential clients. Keep it direct and avoid em dashes. The hero conveys full-stack software engineering and 5+ years of experience. Skills prose should explain the engineering work and product judgment. Keep specific framework, platform, and database names in the icon chips and project evidence in Work. Keep the AI chip and MongoDB in the relevant Skills lists.
- [projects.js](../src/lib/projects.js) owns project order, copy, and media. [project-loop.js](../src/app/project/project-loop.js) supports muted, looping previews with a still fallback. The owner explicitly restored the videos and wants them to behave as thumbnails, without visible playback controls. [project-image-sizes.json](../src/lib/project-image-sizes.json) reserves still dimensions. Run `npm run measure:images` after changing stills.
- [contact.js](../src/app/contact/contact.js) uses the selected split layout on desktop and stacks it on mobile. The homepage and Contact both read “Open to meaningful opportunities” from [src/lib/contact.js](../src/lib/contact.js). “Book a call” currently opens an email because there is no booking URL configured. Keep [contact-form.js](../src/app/contact/contact-form.js) and [public/__forms.html](../public/__forms.html) in sync for Netlify.
- Homepage CMS wiring is documented in [docs/prismic.md](./prismic.md). Check which fields [home.js](../src/app/(home)/home.js) actually consumes before editing the CMS. Several paragraphs are now authored directly in the component. Published CMS changes reach the exported site on the next build and deployment.
- Check [iconbuddy.json](../iconbuddy.json) for approved assignments before adding icons. The new `main-menu` assignment uses Tabler’s menu icon. Model provenance and attribution live in [public/models/CREDITS.md](../public/models/CREDITS.md).

## Verified and open

- The final production build passed, including the project media, image dimensions, icon assets, and contact form checks. `git diff --check` passed.
- Browser checks covered the 320 × 640 hero, the 390 × 844 homepage sections and Contact badge, the mobile menu and About jump, a project tech disclosure, and the desktop archive and pinned Work layout. Iconbuddy found no missing files and flagged existing inline SVG markup in `src/app/iconbuddy-icon.js`.
- Physical phone testing and performance profiling remain open. Verify touch scrolling through the Skills card, the last expanded chip row, and the scene handoffs on a real phone before tuning motion.
- Netlify form delivery still needs verification on a deployed site. The latest local work has not been deployed.
- The editorial homepage without 3D was discussed as a possible alternate experience. Treat it as an idea for a future brief.
