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

Vercel reads `vercel.json` and publishes only `dist/frontend`. Verify the production deployment reaches READY for the exact pushed SHA; check this stable URL, single-player and the multiplayer-unavailable notice. GitHub's Vercel commit status provides deployment evidence.

`deployment.json` explicitly declares `backend: null`. Frontend mode disables Socket.IO and server-provided analytics configuration. Do not deploy Express, create PC tasks/tunnels, or add another game's backend URL. Future multiplayer requires an explicitly authorized and tested backend.

Google Cloud remains a frozen fallback. Keep its disabled trigger, running revision and settings as they are.

For recovery, promote a previously verified Vercel deployment and fix/revert the affected commit on main before the next push. Preserve the production alias so website links keep working.
