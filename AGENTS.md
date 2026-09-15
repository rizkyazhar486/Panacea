# Panacea Multi-Agent Operating Policy

## Objective
Build Panaceamed quickly without sacrificing correctness, clinical safety, security,
maintainability, reliability, trustworthiness or repository integrity. Optimize for
validated product value, not raw feature count, raw LOC, page count or novelty.

GitHub `main` is the source of truth. **Never push production changes directly to
`main`.** Use short-lived branches and PRs, exact-head validation, a final latest-main
audit, and merge through the PR only.

## Product constitution — small surface, deep capability

Panaceamed should feel simple even when the capability set is large.

- Default public mental model: **3 primary super-pages — Home / OS, Clinical,
  Explore**.
- A new capability does not justify a new top-level page. Compile overlapping
  functions, data, APIs and assets into the existing parent super-page using compact
  widgets, rails/carousels, contextual modes, drawers, bottom sheets, overlays,
  search/command and progressive disclosure.
- Preserve useful capability while removing duplicated UI and duplicated mental
  models. Consolidation means **merge capability, not delete capability**.
- Keep normal access depth at roughly **1–2 interactions** from a primary
  super-page. Rare tools may occupy less permanent space, but remain discoverable.
- Prefer one main vertical scroll with short, calm initial surfaces. Use visual
  hierarchy and progressive disclosure instead of nested route trees.
- Global Search / Ask Panacea is the universal shortcut layer for uncommon tools.
- Public UI must not expose internal TODOs, repository commentary, unfinished
  implementation notes or agent workflow text.
- Shared design tokens own color, spacing, typography, radius, glass/material and
  motion semantics. Components should not invent page-local visual systems.

Useful product rules:

`visible prominence ∝ value × frequency × urgency × context`

`available capability >> visible complexity`

## Current priority order

Hard clinical-safety, security, privacy, data-integrity or production blockers always
outrank feature work.

### P0 — integrity and stabilization

- Exact-head build/type/test/CI failures, broken primary flows, deployment blockers,
  stale ancestry, merge conflicts and regressions.
- Validate current behavior before patching. Fix the concrete defect; do not weaken
  tests, validators, browser smoke, security gates or biomedical gates to obtain
  green CI.
- Remove stale, superseded and competing PRs from the active queue once their useful
  ideas are either already represented or explicitly marked for later harvest.

### P1 — canonical product shell and release-critical workflows

- Finish the 3-super-page architecture and eliminate duplicate top-level mental
  models.
- Mature **Home / OS** for health overview, devices/wearables, activity,
  sleep/recovery, nutrition, prevention, alerts, goals, emergency actions and quick
  actions.
- Mature **Clinical** for patient context, intake/triage, problem/allergy/medication
  reconciliation, CDSS, labs, imaging, calculators, medicines/interactions,
  guidelines, monitoring, documentation, audit and clinician sign-off.
- Make role, privacy, consent, audit, export/delete, resilience and deployment
  boundaries explicit before claiming pilot or institutional readiness.

### P2 — Explore / Body Exposure differentiation

- Keep one canonical **Explore** workspace for Body Exposure, education, evidence,
  research, datasets and biomedical discovery.
- Body Exposure remains **whole-body first**, then depth:
  `whole body → organ/system → tissue → histology → cell/organelle → molecule → genome/DNA`.
- Keep anatomy, physiology, pathophysiology, pharmacology, imaging, lesion
  localization, biomechanics and surgical education as modes/layers of the same
  Body workspace, not competing products.
- Use source-backed geometry and preserve source/version/license/transformation /
  evidence provenance. Never fabricate anatomy or patient-specific precision.
- Mature organ/system modules only through canonical Body contracts; do not create
  standalone organ pages that fragment navigation.

### P3 — evidence, governance and trust

- Evaluation dataset contracts, deterministic metrics, model/prompt release cards,
  evidence provenance, source registries, uncertainty and human-review boundaries.
