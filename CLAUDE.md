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

## Claude Code continuation queue — blockers and long-running work

Last consolidated: **2026-09-17**.

This section is the canonical handoff for work that either blocks other agents or
is large/deep enough that it should be owned by Claude Code rather than repeatedly
re-discovered in short ChatGPT implementation sessions. It is a continuation
queue, not permission to bypass `AGENTS.md`, CI, provenance, or review boundaries.

### Critical blockers — resolve before building on top

1. **Body Exposure runtime-boundary regression — PR #1746.**
   - Active candidate: `repair/body-exposure-foundation` / PR #1746.
   - The regression is caused by later document/global UI runtimes mutating Body
     content and overriding Body-specific controls/material behavior.
   - Do not start overlapping Body UI/runtime work until #1746 is merged cleanly,
     explicitly superseded, or its changes are incorporated into a newer branch.
   - Preserve the validated anatomy → physiology/deep-dive → pathophysiology →
     pharmacology → explorer flow and shared selected-system state.
   - Re-resolve latest `main`, inspect overlap, require exact-head Validate + full
     Stabilization Acceptance, then merge only through the PR. Never force merge.

2. **Global runtime ownership conflicts.**
   - Audit document-level/global UI runtimes, universal button handlers, DOM
     mutation layers, visual-first text transformers, and presentation classes.
   - Product-specific workspaces (especially Body Exposure, Clinical, For You,
     AI-EMR, and the AI Chatbot) must have explicit runtime ownership boundaries.
   - Remove accidental cross-surface mutation by architecture, not by stacking
     more one-off CSS exceptions or event-handler patches.
   - Add deterministic regression guards for each protected workspace boundary.

3. **Anatomy asset licensing/provenance before HD expansion.**
   - Issue #626 is mandatory. `thebuggeddev/anatomy` and Breath Atlas are required
     capability references, but upstream public availability is not a license.
   - Do not copy code, meshes, textures, labels, or derived assets unless the
     applicable license/permission is verified independently.
   - Establish a provenance record for every imported/derived anatomy asset:
     source, revision, license, attribution, transformation history, geometry
     status, evidence status, and academic-review status.
   - Until this is resolved, independently reproduce capabilities/interactions;
     do not silently import questionable assets.

4. **Exact-head CI/acceptance credibility.**
   - Never treat stale green CI as evidence for a changed head.
   - Diagnose failing jobs before adding commits. Preserve test intent.
   - Full Stabilization Acceptance remains a merge boundary for production work;
     targeted tests are iteration aids, not substitutes.

### Long-running engineering tasks — Claude Code ownership preferred

#### A. Body Exposure whole-body-first reconstruction and maturation

- Maintain **one canonical Explore → Body Exposure workspace**; do not create a
  second competing anatomy product.
- Whole-body first, then progressively disclose **organ → tissue → cellular →
  molecular/genomic** depth while preserving one shared anatomical state.
- Build/normalize clinically meaningful layers: skin, superficial/deep fascia,
  musculoskeletal, skeleton/joints, cardiovascular, nervous, respiratory,
  lymphatic/immune, endocrine, digestive, urinary, reproductive, and major
  connective/support structures where source quality permits.
- Preserve left/right and anatomical orientation; no toy anatomy, arbitrary
  blobs/tubes, or invented microanatomy presented as verified structure.
- Provide hide/show/isolate, exploded/layered views, orbit/pan/zoom, focus/fit,
  labels, selection, synchronized system state, and cross-section correlation.
- Keep the main scrolling surface visual-first; explanatory interpretation belongs
  behind concise contextual actions/drawers rather than long inline paragraphs.
- Keep important functions reachable within the product's 1–2 interaction rule.

#### B. Mandatory Body deep-dive waves

- **Eye / orbit gold-standard wave:** globe/orbit, corneal layers, retina,
  extraocular muscles, neural pathway, blood supply, lacrimal system, aqueous
  dynamics, accommodation, pupillary reflex, representative pathology,
  pharmacology, imaging correlation, interaction states, and performance.
- **Heart / cardiovascular wave:** chambers, valves, coronary anatomy, conduction,
  pressure/flow relationships, cardiac cycle, hemodynamic overlays, atherosclerosis,
  heart failure, ischemic disease, DVT/venous disease, and clinically grounded
  pathophysiology/pharmacology links.
- **Brain / nervous-system wave:** central/peripheral neuroanatomy, major tracts and
  vascular territories, neurovascular physiology, lesion-localization education,
  stroke relationships, and the mandatory nervous-system atlas reference where
  licensing/provenance permits independent implementation.
