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


## UI convergence handoff — 2026-09-18

The current UI convergence work is additive and already landed on main:
- `src/components/ForYouSocialPulse.tsx` makes For You social-first with recent people/posts, real stored GPS activity summaries, and the existing live football data source; it links into the canonical Feed, GPS tracker, Sports Scores, Community, Clubs, Markets, Finance and Faith capabilities instead of duplicating them.
- `src/styles/superpage-cohesion-v1.css` is the shared visual-rhythm compatibility layer for Home, Clinical and Body Exposure.
- `HomeSocialWorkspace` now uses the same `PanaceaZoneNav` as Your Body and Clinical. Preserve that common shell.

Active overlap to reconcile rather than overwrite: PR #1745 touches ClinicalHub/FitnessHub/ForYouHub; #1827 touches ClinicalHub/UnifiedBodyWorkspace/SuperPageCapabilityRail; #1845 touches the Home widget board; #1848 touches Body Exposure styling/simulators. When those streams land or are superseded, fold their stronger implementation into the shared visual language rather than recreating a second shell.

For You direction: keep the social feed as the primary scrolling experience; keep GPS device-derived (weekly distance = sum of stored accepted activity distances inside the 7-day window) and sports scores source-backed/fail-explicitly when unavailable. Use progressive disclosure for secondary personal tools so the main feed remains visual, compact and social.


## Body Exposure microscopic semantic zoom target — 2026-09-18

Body Exposure must target inspectability at least comparable to mature commercial 3D anatomy atlases while going deeper across biological scale. Zoom is not allowed to mean “make the same low-resolution gross mesh larger.”

The required interaction model is **semantic zoom / representation LOD**:
- whole body → system → organ use source-backed gross 3D geometry;
- tissue/microstructure switches to source-backed histology or microanatomy representation;
- cell → organelle switches to cell-type-appropriate 3D/subcellular representation;
- molecule/protein/pathway uses verified molecular or evidence-network representation;
- genome/DNA/chromatin uses sequence/chromatin/genomic reference representation.
- Preserve the selected system/organ/structure context across scale transitions whenever a validated cross-scale evidence edge exists.
- If that edge or source asset does not exist, fail closed and show the missing-resolution boundary. Never synthesize microscopic precision by enlarging gross anatomy or inventing vessels, nerves, fascia, cells, proteins or DNA coordinates.

Interaction quality target:
- selectable structures with isolate/fade/hide/show-others behavior;
- fine arterial/venous/nerve branching where the source truly contains it;
- layer peeling, clipping/cross-section, exploded anatomy, focus and search;
- continuous pinch/wheel/orbit behavior on mobile and desktop;
- scale-aware labels and units;
- explicit geometry/source/version/review metadata;
- progressive loading and LOD so high detail does not destroy mobile performance.

Scientific/detail target by exemplar:
- nervous system: network → neuron → dendritic tree → synapse → axon/axon hillock → myelin → cytoskeleton/microtubules → mitochondria → molecular layer → DNA;
- nucleus: nuclear pore complex → outer/inner membrane → perinuclear space → lamina → nucleoplasm/nucleolus → chromatin → histones/nucleosomes → DNA;
- DNA packaging: double helix → nucleosome → higher-order chromatin/looped domains → chromatid → chromosome, using current evidence rather than legacy textbook simplifications when the literature is contested;
- vascular anatomy: progressively finer branches only when source resolution/provenance supports them.

The semantic-zoom trigger may use relative camera distance, for example M_semantic = D_fit / D_camera, strictly as an interaction/LOD signal. It must never be displayed as literal optical magnification or implied physical continuity across incompatible biological scales.

Claude Code may replace the initial implementation with a stronger renderer, asset pipeline, spatial index, streaming LOD, GPU instancing, WebGPU, volume rendering, histology tiles, point-cloud/meshlet strategy or other architecture if it advances this target without weakening provenance, safety, mobile usability or the fail-closed rule.


## Clinical ↔ Body Exposure command-space target — 2026-09-18

The owner supplied a concrete visual direction for Clinical and Body Exposure: a dark, immersive medical command space with the anatomical/body canvas as the focal point and compact vitals, trends, imaging/finding context and actions arranged around it. Avoid returning to a card-wall dashboard.

