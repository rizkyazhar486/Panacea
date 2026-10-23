# STABILIZATION V2

Goal: keep main green at the lowest CI cost, without weakening any gate. Nothing here disables a required check; replacements must be proven before anything is turned off (migration phase F).

## Test tiers
| Tier | When | What runs | Budget |
|---|---|---|---|
| T0 fast local | before every commit | the one targeted test (`node --test <file>` / `.mts` harness / one `server/uji` file) + `acceptance-v2` validator when governance files change | seconds |
| T1 PR required | every PR push | `npm run build` (includes all `scripts/qa/*.test.mjs`), `Validate changes`, domain checks only for touched paths (user-journeys, ux-audit, dependency audit, server-validate) | existing required set |
| T2 release full | main push / release | Stabilization Acceptance (browser smokes), Body 3D render acceptance, production deploy verification | existing |

Rule: do not run T1/T2 repeatedly before T0 is green.

## Exact-head rules
1. Evidence is valid only for the head SHA it ran on. After any push, merge of main into the branch, or rebase, previous green is stale.
2. Merge with the full 40-hex head SHA passed to the merge API (guard against races).
3. A newer commit on main can cancel an older main run (`cancel-in-progress: true`). **Cancelled ≠ pass and ≠ fail**: re-run on the intended SHA or wait for the newer run; never record PASS from a cancelled run.
4. Merge only when main is idle (no required main run in progress) so a merge cannot cancel another agent's acceptance.

## Failure classification (first genuine failing step)
| Class | Signature | Action |
|---|---|---|
| Code/test | assertion or typecheck failure | fix root cause, add regression test |
| Dependency/security | audit gate "no acceptance in policy" | patch dependency; acceptance entry only with reason, risk id, expiry |
| Infra-flaky | failure in setup steps (browser download, registry) | one re-run; if it passes, record as infra-flaky with run ids; if it recurs ≥2 in 10 runs, open an engineering task for caching/retry (never weaken the assertion) |
| Cancelled | conclusion `cancelled` | not evidence; re-run |
| Monitor | scheduled production checks | report separately; not a merge gate |

## Deterministic fixtures
Tests inject `clock`/`rng`, use in-repo fixtures, no network, no order dependence (CLAUDE.md §3.1). Browser journeys use synthetic identities only.

## Flaky-test handling
A flaky test is a defect: record run ids, reproduce, fix the cause (timeout from render load → reduce load or raise with justification, as done for Body3D canvas-artifact). Never `skip`, never `retry-until-green` hiding a real failure.

## Rollback
Every PR names its revert. Release rollback evidence = previous deployment id + smoke on it (VERIFICATION_V2 §Production).