- **Respiratory / Breath Atlas wave:** airway tree, lung lobes/fissures, pleura,
  diaphragm/chest-wall mechanics, respiratory cycle, pressure/volume/airflow
  education, and CT/cross-section correlation where source-supported.

#### C. HD 3D/WebGL asset and rendering pipeline

- Multi-resolution LOD/streaming so close zoom improves fidelity without making
  mobile unusable.
- Progressive geometry/texture loading, compression where appropriate, cache
  strategy, cancellation, and graceful degradation on low-power devices.
- Bound devicePixelRatio/render scale on mobile; preserve high-DPI label sharpness.
- Eliminate z-fighting, transparency-order errors, obvious polygon breakup,
  unstable WebGL contexts, memory spikes, and long main-thread stalls.
- Tissue materials should support anatomical interpretation, not cinematic effect.
- Generate reproducible render evidence at whole-body, organ, and close-detail
  zoom levels on mobile and desktop/high-DPI targets.

#### D. Physiology, pathophysiology, and pharmacology simulation layer

- Tie animations/overlays to explicit educational variables and state definitions;
  avoid arbitrary pulsing or decorative motion masquerading as physiology.
- Distinguish **measured**, **reference**, **simulated**, **derived**, and
  **unsupported/conceptual** values in the data model and UI.
- Build system-level flows first, then organ/tissue/cellular depth.
- Link mechanism-of-disease and mechanism-of-drug overlays to evidence/provenance.
- Never infer patient-specific treatment/targeting from generic atlas state.

#### E. Radiology, cross-section, biomechanics, and surgical education

- Add anatomically aligned cross-section/CT-style views only where licensing and
  source quality are adequate.
- Build whole-body biomechanics and movement visualization on the same anatomy
  state rather than as a disconnected demo.
- Surgical simulation is long-running and should begin only after anatomy,
  provenance, performance, and interaction foundations are trustworthy.
- Keep surgical/procedural content educational/reference-only unless qualified
  human review and the required clinical publication boundaries are satisfied.

#### F. Super-page convergence without feature deletion

- Continue capability convergence: fewer top-level pages, more function per
  canonical surface, with progressive disclosure instead of nested navigation.
- Preserve capabilities that overlap in user intent by compiling them into modes,
  contextual drawers, rails, carousels, mini-app widgets, and stateful panels.
- Do not delete working capabilities merely to simplify visual structure.
- Preserve/redirect legacy routes intentionally and test saved/deep links.
- Maintain the global 2-step access goal for primary and important subfeatures.

#### G. Longitudinal patient-state architecture

- Make Your Body/Body Exposure, Clinical, For You, AI-EMR, and AI Chatbot operate
  on one longitudinal patient state rather than isolated page-local stores.
- Event-driven/near-real-time ingestion where source systems support it.
- Model provenance, timestamp/temporal context, confidence, source identity,
  consent, privacy scope, clinician oversight, and correction/reconciliation.
- AI-EMR is the clinical longitudinal source of truth; the chatbot orchestrates
  conversation/actions over the same state; Body is the visual state projection;
  Clinical is the reasoning/evidence/action layer.
- Design migrations and compatibility so legacy local state is not silently lost.

#### H. Wearable and health-data integrations

- Normalize Apple Health, Garmin, Whoop, Oura, Strava, Google Fit/Health Connect or
  successor interfaces where supported, plus future device adapters.
- Handle OAuth/credential lifecycle, revocation, consent scopes, source conflicts,
  duplicate events, timezone/day-boundary issues, units, missing data, and backfill.
- Normalize vitals, activity, sleep/recovery, readiness/battery, VO2max,
  nutrition, strength/fitness signals, and other supported longitudinal metrics.
- Keep raw provenance separate from derived interpretation.

#### I. AI Chatbot + Clinical + AI-EMR orchestration

- Maintain a ChatGPT-like conversational surface while grounding it in the shared
  longitudinal state, Clinical evidence/action context, and AI-EMR history.
- Support provenance-aware retrieval, tool/action boundaries, uncertainty display,
  clinician handoff/oversight, and auditability.
- Do not allow UI convenience to bypass clinical safety/publishing boundaries.

#### J. Global motion/interactions system

- Implement motion as a functional system: hierarchy, direct manipulation,
  spatial continuity, state transition, progressive disclosure, and feedback.
- Avoid global document mutation that unexpectedly changes product-specific UI.
- Respect `prefers-reduced-motion`, keyboard/focus behavior, touch ergonomics,
  mobile performance, and interruption/cancellation of long animations.
- Universal button/widget behavior must have explicit opt-in/ownership contracts.

