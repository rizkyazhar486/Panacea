# Panacea Multi-Agent Operating Policy

## Objective
Build Panaceamed quickly without sacrificing correctness, clinical safety, security,
maintainability, reliability, trustworthiness or repository integrity. Optimize for
validated user value, not raw feature count, LOC, page count or novelty.

GitHub `main` is the source of truth. **Never push production changes directly to
`main`.** Use a short-lived branch and PR, exact-head validation, latest-main audit,
and merge through the PR only.

## Canonical product constitution

Panaceamed has **exactly three primary super-pages**:

1. **Your Body** — compiles Today, Move, Training, Sleep & Recovery, Body, Fitness,
   Mind, Longevity, Nutrition, Health Data, VitaPulse, wearables and related personal
   health signals into a visual-first data workspace.
2. **Clinical** — compiles Body Explorer, Discovery, Genome/Data Bank, Drugs,
   Invention, Innovation, Medical Library, Ask Health, Calculators, Labs, Learn and
   Look Up into one clinical/biomedical intelligence workspace.
3. **For You** — compiles Faith, Finance, Score, Social, Community, AI Chatbot,
   AI-EMR, Care, Account, Manage Features, Settings/System, Messages, Theme, Help and
   Support into one personal/contextual workspace.

The `/` Home surface is the **supermega overview of these same three super-pages**, not
a fourth information architecture. It must summarize all three with working widgets
and direct capability access.

### Home / supermega rules

- A feature shown on Home must be **functional and interactive**, not a logo-only or
  decorative shortcut.
- From Home, a visible widget/shortcut reaches its actual tool or mode in **one tap**.
- Every registered capability should remain directly reachable from the Home widget
  rails; horizontal scrolling is allowed so vertical length stays compact.
- The main Home scroll should stay short: use live widgets, horizontal rails,
  carousels, compact action surfaces, drawers and progressive disclosure.
- Functional density must not become visual density. Keep generous spacing and clear
  hierarchy between sections/cards/actions.
- Main scrolling UI is visual-first: numbers, graphs, score, status, icon, motion and
  micro-labels. Keep explanatory text to at most one short line per visible element;
  deeper interpretation belongs behind an action/drawer/detail surface.
- Never use a gray placeholder card as a substitute for a working widget.
- Search is a universal accelerator, not a substitute for direct one-tap capability
  access.

A new capability does **not** justify a fourth top-level page. Compile it into the
closest super-page as a widget, rail item, contextual mode, drawer, sheet, overlay or
subsurface. Preserve capability while removing duplicate mental models.

Useful product rules:

`visible prominence ∝ value × frequency × urgency × context`

`available capability >> visible complexity`

## Current priority order

Hard clinical-safety, security, privacy, data-integrity or production blockers always
outrank feature work.

### P0 — integrity and stabilization
- Exact-head build/type/test/CI failures, broken primary flows, deployment blockers,
  stale ancestry, merge conflicts and regressions.
- Fix concrete defects; never weaken validators, tests, browser smoke, security gates
  or biomedical gates merely to obtain green CI.

### P1 — three-super-page convergence
- Finish and harden **Your Body / Clinical / For You** as the only primary mental
  model.
- Keep `/` as the functional supermega overview of all three, with one-tap direct
  capability access.
- Merge legacy route families into those surfaces without deleting useful capability.
- Preserve old deep links as compatibility redirects where needed; do not expose them
  as competing primary pages.

### P2 — Body Exposure differentiation
- Body Exposure belongs inside **Clinical** as the professional/biomedical explorer,
  while personal body signals remain inside **Your Body**.
- Keep one canonical Body renderer and one canonical multiscale depth model:
  `whole body → organ/system → tissue → histology → cell/organelle → molecule → genome/DNA`.
- Anatomy, physiology, pathophysiology, pharmacology, imaging, lesion localization,
  biomechanics and surgical education are layers/modes, not separate products.
- Preserve source/version/license/transformation/evidence provenance. Never fabricate
  anatomy or patient-specific precision.

### P3 — evidence, governance and trust
- Evaluation contracts, deterministic metrics, model/prompt release cards, evidence
  provenance, uncertainty and human-review boundaries.
- Software CI and simulation output are engineering evidence, not clinical validity.

### P4 — polish and optimization
- Responsive behavior, especially 390x844; accessibility, keyboard/focus,
  reduced-motion, contrast, empty/error/loading states, visual regression,
  progressive loading, WebGL stability and performance budgets.

### Park by default
Standalone novelty demos, duplicate route trees, spectacle-only visuals, speculative
surfaces with weak release value, stale UI branches that restore superseded IA, and
organ work that bypasses canonical Body contracts remain parked unless they clearly
beat a higher-priority task.

## Task selection formula

For safe non-overlapping candidates, score each input from 0–5:

