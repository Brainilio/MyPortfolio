# Portfolio project content brief

Updated 2026-11-05 from the owner's account in the portfolio chat. This is working context for future agents, not website copy. Preserve specific contribution boundaries: a project's dependencies are not proof the owner implemented every feature. Draft prose below needs editorial review, but the contribution facts come from the owner.

## Presentation decisions

- Prioritize current professional work and personal projects that reflect present capabilities.
- Keep existing early work under **Early projects & learning**. It documents development over time and should not lead the homepage showcase. Keep its routes and assets.
- Images are essential. Lead with an accurate project screenshot or Figma design, concise context, personal contributions, and selected technology/role pills.
- External live-site links are optional; the portfolio must stand on its own. Link to internal detail pages first.
- Clearly identify concept work; do not imply a commissioned or launched product. Do not dismiss straightforward sites as “dirt simple” in public copy.
- Do not invent metrics, dates, personal ownership, features or screenshots. The reported Google search result for JonnyOnTheSpot needs supporting detail before turning it into a measured claim.
- The owner will provide more screenshots/Figma links later. Crapp reference: https://getcrapp.app/; the owner recalls more materials in an earlier ChatGPT conversation. That conversation has not been retrieved. A web fetch of the site failed; no site content was verified.
- Existing usable media: public/projects/my-compassion/ and public/projects/newcold/, each with poster.jpg, 1–9.jpg and preview.mp4. MyCompassion media is documented as sanitized: do not reintroduce identifiable account/child information.

## Current project inventory and draft positioning

### Crapp — 2026 — personal project

Owner's personal project. Stack confirmed by the owner: React Native, Expo, TanStack React Query, Supabase. Draft role pills: Personal project, Mobile development. Do not infer its functionality from its name or claim additional features from another chat without retrieving that context. Need screenshots and a short product description. Reference: getcrapp.app.

### MyCompassion — 2026 — professional work

Supporter portal. Draft summary: “Connecting the supporter experience from frontend components to GraphQL services, authentication and caching.”

Personal work: integrating GraphQL in AWS AppSync, connecting React Query to components, building frontend pieces, backend Lambdas, caching and Redis cache design, some infrastructure work, and connecting authentication to the site. NX monorepo. Selected pills: Next.js, TypeScript, NX, AppSync / GraphQL, React Query, Lambda, Redis, SST. Role: Full-stack development. Broader app context includes DynamoDB, ElastiCache and Cognito; do not suggest sole ownership of the platform.

### Compassion Checkout — 2024 — professional work

Owner specifically worked on the Apple authentication stories. Draft summary: “Contributing Apple sign-in to Compassion's Next.js checkout experience.” Role: Authentication integration. Pills: Next.js, Apple sign-in. The app has payments/fraud infrastructure, but the owner has not claimed implementing it. Do not confuse Apple sign-in here with Apple Pay on the retail sites. Treat 2024 as contribution year; the detailed shared stack below describes the supplied app snapshot, not necessarily its 2024 versions.

### Compassion Authentication — 2025 — professional work

Initial core login/logout and verification components; integration with Cognito and handling/passing/decoding JWTs. Draft summary: “Building the core sign-in, sign-out and verification experience around Cognito.” Pills: Next.js, React, Cognito, JWT. Role: Frontend development, Authentication integration. JWT decoding is not the same as signature verification: do not claim the latter as personal work without confirmation.

### JonnyOnTheSpot — 2023

Straightforward Next.js landing page and design. Owner reports top Google search results; keyword, location, date and evidence are not yet supplied. Draft summary: “A focused landing page designed and built for a clear local-business presence.” Pills: Next.js, Web design. Role: Design & development. Need screenshots, exact brand spelling and business context.

### Personal Trainer — 2026 — concept available for adoption

Business and competitor research, fresh rebrand and Figma design. Draft summary: “A research-led brand and website concept for a personal training business.” Pills: Figma, Competitor research, Brand concept. Role: Research & design. Not a confirmed production implementation. Owner says the concept is up for grabs.

### IAmKarinaRodriguez — 2026 — concept site

Owner designed in Figma and built with Next.js, Framer Motion, Prismic CMS and Tailwind CSS. Draft summary: “A custom website concept pairing a fresh visual direction with editable content and considered motion.” Role: Design & development. Need screenshots and business context; retain concept label.

