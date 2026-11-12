# Hand-off for Codex — portfolio (brainil.io)

State as of 10 November 2026, branch `feat/next-portfolio-hero`, last commit `61d78fa6`. Nothing has been pushed; the owner pushes.
Read `AGENTS.md` first (Next.js 16 notes, 3D model rules). This file covers what changed recently, how the site is put together now, the owner's standing preferences, and what is still open.

---

## 1. Working rules (from the owner)

**Workflow**
- Commit after each change, with a plain message ending in the co-author line used in this repo. **Never push.** Don't commit `.DS_Store`.
- Build check: `NEXT_BUILD_DIR=.next-build-tmp npm run build`, then `rm -rf .next-build-tmp`. Never build into `.next` while `npm run dev` is running (it hangs the dev server on "Compiling").
- Dev server: `npm run dev` on port 3000 (`.claude/launch.json`, name `portfolio-dev`). `/?debug` turns off the Lenis smooth scroll, which helps when scripting scroll positions.
- Change only what the owner names. Keep the original sky palette.
- Leave the untracked files you didn't create alone: `.agents/`, `.claude/skills/`, `customtypes/`, `prismic*`, `skills-lock.json`, `me.png`, and the edits in `package.json` / `package-lock.json`.

**Copy**
- Plain, first person: "I built this / I worked on this."
- No fluff: no explaining what a client company does, no "screens from the Wayback Machine" provenance, no TestFlight or launch status.
- **No company names on the homepage**; they appear only on project pages.
- Freelance projects use the label "Freelance", not "Client".
- **No all-caps labels or eyebrows anywhere.**
- No captions under project media.

**Media**
- Tech-only visuals: no mockups with hands or people, and no uneven device bezels.
- Phone screens are combined into one bezel-free picture (2400×1240).
- Blur children's faces and any personal data.

**Accessibility**
- Text must stay readable on the moving sky. The owner rejects violet text on purple, and colour-shifting headings.
- They like a soft, *subtle* dark shade behind text on the sky. They hate visible dark blobs and frosted panels there.
- No underline on the hero's sliding phrase.

**Design**
- Inter for body text and the display font for headings, with violet accents.
- One button style: `ui-btn` (solid) and `ui-btn--secondary` (frosted). Labels roll on hover via `<Roll>`.
- Tech icons come from Iconbuddy (Tabler and Simple Icons) and are downloaded into `public/icons/tech`. Add a key to `src/lib/tech-icons.js` (or `UI_ICONS` in `scripts/fetch-tech-icons.mjs`), then run `node scripts/fetch-tech-icons.mjs`.

---

## 2. How the site is put together now

- **Static export:** `next.config` has `output: "export"` and `trailingSlash`. Netlify builds with `npm run build` and publishes `out/`; see `netlify.toml`.
- **Header:** `src/app/site-header.js` is a client component rendered once in `src/app/layout.js`, so it appears on every page, including the Lab and the 404 page.
  - **Layout:** wordmark on the left edge, links in a centred glass pill, "Let's talk" on the right edge.
  - **Scroll behaviour:** it fades up when you scroll down and returns when you scroll up, after 3 seconds idle, or on keyboard focus.
  - **Loading screen:** it stays hidden while the homepage loading screen is up (CSS `body:has(.ht-loader:not(.is-done))` in `ui.css`).
- **Footer:** `src/app/site-footer.js` has Email, LinkedIn, GitHub and a "Credits" dialog listing the 3D model attributions.
  - Homepage footer text is dark plum (`#3b2342`), because the page ends on a light rosy sky.
  - The contact page footer has a dark fade behind it.
- **Shared tokens and components:** `src/app/ui.css`; `src/app/tech-chip.js` (`Icon`, `Roll`, `TechChip`).

### Homepage (`src/app/(home)/`)

**Sections:** hero island → About (campfire island) → Work → Skills (park road) → closing card and footer. All the islands are drawn on one shared WebGL canvas (`stage.js`).