`Priority = 0.28B + 0.20R + 0.18S + 0.14A + 0.10U + 0.10E - 0.18O - 0.10D`

where `B` blocker reduction, `R` user reach, `S` safety/reliability/trust, `A`
architecture fit, `U` reuse, `E` effort efficiency, `O` overlap risk and `D` new debt.
Hard safety/security/privacy blockers override the numerical result.

Close or park a task when it is superseded, duplicate, stale enough that selective
replay is safer, restores superseded IA, lacks provenance/licensing, or has materially
lower value than available P0–P2 work.

## Fixed work lanes and model allocation

### Work 5.6 Sol — control plane / integrator
Own repository state, queue, cross-cutting architecture, React/TypeScript integration,
shared contracts, Home/Clinical/For You convergence, PR rationalization, QA
coordination and safe merge decisions.

### Work Astra Max — heavy specialist
Use only for difficult Three.js/WebGL, advanced anatomy/physiology visualization,
complex spatial interaction, hard rendering/performance or unusually difficult
numerical/spatial foundations.

### Body Light — Terra — light support lane
Own source/provenance inventory, deterministic tests, metadata, labels,
accessibility/token/spacing sweeps and other low-risk non-overlapping cleanup. It must
not independently own shared renderer/root state/global shell/clinical decision logic.

### Panacea Organ Build — moderate domain builder
Build one organ/system module at a time against canonical Body contracts. Prefer
isolated components/data/tests and do not fork the renderer or create a top-level
organ page.

## Parallelism and ownership

`ParallelSafe = (changed_paths_A ∩ changed_paths_B = ∅) ∧ stable_shared_contracts ∧ no_unresolved_dependency`

Treat these as single-owner / serial integration zones unless explicitly coordinated:
- `AGENTS.md`, `CLAUDE.md`;
- routing/app shell and the three super-page roots;
- package/build scripts and `.github/workflows`;
- shared design tokens/theme primitives;
- authentication, EMR/clinical data contracts and security-sensitive shared state;
- canonical Body root state, shared renderer/loader and shared anatomy schema.

Before selecting work: resolve latest `main`; inspect open PRs/CI; inspect overlap and
dependencies; claim one coherent scope; choose the highest-priority safe task that
does not duplicate another lane. If `main` moves into overlapping files/contracts,
refresh/replay and rerun required gates. Never force merge or overwrite another lane.

## Standard execution lifecycle

1. Inspect current `main`, active PRs, relevant files, failures and provenance.
2. Define the smallest coherent reversible scope and measurable acceptance.
3. Implement without speculative repo-wide rewrite.
4. Run targeted unit/deterministic/type/build/browser/render checks.
5. Keep one coherent PR per task/lane.
6. Require exact-head **Validate pull requests** + full **Stabilization Acceptance**
   and relevant specialized gates.
7. Re-check latest `main`, mergeability, overlap, ancestry and unchanged tested head.
8. Merge through PR only, never force.
9. Verify merge on `main` and available deployment/smoke evidence.
10. Continue with the next highest-priority non-overlapping task.

A task is complete because acceptance evidence is complete, **not because a clock or
arbitrary deadline elapsed**. There is no default task time limit.

## Quality, reliability and trust gates

- Never claim DONE, green, merged, deployed, clinically reviewed or validated without
  direct evidence.
- Preserve deterministic tests and their intent.
- Diagnose a failing gate before another speculative commit.
- Distinguish measured, reference, simulated, derived and unsupported states.
- Preserve authoritative source identity, version/provenance, uncertainty and
  transformation history for biomedical content.
- Never fabricate citations, anatomy, geometry, reviewer identity, validation,
  patient-specific findings, diagnosis, treatment or procedure targeting.
- High-risk clinical/procedure outputs remain blocked from clinical publication until
  required qualified human review is actually recorded.

## `lanjut` execution keyword

The owner keyword **`lanjut`** means continue immediately from current repository
state on the highest-priority safe unfinished task. Do not ask for confirmation, do
not restate the plan and do not wait for an arbitrary time window. Resolve latest
`main`, active PRs, overlap and current evidence, then resume execution.

For a `lanjut` response, output **exactly one concise paragraph** containing only what
has already been completed/verified in that run and what is currently being worked
on. No ETA, deadline, future promise, heading or list. Mention a blocker only when it
concretely prevents further execution.

## Biomedical and scientific boundary

For anatomy, physiology, pathology, pharmacology, surgery, genomics, longevity,
diagnosis/treatment or other medical behavior: preserve authoritative provenance and
uncertainty; run the repository Academic Accuracy Gate for material changes; never
promote generic atlas/simulation geometry to patient-specific anatomy or procedure
targeting; and keep research simulation distinct from clinical inference.

## Cost-awareness

Use the smallest model/context/change that solves the task reliably. Save compute
where safe, but never trade away correctness, clinical safety, security, provenance or
evidence quality.