### Crystal Living — 2026 — realtor website

Figma design and development using Next.js, Framer Motion, Prismic CMS and Tailwind CSS. Draft summary: “A realtor website with a custom visual identity, editable content and subtle motion.” Role: Design & development. Need images and exact launch/client status.

### GARCIA and Jeans Centre — professional work at foryouandyourcustomers

References supplied: http://wearegarcia.nl/ and http://jeanscentre.nl/. Retail work included Apple Pay, GraphQL migration and performance optimization. Dates and allocation of each contribution to each brand remain unconfirmed; preserve them as a joint account until clarified. Suggested pills: E-commerce, Apple Pay, GraphQL, Performance. Do not invent a frontend framework or performance measurements.

### NewCold — professional work at DPDK, after graduation

Owner specifically worked on the homepage map feature. Existing site data describes an interactive facilities/offices map. Draft summary: “Contributing the interactive map on NewCold's website.” Role: Frontend development. Existing tags include Next.js, React, Mapbox and Tailwind; retain only those verified for the owner's work. Date unconfirmed. Existing images and preview video available. Reference: https://newcold.com/.

### HKLiving — professional work at DPDK, after graduation

Animations, product card designs, authentication, search-bar animation and search integration. Draft summary: “Building animated product and search experiences, with authentication integration.” Role: Frontend development. Framework/date unconfirmed. Reference supplied: https://www.awwwards.com/sites/hkliving. Need screenshots.

### Count — professional work at DPDK, after graduation

Worked on the website. Specific contribution, stack and date not yet described; do not expand the claim. Reference: https://www.countgroup.com/. Need scope and screenshots.

### Sobolt — thesis, component library and cloud work

Owner completed a thesis and worked on a component library and the company's cloud. Topic, responsibilities, stack, dates and results need detail. May be one case study or several once the material is available. Draft role labels: Thesis, Component library, Cloud development. Do not invent a thesis subject.

## Compassion technical context — internal reference, not publication copy

The following is the supplied app/dependency snapshot, not a claim of individual ownership or proof of historical versions. Summarize only relevant public-facing technologies on case studies. Do not copy private network architecture, permission details or internal package names into public pages.

Shared: Next.js 16 App Router, React 19, TypeScript 5.9+, NX monorepo; SST 4, Pulumi and OpenNext; Node 22 Lambda runtime; CloudFront, S3 and VPC; ElastiCache/Redis via ioredis; Secrets Manager; Lambda Powertools logging. Zustand/Immer, TanStack React Query, React Hook Form/Zod, Ky/graphql-request, i18next/react-i18next. SCSS modules/Sass, Radix UI, ARK design system. Optimizely, GTM. Jest/Vitest/Playwright/Testing Library/MSW. Hoisted dependencies do not prove usage by every app.

MyCompassion apps/my: supporter portal on Lambda/CloudFront/S3; Redis; private networking across Cloudflare, AWS and on-prem systems; Secrets Manager; default caching disabled for auth-cookie handling, optimized static assets. Contentful SDK/model/rich-text rendering; @sola/multisite, @sola/supporter-sdk, @sola/config. Owner separately confirms AppSync/GraphQL integration, Lambdas and some infrastructure work.

Checkout apps/checkout: Lambda/CloudFront/S3, Redis, private VPC config, SNS publishing to the Fide transaction topic, Secrets Manager including PayPal config, default caching disabled for cart/auth/payment cookies and optimized static assets. PayPal server and React SDKs, Kount, TokenEx, card-validator, credit-card-type, currency.js; @sola/cart-sdk, @sola/checkout-sdk, @sola/supporter-sdk. These are app capabilities, not the owner's claimed contribution.

Auth apps/auth: Lambda/CloudFront/S3, Cognito User Pool and administrative Cognito API permissions, Redis, private network integration, Secrets Manager holding Cognito/JWT/handoff configuration, CloudFront CORS/HSTS policy. jose and aws-jwt-verify; Salesforce Marketing Cloud email triggers for username recovery, password reset and account updates. No credential values were supplied. Keep internal configuration/permission specifics out of the portfolio.

## Image and motion direction