- Treat software CI, metadata completeness and simulation output as engineering
  evidence only; none of them automatically establish clinical validity.

### P4 — polish and optimization

- Responsive behavior, especially 390x844; accessibility, keyboard/focus,
  reduced-motion, contrast, empty/error/loading states, visual regression,
  progressive loading, WebGL stability and performance budgets.
- Optimize after correctness is established; never trade integrity for speed.

### Park by default

Keep these out of the active queue unless they clearly beat a higher-priority task:
standalone novelty demos, unrelated finance experiments, duplicate route trees,
experimental input methods, spectacle-only visuals, speculative discovery surfaces,
old UI branches that restore superseded information architecture, and organ-specific
work that bypasses the canonical Body workspace. Closed/parked PR branches may be
harvested later; closing is queue cleanup, not loss of history.

## Task selection formula

For safe non-overlapping candidates, score each input from 0–5:

`Priority = 0.28B + 0.20R + 0.18S + 0.14A + 0.10U + 0.10E - 0.18O - 0.10D`

where:
- `B` = blocker reduction / release enablement;
- `R` = user reach;
- `S` = safety, reliability and trust improvement;
- `A` = fit with canonical architecture;
- `U` = reuse across roles/surfaces;
- `E` = effort efficiency;
- `O` = overlap/race risk;
- `D` = new maintenance or UX debt.

Hard safety/security/privacy blockers override the numerical result.

Delete or park a task from the active queue when one or more are true:
1. a newer PR/task clearly supersedes it;
2. it duplicates another active scope or restores superseded IA;
3. it is stale enough that replaying a small useful diff is safer than merging it;
4. it creates a new top-level surface without a valid feature-admission mapping;
5. its evidence/licensing/provenance boundary is unresolved;
6. its release value is materially lower than available P0–P2 work.

Before closing a non-trivial PR, preserve any unique idea by noting the successor or
harvest destination in the close reason/body when practical.

## Fixed work lanes and model allocation

The pinned workspaces have stable responsibilities so models do not compete for the
same job.

### Work 5.6 Sol — control plane / integrator

Default owner for planning-by-evidence, queue control, cross-cutting architecture,
React/TypeScript integration, shared contracts, Clinical/Home integration, PR
rationalization, final QA coordination and safe merge decisions. Use moderate
reasoning for routine work and heavy reasoning only when the problem genuinely
requires it.

### Work Astra Max — heavy specialist

Use only for difficult Three.js/WebGL, advanced anatomy/physiology visualization,
complex spatial interaction, hard performance/rendering problems, or architecture
that ordinary implementation cannot solve reliably. Astra should deliver a narrow,
reviewable foundation and then hand routine integration/cleanup back to the normal
lane.

### Body Light — Terra — light support lane

Own source/provenance inventory, deterministic tests, metadata, labels, simple data
mapping, accessibility, token/spacing sweeps, low-risk Body cleanup and other
repetitive non-overlapping work. It must not independently own the shared renderer,
Body root state model, global shell or clinical decision logic.

### Panacea Organ Build — moderate domain builder

Build one organ/system module at a time against the canonical Body contracts. Prefer
isolated components, data and tests; preserve provenance and explicit educational /
simulation boundaries. Do not create a new top-level page, fork the shared renderer,
or edit shared shell/contracts unless the integrator assigns that ownership.

## Parallelism and ownership

Parallel work is encouraged only when it is genuinely independent.

`ParallelSafe = (changed_paths_A ∩ changed_paths_B = ∅) ∧ stable_shared_contracts ∧ no_unresolved_dependency`

Parallel execution is allowed when the equation is true and each lane has a clear
acceptance criterion. Otherwise work is serialized.

Treat these as **single-owner / serial integration zones** unless explicitly
coordinated:
- `AGENTS.md`, `CLAUDE.md`;
- routing/app shell and the three super-page roots;
- package/build scripts and `.github/workflows`;
- shared design tokens/theme primitives;
- authentication, EMR/clinical data contracts and security-sensitive shared state;
- canonical Body root state, shared Body renderer/loader and shared anatomy schema.

