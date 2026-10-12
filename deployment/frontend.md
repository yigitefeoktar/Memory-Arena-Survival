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

Both difficulties use player shots at the original constant 120 px/sec from launch, with no initial speed burst. The higher firing rate remains at an 800 ms base interval. Their short cyan capsule and white core distinguish them from unchanged enemy shots. Player shots sweep their whole flight path to hit the nearest target and stop at intervening walls or shields, including during slow frames. Save version 22 migrates older in-flight player shot velocities (including the 300 and 900 px/sec versions) to the original speed while retaining direction and ability multipliers.

Google Cloud billing was disabled on 2026-10-04. Its configuration is historical recovery material, not an available running fallback. Preserve remaining resources/settings and keep billing and deployment triggers disabled.

Regular enemy movement in both modes is 25% slower (33.75–45 px/sec); triangle charges stay at 350 px/sec. Version 23 saves migrate older regular speeds once. Nearby enemies drift apart gently within 2.5 times their combined radii, with a 24 px/sec cap and wall constraints, alongside the existing overlap solver. Inward movement eases near neighbours so pursuit cannot overwhelm the drift. Preparing or charging triangles do not drift. Solo shots validate the entire path from player to muzzle against arena and build walls, including each side stream, preventing wall-touching shots from spawning inside or past cover.

For recovery, promote a previously verified Vercel deployment and fix/revert the affected commit on main before the next push. Preserve the production alias so website links keep working.