- Detail page: project title, short description, year/context, clear “My contribution” section, role pills and a restrained set of technology pills; large lead visual and supporting screenshots with meaningful captions.
- Concepts can use actual Figma exports and clearly labelled device mockups; do not generate fictional UI as project evidence.
- Motion option: a short, silent loop built from real screens—slow camera moves, layered screens, UI close-ups and gentle transitions. Use recordings for actual interaction demonstrations, rather than inventing behavior from a still.
- Keep motion behind/adjacent to content; place readable text on a stable surface. Poster-first loading, playsInline, muted playback, visible pause/play control, pause when offscreen/hidden, reduced-motion still fallback, and no critical information available only in the loop. If a clip communicates information, include equivalent text/captions.
- Prefer one video playing at a time and load near viewport. Compare MP4/WebM sizes; retain a useful static poster and avoid loading every project video on the homepage.
- Existing detail pages currently render images only despite previewVideo fields on two projects. Video authoring/exports and new media collection remain future work; no new video was generated in this session. ffmpeg was not found on PATH.

## Next content pass

1. Collect the forthcoming images/Figma links; get a concise Crapp description from the owner or verified source.
2. Confirm unknown dates, DPDK/retail contribution allocation, Count/Sobolt scope, and concept/live status.
3. Populate current entries without replacing missing visuals with unrelated screenshots.
4. Build image-first detail pages with contribution sections and role/technology pills, including design concepts in the archive (the current archive filters to Development only).
5. Create a pilot motion loop from existing MyCompassion or NewCold media, then review its style before expanding.

No commits, pushes or deploys are authorized by this brief.


## Implemented showcase pattern — 2026-11-05

Reference inspected in the user's in-app browser: https://trionn.com/work/loftloom. Adopted the pinned project summary and scrolling mixed-media gallery, adapted to the portfolio's violet palette and nature identity.

- Cards/homepage: image, name, one-sentence `highlight` of personal contribution, year/role; archive includes company context and selected technology pills. Older entries fall back to existing descriptions.
- Detail data: optional `company`, `role`, `responsibilities` array, `description`, existing `dateCreated`, and `media` array. Unknown facts are omitted, not invented. MyCompassion/NewCold use owner-supplied contribution facts.
- Media item: `type` (image/video), `src`, `alt`, optional `poster`, `caption`, `layout` (wide/half/portrait), `presentation` (plain/tablet/atmosphere), `tone` (CSS color). Images preserve their natural ratio; portrait media stacks on mobile. Tablet framing is explicitly styled presentation, not evidence of actual device testing.
- Videos use existing MP4s with posters, native controls and no autoplay. They pause offscreen and when the document is hidden. No new video exports were authored.
- Description is an optional disclosure; responsibilities remain directly visible. Historic process text remains after the gallery.
- Closing contact section: original procedural 3D woodland island, lazy-loaded, capped pixel ratio, static on-demand rendering and resource disposal; mailto plus homepage coast contact link. Next project navigation stays within current/early work respectively.
- Implementation: src/app/project/[slug]/page.js; project-media.js; sticky-summary.js; woodland.js; project.css. The sidebar accounts for its measured height rather than trapping content below short viewports.

## Thumbnail references and compact phone media — 2026-11-05

- MyCompassion and NewCold use public/projects/<slug>/thumbnail.svg for previewImage. These self-contained SVG layouts embed existing screenshots without modifying the originals; they work as HTML previews and Three.js textures.
- Shared art direction: 1600×1000 cover, project name and concise contribution on the left, layered interface screens on the right, small technology/role pills, subtle contour lines. Warm lilac for MyCompassion; cool blue and a map-focused screen for NewCold.
- Source generator: scripts/project-thumbnails.py (Python standard library only). Run python3 scripts/project-thumbnails.py from the checkout to regenerate both covers. Existing posters remain for video and original assets are preserved.
- NewCold screenshots 7–9 are actual 390×844 phone captures. They now use portrait layout/phone presentation in compact padded boxes, with a 170px frame on desktop and 150px on small phones. Full screenshot proportions are retained. Other portrait images are detected on load; explicit portrait layout avoids a layout shift.

## Motion direction correction — 2026-11-05

The owner rejected text-heavy thumbnail artwork. Thumbnail art must contain only the actual screenshot compositions; names, responsibilities and tech pills belong outside the image. The two KOTA screen recordings supplied in chat show compact showreels: stacked screen layouts, focus changes, close-ups and transitions within cards. These replace the previous text-led cover direction.