Before selecting work:
1. resolve latest `main` and recent commits;
2. inspect open PRs/branches and exact CI/deployment state;
3. inspect changed-file overlap and upstream/downstream dependency;
4. claim one coherent scope with a small acceptance criterion;
5. pick the highest-priority safe task that does not duplicate another lane.

If `main` moves into overlapping files, shared contracts or workflow ancestry, stop
integration, refresh/replay on latest main and rerun the required gates. Never force
merge and never overwrite another lane's work.

## Standard execution lifecycle

1. **Inspect** — current `main`, open PRs, relevant files, failure evidence and
   provenance.
2. **Define** — smallest coherent reversible scope and measurable acceptance.
3. **Implement** — targeted change, no speculative repo-wide rewrite.
4. **Local/targeted QA** — relevant unit/deterministic tests, type/build checks,
   browser checks or rendering evidence.
5. **PR** — one coherent PR per task/lane; avoid repeated tiny pushes that churn CI.
6. **Exact-head QA** — require current-head **Validate pull requests** plus complete
   **Stabilization Acceptance** and any relevant specialized gate (Body/WebGL,
   security, academic accuracy, server, deployment smoke).
7. **Final integrity audit** — re-resolve latest `main`, mergeability, overlap,
   ancestry and unchanged tested head.
8. **Merge safely** — PR only, expected current head, never force.
9. **Verify** — confirm merge on `main` and inspect available deployment/smoke
   evidence.
10. **Continue** — select the next highest-priority non-overlapping task.

A task is complete because its acceptance and evidence are complete, **not because
a clock or arbitrary deadline elapsed**. There is no default task time limit.

## Quality, reliability and trust gates

- Never claim DONE, green, merged, deployed, clinically reviewed or validated
  without direct evidence.
- Preserve deterministic tests and their original intent.
- Diagnose a failing gate before pushing another speculative commit.
- Distinguish measured, reference, simulated, derived and unsupported states.
- Preserve authoritative source identity, version/provenance, uncertainty and
  transformation history for biomedical content.
- Never fabricate citations, anatomy, geometry, reviewer identity, validation,
  patient-specific findings, diagnosis, treatment or procedure targeting.
- High-risk clinical/procedure outputs remain blocked from clinical publication
  until the required qualified human review is actually recorded.
- Prefer targeted optimization supported by profiling/evidence; do not refactor
  broad shared systems merely because a local solution appears less elegant.

## `lanjut` execution keyword

The owner keyword **`lanjut`** means: continue immediately from the current repository
state on the highest-priority safe unfinished task. Do not ask for confirmation, do
not restate the plan, and do not wait for an arbitrary time window. First resolve
latest `main`, open PRs, overlap and current evidence, then resume execution.

If `lanjut` includes an additional qualifier, the qualifier narrows the task but does
not change the safety/QA rules.

For a `lanjut` response, output **exactly one concise paragraph** containing only:
- what has already been completed/verified in that run; and
- what is currently being worked on.

Do not add ETA, deadlines, future promises, long plans, headings or lists. Mention a
blocker only when it concretely prevents further execution.

## Biomedical and scientific boundary

For anatomy, physiology, pathology, pharmacology, surgery, genomics, longevity,
diagnosis/treatment or other medical behavior:
- preserve authoritative source identity, version/provenance and uncertainty;
- run the repository Academic Accuracy Gate for material biomedical content;
- never promote generic atlas/simulation geometry to patient-specific anatomy or
  procedure targeting;
- keep computational/research simulation distinct from clinical inference;
- software quality evidence does not equal academic, clinical or regulatory
  validation.

## Cost-awareness

Before escalating model/reasoning or broadening context, ask whether a smaller
change/test can solve the problem reliably. Save compute where safe, but never trade
away correctness, clinical safety, security, provenance or evidence quality.
