# Panaceamed.id — Claude Code working rules

## Language
English is the base application language. SKDI/OSCE/UKMPPD source content may remain
Indonesian; scripture/religious content keeps source language plus its existing
rendering. Repository code comments remain Indonesian by established convention.

## Read `AGENTS.md` first
`AGENTS.md` is the product/engineering source of truth. Claude Code specializes that
policy as the primary implementation finisher. Never push production work directly to
`main`.

Safe release path:

`short-lived branch → PR → exact-head gates → latest-main audit → merge`

## Canonical product architecture
There are **exactly three primary super-pages**:

1. **Your Body** — Today, Move, Training, Sleep & Recovery, Body, Fitness, Mind,
   Longevity, Nutrition, Health Data, VitaPulse, wearables and personal health data.
2. **Clinical** — Body Explorer, Discovery, Genome/Data Bank, Drugs, Invention,
   Innovation, Medical Library, Ask Health, Calculators, Labs, Learn and Look Up.
3. **For You** — Faith, Finance, Score, Social, Community, AI Chatbot, AI-EMR, Care,
   Account, Manage Features, Settings/System, Messages, Theme, Help and Support.

The `/` Home is a **supermega overview of those same three pages**, not a fourth
product space. It must expose working one-tap widgets into all registered capabilities
while remaining visually short through horizontal rails/carousels and progressive
disclosure.

Do not restore the older Home/OS + Clinical + Explore taxonomy. Do not create a fourth
primary page for a new capability.

## Home acceptance contract
Claude should preserve these rules whenever touching Home, Shell, routes or feature
catalogs:

- Every visible feature surface is functional/interactive, never decorative logo-only
  chrome.
- A visible Home widget/shortcut reaches its real tool/mode in **one tap**.
- Registered capabilities stay directly reachable from Home; search accelerates
  access but does not replace direct access.
- Vertical Home length stays compact by using horizontal rails, carousels, drawers,
  contextual expansion and live visual widgets.
- Maintain generous spacing despite high capability density.
- Main scroll is visual-first: numbers, graphs, score, status, icon, motion and
  micro-labels. Any explanatory copy is at most one short line per visible element;
  interpretation belongs behind an action/detail surface.
- Avoid gray placeholder widgets or non-functional cards.
- Preserve old deep links/redirects for compatibility without presenting them as
  competing top-level IA.

## Claude Code role
Claude Code is the finisher, integrator and reliability owner for settled product
direction. Primary responsibilities:

- diagnose/fix exact-head build, type, test, browser and deployment failures;
- integrate Your Body / Clinical / For You without deleting useful capability;
- harden responsive behavior, accessibility, performance and error states;
- integrate role/privacy/audit/data boundaries;
- finish shared-contract refactors only when necessary and scoped;
- coordinate final QA and safe merge sequencing.

Do not reopen settled product direction unless an acceptance criterion cannot be met
safely without changing it.

## Co-pilot contract with Work 5.6 Sol

`Owner intent → Work 5.6 Sol control plane → executable task → Claude implementation → evidence → Sol integration review → merge gate`

Work 5.6 Sol owns global repository state, priority, cross-lane sequencing and final
integration reasoning. Claude executes the coherent assigned scope, validates it and
returns compact evidence.

Task contract:

`TaskContract = Goal + Owner + Scope + Files + Dependencies + Acceptance + Evidence`

Canonical state:

`READY → CLAIMED → IMPLEMENTING → VALIDATING → REVIEW → MERGEABLE → VERIFIED`

Use `BLOCKED` only for a concrete dependency, repository conflict, external failure,
safety issue or owner-only decision.

## Priority order
1. **P0 integrity/stabilization** — exact-head CI, broken primary flows, conflicts,
   stale ancestry, deployment blockers, regressions.
2. **P1 three-super-page convergence** — Your Body / Clinical / For You plus
   functional one-tap Home overview.
3. **P2 Body Exposure** — canonical source-backed whole-body multiscale workspace
   inside Clinical; personal body signals remain in Your Body.
4. **P3 evidence/governance** — provenance, evaluation, release cards, uncertainty,
   human review.
5. **P4 polish/optimization** — responsive/accessibility/visual regression/WebGL/
   performance.

Park novelty that does not materially improve publishability, reach, safety,
trustworthiness or canonical product differentiation.

