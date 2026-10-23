# Acceptance v2

Source of truth: `governance/ACCEPTANCE_V2.json`. This page explains it; it does not restate it.
Validator: `node scripts/qa/acceptance-v2.mjs` (also run inside `npm run uji` via
`scripts/uji/acceptance-v2.mts`, i.e. inside the required **Validate changes** check).

## Two separate books

| Book | Contains | Who closes it | Counted in |
|---|---|---|---|
| **Engineering criteria** (`ENG-*`) | Gates `ENGINEERING`, `PRODUCT_QUALITY`, `PRODUCTION`, `CLINICAL_SAFETY_ENG` | AI lanes, by code + test + CI | Engineering denominator |
| **External gates** (`EXT-*`) | Rights, legal policy, clinical validation, credentials, release sign-off, real-user acceptance | Named human role | Separate open/decided count |

Report both numbers side by side, e.g. `Engineering PASS 12/32 · External gates open 9/14`.
Never merge them into one percentage.

Baseline on main `256a22de`: **Engineering PASS 0/32** (FAIL 6, NOT_RUN 26) · **External open 14/14**.
Every criterion starts NOT_RUN or FAIL: nothing is carried over as PASS from the legacy ledger
until its evidence is re-recorded at a v2 SHA.

## Every engineering criterion has

`id` · `gate` · `horizon` · `priority` · `lane` (AI only) · `legacy` ids · `capability` · `risk` ·
`done` (testable, no human approval words) · `checks[]` (command + evidence files that must exist) ·
`negativeControl` · `evidence` · `dependsOn` · `status` · `statusSha` (40-hex for PASS/FAIL).

## What the validator rejects (anti-gaming)

- a criterion with no executable check, or an evidence file that does not exist
- an engineering criterion owned by a human role, or whose `done` needs a signature/approval
- `PASS`/`FAIL` without a 40-hex SHA; `NOT_APPLICABLE` without a reason
- `BLOCKED_EXTERNAL` inside the engineering statuses
- any of the 45 legacy ids left unmapped (hard criteria cannot be dropped to raise the score)
- an external gate owned by an AI lane, or marked `DECIDED` without a decision record
- a missing negative control

## Changing a criterion

Versioned (`version` field) and done in its own PR with the reason. Changing a threshold **after**
seeing it fail needs a written justification and owner approval in the PR. Criteria may be added;
removing one requires mapping its legacy ids elsewhere.

## Recording a result

In the PR that produced the evidence: set `status`, `statusSha` (the exact head that ran), and put
run IDs/paths in `statusNote`. If main moves before merge, the status is stale until re-run on the
new head (see VERIFICATION_V2 §Revalidation).
