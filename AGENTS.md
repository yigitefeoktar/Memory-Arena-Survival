# Memory Arena Survival repository instructions

Use the `game-deployment` skill. Its canonical version is [in Ricochet's GitHub repository](https://github.com/yigitefeoktar/Ricochet-Arena/tree/main/deployment/skills/game-deployment). The user replaced the Google Cloud workflow with GitHub main → Vercel frontend + optional PC backend.

## Release workflow

- GitHub source of truth: `yigitefeoktar/Memory-Arena-Survival`, branch `main`. Writable remote in the saved PC checkout: survival (verify its URL; origin in the saved PC checkout points to Memory-Arena). Verify the destination is `https://github.com/yigitefeoktar/Memory-Arena-Survival.git` before pushing; never push another game's code.
- Inspect Git status, preserve unrelated work, stage only task changes, run `npm run lint`, `npm test` and the relevant production build. Report actual failures. Commit authorized code/UI changes to main and push without force-pushing. Read-only work does not authorize releases.
- Frontend target: Vercel project `memory-arena-survival` (`prj_0W2mJ2sohdbT1eRyF8Qwb28e40mH`), team `team_xVwirII3Qvw8wj4rshxpfiL4`. Stable production URL: https://memory-arena-survival.vercel.app/
- GitHub main publishes this project's frontend. Use `npm run build:frontend` (Vite frontend mode) and `dist/frontend`; `vercel.json` declares the static build. Run lint, tests and this frontend build before pushing, then verify Vercel READY and the exact pushed SHA. Do not use the legacy combined/server build for Vercel.
- Frontend mode explicitly disables Socket.IO and ByteBrew configuration requests. Multiplayer displays an unavailable message with disabled room controls; single-player stays usable without this PC. To enable a backend later, require explicit authorization, a separate backend contract/URL and end-to-end tests before changing these build gates. Never inherit Ricochet's backend.
- Backend: explicitly disabled/deferred (`deployment.json` has `backend: null`). Multiplayer is not working/verified for this game yet. Do not install/update any PC backend, port, Windows task or tunnel. Server files/dependencies are not permission to enable one. Frontend-only games also use a missing/null backend declaration and skip all backend operations.
- Do not start a local development server unless asked. A bounded production smoke test may verify a release. Check the published menu, single-player, multiplayer notice and console errors. For rollback, promote a verified previous Vercel deployment and reconcile main so the next release retains the fix; keep this stable URL.
- Free services only; no domain purchase. Updates may end multiplayer matches once a backend is explicitly enabled; the user updates when nobody is playing.

## Frozen Google Cloud fallback

- Existing URL retained: https://memory-arena-survival-823233237078.us-west1.run.app
- Project `gen-lang-client-0375824487`, service `memory-arena-survival`, region `us-west1`.
- Cloud Build trigger `88a7d0a8-87cc-4d92-ba8a-efa88a989b0b` was disabled on 2026-10-03. Main pushes must not update Cloud Run. Do not re-enable/redeploy, change traffic/settings/secrets/domains, or delete it unless specifically requested.
- Historical configuration: `deployment/historical-cloud-instructions.md`, recovery reference only. Its old release steps are superseded by this file. Build/start scripts may remain as legacy material; do not use their Cloud deployment workflow.

For completed releases, report the verified frontend URL, short SHA and checks/deployment result. The Cloud URL serves its saved fallback version and is not evidence of a new deployment.
