# Stabilization v2 — keeping main green cheaply

## Test tiers

| Tier | When | What | Cost rule |
|---|---|---|---|
| **T1 Fast local** | Before every push | Targeted test for the changed file(s); `npx tsc --noEmit` for TS changes | Run first; never run T2 before T1 is green |
| **T2 PR required** | Every PR head | Validate changes (lint:arsitektur, lint:ratchet, build, `npm run uji`), server-validate (`cd server && npm run uji`), plus path-filtered domain checks | Exact head only; re-run only if head or base moved |
| **T3 Release full** | Main SHA chosen for release | All browser acceptance (F1, UX, Body 3D), production browser check, deployed-SHA verification | Once per release candidate, not per PR |

Required on every PR: **Validate changes**, **server-validate**, **Stabilization Acceptance**, and
any path-filtered check the diff triggers. Domain checks run only when their paths change.

## Stop-the-line

If any required check is red on main:
1. Integrator opens/claims a single fix PR within the same session.
2. Other lanes keep working on branches but **do not merge** until main is green, except the fix.
3. PHI exposure anywhere (log, CI output, repo) is also stop-the-line, plus revoke/rotate if real.

## Determinism

- Synthetic identities and fixtures only; no real patient data, no live third-party calls in T1/T2.
- Pin runner images for browser jobs (`ubuntu-24.04`), Node major, and Playwright version together.
- Time: inject a fixed clock in tests that depend on dates.

## Flaky tests

A test that fails then passes on re-run with no code change is **flaky**, not green.
1. Record it in the PR (run IDs of both attempts).
2. Open a task row `T-FLAKY-<name>` on TASK_BOARD.
3. Quarantine only with an owner-visible PR that keeps the test running in a non-blocking job and
   names the fix task. Never delete or `skip` silently.

## Merge rules

- Merge only when the exact head is green and the base has not moved; if main moved, sync and re-run.
- One integrator decides merge order; serialize PRs that touch shared files.
- No force-push to shared branches, no admin bypass, no merging over red required checks.
- Recommended (owner action): enable branch protection on `main` with the required checks above
  (currently not enabled — see EXTERNAL_GATES §Repo).

## Rollback

Every PR states its rollback (normally "revert this commit"). Release rollback = redeploy the last
release SHA via the existing production workflow (scripted under ENG-E7-03).

## Credit discipline

- Cache evidence by SHA; skip audits whose inputs did not change.
- One discovery per SHA; reuse PROJECT_REALITY_MAP instead of re-reading the repo.
- Do not run the full suite repeatedly while a targeted test is still red.
