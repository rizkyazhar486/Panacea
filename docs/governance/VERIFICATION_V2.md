# Verification v2 — how evidence is judged

## Status semantics

| Status | Meaning | Required evidence |
|---|---|---|
| `PASS` | Every check of the criterion passed on this exact commit | `statusSha` + run ID or command output for each check + negative control observed failing |
| `FAIL` | At least one check failed on this exact commit | `statusSha` + the first failing line |
| `NOT_RUN` | No evidence for the current SHA | — |
| `NOT_APPLICABLE` | Capability does not exist in the product yet (e.g. contributor backend role) | reason in `statusNote`; never counted as pass |
| `BLOCKED_EXTERNAL` | External gates only: waiting on a named human decision | one precise question |
| `DECIDED` | External gates only | link to the actual signed/dated record |

These are different states and are never reported as each other:
**implemented → tested → merged → deployed → clinically validated.**

## Integrity rules

1. **Exact head.** Evidence counts only for the SHA it ran on. A green run on an older head is
   history, not evidence.
2. **Negative control.** A check that cannot fail proves nothing. Each criterion names a sabotage or
   fixture that must turn it red; it is run when the check is created or changed.
3. **Independent review.** The reviewer of a PR is a different AI lane than the author (Claude ↔
   Codex). Review is engineering review only; it never counts as clinical, legal or owner approval.
4. **No self-promotion of external gates.** Only the named human role can move an `EXT-*` gate to
   `DECIDED`, by supplying the artifact listed in EXTERNAL_GATES.
5. **Clinical boundary.** `CLINICAL_SAFETY_ENG` PASS means "engineered safely", not "clinically
   valid". `clinically_reviewed` stays `false` until EXT-C6-A produces a signed record for that
   engine ID and commit.
6. **Production linkage.** A deployment claim needs the frontend `build.json` SHA, backend
   `/api/health` build commit, and the run ID that checked them. A queued, skipped or cancelled
   deploy is not a deployment.

## Revalidation

A `PASS` becomes stale (treat as `NOT_RUN`) when:
- main moves and the diff touches any file listed in the criterion's checks, or
- a dependency lockfile changes (for `ENG-SEC-01` and all browser criteria), or
- 14 days pass without a re-run (regression packs `ENG-REG-*`).

The integrator re-runs stale criteria in one batch per main SHA — not per PR.