Current outputs: public/projects/my-compassion/thumbnail-motion.mp4 and public/projects/newcold/thumbnail-motion.mp4. Both are eight-second, silent, 1280×800/24fps H.264 loops made from existing screenshots: overview stack → enlarged detail → crossfade to another screen → return to the start. Static thumbnail.svg covers have no added visible text. Existing detail-page preview.mp4 films remain separate and unchanged.

Source: scripts/render-project-motion.py (FFmpeg via temporary imageio-ffmpeg in ignored work/video-tools). Reference-frame inspection and temporary authoring dependencies remain under work/. No reference recordings or authoring tools ship to the browser.

ProjectThumbnail supplies lazy in-view motion on archive/phone cards, pause/play controls outside the linked artwork, offscreen/hidden-tab pause, and a static reduced-motion fallback that responds to preference changes. Desktop Work sheets use VideoTexture with poster fallback and a “Pause previews” control; offscreen/hidden/reduced-motion playback stops. The original screenshots and text outside thumbnails are preserved.


## NewCold direction replaced — 2026-11-05

The owner rejected the motion studies. NewCold now uses the supplied white logo on a plain matching navy background, with a desktop/laptop map screenshot and one smaller phone screenshot beside it. No added copy or animation in its thumbnail. Its thumbnailVideo field has been removed, and the rejected MP4 is preserved under work/newcold/ rather than shipped. MyCompassion awaits further direction.

New supplied media: cleaned public/projects/newcold/map-burley.jpg, map-tacoma.jpg, desktop-home.jpg and mobile-home.jpg; logo.png is the supplied logo. Browser chrome, dock and the unrelated window alongside the narrow browser were removed before placing files under public/. The new stills have been added to NewCold's detail gallery. Sources and both supplied recordings are preserved in ignored work/newcold/source/. The recordings show the desktop homepage hero video and a narrow-screen image carousel; they are reference material and do not expand the owner's claimed map responsibilities.

NewCold source cover generator: scripts/newcold-thumbnail.py, also invoked by scripts/project-thumbnails.py. It composites the actual logo and prepared screenshots as a self-contained SVG, including a logo alpha filter to avoid a visible background rectangle from the supplied color profile.

NewCold hardware refinement: the owner requested sleeker bezels. The same composition now has a thin graphite laptop rim, shallow metal base, and a near edge-to-edge phone with a small camera cutout. Source remains scripts/newcold-thumbnail.py.


## Confirmed NewCold treatment — minimal screens and actual footage

The owner rejected both hardware-frame iterations and explicitly chose **minimal screen frames with almost no visible hardware**. Do not reintroduce a laptop base, camera cutouts, phone controls, metallic bezels or additional mockup hardware. Keep the supplied logo and plain navy backdrop.

The owner then requested the supplied header recording in the landscape screen, or the carousel-scrolling recording in the portrait screen. The implemented composition uses both actual recordings in fixed, thin-edged screen panels. Only the real sites move inside; the panels and logo remain still.

- Current motion asset: public/projects/newcold/thumbnail-preview.mp4, 1280×800, 24fps, 9.36 seconds, silent; about 527 KB. thumbnailVideo points to this asset.
- Source: scripts/render-newcold-preview.py, reading work/newcold/source/recording-163705.mov and recording-163846.mov. It also prepares header-poster.jpg and carousel-poster.jpg.
- Static fallback: thumbnail.svg generated by scripts/newcold-thumbnail.py; it uses the same panel positions and actual recording stills. Existing pause/offscreen/hidden-tab and reduced-motion behavior is reused.
- Header and carousel footage are overall site context; the owner's specifically claimed NewCold contribution remains the interactive map.


## Final refinement: one video panel, preserve source proportions

The owner clarified: **one video device, not both**, and no stretching or quality reduction. NewCold now shows only the desktop header recording in a minimal landscape panel. The portrait/carousel panel is removed from the cover.

The source recording is 3454×1722. The renderer uses proportional width-based scaling (`scale=1360:-2`), without fill/stretch/cropping, and a 2560×1600, 30fps H.264 export at CRF 16 for a high-density thumbnail. Current thumbnailVideo: public/projects/newcold/thumbnail-header.mp4. The matching SVG poster uses `preserveAspectRatio="xMidYMid meet"`. These are high-quality delivery encodes, not claims of lossless preservation. The original source recording is kept unchanged under work/newcold/source/.