#### K. Responsive visual-system normalization

- Preserve the product direction: dark biomedical/space-black foundation,
  restrained spectral light, clean high-contrast hierarchy, large whitespace,
  minimal persistent text, and visually dominant data/anatomy.
- Main scrolling UI should favor visuals, numbers, charts, state, icons, and
  micro-labels; longer interpretation belongs behind contextual disclosure.
- Avoid arbitrary multi-color tiles, meaningless gradients, excessive glow/shadow,
  equal visual weight for every card, and decorative copy with no function.
- Validate phones, desktop/high-DPI, safe areas, narrow widths, and orientation.

### Deep validation / QC tasks

These are intentionally long-running and should be treated as their own work,
not squeezed into feature PRs when they materially broaden scope.

1. **Anatomical/scientific accuracy review**
   - Source-level provenance, terminology, laterality/orientation, relationships,
     physiology correctness, explicit uncertainty, and academic gate compliance.
   - Never fabricate citations or reviewer identity.

2. **Medical publication boundary review**
   - Separate educational/reference content from patient-specific clinical claims.
   - Require real reviewer metadata before any "reviewed/verified" claim.

3. **Visual regression and browser matrix**
   - Required representative check at 390x844 plus desktop/high-DPI.
   - Body/WebGL smoke, orbit/zoom/layer toggling, close-zoom rendering, route/deep
     link preservation, and screenshots/render artifacts where supported.

4. **Performance/memory profiling**
   - Initial load, interaction latency, asset decode/upload, WebGL memory,
     context-loss recovery, long-task detection, and lower-power-device behavior.

5. **Accessibility/interaction QC**
   - Keyboard/focus paths, semantic labels, contrast, reduced motion, touch target
     sizing, screen-reader-safe control naming, and no gesture-only critical action.

6. **Data/security/privacy QC**
   - Consent boundaries, minimum necessary data flow, secrets handling, auth/session
     lifecycle, auditability, deletion/revocation behavior, and cross-user leakage
     protection for shared longitudinal state.

### Dependencies / prerequisites

- Always re-read latest `main`, active PRs, and overlapping changed files before
  taking ownership of any queue item.
- Licensed/provenance-cleared assets are a prerequisite for importing anatomy data.
- External integrations require real credentials/API scopes and must degrade safely
  when unavailable; never fake successful integration data.
- Clinical "verified" publication requires actual qualified human review records.
- High-risk visual simulation work requires deterministic test fixtures and stable
  baseline screenshots/render artifacts before large refactors.

### Definition of done for queue items

A queue item is not DONE merely because code exists. It is done only when:

- the intended capability is implemented without deleting unrelated functionality;
- targeted tests pass and exact-head **Validate pull requests** plus full
  **Stabilization Acceptance** are green for the final candidate;
- latest-main overlap/ancestry is rechecked immediately before merge;
- user-visible work is browser-verified at required representative sizes;
- Body/3D work preserves WebGL smoke/render evidence and performance boundaries;
- provenance/licensing/medical-status metadata are correct for biomedical content;
- merge is through the PR, the result is verified on `main`, and stale duplicates
  are closed/superseded.

### Handoff priority order

Use this order unless a newer blocker or overlapping active PR makes it unsafe:

1. Resolve/reconcile **PR #1746** and restore the Body runtime boundary.
2. Eliminate remaining global-runtime ownership conflicts around canonical
   workspaces and add deterministic guards.
3. Resolve anatomy licensing/provenance paths and keep Issue #626 intact.
4. Mature the **whole-body-first** Body Exposure foundation and HD/LOD pipeline.
5. Continue Eye → Heart/Cardiovascular → Brain/Nervous → Respiratory deep dives on
   top of the same shared body state.
6. Build longitudinal patient-state/event architecture across Body, Clinical,
   For You, AI-EMR, and AI Chatbot.
7. Add wearable/data integrations and provenance-aware chatbot orchestration.
8. Run deep validation/QC, performance hardening, accessibility, and final product
   polish as dedicated work, not as rushed side effects.

### Handoff behavior

- If a task is blocked by a dependency, record the concrete blocker and move to
  the next **non-overlapping** independent queue item; do not spin on it.
- If a task will require sustained deep debugging, broad refactoring, large 3D
  asset work, migration design, multi-surface state integration, or extensive
  medical/provenance validation, Claude Code should own it end-to-end.
- Shorter independent implementation work may continue in parallel only when file
  ownership and runtime boundaries are clearly non-overlapping.
- Never force-push shared work, never overwrite another agent's branch, never
  weaken acceptance gates, and never delete features just to make convergence
  easier.
