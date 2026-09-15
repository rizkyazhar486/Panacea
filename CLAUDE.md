# Panaceamed.id — working rules

## Language: English is the base. This is permanent.

The **fundamental language of this application is English**, everywhere, from now
on and for good. English is not a preference to be revisited each session — it is
what makes the product professional and usable outside one person's own screen.

The app is **multilingual on top of that base**: English (source) plus
**Arabic, Mandarin, Indonesian, French, Japanese, Dutch**. Every new string is
written in English first and then translated outward; never the reverse.

### What this means in practice

- **Write every new user-facing string in English.** Buttons, labels, empty
  states, error messages, notification titles and bodies, onboarding copy.
- **Never translate the interface into Indonesian.** If a screen is still in
  Indonesian, it is unfinished work — convert it to English, do not "keep it
  consistent" with its neighbours by adding more Indonesian.
- **Two exceptions, and only these two:**
  1. The **SKDI / OSCE / UKMPPD medical corpus** (disease notes, station notes,
     exam banks, therapy references) stays in Indonesian — it mirrors Indonesian
     national competency material and its wording is the point.
  2. **Scripture and religious content** (Qur'an, hadith, other traditions) keeps
     its source language plus the existing Indonesian rendering.
  The interface *around* both of those is still English.
- **Code comments in this repository are written in Indonesian** by long-standing
  convention, and that stays. Comments are not interface.

### Why this was written down

An earlier session read a note that said "~1,100 remaining English strings" as a
list of strings to translate *into* Indonesian, and pushed ten commits in the
wrong direction before it was caught. The instruction had always been the
opposite. The cost of re-deriving this from context is a day of work thrown away,
so it lives here instead.

## Identifiers are not text

`id`, route paths, `value=` on options, filter keys, and anything compared with
`===` are **data**, not interface. Translating them empties saved layouts and
silently kills filters with no visible error. Translate the label; leave the key.

## Product architecture: simplicity is permanent

Panaceamed must feel small even when its capability set is very large. Treat this
as a permanent architecture rule for every UI change.

- The default information architecture is **3 primary super-pages: Home / OS,
  Clinical, Explore**. Add a fourth only if a truly different mental model cannot
  be represented cleanly inside those three.
- Do not create a new page merely because a new feature exists. Merge overlapping
  functionality, data, APIs and assets into an existing super-page first.
- Compile features into compact widgets, horizontal rails, carousels, visual
  states, contextual tabs, expandable panels, drawers, bottom sheets, overlays,
  motion/3D views, and global search / Ask Panacea.
- Keep one main vertical scroll and use progressive disclosure. The initial screen
  should be short, calm and readable; deeper capability appears when requested.
- Any feature should normally be reachable in **1–2 interactions** from a primary
  super-page. Rare features may be visually smaller, but not buried deeper.
- Order the screen by value and urgency: most significant first, less useful or
  low-frequency capability later or on demand.
- A new user should understand the application's primary structure in roughly
  **5–9 minutes**.
- Educational content can be scientifically deep, but its first layer should use
  visuals first and minimal text: images, diagrams, charts, animation, video, 3D,
  simulation and interaction. Reveal detailed explanation/evidence on demand.
- Never expose internal TODOs, unfinished work, development plans, repository
  structure, implementation commentary or “what comes next” in public UI unless
  it is intentionally a public roadmap.
- Navigation is not sacred. Remove, collapse or replace nav that adds clutter or
  duplicate paths. Search / command access may be the universal shortcut.
- Theme/color values come from shared design tokens. Do not invent page-local
  palettes or arbitrary colors inside components.

The governing equation is simple:

`available capability >> visible complexity`

and prominence should broadly follow:

`value × frequency × urgency × context`

## Claude Code continuation queue — use this instead of a separate handoff

This is the durable continuation queue. The owner does **not** want a separate
handoff document for routine continuation. Read this section and `AGENTS.md`, then
inspect current `main`, open PRs/issues and exact-head CI. Verify an item is still
unfinished before touching it; do not re-plan settled product decisions.

### First responsibility: stabilization and finishing

- Finish exact-head Validate + full Stabilization Acceptance + relevant security /
  Body/WebGL gates for active production PRs, re-check latest `main`, ancestry and
  file overlap, then merge only through the PR. Never trust stale green CI.
- If Deep Human Lab blocker/PR `#1711` still exists, capture the present failure,
  make the smallest evidence-based fix and rerun fresh CI.
- Own final debugging, hardening, performance cleanup, build/type/test fixes,
  responsive behavior and visual finishing. Target remains Friday **18 Sep 2026**,
  but no deadline allows bypassing gates or weakening validation.
- Complete visual debt: Home contrast/information simplification, global typography
  hierarchy, 4/8 spacing, nav de-duplication/mobile flow, Today/widgets/reference
  ranges, Body Exposure/Learn/Discovery cleanup, forms/tables/modals/alerts/empty /
  error states, accessibility and visual-regression checks.

### Continue product consolidation, not page growth

- Reduce the public mental model toward **Home / OS, Clinical, Explore**. Existing
  specialist routes may survive only as compatibility/deep-link adapters or
  contextual states; do not let them remain parallel top-level products.
- Merge overlapping functions, APIs, datasets and assets into the same super-page.
  Preserve capability; remove duplication, not functionality.
- Keep every feature roughly 1–2 interactions from a primary super-page. Rare
  tools should be compact but discoverable via rails, drawers, contextual modes,
  global search / Ask Panacea.
- Remove public-facing TODO/dev status/“coming next”/internal repository or workflow
  commentary from the shipped UI.

### Visual system that must be unified

- Replace arbitrary component-local colors with shared semantic tokens.
- Owner direction: near-black/space-black biomedical-cosmic canvas; spectral
  cyan/electric blue/violet/magenta refraction; restrained warm-white/gold halo;
  Panacea green `#00BF63` is brand/semantic accent rather than a large fill.
- Keep quiet surfaces, narrow consistent borders and controlled glass/translucency.
  Avoid washed-out dark panels, parent opacity/filter/grayscale, decorative green
  backgrounds and unreadable muted text.
- Prefer 4/8 spacing rhythm, typography ladder `12, 14, 16, 20, 24, 32`, body text
  at least 12 px, and 44 px minimum primary touch targets.
- Motion/3D can be ambitious but must communicate state/anatomy/causality. Mark
  experimental or synthetic content explicitly; never present spectacle as fact.

### Body Exposure remains the highest-value product depth work

- Keep whole-body-first ordering. Mature breadth across organ systems before
  over-investing in one organ or microscopic view.
- Canonical depth: `whole body → organ/system → tissue → histology → cell/organelle
  → molecule → genome/DNA`.
- Physical layers: skin → subcutaneous tissue → fascia → muscle → tendon/ligament →
  neurovascular structures → organ/capsule → histology → cell → molecule → gene.
- Biomechanics: bone → cartilage → capsule → ligament → tendon → muscle → fascia →
  force/load/movement.
- Keep anatomy, physiology, pathophysiology, pharmacology, imaging, lesion
  localization, biomechanics and surgical education inside the same Body Exposure
  state model rather than spawning separate products.
- Mandatory capability references remain `thebuggeddev/anatomy`, Breath Atlas,
  `aycibatuhan/nervous-system-atlas`, dental-atlas and anatomy-unfolded references.
  Verify licensing before copying code/assets; preserve source/version/license /
  transformation/evidence/provenance.
- Issue `#626` is mandatory: HD anatomy + Breath Atlas fidelity, respiratory
  mechanics, airway hierarchy, LOD/progressive loading, stable WebGL, 390x844 and
  high-DPI visual evidence.
- Continue organ/system maturation: Eye Gold Standard, Heart & Cardiovascular,
  Brain & Neurovascular/Nervous System, Respiratory, Renal, Endocrine, and whole-
  body Musculoskeletal/Biomechanics.
- Eye scope: orbit/globe, corneal layers, retinal layers, EOM, neural pathway,
  blood supply, lacrimal system, aqueous flow, accommodation, pupillary reflex,
  pathology, pharmacology, imaging, interaction, performance and validation. Treat
  owner goals `Q ≥ 0.88` and anatomical accuracy `≥ 0.92` as real gates only when
  a reproducible rubric exists; never invent a passing score.
- Continue mechanism chain work: pathophysiology → pharmacology/DailyMed → causal
  bridge → unified mechanism graph → provenance; finish/replay lesion, heart PV,
  brain neurovascular, respiratory V/Q + gas exchange, renal and endocrine flows.

### Compile the three super-pages deeply

- **Home / OS:** health overview, longitudinal signals, wearables/device data,
  activity, sleep/recovery, nutrition, longevity/prevention, alerts, goals,
  emergency actions and quick actions. WHOOP, Garmin, Oura and Apple Health are
  contextual integrations, not standalone top-level products.
- **Clinical:** patient context, intake/triage, differential diagnosis, CDSS, labs,
  imaging, scores/calculators, medicines/interactions, guidelines, monitoring and
  documentation in one flow, with human-review/evidence boundaries preserved.
- **Explore:** Body Exposure, education, evidence/reference, research, datasets and
  biomedical discovery in one visual-first workspace with brief surface text and
  deeper evidence on demand.
- Discovery may include computational molecule/drug/vaccine concepts and safe
  synthetic simulation tied to literature/provenance. Do not implement operational
  pathogen engineering, actionable wet-lab viral design or unsupported claims of
  immediate patient applicability.

### Final acceptance before calling work finished

- Phone/tablet/desktop pass, especially 390x844; no floating control, nav, drawer
  or carousel may cover clinically/educationally important content.
- Preserve progressive asset loading, bounded render scale/devicePixelRatio,
  graceful degradation and stable WebGL under toggles/orbit/zoom/animation.
- Audit keyboard/focus semantics, reduced motion, contrast, readable muted text,
  loading/empty/error states and visual regression.
- Delete genuinely dead duplicate routes/components only after deep-link /
  compatibility and usage concerns are resolved; do not delete capability merely
  because its old page is hidden.

### Work allocation

- **Claude Code:** stabilization, debugging, hardening, integration, de-fragmenting
  routes/UI, refactors, responsive behavior, performance cleanup and finishing.
- **Astra/heavy:** difficult Three.js/WebGL, advanced 3D anatomy/physiology,
  sophisticated spatial/motion work and hard visual foundations.
- **Routine/medium:** most React/TypeScript integration, consolidation and data
  wiring.
- **Light/repetitive:** token/spacing/typography/accessibility sweeps, labels,
  deterministic cleanup and simple tests.
- Do not re-plan decisions already settled in this file. Take the highest-value
  non-overlapping unfinished item, implement, validate, merge safely, then continue.

## Multi-agent coordination — mandatory

This repository is edited concurrently by ChatGPT/Codex, Claude Code, Replit and
other automation. **GitHub `main` is the source of truth, but agents must not push
directly to `main`.** Direct writes make other PRs stale, cancel useful CI, and
create hard-to-audit races.

Before editing:
1. Resolve the latest `main` SHA.
2. Inspect recent commits and open PRs touching the intended files/area.
3. If another active PR owns overlapping paths, do not duplicate it. Pick another
   safe task or coordinate explicitly.
4. Create a short-lived branch from the latest safe `main`.

During implementation:
- Keep one coherent, reversible batch per PR.
- Do not create `TEMP`, placeholder, dummy, or knowingly broken commits on `main`.
- Prefer targeted tests while iterating; diagnose failures before pushing another
  commit so CI is not repeatedly cancelled and restarted.
- Do not weaken validators, biomedical gates, browser smoke, security checks, or
  tests merely to obtain green CI.
- Do not force-push shared branches or overwrite another agent's work.

## Shipping — PR only

**Never push directly to `main`, and never "push to both main and a Claude branch".**
The previous dual-push rule is retired because it caused moving-main races.

For every production change:
1. Push the short-lived branch and open/update exactly one PR.
2. Run targeted checks first as useful.
3. Require **Validate pull requests** and the complete **Stabilization Acceptance**
   workflow to pass for the exact current PR head. Full acceptance remains the
   authority for frontend build/tests, Body/WebGL smoke, and server gates.
4. Immediately before merge, resolve latest `main`, confirm mergeability, inspect
   changed-file overlap, and confirm the tested head has not changed.
5. If `main` moved into overlapping files, CI/workflow files, or creates uncertain
   ancestry, refresh/rebuild from latest `main` and rerun gates. Never force merge.
6. Merge through the PR only after the exact-head gates are green and the final
   race check is clean. Automatic merge is acceptable under those conditions.
7. After merge, verify the merge is present on `main` and inspect available
   deployment/smoke evidence.
8. Close stale or superseded duplicate PRs so agents do not keep working the same
   candidate twice.

For user-visible changes, verify the affected surface in a real browser at
**390x844** when the repository's browser tooling supports it. For Body/3D work,
preserve the existing WebGL smoke and rendered-artifact checks.

## Biomedical / clinical publication boundary

Software CI is not academic or clinical validation. For anatomy, physiology,
pathology, pharmacology, genomics, surgery, diagnosis/treatment, or other medical
content, preserve provenance, evidence/version boundaries, uncertainty, AI
assistance disclosure, and the repository Academic Accuracy Gate. Never claim
human review unless a real qualified reviewer, credentials, date and scope are
recorded. Never infer patient-specific anatomy, lesion location, procedure target,
force/device setting, diagnosis or treatment from generic atlas/simulation data.

## Shared policy

Read and follow `AGENTS.md` as the cross-agent operating policy. If this file and
`AGENTS.md` conflict on Git/CI coordination, follow the safer rule: short-lived
branch → PR → exact-head gates → final latest-main audit → merge.