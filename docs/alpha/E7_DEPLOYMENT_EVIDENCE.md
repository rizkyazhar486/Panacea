# E7 — deployment SHA evidence (engineering, not acceptance)

Status: **E7 remains NOT_CHECKED.** This records what can be observed from outside the deployment. No ledger change.

## Mechanism (verified from `.github/workflows/vercel-prebuilt-production.yml`)

Production is shipped by the "Vercel Prebuilt Production" workflow. A plain push to `main` runs only the `push-policy` job; the `release-gates` and `deploy` jobs are **skipped** unless the commit message contains `[deploy-vercel]`. Newest `main` is otherwise released by a six-hourly schedule (`17 */6 * * *`) or `workflow_dispatch`, deliberately batched to protect the free deployment quota. Consequence: **a green push run does not mean the push was deployed** (latest push run `38959680425`: `push-policy` success, `release-gates` and `deploy` skipped).

## Observation, 2026-10-16 20:22 UTC (read-only, tool: `node scripts/qa/verify-deployed-sha.mjs <main sha>`)

| Target | Running SHA | Main | Result |
| --- | --- | --- | --- |
| Frontend `https://www.panaceamed.id/build.json` (CDN `x-vercel-cache: HIT`, `max-age=0, must-revalidate`) | `edb14bc7a81af5f88c5237f851b5664c19cc8099` | `ec604925b9a3b44aa820b40ebd1eea415ae62865` | differs |
| Backend `https://panaceamed-backend.onrender.com/api/health` (`build.commit`) | `cf8389ac7683c9f257b544dd0609f14a1ec94c81` | `ec604925…` | differs |

Independent cross-check for the frontend: the most recent run of that workflow whose `deploy` job succeeded is the scheduled run `38933899439` at head `edb14bc7…` (finished 2026-10-16 ~16:46 UTC), which equals the live `build.json`. So the marker matches what the deploy workflow says it shipped; it lags `main` by the commits merged since, as the batching policy predicts. An earlier scheduled attempt (`38893886995`, head `fd3f7d12`) failed. The Vercel connector available to this session lists no projects for the `panaceamed` team, so the Vercel-side deployment record could not be read independently.

## What would make E7 verifiable

1. After the next scheduled or dispatched production deploy, run the tool against the SHA that deploy ran for (not necessarily current `main`): both targets must report that SHA.
2. Smoke the critical journeys against the deployed SHA (the repo has `production-browser-check.yml` and `render-live-smoke.yml`; their results for that SHA are the evidence).
3. Owner decision: define "equal to main" for a batched-release system (HEAD vs the SHA of the latest deploy run vs last commit affecting each deployable).

Not done and not claimed: staging (no staging environment is configured in this repository), independent post-deploy comparison, journey smoke for the deployed SHA.
