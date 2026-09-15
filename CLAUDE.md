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

## Co-pilot contract with Work 5.6 Sol

Panacea uses a coordinated control-plane + implementation model rather than multiple
agents independently planning the same product.

The default relationship is:

`Owner intent → Work 5.6 Sol control plane → executable task → Claude implementation → evidence → Sol integration review → merge gate → next task`

This is an ownership model, not a ranking of model intelligence.

### Work 5.6 Sol responsibilities

Work 5.6 Sol is the repository co-pilot and control plane. It should:
- maintain the global picture of latest `main`, active PRs, CI, dependencies and
  changed-file overlap;
- convert owner intent into a small executable task contract;
- select the highest-priority safe task using `AGENTS.md`;
- protect the canonical three-super-page architecture and prevent duplicate routes,
  duplicate capability and conflicting implementations;
- decide whether work belongs to Claude Code, Astra, Body Light — Terra or Panacea
  Organ Build;
- review evidence, residual risk, overlap and merge readiness;
- own cross-lane sequencing and final integration reasoning;
- implement directly only when that is the clearest and most efficient safe path.

### Claude Code responsibilities in the pair

Claude Code is the primary execution finisher. It should:
- execute the assigned coherent scope instead of reopening settled product direction;
- diagnose failures from evidence before modifying code;
- implement, test, stabilize, optimize and integrate the assigned work;
- return a compact evidence handoff after each meaningful implementation cycle;
- avoid editing files or unstable shared contracts owned by another active lane;
- escalate architecture decisions only when the current acceptance criterion cannot be
  satisfied safely without changing the settled product model.

### Task contract

Every non-trivial task should be representable as:

`TaskContract = Goal + Owner + Scope + Files + Dependencies + Acceptance + Evidence`

Minimum interpretation:
- **Goal** — user-visible or engineering result;
- **Owner** — one active execution owner;
- **Scope** — smallest coherent reversible implementation;
- **Files** — expected owned paths/subsystem;
- **Dependencies** — required upstream PR/contracts/data;
- **Acceptance** — objective conditions defining completion;
- **Evidence** — tests, CI, browser/render evidence, provenance or review required.

Do not start substantial work when ownership or dependency state is ambiguous.

### Canonical work state

Use:

`READY → CLAIMED → IMPLEMENTING → VALIDATING → REVIEW → MERGEABLE → VERIFIED`

Use `BLOCKED` only for a concrete unresolved dependency, repository conflict,
external failure, safety issue or owner-only decision. "Almost done", "looks good"
and "probably fixed" are not repository states.

### Handoff packet

A handoff between Sol and Claude should carry state rather than narrative. Include:

`branch / PR / exact head SHA`
`goal and acceptance criteria`
`changed paths`
`tests and gates executed`
`current failures`
`known risks`
`dependencies / overlap`
`recommended next action`

The receiving model must resolve current repository state before trusting an old
handoff.

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

## Current landing / Home OS execution directive

Landing quality is a release-critical P1 concern immediately after P0 blockers.
Do not solve landing-page weakness by adding more permanent cards or routes. The
landing page must become a calm, high-trust entry into the three-super-page product.

### First-screen objective

Within roughly five seconds, a new user should understand:
1. **what Panaceamed is** — an AI-powered health and clinical intelligence platform;
2. **who it serves** — patient/individual, clinician and advanced learner/researcher
   contexts without presenting three competing products;
3. **why it is different** — continuous health context + clinical intelligence +
   interactive human-body exploration/evidence in one coherent system;
4. **what to do next** — one obvious primary action and direct entry to Clinical or
   Explore when relevant.

The opening screen should communicate value before feature inventory.

### Landing composition

Prefer a compact sequence such as:

`hero/value → personal health snapshot → primary actions → Clinical / Explore gateways → trust/evidence → progressive capability discovery`

Keep the first viewport visually short and calm. Secondary capabilities remain
available through rails, contextual expansion, search/command, drawers or subsequent
scroll sections rather than permanent navigation clutter.

### Hero requirements

The hero should:
- use one clear value proposition rather than several slogans;
- avoid implementation jargon, TODOs and unsupported clinical claims;
- contain one dominant action and at most a small number of secondary destinations;
- use a restrained Panacea visual signature rather than generic dashboard chrome;
- preserve readability and fast interaction on mobile;
- not require a large WebGL payload merely to understand the product.

A lightweight living-human/body visual may be used as the signature visual when it is
fast, stable and source-safe. Heavy interactive Body Exposure remains in Explore.

