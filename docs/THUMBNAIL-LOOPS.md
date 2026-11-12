# Project thumbnail loops

Short, silent motion loops that reconstruct each project's real site: brand-colour gradient, a browser window, a cursor that clicks through the actual screens. They play on the projects page, the homepage Work sheets and the detail pages, and are meant to work as Instagram posts later.

## Current loops

| Project | File | Length | Idea |
|---|---|---|---|
| NewCold | `public/projects/newcold/thumbnail-loop.mp4` | 8 s | Hero photo with the logo assembling → camera flies through the mark's empty centre square into the facilities map → pins ripple, Wakefield panel slides in → pull back out. |
| MyCompassion | `public/projects/my-compassion/thumbnail-loop.mp4` | 8 s | Compassion-blue gradient, white logo bottom right; portal window where the cursor clicks Home → My Sponsored Children → Give a Gift. |
| Compassion Checkout | `public/projects/compassion-checkout/thumbnail-loop.mp4` | 10 s | Basket icon tapped → checkout grows out of it → form fills, card typed (blurred) → review → submit → confirmation → basket turns into a green check, which turns back into the basket as the loop restarts. |
| Crapp (commercial) | `public/projects/crapp/thumbnail-loop.mp4` | 14 s | Not the window template: a short ad, Title Case, Poppins (the app's font), real motion blur. "Need To Go?" with the nervous mascot (sweat drops) → the app flies in, crash zoom into Map → the map opens, pins pop, "Find." with the mascot peeking in → whip pan → "Check." over the scrolling detail screen with label chips → crash zoom into the Go Now button → "Go Now!" with the thumbs-up mascot (speech bubble masked off) → a drawn street map: the route draws, the location dot follows it to the restroom pin, "Relief Found." → app screens scroll behind the end card, the city rises, Crapp wordmark, "Find. Check. Go Now." (evenly spaced), the relaxed sunglasses mascot → iris back to white. Mascot variants are composites of the four supplied poses; no new art was generated. |
| Crapp (walkthrough) | `public/projects/crapp/walkthrough.mp4` | 10 s | Phone on Crapp blue: Explore → Map → pin card → Poopmergency; shown on the detail page. |
| Compassion Authentication | `public/projects/compassion-auth/thumbnail-loop.mp4` | 9 s | Checkout's look with a **person icon** instead of the cart: icon tapped → login window grows out → camera pushes in on the card → username and password typed → Continue → MyCompassion → back into the icon, now a green check. Phone recording (`phone-recording.mp4`, 12 s): create account with the password rules ticking off live → log in → signed in. Staging, test account. |
| HKliving | `public/projects/hkliving/thumbnail-loop.mp4` | 12 s | The homepage's sideways scroll, section by section, then a motion-blurred whip back. Built from 13 Wayback captures (9 Dec 2022) with the header lifted off and laid back on with multiply; the archive lost the photos, so HKliving's own campaign photos (still on images.prismic.io) are composited into each measured slot. Also `search.mp4` (search panel drops over a product page, popular searches, "ceramics" typed, loading) and `press-room.mp4` (product library, packshots loading in; packshots are current HKliving ones relabelled with their own codes, since the archived ones are gone). |
| Garcia & Jeans Centre | `public/projects/jogg-group/thumbnail-loop.mp4` (both windows overlapping, Jeans Centre offset 5 s; `work/jogg/fg.txt`), built from `public/projects/{garcia,jeans-centre}/shop-flow.mp4` | 10 s | Live store, same platform: listing → product → size → added to bag (mini bag) → the bag, camera pushes in on the accepted payment marks with a ring on Apple Pay → checkout step one. Nothing ordered; no personal data entered. `?scene=shop&brand=garcia|jeanscentre`. |

Each loop has a `thumbnail.jpg` poster next to it (used as `previewImage`).

## How they're made

- Source: `work/thumbs/index.html` (in ignored `work/`; canvas 2D, one function per scene: `newcold` (nc), `mycompassion` (mc), `checkout` (co), `crapp` (cr), `crappAd` (ad)). Crapp sources: `~/Desktop/CRAPP SENSITIVE /Screenshots` (raw 1125×2436 screens, mascot poses, App Store screens) and `~/Desktop/Crapp-App-Store-Assets`; door codes are blurred.
- Preview a still: serve the folder with `node work/thumbs/serve.mjs "$PWD/work/thumbs" 5181 "$PWD/work/thumbs/frames"`, then open `http://localhost:5181/?scene=co&t=4.5` (`nc`, `mc`, `co`).
- Render: open `?scene=<name>&render=1`; every frame (30 fps) is posted to `work/thumbs/frames/<scene>-NNNN.jpg`. The tab title changes to `done` when finished.
- Encode:
  ```bash
  ffmpeg -framerate 30 -i work/thumbs/frames/co-%04d.jpg -c:v libx264 -pix_fmt yuv420p -crf 21 -preset slow -movflags +faststart -an public/projects/<slug>/thumbnail-loop.mp4
  ```
- Raw captures: `work/checkout/shots/` (desktop 01–12, Safari 13–14, phone m1–m5) and `work/newcold/shots/`. They are unblurred, so keep them out of `public/`.

## Rules we've settled on

- Reconstruct the real site and use it live (cursor, clicks, page changes); no stacked-card flips, which looked scrappy.
- Client work: brand gradient background, real client logo bottom right; no typed project names in the artwork.
- Own products (Crapp) can be a proper commercial: full-bleed beats, crash zooms, whip pans, motion blur, the product's own font (Poppins for Crapp) and mascot; keep copy short and skip decorative filler.
- No identifiable children or families: blur child photos, names, birthdays and "Add Birthday Gift for …" lines; blur card numbers, emails and any real personal details. Contact details in captures are test data.
- Loops are seamless: the last frame matches the first.
- Captions say what the owner actually built (e.g. Checkout = Apple sign-in, not Apple Pay).

## Later

- [ ] Export Instagram versions of each loop: square 1080×1080 and 4:5 1080×1350 (recompose the window and logo per format rather than cropping).
- [ ] Give the next projects the same treatment (Compassion Authentication, JonnyOnTheSpot, …) once screens are available.
- [ ] Higher-resolution captures: the browser pane captures at ~800 px wide; full-resolution screenshots would make square/4:5 exports sharper.
- [ ] Optional: remove the unused older thumbnails (`thumbnail.svg`, `thumbnail-header.mp4`, `thumbnail-motion.mp4`) from `public/projects/newcold` and `public/projects/my-compassion`.

## Detail pages: device scenes and scroll motion

- Device scenes: screenshots keyed into green-screen photos (Unsplash) at `work/thumbs/assets/scenes/` (desk-typing, shoulder, shoulder2, phone-hands, phone-sofa). Render one with `?scene=mock&bg=scenes/<photo>.jpg&shot=assets/shots/<shot>.jpg&still=1&out=<name>`: the screen's edges are line-fitted (ignoring hands and hair), the shot is warped in, and the green key keeps hands in front. Output goes to `public/projects/<slug>/scene*.jpg` with `presentation: "scene"`.
- Scroll motion: `ProjectMedia` gives each block one of rise, zoom, slide-left, parallax, tilt, slide-right, rotating down the page from a per-project starting point (from the slug), so pages move differently. An item can pin one with `motion`. Reduced motion turns it all off.

## Showreel guide (from the owner)

How to build a showreel or reel that wins clients — share the process, not just the result, so clients feel confident and calm:

1. **Research:** study existing showreels for pacing (typically 45–60 seconds), music and how case studies are presented.
2. **Storyboard:** plan a narrative arc — first client conversation and sketching → branding → final implementation. Use short, punchy lines (e.g. "Exciting results, calm process").
3. **Prepare:** motion-graphics templates can help; film real footage in good natural light from varied angles.
4. **Edit:** organise assets, then cut to the beat of the music — matching cuts to the beat is the crucial step.
