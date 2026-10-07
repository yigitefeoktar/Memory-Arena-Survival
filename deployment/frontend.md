# Frontend release

Production: https://memory-arena-survival.vercel.app/

Vercel project: `memory-arena-survival` (`prj_0W2mJ2sohdbT1eRyF8Qwb28e40mH`). Its GitHub integration uses `main`.

Before pushing an authorized release, run:

```sh
npm ci
npm run lint
npm test
npm run build:frontend
```

Vercel reads `vercel.json` and publishes only `dist/frontend`. Verify the production deployment reaches READY for the exact pushed SHA; check this stable URL, both solo difficulties and saved-run loading. Preserve the clean main-menu layout: a small arrow inside START RUN opens a Normal/Hard selector (both use 100 HP, 24 starting enemies and a three-streak cap; Normal regenerates during waves, Hard does not). Normal is selected by default; selecting either mode does not start the game. START RUN starts the selected mode. Keep the button seamless without a separator, with matching hover effects across the whole button for the main part and only the arrow area for the small part. Difficulty details appear only in the dropdown, without a separate row. Saves and retries retain their mode. Normal restores 2% of maximum HP per second during active play without a damage delay; Hard has no in-wave regeneration. Both fully heal on wave clear. Older saves migrate four- or five-streak progress to the three-streak cap and remove baked wave speed boosts while retaining their difficulty. Enemy speed stays constant across waves and elapsed time. Multiplayer and map selection remain hidden. GitHub's Vercel commit status provides deployment evidence.

`deployment.json` explicitly declares `backend: null`. Frontend mode disables Socket.IO and server-provided analytics configuration. Do not deploy Express, create PC tasks/tunnels, or add another game's backend URL. Future multiplayer requires an explicitly authorized and tested backend.

Google Cloud billing was disabled on 2026-10-04. Its configuration is historical recovery material, not an available running fallback. Preserve remaining resources/settings and keep billing and deployment triggers disabled.

For recovery, promote a previously verified Vercel deployment and fix/revert the affected commit on main before the next push. Preserve the production alias so website links keep working.
