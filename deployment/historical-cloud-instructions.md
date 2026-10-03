# Repository instructions

## Production deployment

- GitHub repository: `yigitefeoktar/Memory-Arena-Survival`
- Deployment branch: `main`
- Google Cloud project: `gen-lang-client-0375824487` (project number `823233237078`)
- Cloud Run service: `memory-arena-survival`
- Region: `us-west1`
- Cloud Build trigger ID: `88a7d0a8-87cc-4d92-ba8a-efa88a989b0b`
- Production URL: `https://memory-arena-survival-823233237078.us-west1.run.app`
- Health endpoint: `/api/health` (expect HTTP 200 and `status: ok`)
- Runtime: Node.js 24 buildpacks, `npm start`, port from `process.env.PORT`
- Required checks: `npm run lint`, `npm test`, and `npm run build`

For every requested code or UI change:

1. Inspect `git status` and preserve unrelated user work. Stage only task-related files or hunks.
2. Run the relevant checks above. Commit the task-related changes directly to `main` and push `main` to the `survival` remote. Never force-push. That push is the production deployment trigger. Do not start a local development server unless the user explicitly asks; a temporary production-server smoke test is allowed when needed for Cloud Run validation.
3. Wait for the pushed commit's Cloud Build trigger run to succeed and for Cloud Run to report ready with 100% of traffic on a revision linked to that commit. If deployment fails, inspect the build or service logs, make only in-scope fixes, rerun checks, commit, push, and verify again.
4. Verify the production page, `/api/health`, and Socket.IO. Confirm that session affinity, maximum instance count of 1, concurrency 80, timeout 3600 seconds, 1 CPU, 512 MiB memory, port 8080, public access, and all-ingress remain intact.
5. In the final response include the production URL, deployed commit short SHA, verification results, and Cloud Build/Cloud Run result.
