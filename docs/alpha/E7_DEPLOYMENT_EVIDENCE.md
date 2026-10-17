# E7 — deployment SHA evidence (engineering, not acceptance)

Status: **E7 status is decided by the ledger, not by this file.** This records what can be observed from outside the deployment. No ledger change.

## Mechanism (verified from `.github/workflows/vercel-prebuilt-production.yml`)

Production is shipped by the "Vercel Prebuilt Production" workflow. A plain push to `main` runs only the `push-policy` job; the `release-gates` and `deploy` jobs are **skipped** unless the commit message contains `[deploy-vercel]`. Newest `main` is otherwise released by a six-hourly schedule (`17 */6 * * *`) or `workflow_dispatch`, deliberately batched to protect the free deployment quota. Consequence: **a green push run does not mean the push was deployed** (latest push run `38959680425`: `push-policy` success, `release-gates` and `deploy` skipped).

## Observation, 2026-10-16 20:22 UTC (read-only, tool: `node scripts/qa/verify-deployed-sha.mjs <main sha>`)

| Target | Running SHA | Main | Result |
| --- | --- | --- | --- |
| Frontend `https://www.panaceamed.id/build.json` (CDN `x-vercel-cache: HIT`, `max-age=0, must-revalidate`) | `edb14bc7a81af5f88c5237f851b5664c19cc8099` | `ec604925b9a3b44aa820b40ebd1eea415ae62865` | differs |
| Backend `https://panaceamed-backend.onrender.com/api/health` (`build.commit`) | `cf8389ac7683c9f257b544dd0609f14a1ec94c81` | `ec604925…` | differs |

Independent cross-check for the frontend: the most recent run of that workflow whose `deploy` job succeeded is the scheduled run `38933899439` at head `edb14bc7…` (finished 2026-10-16 ~16:46 UTC), which equals the live `build.json`. So the marker matches what the deploy workflow says it shipped; it lags `main` by the commits merged since, as the batching policy predicts. An earlier scheduled attempt (`38893886995`, head `fd3f7d12`) failed. The Vercel connector available to this session lists no projects for the `panaceamed` team, so the Vercel-side deployment record could not be read independently.

## Observation after a dispatched release, 2026-10-17 02:26-02:50 UTC

Release `38996081367` (`workflow_dispatch`, head `80f9cef9afcc5f9efe051ba36133dfb371316489`): `release-gates` success, `deploy` success, `push-policy` skipped. Main was idle and green at dispatch (0 pending, 0 failing checks).

`production-browser-check` run `38996395944` (job `117289807458`, `workflow_dispatch`, `EXPECT_SHA=1f858fd32d81329b9c21e65f1e51657d74005896`, success). `main` had already advanced to `1f858fd32` by then (docs-only C6 deferral merge #2615), so the comparator, not equality with HEAD, is what decides:

| Target | Running SHA | Class (`scripts/qa/deploy-equivalence.mjs`) |
| --- | --- | --- |
| Frontend | `80f9cef9a` | SETARA - ancestor of main; no change on the deployed frontend paths |
| Backend | `f67c2bfa0` | SETARA - ancestor of main; no change on the deployed backend paths |

The browser check itself recorded one `warn`: the backend reports `f67c2bfa0…`, not `1f858fd32…` (expected, because the backend path did not change after `f67c2bf`). Both viewports (390 and 1440) returned HTTP 200, no horizontal overflow, WebGL2 available, 0 console errors; TLS valid (TLSv1.3, authorized, expires 2026-11-19); `panaceamed.id` redirects 308 to `www`.

Limits, not hidden: the authenticated Body Exposure page (`/body-exposure/canonical`) needs a session, so the 3D canvas, slicing and labels are **not verified in production** (`canvas: false` at both viewports, reported as `info`). There are no production credentials in this environment, so authenticated production journeys were not run. Equivalence for a batched-release system follows the comparator's definition above; the owner decision in item 3 below is still open.

## What would make E7 verifiable

1. ~~After a dispatched production deploy, check both targets~~ done above for `80f9cef`/`f67c2bf` (2026-10-17); repeat after each release.
2. Smoke the critical journeys against the deployed SHA (the repo has `production-browser-check.yml` and `render-live-smoke.yml`; their results for that SHA are the evidence).
3. Owner decision: define "equal to main" for a batched-release system (HEAD vs the SHA of the latest deploy run vs last commit affecting each deployable).

Not done and not claimed: staging (no staging environment is configured in this repository), authenticated journey smoke against production, production verification of the 3D canvas.

## Addendum — the build-marker step in that release

In release `38996081367` the `deploy` job's step **Verify deployed build marker equals the built commit** (added by #2610) also concluded `success`, next to the deploy and smoke steps: the deployed `build.json` commit equalled `github.sha`. This is the deployed artifact attesting its own commit, independent of the workflow's claim. It does not add staging, critical-journey smoke on that SHA, or the owner's definition of "equal to main"; E7 stays NOT_CHECKED. No ledger change.