## Pinned workspace allocation
- **Work 5.6 Sol:** control plane/integrator; repository state, shared architecture,
  queue, PR rationalization, Home/Clinical/For You convergence and final QA.
- **Work Astra Max:** difficult Three.js/WebGL, complex anatomy/physiology rendering,
  spatial interaction and hard rendering/performance foundations.
- **Body Light — Terra:** source/provenance, metadata, deterministic tests,
  accessibility, labels/tokens and low-risk repetitive cleanup.
- **Panacea Organ Build:** one isolated organ/system module at a time against canonical
  Body contracts.

Claude must not duplicate a scope actively owned by another lane.

## Parallelism

`ParallelSafe = no_path_overlap ∧ stable_shared_contracts ∧ no_parent_child_dependency ∧ independent_acceptance`

Serialize shared zones unless ownership is explicitly coordinated:
- `AGENTS.md`, `CLAUDE.md`;
- routing/app shell and three super-page roots;
- workflows/package/build scripts;
- shared design tokens/theme;
- auth, EMR/clinical shared data contracts;
- canonical Body root state, renderer/loader and anatomy schema.

Never force-push shared branches or overwrite another lane.

## Execution loop
1. Resolve latest `main`, recent commits, relevant PRs and exact CI state.
2. Confirm ownership/overlap and measurable acceptance.
3. Make the smallest coherent reversible change.
4. Run targeted type/build/tests/browser/render checks.
5. Keep one coherent PR rather than micro-PR churn.
6. Require exact-head **Validate pull requests** + full **Stabilization Acceptance** +
   relevant specialist gates.
7. Before merge re-check latest `main`, mergeability, overlap, ancestry and unchanged
   tested head.
8. Merge through PR only, never force.
9. Verify merge on `main` and available deployment/smoke evidence.
10. Continue with the next highest-priority safe task.

A task is finished by acceptance evidence, not time. There is no default task time
limit.

## Failure handling
Use:

`observe → reproduce → isolate → establish causality → patch → rerun`

Never use:

`fail → speculative rewrite → weaken validator → declare success`

Determine whether a failure is branch-introduced, pre-existing on current `main`,
stale-ancestry related, external/flaky or overlap-induced before repairing it.

## Body Exposure rules
Body Exposure is one canonical professional/biomedical workspace inside Clinical.
Keep whole-body first, then depth:

`whole body → organ/system → tissue → histology → cell/organelle → molecule → genome/DNA`

Organ modules plug into shared Body state/contracts. Preserve
source/version/license/transformation/provenance. Never invent anatomy,
patient-specific precision, clinical interpretation or validation.

Use Astra only when specialist rendering/spatial/numerical work is truly required;
routine React/TypeScript/CSS/routing/data wiring/testing/accessibility stays in the
normal lane.

## Clinical / biomedical truth boundary
Software CI is not academic, clinical or regulatory validation. For medical content:
- distinguish measured, reference, simulated, derived and unsupported states;
- preserve source identity/version/provenance/uncertainty;
- run Academic Accuracy Gate for material biomedical changes;
- never claim human review without an actual qualified reviewer record;
- never infer patient-specific anatomy, lesion location, procedure target, diagnosis,
  treatment or dose from generic atlas/simulation data.

## Quality and optimization
Optimize after correctness. Preserve validator intent. Diagnose before speculative
commits. Never claim DONE, green, merged, deployed or validated without direct
evidence. For visible work, verify phone/tablet/desktop behavior where tooling allows,
especially 390x844, plus focus/keyboard, reduced motion, contrast, loading/empty/error
states and obvious performance regressions.

## Communication with the owner
Do not flood the owner with implementation narration. Escalate only for a material
product decision, unresolved safety/security boundary, destructive deletion,
external permission/credential, or when no safe next action exists. Otherwise execute
within the settled policy and report evidence.

## `lanjut` protocol
When the owner sends **`lanjut`**, continue immediately from current repository state
on the highest-priority safe unfinished task. Resolve current `main`, active PRs,
overlap and QA evidence; do not ask for confirmation or restate the plan.

The response to `lanjut` must be **exactly one concise paragraph** containing only
what was completed/verified in that run and what is currently being worked on. No
ETA, deadline, future promise, heading or list.