**Stage fix:** islands may now draw past the sides of their box (plain numeric `overscan`). This fixed a hard vertical cut along the clouds while the hero island scales in on first load.

**Hero (`home.js`)**
- "I build" followed by a sliding phrase in solid off-white, with no underline. The phrases are in `SLIDES`: cross-platform apps / full-stack platforms / serverless back ends / design systems / 3D on the web.
- Intro: "Software engineer with five years of shipping production products, from architecture to launch: React and React Native up front, serverless AWS behind them, and a designer's eye for the details. Originally from the Netherlands, now in Colorado." It's aimed at engineering recruiters at large tech companies.
- A faint radial shade (`.ht-intro::before`) sits behind the hero text.

**About**
- The owner's photo is `public/me.jpg`: a 360px square cropped from the untracked `me.png`, shown in the round `.ht-portrait`.
- Copy is in `home.js`. It names no companies; the location is Colorado Springs.

**Work (`work-showcase.js` + `work-cards.js`)** — final layout, chosen after comparing about 20 variants (all removed):
- **Heading and intro:** "Latest work" with one line under it (`INTRO`), both solid `#fbf7ff`, with a faint radial shade (`.wl-head::before`) and a close dark text glow.
- **Buttons:** "All work" is the primary button and "Lab" the secondary one.
- **Names:** the three project names are huge on the left. The active one is solid; the others sit at 28% opacity. The active project's role and tech icons (3 icons plus a "+N" count) sit underneath.
- **Screen:** the thumbnail loop plays on a big screen, **centred vertically in the section and fixed**; projects only crossfade on it. The owner asked for it not to move.
- **Sky and eagle:** the WebGL sky behind shows clouds, fading stars and a sun rising with the scroll. The bald eagle circles in the open sky above (`EAGLE_UP`), then flies on into Skills (`eagle-handoff.js`).
- **Projects shown:** `FEATURED` in `home.js` lists Crapp, MyCompassion and Karina's site.
- **Phones:** a plain list over the sky.

**Section menu:** the "Home / About / Work / Skills" pill at the bottom right slides away (`.is-away`, `inert`) once the footer is in view, so it doesn't cover the footer links.

**Closing card:** "Got an idea?", with Let's talk and Book a call buttons.

### Work page (`src/app/projects/`)

