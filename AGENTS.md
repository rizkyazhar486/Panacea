# Panacea Multi-Agent Operating Policy

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
