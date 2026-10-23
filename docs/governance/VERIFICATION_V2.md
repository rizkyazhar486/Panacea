# VERIFICATION V2

## Status semantics
| Status | Meaning | Who may set |
|---|---|---|
| `PASS` | command + negative control passed on exact SHA, evidence stored | CI/AI after run |
| `FAIL` | ran and failed; failing step recorded | CI/AI |
| `NOT_RUN` | no run on current evidence SHA | default |
| `BLOCKED_EXTERNAL` (gate) | human decision requested, specific question sent | AI sets after sending request |
| `DECIDED` (gate) | signed decision record attached | **human only** |
`VERIFIED` is not used in v2. Legal/clinical/production claims use gates, never criteria.

## Evidence record (one per criterion per SHA)
```
criterion: ENG-XX-n
sha: <40-hex>            base/head: <40-hex>/<40-hex>
command: <exact>         exit: 0|n
failing-before: <run id or output excerpt>   passing-after: <run id>
negative-control: <command> -> expected failure observed: <excerpt>
artifact: <path or run URL>      recorded-at: <UTC>
```
Stored in the PR description and, for release, `docs/governance/evidence/<sha>.json` (to be added with the first full run).

## Integrity
- Evidence from a different SHA, a cancelled run, or a run with skipped tests is invalid.
- Every gate must be **sabotaged** once (break the thing it guards) and shown to fail by name; record the failure excerpt. Example: ENG-G-1 — editing a script path in `ACCEPTANCE_V2.json` to a non-existent file fails `acceptance-v2.test.mjs` with `skrip perintah tidak ada`.
- Thresholds cannot be edited after a failure without justification in the PR and owner approval.

## Revalidation
On every PR touching a criterion's evidence paths; full re-run on each release SHA. Evidence older than the last change to its paths is stale.

## Independent review
Reviewer ≠ author agent (the Codex lane reviews Claude Code PRs and vice versa; a human reviewer satisfies this too). The reviewer checks head SHA, changed-file overlap, exact-head checks, and that no test was weakened. AI review is not external validation.

## Production linkage
Release acceptance records: deployed artifact SHA (`build.json` / `/api/health build.commit`) classified by `scripts/qa/deploy-equivalence.mjs` (equal / ancestor / diverged), deployment id, smoke result, previous deployment id for rollback. What counts as "accepted SHA" is EXT-E7-1; until decided, reports state the facts and never say "equal to main" as a pass.
