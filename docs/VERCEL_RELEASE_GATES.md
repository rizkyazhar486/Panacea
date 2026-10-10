# Vercel exact-revision release gates

Production deployment requires passing technical acceptance for the triggering
commit on current canonical `main`. A green PR, an older main commit, a successful
workflow with a skipped required job, or a superseded run cannot authorize release.

`scripts/qa/vercel-release-gate.mjs` checks these workflows and required jobs:

| Workflow | Required jobs |
| --- | --- |
| `stabilization-acceptance.yml` | `full-acceptance`, `server-acceptance` |
| `organ-3d-acceptance.yml` | `render-proof` |
| `clinical-evidence.yml` | `clinical-evidence` |
| `security-baseline-enforcement.yml` | `enforce` |
| `dependency-audit.yml` | `dependency-audit` |

Evidence must identify the exact SHA, main branch, run, latest attempt and required
job. The verifier reads all bounded API pages, pins job reads to the run attempt,
and refreshes main and workflow evidence before returning. Ambiguous latest
attempt ordering blocks release. API errors and incomplete evidence fail closed.

The prerequisite job uses a read-only GitHub token and does not receive Vercel
credentials. It can wait up to 1,200 seconds for missing or pending workflows.
Every observation starts a fresh verification; a terminal failure, malformed
evidence or main advance stops it. Waiting observes CI without rerunning tests.
The deployment job repeats verification immediately after its build, before
publishing, without waiting. This reduces the race between acceptance and release;
it does not provide an atomic lock on GitHub main or workflow reruns.

The CLI uses `GITHUB_REPOSITORY`, `GITHUB_SHA` and `GITHUB_TOKEN`.
`RELEASE_GATE_WAIT_SECONDS` defaults to zero and may be set to at most 1,200 for
the prerequisite job. A successful check prints JSON containing the accepted SHA,
workflow paths, run/attempt IDs and required job IDs. A blocker exits nonzero.

Ordinary pushes remain batched. Scheduled, manual and `[deploy-vercel]` releases
all require the same guard. Dependency audit runs on every main push so a revision
can acquire its own evidence; pull-request path filters remain scoped. Existing
Vercel quota deferral and deployment concurrency remain in effect.

Gate passage is technical evidence. It does not supply qualified clinical review,
clinical-use authorization, a successful deployment, or production revision proof.
Verify deployment execution, live smoke results and deployed revision separately.
