# Prismic: first connection

Repository: **Brainilio Portfolio**, API ID `3e52fa3b`.
Dashboard: https://3e52fa3b.prismic.io

## Edit the homepage

The single **Homepage Copy** document is created and published with the current homepage wording. Open it, edit the fields you want to change, and publish it again.

Direct editor: https://3e52fa3b.prismic.io/builder/pages/avNdHRIAACwAXPk8?s=published The document has eight fields: Introduction, Technology line, About heading, About description, Current role, Skills heading, Contact heading, Contact description.

Blank fields and a missing published Homepage Copy document use the current wording. Content is rendered as plain text, retaining the site's existing layout and animations. Project case studies, skill lists, models, and scene configuration are still managed in code.

The CLI manages models, not page content. The initial document was created through the dashboard. The local model was generated with the Prismic CLI; use that CLI or Type Builder for future model changes, rather than editing model JSON by hand.

## Development and publishing

Run `npm run dev` to see published content locally. Refresh the page after publishing. Production uses Next.js `output: "export"`: **publish in Prismic, then rebuild and redeploy the site**. Publishing alone does not update the exported website. A deploy webhook can automate the rebuild once the hosting provider is confirmed.

Draft/live previews are not configured: Next.js preview cookies and dynamic route handlers require a server deployment. The initial integration intentionally keeps the current static hosting setup.

The repository name and routes live in `prismic.config.json`. `src/lib/prismic.js` fetches content only on the server/build. A public Content API needs no token. If the API is made private, add its read token as `PRISMIC_ACCESS_TOKEN` in `.env.local` locally and in the deployment environment. Do not add write tokens to application configuration.

Only a missing document falls back; network and authentication errors fail the build so outdated copy is not silently shipped.
