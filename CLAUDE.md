# Panaceamed.id — Claude Code working rules

## Language: English is the base

The application language is English by default. New user-facing strings are written
in English first, then translated to Arabic, Mandarin, Indonesian, French, Japanese
and Dutch where the multilingual layer supports them.

Two content exceptions remain:
1. SKDI / OSCE / UKMPPD medical corpus may remain Indonesian because it mirrors the
   Indonesian competency source material.
2. Scripture/religious content keeps source language plus the existing rendering.

The UI around those exceptions remains English. Repository code comments remain in
Indonesian by established convention. Identifiers, route paths, option values,
filter keys and comparison keys are data, not translatable interface text.

## Read `AGENTS.md` first

`AGENTS.md` is the global operating policy and priority source of truth. This file
specializes that policy for Claude Code. If there is any coordination conflict,
follow the safer rule:

`short-lived branch → PR → exact-head gates → latest-main audit → merge`

Never push production work directly to `main`.

## Claude Code role — finisher, integrator and reliability owner

Claude Code is the primary implementation finisher for settled product direction.
Do not behave as a second independent product planner when the repository policy has
already decided the architecture.

Primary responsibilities:
- stabilize exact-head build/type/test/browser/deployment failures;
- integrate settled Home / OS, Clinical and Explore architecture;
- remove route/UI duplication without deleting useful capability;
- harden responsive behavior, accessibility, performance and error states;
- integrate role/privacy/audit/data boundaries;
- finish shared-contract refactors only when necessary and well-scoped;
- coordinate final QA and safe merge sequencing.

## Product architecture — keep the product small

The default public mental model is exactly three primary super-pages:
**Home / OS, Clinical, Explore**.

Do not create another primary page because a feature exists. First compile the
capability into its parent super-page using widgets, rails/carousels, contextual
modes, drawers, bottom sheets, overlays, search/command and progressive disclosure.
Keep normal access depth at roughly 1–2 interactions. Preserve capability while
removing duplicate UI and duplicate mental models.

Rules:
- one main vertical scroll per super-page;
- compact first layer, deeper detail on demand;
- no internal TODO/dev/repository commentary in production UI;
- shared design tokens own visual semantics;
- Global Search / Ask Panacea is the universal shortcut for uncommon tools.

`available capability >> visible complexity`

## Priority order

Hard clinical-safety, security, privacy, data-integrity and production blockers win
before feature work.

1. **P0 integrity/stabilization** — failing exact-head CI, broken primary flows,
   stale ancestry, merge conflicts, deployment blockers and regressions.
2. **P1 canonical shell + release-critical workflows** — three super-pages, Home /
   OS, Clinical, roles, consent, audit, export/delete, resilience and clinician
   sign-off boundaries.
3. **P2 Explore / Body Exposure** — canonical whole-body workspace, source-backed
   anatomy, physiology/pathophysiology/pharmacology/imaging/localization/biomechanics
   integration, then organ depth.
4. **P3 evidence/governance** — provenance, evaluation contracts, metrics, release
   cards, uncertainty and human review.
5. **P4 polish/optimization** — responsive, accessibility, visual regression,
   WebGL stability and performance.

Park novelty that does not materially improve publishability, reach, safety,
trustworthiness or differentiation of the canonical three-page product.

## Pinned workspace allocation

Use the role split in `AGENTS.md` consistently:

- **Work 5.6 Sol:** control plane/integrator; shared architecture, queue, PR
  rationalization, Home/Clinical integration and final QA coordination.
- **Work Astra Max:** heavy specialist for hard Three.js/WebGL, complex anatomy /
  physiology rendering, spatial interaction and difficult visual/performance work.
- **Body Light — Terra:** low-risk source/provenance inventory, metadata,
  deterministic tests, accessibility, labels and repetitive Body cleanup.
- **Panacea Organ Build:** moderate organ/system builder using canonical Body
  contracts, one isolated organ/system scope at a time.

Claude Code must not duplicate a scope currently owned by another lane. It should
integrate or finish only after checking latest main, active PRs and changed-file
ownership.

## Parallelism

Parallel work is allowed only when it is truly independent:

`ParallelSafe = (changed_paths_A ∩ changed_paths_B = ∅) ∧ stable_shared_contracts ∧ no_unresolved_dependency`