### Trust layer

The landing should expose trust without turning into a legal/documentation page.
Use compact evidence/provenance language and clear boundaries for:
- evidence-backed vs simulated/derived information;
- privacy/consent and user data control;
- clinician review boundaries for clinical use;
- device/source status where user data is shown;
- emergency and safety pathways where applicable.

Never market software CI, atlas geometry or model output as clinical validation.

### Role-aware behavior

Do not create separate duplicated landing pages for patient, doctor and owner unless a
security/operational role requires a different destination. Prefer one Home / OS with
contextual role-aware widgets, actions and terminology. Existing contributor,
verifier and admin operational redirects may remain explicit.

### Landing acceptance

Before calling the landing showcase-ready, verify at minimum:
- first-screen value proposition is understandable without opening another page;
- no duplicate primary navigation model is visible;
- Home, Clinical and Explore are reachable in 1–2 interactions;
- personal health data degrades gracefully when unavailable;
- 390x844 has no horizontal page overflow, clipped primary content or unusable touch
  targets;
- tablet/desktop hierarchy remains balanced and not stretched into empty dashboard
  chrome;
- keyboard/focus semantics and reduced motion are acceptable;
- loading/empty/error states do not expose broken-looking surfaces;
- no unsupported medical or trust claim is introduced;
- exact-head repository gates required by `AGENTS.md` are green before merge.

Landing polish is not permission to bypass a failing P0 stabilization gate.

## Priority order

Hard clinical-safety, security, privacy, data-integrity and production blockers win
before feature work.

1. **P0 integrity/stabilization** — failing exact-head CI, broken primary flows,
   stale ancestry, merge conflicts, deployment blockers and regressions.
2. **P1 canonical shell + release-critical workflows** — three super-pages, landing /
   Home OS maturity, Clinical, roles, consent, audit, export/delete, resilience and
   clinician sign-off boundaries.
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

`ParallelSafe = no_path_overlap ∧ stable_shared_contracts ∧ no_parent_child_dependency ∧ independent_acceptance`

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

## Failure handling

When CI or a deterministic test fails, use:

`observe → reproduce → isolate → establish causality → patch → rerun`

Do not use:

`fail → speculative rewrite → weaken validator → declare success`

Determine whether the failure is introduced by the current branch, pre-existing on
latest main, caused by stale ancestry, caused by an external/flaky dependency, or
caused by another overlapping change. Repair follows causality, not convenience.

## Implementation completion packet

After a meaningful implementation cycle, Claude should return a compact handoff:

Status:
Branch:
PR:
Head SHA:
Acceptance:
Changed paths:
Tests executed:
CI state:
Failures remaining:
Overlap/dependencies:
Biomedical/provenance notes:
Residual risk:
Recommended next action:

Never report DONE while required evidence is still pending.

## Body Exposure rules

Body Exposure is one canonical workspace. Keep whole-body first, then depth:

`whole body → organ/system → tissue → histology → cell/organelle → molecule → genome/DNA`

Do not create standalone organ products. Organ modules must plug into the shared Body
state model. Preserve source/version/license/transformation/provenance. Never invent
anatomy, patient-specific precision, clinical interpretation or validation.

For Body/3D work, preserve the specialized WebGL/render acceptance and mobile
390x844 evidence. Difficult rendering foundations may be handed to Astra, but routine
integration, responsive cleanup and tests should return to normal implementation.

## Specialist escalation

Escalate to Astra only when the bottleneck is genuinely specialist work such as:
- difficult Three.js/WebGL rendering architecture;
- advanced biomedical 3D geometry;
- complex spatial interaction;
- hard GPU/rendering performance;
- simulation requiring unusually deep numerical/spatial reasoning.

Do not escalate ordinary React, TypeScript, CSS, routing, data wiring, testing,
accessibility or routine debugging. After a specialist foundation is produced,
routine cleanup and product integration return to Claude Code or the normal lane.

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

Before requesting merge, self-review the changed diff, build/type state,
deterministic tests, required browser/mobile behavior, accessibility, empty/loading /
error states, obvious performance regressions and biomedical provenance/truth
boundaries where applicable. A green run on another SHA is not evidence for the
current head.

## Communication with the owner

Do not flood the owner with implementation narration. Escalate only when:
- a product decision materially changes user-visible behavior;
- two valid architectures remain and owner preference matters;
- clinical/safety/security boundaries are unresolved;
- destructive deletion is required;
- an external permission or credential is required;
- no safe next action exists.

Otherwise execute within the agreed policy and report evidence.

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
