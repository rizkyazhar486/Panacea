# T-H0-08 — required browser checks (owner action, not applied)

**Task:** ENG-CI-01; **lane:** ARGON; **scope:** required checks on pull requests to `main`.
**Prepared from:** `main` 9db6b04e2e69794cf7cf320c59e41cf3cc275990 (2026-10-24), head CI and protection must be checked again after integration.
**Do not enable protection until this PR is merged and exact-head CI proves the three jobs succeed.**

## Why this code change is a prerequisite

Before this change, F1 `user-journeys` and F2 `ux-audit` were only created when a PR changed a selected file path. Requiring those checks in branch protection would block unrelated PRs indefinitely because the checks would not exist. This PR removes `pull_request.paths` for F1 and F2 **only**. `push.paths` remains filtered to avoid unrelated push runs. Stabilization `full-acceptance` already runs on every PR to `main`.

`scripts/qa/required-browser-checks.test.mjs` is picked up by `npm run build` and fails closed if a required PR trigger becomes filtered again, its `main` branch target disappears, or its expected job name changes. The negative controls reintroduce a path filter and a wrong job name; each must fail.

**Tradeoff:** required F1/F2 browser jobs will run on all PRs, increasing CI load. This is the intended tradeoff when making them mandatory, and should be measured before further changes to runner capacity.

## Owner-only command — prepare, DO NOT run from this PR

After this PR is safely merged and fresh required CI is green, execute with an authorized GitHub admin account:

```bash
set -euo pipefail
api='repos/rizkyazhar486/Panacea/branches/main/protection/required_status_checks'
gh api "$api" --jq '{
  strict: .strict,
  checks: ((.checks // []) + [
    {context:"full-acceptance", app_id:15368},
    {context:"user-journeys", app_id:15368},
    {context:"ux-audit", app_id:15368}
  ] | unique_by(.context))
}' > /tmp/panacea-h0-08-required-checks.json
cat /tmp/panacea-h0-08-required-checks.json
gh api --method PATCH "$api" --input /tmp/panacea-h0-08-required-checks.json
```

The GET preserves existing `validate`, `server-validate`, any other required checks, and the current `strict` setting. `app_id=15368` is the observed GitHub Actions app. Confirm the output includes those five contexts before executing PATCH. No force push or branch protection bypass is authorized.

## Verification and rollback

1. Confirm exact-head `validate`, `server-validate`, `full-acceptance`, `user-journeys`, `ux-audit` green on this PR.
2. Confirm check contexts exist on an ordinary documentation-only PR after merge (the negative-control contract tests this statically; CI provides real proof).
3. Owner runs the command above only after the prerequisites and reviews pass; then GET the branch protection and inspect the resulting five contexts.
4. If a required browser workflow fails, fix the actual failure rather than overriding checks. To roll back workflow-trigger coverage, revert this PR using another reviewed PR **after** the owner removes those required contexts; otherwise revert would deadlock merges.

`TASK_BOARD.md` is intentionally untouched: open PRs #2700, #2701 and #2702 currently edit that file, and agent governance forbids overlapping edits. Claude may record T-H0-08 disposition there after those PRs integrate. This PR does not claim to have applied the protection change.