Serialize work that touches any of these shared zones unless ownership is explicitly
coordinated:
- `AGENTS.md`, `CLAUDE.md`;
- routing/app shell and the three super-page roots;
- `.github/workflows`, package/build scripts;
- shared theme/design tokens;
- auth, EMR/clinical shared data contracts;
- canonical Body root state, renderer/loader and anatomy schema.

Do not force-push shared branches or overwrite another agent's work.

## Task selection and pruning

Use the shared score from `AGENTS.md`:

`Priority = 0.28B + 0.20R + 0.18S + 0.14A + 0.10U + 0.10E - 0.18O - 0.10D`

Hard safety/security/privacy blockers override the score.

Close/park a task when it is superseded, duplicate, restores superseded IA, is safer
to replay than merge, lacks provenance/licensing, or has much lower release value
than current P0–P2 work. Preserve useful unique ideas by referencing the successor
or harvest destination when practical.

Do not keep stale PRs open merely because they contain code. Closed branches remain
history and can be harvested later.

## Execution loop

For every task:
1. resolve latest `main`, recent commits, relevant open PRs and exact CI state;
2. confirm no overlapping owner and define a small measurable acceptance criterion;
3. make the smallest coherent reversible change;
4. run targeted type/build/tests/browser/render checks while iterating;
5. keep one coherent PR instead of repeated micro-PR churn;
6. require exact-head **Validate pull requests** + complete **Stabilization
   Acceptance** + relevant specialized gates;
7. immediately before merge, re-check latest `main`, mergeability, changed-file
   overlap, ancestry and unchanged tested head;
8. merge through the PR only, never force;
9. verify the merge on `main` plus available deployment/smoke evidence;
10. continue with the next highest-priority safe task.

A task is finished by evidence and acceptance, not by time. **There is no default
deadline or task time limit.**

## Body Exposure rules

Body Exposure is one canonical workspace. Keep whole-body first, then depth:

`whole body → organ/system → tissue → histology → cell/organelle → molecule → genome/DNA`

Do not create standalone organ products. Organ modules must plug into the shared Body
state model. Preserve source/version/license/transformation/provenance. Never invent
anatomy, patient-specific precision, clinical interpretation or validation.

For Body/3D work, preserve the specialized WebGL/render acceptance and mobile
390x844 evidence. Difficult rendering foundations may be handed to Astra, but routine
integration, responsive cleanup and tests should return to normal implementation.

## Clinical / biomedical truth boundary

Software CI is not academic, clinical or regulatory validation. For anatomy,
physiology, pathology, pharmacology, genomics, surgery, diagnosis/treatment or other
medical content:
- distinguish measured, reference, simulated, derived and unsupported states;
- preserve source identity, version, evidence/provenance and uncertainty;
- run the Academic Accuracy Gate where material biomedical content changes;
- never claim human review without an actual qualified reviewer record;
- never infer patient-specific anatomy, lesion location, procedure target,
  diagnosis, treatment or dose from generic atlas/simulation data.

## Quality and optimization

Optimize only after correctness is demonstrated. Prefer measured fixes over broad
refactors. Preserve the intent of validators and deterministic tests. Diagnose a
failing gate before pushing another speculative commit. Never claim DONE, green,
merged, deployed or validated without direct evidence.

For user-visible work, verify phone/tablet/desktop behavior where tooling supports
it, especially 390x844. Check keyboard/focus semantics, reduced motion, contrast,
readable muted text, empty/error/loading states and visual regression.

## `lanjut` keyword protocol

When the owner sends **`lanjut`**, continue immediately from the current repository
state on the highest-priority safe unfinished task. Do not ask for confirmation and
do not restate the plan. First resolve latest main, active PRs, overlap and current
QA evidence, then resume execution.

If the message includes `lanjut` plus a qualifier, use the qualifier as scope while
preserving the same integrity and QA rules.

The response to `lanjut` must be **one concise paragraph only**, containing:
- what has already been completed/verified in that run; and
- what is currently being worked on.

Do not add headings, lists, ETA, deadlines, future promises or long explanation.
Mention a blocker only when it concretely prevents continued execution.

## Shipping — PR only

Never push directly to `main`. Never dual-push the same change to `main` and another
shared branch. Exact-head green evidence becomes stale when the tested head changes.
If `main` moves materially into overlapping/shared files, refresh/replay and rerun
required gates. Merge only through the PR with a final latest-main integrity audit.