- **One card style:** thumbnail; name with "what I did" (the project's `role`) under it; two overlapping tech icons plus "+N", which don't spread on hover. Early projects sit in a collapsed `<details>`.
- **Project order** is the owner's explicit list in `ORDER` at the bottom of `src/lib/projects.js`:
  1. crapp
  2. my-compassion
  3. karina-rodriguez
  4. strength-without-pain
  5. compassion-auth
  6. compassion-checkout
  7. jonnyonthespot
  8. trend-trade
  9. jogg-group
  10. count-group
  11. newcold
  12. hkliving
  13. sobolt
  14. sobolt-components

  Early projects follow by year. The homepage, the Work page and the "Next project" links all use this order.

### Project pages (`src/app/project/[slug]/page.js`)

- Left column: Year, Company (or the "Freelance" label), Role, What I did, tech chips, About, and an optional **quote** (`project.quote = { text, by }`, styled `.case-quote`).
- Media reveal with a single fade-and-rise. There are no zoom, parallax or tilt effects and no captions.

### Contact (`src/app/contact/`)

- **Copy:** "Let's make it real." with the "Available for freelance projects" badge. Book a call and Email me sit at the top. LinkedIn and GitHub are round icon buttons.
- **Offer list:** in `OFFER` in `src/lib/contact.js`, shown as plain lines (deliberately not like the form's clickable options):
  - React Native & Expo apps
  - Websites & web apps
  - Back-end & AWS
  - Sign-in & payments
  - Features & performance
  - Design & design systems
- **Three-step form (`contact-form.js`):**
  1. What it's about: new website / new app / freelance or contract work / design / full-time role.
  2. The main goal; the options depend on the answer to step 1.
  3. Name, plus email **or** phone (at least one).
- **Netlify Forms:** the form posts to Netlify through the static copy at `public/__forms.html`. Netlify detects it at deploy time, so keep its field names in sync with the component. Submitting returns 405 locally, which is expected.
- **Layout switch still in place:** `?layout=1|2|3` (Split / Open / Docked), with a switcher at the bottom centre. The owner hasn't picked one yet.

### Project content updated in this period

- **Years** come from the owner. JonnyOnTheSpot is 2023 and NewCold is 2022.
- **Roles and copy** come from the owner's notes, LinkedIn and the 2023 resume. This covers Checkout (back end: SST, Cognito, DynamoDB cart, ElastiCache), Authentication, MyCompassion, Garcia & Jeans Centre (AWS pipeline, Lighthouse CI), HKliving, Trend Trade (startup MVP) and Count.
- **Freelance projects:** IAmKarinaRodriguez, JonnyOnTheSpot and Personal Trainer Concept are labelled "Freelance" and credited with design and development.
- **Sobolt Design System** (`sobolt-components`, 2021) is a new project:
  - **Thumbnail loop:** a tilted wall of the real Sobolt web components in Poppins.
  - **Assemble clip:** the components dropping into place one after another.
  - **Artwork:** the owner's design-system image.
  - **Quote:** a testimonial from the internship supervisors.
- **Where the media was made:** in the ignored `work/sobolt/`, by driving headless Chrome over the DevTools protocol (`cdp.mjs`, `wall.mjs`, `assemble.mjs`, `stills.mjs`) on the library's public render page (`iframe.html`). The Storybook's own interface asks for a password; it was not bypassed.

---

## 3. Open items

1. **Contact layout:** the owner should choose Split, Open or Docked. Then delete the other two layouts and the `.ct-switch`.
2. **Calendly:** `SCHEDULE_URL` in `src/lib/contact.js` is empty, so "Book a call" falls back to a mailto link. The owner will supply the link.
3. **Netlify:** form detection must be turned on in the site's Netlify settings. The first real submission can only be tested after a deploy.
4. **Karina's project name:** the owner asked for "IAmKarinaRodriguez", but a later edit of their own set `name` back to "Karina Rodriguez" (`src/lib/projects.js` line ~261). Ask before changing it.
5. **Contrast:** the shade behind "Latest work" and the hero text was made fainter at the owner's request. Contrast hasn't been re-measured since then. Earlier, at a stronger shade, the small intro line was about 4.2–4.8:1 against the lightest sky at the end of the Work section. If you change it, keep it subtle and lean on the text glow.
6. **Sobolt cloud platform** still lists "The Stencil web-component library, with Storybook" under What I did, although the library now has its own page. The owner hasn't said whether to remove the line.
7. **`me.png`** sits untracked in the project root (the original photo). Leave it unless the owner asks.

---

## 4. Useful files

| What | Where |
|---|---|
| Project data, order, quotes | `src/lib/projects.js` |
| Tech icon map / fetch script | `src/lib/tech-icons.js`, `scripts/fetch-tech-icons.mjs` |
| Contact details, offer list | `src/lib/contact.js` |
| Homepage | `src/app/(home)/home.js`, `home.css`, `stage.js`, `work-showcase.js`, `work-cards.js` |
| Header / footer / shared UI | `src/app/site-header.js`, `site-footer.js`, `ui.css`, `tech-chip.js` |
| Contact | `src/app/contact/contact.js`, `contact-form.js`, `contact.css`, `public/__forms.html` |
| Content background | `docs/PROJECT-CONTENT-BRIEF.md`, `docs/THUMBNAIL-LOOPS.md`, `docs/PROJECT-REFINEMENT.md` |
| Model credits | `public/models/CREDITS.md` (CC BY attribution must stay visible in the footer's Credits dialog) |
