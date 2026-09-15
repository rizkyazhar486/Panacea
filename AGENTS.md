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

## Durable unfinished-work queue — no separate handoff

This section is the in-repository continuation ledger for Claude Code, Codex and
other implementation agents. **Do not create a separate handoff document unless
an owner explicitly asks for one.** Read this queue together with current `main`,
open PRs/issues and CI evidence. Before starting an item, verify that it is still
unfinished. Do not delete or mark an item complete until the implementation is
merged and its relevant acceptance evidence is green.

### P0 — stabilization, hardening and visual debt

- Finish exact-head CI for active production PRs: Validate, complete Stabilization
  Acceptance, security gates, Body/WebGL acceptance where relevant, then re-check
  latest `main`, ancestry and overlap before merge. Never rely on stale green CI.
- Diagnose concrete build/test/typecheck/browser failures before changing code.
  If Deep Human Lab blocker/PR `#1711` is still open, capture the current failure,
  make the smallest justified patch, and rerun fresh CI rather than re-planning.
- Complete the UI/UX debt pass without deleting capability: Home contrast and
  information simplification, typography hierarchy, 4/8 spacing consistency,
  navigation de-duplication/mobile flow, Today/widgets/reference ranges, Body
  Exposure/Learn/Discovery visual cleanup, forms/tables/modals/alerts/empty/error
  states, responsive behavior, accessibility and visual-regression review.
- Final stabilization/debugging/hardening/optimization is a Claude Code + Astra
  responsibility. The target remains Friday **18 Sep 2026**, but never bypass a
  gate, weaken a validator or claim readiness without evidence.

### P1 — finish consolidation into three super-pages

- Continue reducing public route complexity toward **Home / OS, Clinical, Explore**.
  Existing specialized routes may remain as compatibility/deep-link adapters, but
  they must not present themselves as competing top-level products.
- Compile duplicate or overlapping pages into one stateful workspace using widgets,
  rails/carousels, contextual tabs, drawers, overlays and progressive disclosure.
- Preserve useful functions, datasets, APIs and assets while removing duplicate UI
  and duplicate mental models. Consolidation means **merge capability, not delete
  capability**.
- Keep any feature reachable in roughly 1–2 interactions from a primary super-page.
  Rare tools should be smaller/secondary, not deeply buried.
- Make global search / Ask Panacea the universal shortcut layer so a user can reach
  uncommon functionality without understanding the old route tree.
- Remove production-facing TODOs, dev-status copy, “coming next”, implementation
  commentary and internal repo/workflow language from all public surfaces.

### P2 — unify the visual system instead of page-local styling

- Replace arbitrary component-local colors with semantic/shared tokens. Do not add
  new page-local palettes.
- Current owner direction: near-black/space-black biomedical-cosmic foundation;
  spectral/refraction accents in cyan/electric blue/violet/magenta; restrained
  warm-white/gold halo; Panacea green `#00BF63` remains a brand/semantic accent,
  not a large decorative fill.
- Keep surfaces quiet, translucent/glass only where it improves hierarchy, with
  narrow consistent borders and continuous framing. Avoid washed-out dark panels,
  parent `opacity`/`filter`/`grayscale`, decorative green slabs and unreadable muted
  mobile text.
- Use predictable spacing and typography. Prefer the 4/8 spacing rhythm and the
  existing size ladder `12, 14, 16, 20, 24, 32`; body copy must not fall below
  12 px and primary touch targets should be at least 44 px.
- Motion/3D/visual effects may be ambitious, but they must clarify state, anatomy,
  causality or navigation rather than become empty spectacle. Experimental/synthetic
  visualizations must be labeled as such and never presented as clinical fact.

### P3 — Body Exposure: whole-body first, then depth

- Keep **whole body first**. Mature breadth across the body and organ systems before
  spending disproportionate effort on one isolated organ or microscopic layer.
- Canonical anatomical depth is:
  `whole body → organ/system → tissue → histology → cell/organelle → molecule → genome/DNA`.
  The physical layer sequence should remain anatomically meaningful: skin →
  subcutaneous tissue → fascia → muscle → tendon/ligament → neurovascular
  structures → organ/capsule → histology → cell → molecule → gene.
- Biomechanics should follow bone → cartilage → capsule → ligament → tendon →
  muscle → fascia → force/load/movement, with source-backed geometry and no
  fabricated precision.
- Integrate anatomy, physiology, pathophysiology, pharmacology, imaging, lesion
  localization, biomechanics and surgical education as modes/layers of the same
  Body Exposure workspace, not separate competing products.
- Mandatory references/targets remain: `thebuggeddev/anatomy`, the Breath Atlas,
  `aycibatuhan/nervous-system-atlas`, the dental-atlas reference and the
  anatomy-unfolded reference. Use them for capability/interaction targets; copy
  code/assets only when licensing/permission is verified. Preserve provenance.
