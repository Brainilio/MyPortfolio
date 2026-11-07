# Project thumbnail loops

Short, silent motion loops that reconstruct each project's real site: brand-colour gradient, a browser window, a cursor that clicks through the actual screens. They play on the projects page, the homepage Work sheets and the detail pages, and are meant to work as Instagram posts later.

## Current loops

| Project | File | Length | Idea |
|---|---|---|---|
| NewCold | `public/projects/newcold/thumbnail-loop.mp4` | 8 s | Hero photo with the logo assembling → camera flies through the mark's empty centre square into the facilities map → pins ripple, Wakefield panel slides in → pull back out. |
| MyCompassion | `public/projects/my-compassion/thumbnail-loop.mp4` | 8 s | Compassion-blue gradient, white logo bottom right; portal window where the cursor clicks Home → My Sponsored Children → Give a Gift. |
| Compassion Checkout | `public/projects/compassion-checkout/thumbnail-loop.mp4` | 10 s | Basket icon tapped → checkout grows out of it → form fills, card typed (blurred) → review → submit → confirmation → basket turns into a green check, which turns back into the basket as the loop restarts. |
| Crapp (commercial) | `public/projects/crapp/thumbnail-loop.mp4` | 12 s | Not the window template: a short ad. "Need to go?" with the mascot → the app flies in and the camera crash-zooms into Map → the map opens, pins pop, "Find." → whip pan → "Check." over the scrolling detail screen with label chips → crash zoom into Go Now → the go-now mascot → app screens scroll behind the end card, the city rises, Crapp wordmark, relief-found mascot. Poppins (the app's font), real motion blur (sub-frame averaging), iris back to white. |
| Crapp (walkthrough) | `public/projects/crapp/walkthrough.mp4` | 10 s | Phone on Crapp blue: Explore → Map → pin card → Poopmergency; shown on the detail page. |

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
