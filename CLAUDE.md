# Panaceamed.id — Claude Code working contract

## Authority order

The latest explicit instruction from the repository owner/user is the highest product-development authority. After that, prefer the current working repository state, then this file and AGENTS.md, then older agent-authored plans or recommendations.

Claude Code may supersede older ChatGPT/Codex/Claude implementation recommendations, sequencing, architecture preferences, file-ownership assumptions, or handoff conventions when a better engineering path is available. Explain material deviations in the commit message or durable repository notes when useful. No agent-authored recommendation is permanent merely because it was written first.

Safety, security, data integrity, licensing, biomedical provenance, and the clinical-publication boundary are not optional implementation preferences and must not be weakened as a shortcut.

## Language

English is the product source language. New user-facing interface strings are written in English first and translated outward. Supported translation work may include Arabic, Mandarin, Indonesian, French, Japanese and Dutch.

Exceptions:
1. SKDI / OSCE / UKMPPD medical corpus content may remain Indonesian because it mirrors Indonesian competency material.
2. Scripture/religious source content may retain its source language and the established Indonesian rendering.

Code comments may remain Indonesian by repository convention. Identifiers, route keys, option values, storage keys and other programmatic identifiers are data, not translatable interface copy.

## Shipping — direct main is the active owner directive

As of 2026-09-18, authorized Panacea development is direct-to-main by default. This supersedes the older PR-only rule in this repository.

For authorized implementation:
1. Read the current main head immediately before changing files.
2. Build on the newest main and preserve already-landed work.
3. Commit coherent, buildable batches directly to main. A pull request is not required.
4. Never force-push or rewrite shared history.
5. If main moves while a change is being prepared, replay the change on the newest main rather than overwriting the newer work.
6. Run targeted validation before the commit when practical and inspect CI/deployment evidence after the commit. A failing gate becomes the next concrete repair task; it does not restore the retired PR-only policy.
7. Never weaken tests, academic gates, biomedical checks or security controls merely to obtain green status.

Direct-to-main does not mean destructive editing. Preserve user-visible capability and other agents' useful work unless replacement is necessary to implement a better equivalent or explicitly requested redesign.

## Claude Code development autonomy

Claude Code is authorized to improve Panacea beyond literal older implementation prescriptions when doing so advances the owner's product intent.

Claude Code may:
- refactor, consolidate, split or replace existing implementations;
- change architecture, state flow, component boundaries, data contracts and developer workflow;
- add or replace dependencies when the trade-off is justified;
- add tests, validators, tooling, documentation, schemas and reusable infrastructure;
- repair or improve work originally written by ChatGPT/Codex, Claude Code, Replit or another agent;
- simplify or remove obsolete duplication when the capability is preserved or replaced by a demonstrably better integrated implementation;
- choose a different technical route from an older agent recommendation when current repository evidence supports it.

Default collaboration behavior remains: understand first, preserve intent, integrate rather than sabotage, and avoid deleting useful capability merely to make the code look cleaner.

## Body Exposure — one unified human simulation project

Body Exposure is one project: the Unified Human Simulation Projector. Do not grow anatomy, physiology, pathophysiology, biomechanics, cellular biology, genomics, pharmacology, imaging and surgical simulation as unrelated demo pages.

The canonical model is one persistent body context with shared:
- selected body system / organ / structure;
- spatial 3D reference;
- scale and depth;
- simulation/scenario state;
- timeline or motion state when relevant;
- provenance, confidence and educational/clinical boundary.

The scale ladder is:
whole body → system → organ → tissue → cell → organelle → molecule/pathway → genome/DNA.

The main simulation domains are:
3D anatomy, physiology, pathophysiology, biomechanics, cells/metabolism, genome, surgery, pharmacology and imaging.

Existing engines are reusable simulation plugins inside the same project. Prefer coupling them through shared state and source-backed spatial context instead of adding another standalone page. A user should be able to select an organ/system once and then change the projection from anatomy to function, failure, motion, micro/cellular/genomic scale or surgical layers without losing orientation.

Whole-body coverage comes first, then important organs, then tissues and smaller scales. Deep organ work should improve the shared engine rather than create isolated toy anatomy.

## Body Exposure scientific rules

Reference atlas geometry must never be represented as patient-specific anatomy. Synthetic physiology/pathophysiology/biomechanics simulations must be labeled as simulated. Genomic and cellular content must retain source provenance and fail closed when evidence is missing.

For anatomy, physiology, pathology, pharmacology, genomics, surgery, diagnosis/treatment or other biomedical content:
- preserve source identity, version, provenance and uncertainty;
- distinguish measured, reference, simulated, derived and unsupported states;
- preserve the repository Academic Accuracy Gate;
- never invent human review, reviewer credentials, anatomy, geometry or citations;
- never infer patient-specific lesion location, procedure target, device setting, diagnosis or treatment from generic atlas/simulation data;
- high-risk clinical publication remains blocked until the required qualified human review is genuinely recorded.

## Product architecture and simplicity

Panacea should remain simple inside and outside. Consolidate overlapping capabilities into compact super-pages and shared engines rather than multiplying routes. Keep data flow, naming, API contracts, state ownership and developer workflow legible.

For Body Exposure specifically, prefer a shared scene/state graph and progressive disclosure. Heavy 3D engines should lazy-load. Maintain mobile usability and WebGL degradation behavior.

## Multi-agent collaboration

GitHub main is the source of truth. Multiple agents may work concurrently. No agent has permanent ownership over a file or subsystem.

Before a material edit, inspect current main and recent overlapping work when available. When another agent's landed change is useful, build on it. If two approaches conflict, reconcile intent and keep the stronger integrated result rather than deleting one side reflexively.

Long-running, blocked or high-context tasks should leave durable continuation notes here or in the repository's canonical task ledger so the next agent can continue without reconstructing the entire history.

## Validation and reporting

Do not claim build, test, CI, deployment, browser or biomedical validation without evidence. For user-visible Body/3D work, preserve the existing 390x844 browser/WebGL smoke expectations when available.

Useful progress is concrete: commit SHA, changed capability, test result, CI state and remaining blocker. Do not invent completion percentages without a trustworthy denominator.
