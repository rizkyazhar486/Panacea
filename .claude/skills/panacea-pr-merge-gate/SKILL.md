---
name: panacea-pr-merge-gate
description: Use when a Panaceamed implementation is ready for review, merge, auto-merge consideration, or when main has moved after validation began.
---

# Panacea PR Merge Gate

## Authority
`CLAUDE.md` and `AGENTS.md` define the repository's current merge policy. This skill operationalizes that policy; it never weakens it.

## Gate
1. Confirm the PR contains one coherent reversible batch.
2. Resolve the exact current head SHA.
3. Run targeted checks useful for the changed area.
4. Require the repository's mandatory validation and full stabilization/acceptance gates for that exact head.
5. Immediately before merge, resolve latest `main` again.
6. Inspect ancestry, mergeability, and changed-file overlap with work merged since the tested base.
7. If overlap or uncertain ancestry can invalidate the evidence, refresh from latest `main` and rerun required checks.
8. Merge through the PR only; never force-merge or direct-push around the gate.
9. Verify the merge commit/change is actually present on `main` and inspect available deployment/smoke evidence.

## Never infer green
A stale successful run, an older commit's check, or a local build is not evidence that the current PR head is acceptable.

## Stop
If required gates are red or unavailable for a material reason, report the concrete blocker and preserve the branch for follow-up.