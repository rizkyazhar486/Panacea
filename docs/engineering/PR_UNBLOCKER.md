# PR Unblocker

Use **Actions → PR Unblocker → Run workflow** when an authorized same-repository pull request is stuck because its branch is behind `main` or a transient CI run failed.

## What it does

1. Requires a numeric open PR targeting `main`.
2. Refuses cross-repository/fork PRs.
3. Reads the exact current head SHA.
4. If the branch is behind `main`, requests GitHub's protected PR branch update using that expected head SHA.
5. Never force-pushes or rewrites shared history.
6. If the branch is already current, it can retry failed/cancelled workflow runs.
7. Leaves a PR comment describing what happened.

## What it does not do

- It does not merge a PR.
- It does not bypass required reviews, branch protection, clinical/security/privacy gates, or CI.
- It does not disable tests.
- It does not operate on fork PRs.
- It does not push directly to `main`.

The intended flow is:

```
authorized contributor pushes feature branch
        ↓
open PR
        ↓
PR Unblocker if branch/checks get stuck
        ↓
fresh exact-head CI
        ↓
required human review
        ↓
normal protected merge
```