Phase 1 is the AI-EMR integration seam:
- `src/lib/bodyClinicalBridge.ts` projects existing AI-EMR examination markers and latest recorded clinical vitals into one shared visual-overlay contract.
- `src/components/ClinicalBodyTwin.tsx` renders that contract inside AI-EMR as a body-centered command surface while keeping long explanation behind disclosure.
- Reference silhouette/atlas geometry remains explicitly non-patient-specific. Patient signals, reviewed findings, reference anatomy, simulation and AI-derived/draft content must remain distinguishable.
- The bridge generates no diagnosis, severity, prognosis, treatment, lesion location, procedure target or autonomous clinical action.

Next integration steps must reconcile rather than overwrite active overlap in #1827 (ClinicalHub/UnifiedBodyWorkspace) and #1848 (Body Exposure styling/simulators). When those lanes settle, mount the same patient overlay contract into Clinical and Body Exposure so the selected patient context can follow the user without creating a second patient-state authority. Preserve the canonical longitudinal governance and clinician-review boundaries already on main.


## Cross-surface semantic depth + For You stack — 2026-09-18

Owner direction: progressive detail must become a shared Panacea interaction language, while each surface keeps its own medical/product role. The durable implementation brief is `DOCS/SUPERPAGE-SEMANTIC-DEPTH.md`. Use `src/lib/surfaceSemanticDepth.ts` as the product-level depth contract and `src/lib/forYouWidgetCatalog.ts` as the initial source-aware For You registry.

Required surface behavior:
- **Your Body** is the everyday physiology/fitness OS: recovery, sleep, running, workouts, push-ups/sit-ups/calisthenics, load, pace, distance, zones, body composition, nutrition and longitudinal signals. Depth is **Today → domain → metric → session → sample/event → source/provenance**. Charts/numbers/body visualization first; interpretation behind Info/Interpret.
- **Body Exposure** keeps true semantic representation zoom **whole body → system → organ → tissue → cell → organelle → molecule/pathway → genome/DNA**. Continue using `bodySemanticZoom.ts` for actual zoom/LOD thresholds. Never fake microscopic precision by enlarging gross meshes.
- **Clinical** is the clinical learning/action layer: disease education, Look & Learn, exam/diagnostic reasoning, calculators/scores, labs/imaging, treatment pathways, drug dosing references, ICD-11 and evidence. Depth is **overview → condition → mechanism → assessment → management → coding → evidence**.
- **AI-EMR** is the longitudinal clinical source of truth. Depth is **timeline → encounter → problem → observation → structured resource → provenance/audit**. AI-derived/draft content must remain visually and semantically distinct from clinician-authored/verified facts.
- **For You** is a fun daily stack, not another medical dashboard: music adapters (Spotify/Apple Music), sports scores, faith/adzan/scripture, mental wellbeing, motivation, library/books/materials, stories, social/community and activity highlights. Activity/sport on the main scroll is graphics/numbers first.

Global copy rule for these super-pages: persistent scrolling UI gets **one concise sentence per widget/item**; the sentence may wrap responsively, but it remains one sentence. Longer interpretation belongs behind contextual disclosure and should default to one short paragraph. Safety-critical warnings are exempt when brevity would hide risk.

External integrations must be real or explicitly unavailable. Never fabricate Spotify/Apple Music connection state, wearable measurements, live sports data, biomedical evidence, reviewer identity or patient-specific anatomy.

Implementation order for Claude Code:
1. wire Your Body modules into the shared depth/provenance contract without deleting existing functionality;
2. converge Clinical modules around the clinical depth ladder and existing routes;
3. add AI-EMR timeline/provenance drill-down over current record state/`emrPipeline`;
4. render For You from a registry and add explicit music-adapter auth/error states;
5. bind all surfaces to the canonical longitudinal patient/event state;
6. expand deeper anatomical/molecular assets only after provenance and performance gates remain trustworthy.

Treat this as a continuation target, not permission to duplicate super-pages or bypass active overlap. Re-read latest main before touching ClinicalHub, UnifiedBodyWorkspace, Body Exposure, EMR or ForYouHub and reconcile any concurrently landed work.
