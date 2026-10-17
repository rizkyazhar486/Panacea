# F1 + F2 Parallel Execution Guidance — Claude Code

**Owner direction:** 2026-10-17. **Status:** engineering execution guidance; not an acceptance verdict or authorization to merge.

## Scope and source of truth

- **F1 (Task 44): Full User Journey Acceptance** and **F2 (Task 45): UI/UX Optimization & Polishing Acceptance** MAY run **concurrently**, including two separate Claude Code sessions/worktrees or Claude Code plus Codex as an independent code reviewer.
- Source of truth: `governance/ALPHA_ACCEPTANCE_LEDGER.json` and generated `docs/alpha/ALPHA_ACCEPTANCE_LEDGER.md`. Keep F1/F2 **REPORTED** until their written acceptance gates are independently satisfied and evidence is recorded. Never modify acceptance criteria just to turn a status green.
- This instruction does **not** waive the present product wedge, clinical-safety constraints, frontend design authority, privacy/RBAC, or the current owner-approval boundary. Follow `AGENTS.md`, `CLAUDE.md`, `governance/doctrine/PANACEA_CURRENT_WEDGE.md`, `docs/product/ADAPTIVE_RESPONSIVE_DESIGN_SYSTEM.md`, and the applicable journey/role Figma sources documented in `AGENTS.md`.
- **C6 remains separate:** the 45 historical criteria consist of 44 active engineering criteria and C6 deferred to Clinical Validation. Neither F1 nor F2 work changes C6 or grants clinical approval.

## Parallel ownership and work isolation

| Lane | Agent work that may proceed now | Human decision or review boundary |
| --- | --- | --- |
| **F1 — journeys and authorization** | Claude Code: inventory existing routes/role contracts, implement/fix permitted journeys, add real-app/real-API E2E coverage with synthetic identities, test both positive and negative RBAC, denial, logout/revocation, slow/error/recovery states, 390×844 and 1440×900. | Product Owner decides any unresolved **role-scope, tenant/isolation, and access-policy** choices. API owner confirms contracts; do not invent backend role privileges or broaden access. Do not claim untested OAuth, contributor, or clinical workflows are accepted. |
| **F2 — UX and accessibility** | Claude Code: audit and repair active critical journeys and global navigation, mobile/desktop adaptivity, semantic labels, keyboard/focus, WCAG 2.2 AA contrast, reduced motion, visual consistency, light/dark screenshot regressions, and documented performance budgets; update tests without relaxing ratchets. | Existing frontend/design authority (Vika) retains final design decisions; targeted **human QA** reviews actual keyboard/focus and visual findings. Automated axe or screenshot results alone do not count as human usability validation. |
| **Cross-lane independent review** | Codex or a second Claude Code session may inspect diff, verify conflict boundaries, review test sufficiency, and report evidence/gaps separately. | AI review is engineering assistance, not owner approval, clinical sign-off, or proof of user acceptance. |

## Branches, PRs, and merge coordination

1. Start from the **current** `main` after inspecting overlapping open PRs, especially changes to shared navigation, authentication, accessibility baselines, and the acceptance ledger.
2. Use **two branches/worktrees and two PRs**, one scoped to F1 (`feat/f1-journey-acceptance-…` or `test/f1-…`), another to F2 (`fix/f2-ux-a11y-…`). Do not let both sessions edit the same working tree, commit to each other's branch, or push directly to `main`.
3. Declare likely shared-file ownership in the PR descriptions. If the same component or test file must change for both, agree on the upstream owner; sequence the shared change or split out a dependency PR. Do not blindly overwrite or cherry-pick unreviewed changes.
4. Each PR must have reproducible acceptance evidence, actual test commands, relevant screenshots/traces, unresolved gaps, and the **exact head SHA**. Run mandatory `Validate`, `Stabilization Acceptance`, and applicable F1/F2 workflow checks **on that exact SHA**. Check test status, not just that a check was triggered. Never weaken test suites, accessibility thresholds, baselines, or acceptance definitions merely to pass CI.
5. Before integration, verify ancestry against current `main`, compare overlaps, and check all review comments. If `main` advances, synchronize the branch and rerun all affected exact-head checks. Merge only through the repository's authorized protected/expected-head procedure after checks and review; no force merges or stale green CI. Merely opening a PR does not mark either task VERIFIED.
6. After integration, verify the **resulting `main` commit**, run/inspect post-merge tests and confirm ledger evidence before proposing an honest status transition. Avoid updating the generated ledger Markdown manually; generate it through the existing ledger script after updating its JSON source.

## F1 minimum gate (evidence-based)

- Test real application + API critical journeys for **patient, doctor, nurse, laboratory, and owner/admin where contracts support them**; use synthetic users and document scope.
- Confirm **least privilege and deny-by-default**, positive/negative RBAC, assignment and revocation, tenant/patient isolation, non-dead-end navigation, meaningful loading/error/empty and recovery states, and both target viewport sizes.
- Treat unimplemented roles and journeys as **gaps**, not passes; do not fabricate OAuth, clinical authority, or patient test results. Clinician cross-tenant reads and any other role-scope conflicts require an explicit owner policy decision before broadening privileges.
- Reference current `scripts/qa/user-journey-e2e.mjs`, `scripts/qa/user-journey-staff.mjs`, `scripts/qa/user-journey-resilience.mjs`, `.github/workflows/user-journey-acceptance.yml`, and `docs/alpha/F1_NURSE_LAB_RBAC_PROPOSAL.md` as applicable. Check current code; historical proposal text may be superseded.

## F2 minimum gate (evidence-based)

- Keep the existing accessibility and performance ratchets **fail-closed**. In particular, do not call F2 VERIFIED while unresolved WCAG AA contrast defects, unmeasured gradient/image-background contrast, or manual keyboard/focus findings remain open.
- Cover active critical journey surfaces and global navigation with targeted automated audits **plus** human review, 390×844 and 1440×900, light/dark appearance, responsive overflow, touch target, readable text, labels, reduced motion, empty/loading/error/recovery states, screenshot diffs, and measured load performance.
- Reference `scripts/qa/ux-audit.mjs`, `scripts/qa/axe-audit.mjs`, `scripts/qa/axe-ratchet.mjs`, `scripts/qa/kontras-wcag.mjs`, `scripts/qa/theme-parity.mjs`, and their governed baselines as applicable. Do not manipulate baseline values to hide failures.

## Reporting template

For **each** F1/F2 PR, record: **scope and source main SHA → changed files → head SHA → exact-head workflow/run links and outcomes → E2E/a11y/visual results → outstanding findings → owner/human QA decisions → integration status → final ledger evidence**.

**Hard rule:** `implementation complete` ≠ `CI green` ≠ `human accepted` ≠ `ledger VERIFIED`. Keep these states separate.