- Issue `#626` remains a mandatory Body Exposure HD Anatomy + Breath Atlas target:
  progressive loading, LOD, high-DPI fidelity, stable WebGL, respiratory mechanics,
  airway hierarchy and mobile 390x844 evidence.
- Organ/system maturation sequence includes the Eye Gold Standard, Heart &
  Cardiovascular, Brain & Neurovascular/Nervous System, Respiratory, Renal,
  Endocrine, and whole-body Musculoskeletal/Biomechanics. Do not declare an organ
  presentation-ready merely because a shell exists.
- Eye Gold Standard scope includes orbit/globe, corneal layers, retinal layers,
  extraocular muscles, neural pathway, blood supply, lacrimal system, aqueous flow,
  accommodation, pupillary reflex, pathology, pharmacology, imaging, interaction,
  performance and validation. Owner quality goals `Q ≥ 0.88` and anatomical
  accuracy `≥ 0.92` are aspirational gates unless an explicit reproducible rubric
  exists; never fabricate a passing score.
- Continue mechanism integration: pathophysiology → pharmacology/DailyMed → causal
  bridge → unified mechanism graph → provenance; complete/replay lesion workflows,
  heart pressure-volume, brain neurovascular, respiratory V/Q + gas exchange,
  renal and endocrine simulations with explicit evidence/simulation boundaries.

### P4 — Home / OS, Clinical and Explore capability compilation

- **Home / OS:** compile personal health overview, wearables/device integrations,
  activity, sleep/recovery, nutrition, longevity, prevention, alerts, goals,
  emergency actions and quick actions into a short vertically scrollable surface.
  WHOOP, Garmin, Oura and Apple Health integrations belong here contextually rather
  than as separate top-level products.
- **Clinical:** unify patient context, intake/triage, differential diagnosis, CDSS,
  labs, imaging, clinical scores/calculators, medicines/interactions, guidelines,
  monitoring and documentation into one clinical flow. Do not expose AI output as
  verified diagnosis/treatment without the required evidence/review boundary.
- **Explore:** unify Body Exposure, medical education, evidence/reference, research,
  datasets and biomedical discovery in one visual-first workspace. Deep content is
  allowed, but first-layer text should stay brief and visual/interactive.
- Discovery/research simulation may support computational molecule/drug/vaccine
  concepts, literature/evidence links and safe synthetic modeling. Do **not** add
  operational pathogen engineering, actionable wet-lab viral design or unsupported
  claims of real-time clinical applicability.

### P5 — final polish and acceptance

- After feature consolidation, run a full responsive pass for phone/tablet/desktop,
  especially 390x844; verify no floating controls, nav, drawers or carousels cover
  important content.
- Preserve progressive asset loading, bounded render scale/devicePixelRatio, WebGL
  context stability, graceful degradation and performance budgets for 3D pages.
- Audit keyboard/focus semantics, reduced motion, color contrast, readable muted
  text, empty/error/loading states and visual regression.
- Remove genuinely dead duplicate routes/components only after compatibility/deep
  links and usage are accounted for. Never delete a feature merely because its old
  page is no longer visible.

### Model/work allocation

- **Claude Code:** stabilization, debugging, hardening, integration, route/UI
  de-fragmentation, refactoring, responsive behavior, performance cleanup, build/
  type/test failures, and finishing already-settled product decisions.
- **Astra / heavy visual mode:** difficult Three.js/WebGL, advanced anatomy or
  physiology rendering, sophisticated 3D/motion/spatial interaction and visual
  problems that ordinary coding modes cannot solve reliably.
- **Routine/medium:** most React/TypeScript integration, component consolidation,
  data wiring and predictable UI work.
- **Light/repetitive:** token replacement, spacing/typography/accessibility sweeps,
  labels, deterministic cleanup and simple tests.
- **Do not re-plan settled decisions.** Inspect current state, take the highest-value
  non-overlapping unfinished item, implement it, validate it, merge safely, then
  continue.

## Continuous product director — publish first, mature continuously

The default objective is **maximum validated user-visible output per unit of time**,
not maximum page count, raw LOC or novelty. Every agent run should choose the next
non-overlapping task with the highest release value.

Use this transparent priority score with each component normalized to 0–5:

`ShipPriority = 0.30B + 0.25R + 0.20X + 0.15S + 0.10E`

where `B` = release-blocker reduction, `R` = user reach, `X` = reuse across target
audiences, `S` = safety/trust improvement, and `E` = effort efficiency. Hard
security/clinical-safety blockers override the numerical score.

### Release sequence

1. **Showcase candidate first.** The app should be safe to show publicly and to
   clinicians: exactly three obvious super-pages, no broken primary flows, no dev
   copy/TODOs, coherent theme, responsive phone/desktop behavior, demo-safe data,
   and every visible control either functional or intentionally disabled with a
   user-facing reason.
