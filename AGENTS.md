# Panacea Multi-Agent Operating Policy

## Objective
Work efficiently on Panacea while minimizing duplicated work, CI churn, stale PRs,
and unnecessary model/credit usage. Correctness, clinical safety, maintainability,
security and production stability remain more important than speed.

## Source of truth and traffic rules

GitHub `main` is the source of truth. **Agents must not push directly to `main`.**
Every production change uses a short-lived branch and PR.

Before selecting work:
1. Resolve latest `main` and recent commits.
2. Inspect open PRs/branches and current CI/deployment state.
3. Check changed-file overlap for the intended area.
4. If another agent already owns overlapping paths, do not duplicate the work.
5. Prefer the highest-value non-overlapping unfinished candidate.

One active coherent PR is preferable to several overlapping micro-PRs. Close or
supersede stale duplicates explicitly.

## Product UX constitution — compact super-pages

Panaceamed must expose a very small mental model while preserving a very large
capability set. This is a permanent product-architecture constraint, not a styling
preference.

- Prefer **3 primary super-pages**: Home / OS, Clinical, and Explore. A fourth
  primary page is allowed only when a genuinely distinct mental model cannot be
  represented cleanly inside those three.
- New capability does **not** imply a new page. First try to compile it into an
  existing super-page as a widget, horizontal rail, carousel, compact card,
  contextual tab, expandable panel, drawer, bottom sheet, overlay, visual state,
  or command/search action.
- Preserve existing useful features when consolidating. Merge overlapping
  features, datasets, APIs and assets into one coherent surface instead of
  deleting capability or creating parallel/duplicate products.
- Target **1–2 interactions from a primary super-page to any feature**, including
  low-frequency features. Rare features may occupy less permanent visual space,
  but they must not become harder to reach.
- Use one main vertical scroll. Prefer short, visually calm pages with horizontal
  rails/carousels and progressive disclosure instead of long menus or nested
  route trees.
- Order content by significance: urgent/high-value/high-frequency items first;
  useful secondary items next; optional/rare items last or on demand.
- Visible complexity must stay much lower than available capability. A user should
  understand the app's main structure within roughly **5–9 minutes**.
- Education may be deep, but the first layer should be visual and concise:
  diagrams, images, motion, simulation, 3D, video, charts and interaction before
  long explanatory text. Reveal deeper evidence and detail on demand.
- Do not expose development state, TODOs, unfinished work, implementation plans,
  repository names, internal architecture commentary, or “what we are building
  next” in production-facing UI unless it is intentionally a public roadmap.
- Navigation is disposable. Remove or collapse nav items when they add clutter,
  duplicate another path, or reduce aesthetics. Global search / Ask Panacea may
  serve as the universal shortcut layer.
- Theme values come from shared design tokens. Components must not invent local
  colors merely because they look attractive. Visual hierarchy, spacing, radius,
  typography, glass treatment, motion and color must read as one system.

A useful default rule is:

`visible prominence ∝ value × frequency × urgency × context`

and:

`available capability >> visible complexity`

When two features substantially overlap in user intent, data, actions or context,
the default is to **merge them into the same super-page** rather than add another
branch in navigation.

## Standard agent lane

For each candidate:
1. Define a small acceptance criterion.
2. Create a branch from latest safe `main`.
3. Make the smallest coherent reversible change.
4. Run targeted tests/typechecks locally or through available tooling first.
5. Push a consolidated branch update; avoid repeated tiny pushes that continually
   cancel and restart CI.
6. Open/update one PR.
7. Require exact-head **Validate pull requests** plus complete **Stabilization
   Acceptance** before merge.
8. Immediately before merge, re-resolve latest `main`, mergeability and changed-file
   overlap. If overlap or workflow ancestry is uncertain, refresh from latest main
   and rerun gates; never force merge.
9. Merge through the PR only. Verify `main` and available deployment/smoke evidence.
10. Continue to the next non-overlapping candidate without waiting for a manual
    “lanjut” instruction when operating under an authorized automation.

## CI throughput policy

Stabilization coverage must not be weakened merely to make CI faster. Throughput
improvements should remove redundant work, expose failures earlier, improve cache
use, or safely parallelize independent gates.

- `npm run build` already includes repository validators and TypeScript project
  build; avoid duplicating an equivalent typecheck in the same workflow unless it
  catches a distinct class of failure.
- Preserve deterministic frontend tests, Body 390x844 browser smoke, rendered
  WebGL evidence, server typecheck/build/tests, and specialized gates where relevant.
- Diagnose a failed run before pushing another commit. A speculative push wastes
  runner time and cancels useful evidence.
- Do not create placeholder/TEMP commits on `main` to trigger or test CI.
- Do not bypass or edit tests solely to make a failing candidate green.
- CI green on an old head is stale evidence if the PR head changes. If `main`
  changes materially or overlaps the PR, revalidate against current main.

## Failure protocol

When a gate fails:
- identify whether the failure is caused by the candidate, current `main`, runner
  infrastructure, or a hidden dependency between jobs;
- fix only the concrete defect when possible;
- preserve the original test intent;
- if a refactor/optimization exposes a hidden dependency, encode that dependency
  explicitly rather than restoring accidental ordering;
- never claim DONE, green, merged, deployed or verified without direct evidence.

## Default coding behavior

- Use normal/default Codex and medium reasoning for routine coding.
- Keep repository context narrow; inspect only relevant files unless broader
  context is necessary.
- Prefer targeted edits over repo-wide refactors.
- Prefer targeted tests first; full gates remain required at merge boundaries.
- Avoid repeatedly re-reading unchanged files.
- Do not use expensive/highest-capability modes for routine Git, docs, renaming,
  formatting, simple styling, CRUD, small refactors, or straightforward bug fixes.

## Escalation policy

1. **Routine / Medium reasoning**
   - Small bug fixes, CRUD/API wiring, TypeScript fixes, simple React components,
     CSS/layout, tests, documentation and Git operations.
2. **High reasoning**
   - Multi-file dependency issues, difficult debugging, architecture, complex
     state/data flow, security-sensitive or clinically important implementation.
3. **Extra-high reasoning**
   - Only when High is insufficient or correctness risk is substantial.
4. **Astra**
   - Reserve for complex interactive medical visualization, Three.js/WebGL,
     advanced 3D/animated anatomy or physiology, sophisticated SVG/canvas, and
     difficult end-to-end visual work ordinary modes cannot solve reliably.

After a difficult visual foundation works, return to normal/default mode for
integration, cleanup, responsive behavior, tests and maintenance.

## Biomedical and scientific boundary

For anatomy, physiology, pathology, pharmacology, surgery, genomics, longevity or
other medical behavior:
- preserve authoritative source identity, version/provenance and uncertainty;
- distinguish measured, reference, simulated, derived and unsupported states;
- run the repository Academic Accuracy Gate for material biomedical content;
- never fabricate citations, anatomy, geometry, reviewer identity or validation;
- never promote generic atlas geometry to patient-specific anatomy or procedure
  targeting;
- high-risk clinical/procedure content stays blocked from clinical publication
  until the required qualified human review is actually recorded.

## Cost-awareness rule
Before escalating model/reasoning or broadening context, ask internally whether a
smaller targeted change/test can solve the task reliably. Save compute where safe,
but never trade away correctness, clinical safety, security or evidence quality.