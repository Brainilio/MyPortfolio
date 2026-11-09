# Project refinement checklist

Every project is listed on the site. The new ones are drafts: they have only the facts the owner has confirmed and a first screen or a placeholder. We'll go through them one by one to settle the story (what I did, year, company, tech), then clean up the media.

## New drafts (added 2026-11-08)

| Project | Slug | What's in place | To confirm | Media plan |
|---|---|---|---|---|
| Compassion Authentication | `compassion-auth` | Desktop: log in, filled log in, create account, reset password, recover username. Phone: create account, reset password, "already logged in". All from auth.stage.compassion.com with the test account. | My contribution, year, tech | Motion thumbnail like Checkout's, but a **person icon** instead of the cart. Mobile recordings of the auth flows (requested). Logging in lands on MyCompassion. |
| Garcia | `garcia` | Homepage (wearegarcia.nl). Role: back-end, Apple Pay. | Company/agency, year, tech, which screens show my work (checkout, Apple Pay) | Checkout/Apple Pay flow, ideally in Safari so the Apple Pay button shows. |
| Jeans Centre | `jeans-centre` | Homepage (jeanscentre.nl). Role: back-end, Apple Pay. | Same as Garcia | Same as Garcia. |
| Sobolt cloud platform | `sobolt` | Built from the owner's 2021 walkthrough recording (`work/sobolt/src`): thumbnail loop (dashboard into Reports), full walkthrough, five stills. Faces on request cards and the header avatar blurred. Tech: FastAPI, Python, React, Stencil (owner). Year 2021 from the recording. | Role (listed as full-stack, to confirm), what I built specifically | The walkthrough keeps Sobolt's own burned-in titles; stills are taken from moments without them. |
| Trend Trade | `trend-trade` | Placeholder thumbnail. Role: mobile app. | Story, year, tech | Owner's videos and photos. |
| HKliving | `hkliving` | Homepage from the Wayback snapshot the owner picked: `web.archive.org/web/20221209080256/https://hkliving.com/`. Year listed as 2021 (owner's word). | Year, company, role, tech. Check whether the headline overlapping the intro text is the real design or an archive artifact. | **Motion idea: the homepage scrolls sideways.** Build a loop of that horizontal scroll. Also capture the owner's work: the search bar animation, the cart animation, product detail pages and the Press Room. |
| Count Group | `count-group` | Placeholder thumbnail. Year listed as 2021–2022. | Owner will give the right Wayback date (the oldest automatic snapshot, Oct 2022, isn't the version they built). | Captures from that snapshot. |

## Media built (2026-11-08, second pass)

- Compassion Authentication: person-icon loop (thumbnail), phone recording, 9 screens.
- HKliving: sideways homepage loop (thumbnail), search reel, Press Room reel, product page and homepage stills with photos restored.
- Garcia and Jeans Centre: shop-flow loop each (thumbnail), listing, product, mini bag, bag (Apple Pay mark), checkout step one, phone product page.

Not possible yet, needs the owner:
- HKliving cart animation: the 2022 site's cart sits behind the B2B login and isn't in the archive. Need a video or the right snapshot.

Apple Pay step (2026-11-08, owner approved test details): went through guest checkout on both live stores with placeholder details (name "Test Portfolio", an example.com email, a public Amsterdam address), no account created, nothing paid. Captured the payment step with Apple Pay selected, desktop and phone. The browser used isn't Safari, so for the capture a display-only `ApplePaySession` stand-in was defined before checkout mounted (the sites only list Apple Pay when Safari reports support). The button's label was drawn in, because only Safari paints `-apple-pay-button`; it matches Safari's Dutch check-out button ("Reken af met  Pay"). The test address is blurred in every capture. A real Safari recording would still be the most faithful version if the owner has one.

## Existing projects to review

Crapp, MyCompassion, Compassion Checkout, NewCold, Karina Rodriguez, JonnyOnTheSpot, Strength Without Pain: check each story, year, company, tech and media.

## Notes

- Client background filled in by Claude (please check): Garcia is a Dutch jeanswear brand; Jeans Centre sells family clothing in stores across the Netherlands and online; Sobolt uses AI to inspect infrastructure such as wind turbines from images; HKliving is an Amsterdam interior and homeware brand; COUNT Group works in energy and petrochemical solutions (from its site title). Roles and contributions are only what the owner said.
- Trend Trade has no background yet: what the app does is still to come from the owner.

- Order: the drafts sit after Strength Without Pain for now, so the homepage's top four (Crapp, MyCompassion, Checkout, NewCold) don't change. Reorder once the stories are settled.
- Raw captures live in ignored `work/` (`work/auth/shots`, `work/sites/new`).
- No CC details, children or personal data appear in any of the new captures.
- Compassion Authentication signed-in screens: the staging test account signs in but its dashboard stays empty, so the desktop loop, the phone recording and the signed-in still land on the filled MyCompassion home from the MyCompassion project (children blurred, placeholder email). The phone dashboard is laid out in the renderer from that desktop capture; there's no real phone capture of it.