2. **Patient + athlete pilot next.** Mature Home / OS for connected signals,
   provenance, trends, sleep/recovery, activity/training, nutrition, prevention,
   reminders, emergency actions, consent and export/delete controls. Athlete mode
   is role-adaptive Home / OS, not a fourth page.
3. **Puskesmas assisted pilot next.** Mature Clinical for patient queue/context,
   intake, vitals, red flags/triage support, problem/allergy/medication review,
   calculators, labs, medicines, referral, notes, print/export, audit and
   low-bandwidth resilience. Clinician sign-off remains mandatory for clinical
   actions.
4. **Hospital integration pilot after that.** Add/finish RBAC, holistic EMR,
   longitudinal records, audit trail, interoperability/FHIR mapping where
   appropriate, deployment observability, backups/recovery, privacy/governance,
   incident/downtime behavior and institution-specific integration tests. Do not
   market “hospital ready” merely because the UI looks finished.
5. **Explore / Body Exposure matures in parallel** as Panaceamed's differentiation
   layer, but novelty must not block release-critical Home / Clinical work.

### Same three pages, role-adaptive composition

- **Home / OS:** primary for patient, athlete and general user; clinicians may also
  see their own/personal summary. Change widgets/priority by role, not route trees.
- **Clinical:** primary for doctor/Puskesmas/hospital workflow. Patients may receive
  a limited patient-facing view, but clinician-only actions stay role-gated.
- **Explore:** universal visual learning/research/body workspace; role changes depth
  and available controls, not the top-level page count.
- Admin/settings/enterprise controls belong in profile, command/search, drawers or
  contextual management surfaces, not as another primary super-page.

### Feature admission rule

Every new capability must declare:
1. parent super-page (`Home`, `Clinical`, or `Explore`);
2. surface form (`primary widget`, `rail/carousel item`, `contextual mode/drawer`,
   or `search/command-only`);
3. expected access depth (normally 1–2 interactions);
4. data/evidence/provenance status;
5. whether it is release-critical, differentiating, or optional.

A feature without this mapping is parked instead of creating a new top-level route.

### Current PR harvest order (2026-09-15)

- **0 — #1734 first:** land the 3-super-page foundation after fresh exact-head
  Validate + full Stabilization Acceptance and final latest-main overlap check.
- **1 — Clinical core:** replay/adapt useful work from #1708 into Clinical. Reuse
  the intent-level Care grouping from closed #1733 where useful, but do not restore
  its competing IA.
- **2 — Body mechanism evidence chain:** #1711 → #1712 → #1713, replayed one layer
  at a time onto latest main and integrated under Explore / Body Exposure. Closed
  #1705 is superseded by #1711.
- **3 — High-value Body depth:** selectively integrate #1681 lesion localization,
  #1646 EEG/brain work and useful convergence ideas from #1701 without creating
  parallel Body products.
- **4 — Discovery differentiation:** integrate safe, evidence-bounded pieces of
  #1645, #1709, #1726 and #1715 under Explore / Discovery rather than separate
  public products.
- **5 — Legacy Home/UI PRs:** treat #1664, #1665 and #1666 as design/test sources to
  harvest selectively after #1734; do not wholesale merge stale UI that reopens old
  Home architecture.
- **6 — Enterprise/product architecture:** #1683 and #1714 are lower priority than
  working Clinical/EMR/pilot flows; integrate only when their governance/economics
  concepts support the real three-page product.
- **7 — Optional novelty:** #1672 and #1706 remain parked until showcase and pilot
  gates are green. Novel input/cinematic features must not delay publishability.
- **Conditional — #1658:** only replay if its reachability fix still corresponds to
  a current failing gate after Learn content has been absorbed into Explore.

### Continuous lane allocation

- **Lane A — Release/CI (Claude Code):** exact-head failures, build/type/test,
  routing, accessibility blockers, performance, responsive defects, hardening.
- **Lane B — Product integration (routine/medium coding):** 3-page consolidation,
  role-adaptive widgets, Clinical/EMR/data wiring, route adapters, search/command.
- **Lane C — Visual/3D (Astra/heavy):** Body Exposure, WebGL/Three.js, spatial
  interaction, anatomy/physiology motion and difficult visual foundations.
- **Lane D — Evidence/content/data (fast/medium):** source/provenance mapping,
  concise educational layers, safe demo fixtures, labels, token/a11y sweeps and
  deterministic tests.

Do not let two lanes edit the same high-conflict files simultaneously. Prefer one
coherent PR per lane. When a PR merges, immediately select the next highest
`ShipPriority` non-overlapping task instead of waiting for another “continue”.

### Definition of publishable vs clinically deployable

A visually polished showcase can ship before institutional deployment. Puskesmas
or hospital use requires the relevant security, privacy, audit, human-review,
evidence, reliability and governance gates to be actually satisfied. Software CI
is not clinical validation. Keep those stages explicit so speed never becomes an
unsupported clinical-readiness claim.

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