# Panacea Multi-Agent Operating Policy


## Parent charter for every current and future agent

[PANACEA_CONSTITUTION.md](PANACEA_CONSTITUTION.md) is the model-agnostic parent scientific and governance charter. Every current or future agent, model, workflow and specialist tool must conform to it. This includes research/discovery, invention, biomedical/drug work, clinical trials, surveillance, scientific publication, education, hospital deployment, human-performance domains, privacy/security and continuous technology refresh.

Do not grant a model authority because of branding, generation number or AGI claims. Route work by validated capability and re-benchmark when stronger technology appears. Reaching 100% of a version's defined acceptance criteria transitions the project into Continuous Evolution Mode; it does not terminate R&D.

## Objective

Develop Panacea quickly without destroying existing work. Correctness, clinical safety, maintainability, security, provenance and production stability remain hard constraints.

## Owner directive: main-first continuous development

GitHub main is the source of truth. As of 2026-09-18, authorized agents may and should commit coherent production changes directly to main. This supersedes the repository's older PR-only traffic rule.

Traffic rules:
1. Resolve the current main head immediately before writing.
2. Preserve already-landed work and inspect likely overlap when practical.
3. Commit coherent, buildable batches directly to main; do not create a PR merely because an older instruction required one.
4. Never force-push, rewrite shared history, or overwrite a newer main.
5. If main advances during preparation, replay/rebuild on the newer head.
6. Validate before committing when practical and inspect CI after committing.
7. A broken main is repaired forward immediately; do not bypass or weaken tests, security checks or biomedical gates to make status green.

## Field Use-Case R&D Autopilot

[DOCS/FIELD-USECASE-RD-AUTOPILOT.md](DOCS/FIELD-USECASE-RD-AUTOPILOT.md) is the mandatory model-agnostic operating loop for finding and validating Panacea use cases from real-world evidence.

When the owner says **"lanjut"**, **"continue"** or an equivalent continuation command without narrower scope, do not default to inventing another feature. Inspect current main and the unresolved field/use-case gap state, then automatically run the next highest-value safe independent **field signal -> WHO -> PROBLEM -> PROMISE -> PROOF -> experiment -> measurement -> keep/iterate/kill -> platform capability** cycle.

The field-learning scope includes consumer health, health education, outpatient/clinical workflows, access, follow-up, administrative burden, safety/near-miss learning, malpractice/ethics complaints and verified professional-conduct findings, public-health evidence, support feedback, product telemetry, and jurisdiction-specific regulatory/workflow gaps. Preserve provenance, de-identify by default, and never turn an unverified malpractice or ethics allegation into a factual accusation.

Optimize for **meaningful voluntary return and durable health value**, not compulsive engagement or maximum screen time. Strong consumer-product engagement is encouraged through relevance, progress, continuity, useful novelty, low friction and user control. Dark patterns, notification spam, fear/shame, health-anxiety amplification, exploitative intermittent rewards and endless-scroll mechanics whose primary purpose is compulsive use are not acceptable success criteria.

"No gap" means maintain an explicit, continuously reduced gap ledger; it never means fabricating evidence or declaring unknowns solved. Continuous work operates within actual authorized execution windows; no agent may claim background work when no runtime/automation is executing.

## Agent autonomy and collaboration

The latest explicit owner/user instruction outranks agent-authored process or architecture recommendations.

Claude Code, ChatGPT/Codex and other authorized builders may improve, refactor or replace one another's implementation when it produces a stronger integrated result. No file or subsystem is permanently reserved for one agent.

Agents may deviate from older agent recommendations, including sequencing and architecture, when current evidence supports a better approach. Material changes should preserve the owner's intent, useful capabilities, data compatibility where required, and clinical/safety boundaries.

Default behavior is preserve → understand → integrate → improve. Do not sabotage another agent, delete working capability for stylistic preference, or add bureaucracy that exists only to protect an agent's past choices.

## Simultaneous product lanes

Independent lanes may continue concurrently:
- UI/UX, motion, responsive behavior, accessibility and design system;
- frontend behavior and feature convergence;
- backend, APIs, database/Supabase and integrations;
- AI orchestration, evaluation, clinical reasoning infrastructure and safety;
- Body Exposure and biomedical simulation;
- tests, CI, observability, security and repository hygiene;
- analytics, localization, documentation and tooling.

A real shared dependency should block only the work that depends on it.

## Body Exposure operating model

Body Exposure is a single Unified Human Simulation Projector, not a collection of unrelated visual demos.

All body simulation work should converge on one persistent context:
- body system / organ / structure selection;
- source-backed 3D spatial reference;
- whole-body-to-genome scale;
- physiology/pathophysiology scenario;
- movement/biomechanics state;
- cellular/metabolic/genomic state;
- surgical/imaging/pharmacology projection;
- evidence provenance and boundary.

Canonical scale:
body → system → organ → tissue → cell → organelle → molecule/pathway → genome.

Canonical projection domains:
3D anatomy → physiology → pathophysiology → biomechanics → cell/metabolism → genome → surgery → pharmacology/imaging.

Reuse existing engines as plugins in the shared projector and progressively couple their state. Prefer one strong spatial/simulation engine over more standalone pages.

## Validation

Build and test expectations remain meaningful even though PR gating is retired.

- Preserve deterministic frontend tests and validators.
- Preserve Body/WebGL and mobile smoke coverage.
- Preserve server build/typecheck/tests.
- Preserve security baselines and Academic Accuracy Gate.
- Diagnose concrete failures rather than editing tests to hide them.
- Never claim a check ran when it did not.

For an authorized direct-main commit, a post-commit CI failure is a forward-fix priority, not a reason to fabricate success.

## Biomedical and scientific boundary

For anatomy, physiology, pathology, pharmacology, surgery, genomics, longevity and related medical behavior:
- retain authoritative source identity, provenance and uncertainty;
- keep measured, reference, simulated, derived and unsupported states distinct;
- never fabricate citations, geometry, reviewer identity or validation;
- never convert generic atlas geometry into patient-specific anatomy or operative targeting;
- never present a synthetic teaching model as a measured patient state;
- high-risk clinical publication remains blocked until actual qualified human review is recorded.

## Engineering behavior

Prefer the smallest coherent change that advances the shared architecture, but Claude Code may perform larger refactors when fragmentation itself is the problem.

Use normal reasoning for routine work, higher reasoning for architecture/debugging/clinical-risk work, and the strongest visual/3D tooling for difficult Three.js/WebGL or advanced simulation tasks. Once a difficult foundation works, return to cheaper routine modes for cleanup, integration and maintenance.

Keep implementation simple, observable and resumable. Leave durable handoff context for long-running work.

## Progress reporting

Report verifiable deltas: current main SHA, concrete capability, tests/CI, deployment evidence and blockers. Do not invent precision or completion percentages.
