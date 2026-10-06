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

Vercel reads `vercel.json` and publishes only `dist/frontend`. Verify the production deployment reaches READY for the exact pushed SHA; check this stable URL, both solo difficulties and saved-run loading. Preserve the clean main-menu layout: START RUN starts Normal (125 HP, up to four streaks), and a small arrow inside its right edge opens START HARD MODE (100 HP, up to five streaks). Difficulty details appear only in the dropdown, without a separate row. Saves and retries retain their mode. Both heal only on wave clear. Multiplayer and map selection remain hidden. GitHub's Vercel commit status provides deployment evidence.

`deployment.json` explicitly declares `backend: null`. Frontend mode disables Socket.IO and server-provided analytics configuration. Do not deploy Express, create PC tasks/tunnels, or add another game's backend URL. Future multiplayer requires an explicitly authorized and tested backend.

Google Cloud billing was disabled on 2026-10-04. Its configuration is historical recovery material, not an available running fallback. Preserve remaining resources/settings and keep billing and deployment triggers disabled.

For recovery, promote a previously verified Vercel deployment and fix/revert the affected commit on main before the next push. Preserve the production alias so website links keep working.
