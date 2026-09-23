# Panaceamed.id — Claude Code working contract


## Panacea Constitution — parent scientific authority

All Claude Code work must comply with [PANACEA_CONSTITUTION.md](PANACEA_CONSTITUTION.md). It is the model-agnostic parent charter for scientific discovery, R&D, invention, clinical translation, drug discovery, trials, surveillance, publication integrity, continuous model/technology evolution, privacy, safety and validation. The latest explicit owner instruction remains highest product authority, but no model-specific instruction may silently weaken the Constitution's evidence, reproducibility, safety, governance, external-validation, publication-integrity or human-oversight requirements.

A current-version “100%” acceptance state is a transition trigger, not an endpoint: after defined acceptance gates are satisfied, continue in Continuous Evolution Mode by monitoring new evidence/technology, benchmarking, validating, integrating and re-validating the next baseline. Model roles are capability-driven and may change as future models outperform current ones.

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

## Field R&D continuation contract

Claude Code must follow the model-agnostic [Field Use-Case R&D Autopilot](DOCS/FIELD-USECASE-RD-AUTOPILOT.md).

When the owner says **"lanjut"** or equivalent without a narrower target, continue the highest-value safe independent evidence-to-product cycle rather than asking which routine task to do next or simply adding another feature. The canonical framing is **WHO -> PROBLEM -> PROMISE -> PROOF** backed by real field evidence, explicit telemetry/validation and a keep/iterate/kill decision.

This includes learning from care-delivery friction, health education, outpatient workflows, access, support feedback, safety incidents, near misses, malpractice/ethics reports, public-health evidence and product behavior, with provenance/privacy/jurisdiction boundaries preserved. Unverified allegations remain allegations.

Retention should come from real repeated value. Do not optimize Panacea for compulsive use, manipulative dark patterns or maximum screen time.

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

## Panacea Visit Operating System handoff — 2026-09-18

The owner wants doctor visits to operate as one AI-EMR-connected clinical OS: camera/microphone encounter plus continuous medical-device context, with the visual direction of a body/organ-centered medical command space rather than a card wall.

Phase 1 is landed on main:
- `src/lib/visitOperatingSystem.ts` is the canonical visit-session kernel.
- `scripts/uji/visit-operating-system.mts` covers consent, identity, device/unit/signal-quality checks, freshness, idempotency, lifecycle, AI-EMR live context and clinician-reviewed promotion.
- Existing `server/src/realtime.ts` + `src/components/ConsultChat.tsx` already provide WebRTC camera/microphone signaling and peer media. Reuse them; do not create a competing video stack.
- Continuous device samples are live/ephemeral visit context by default. They do not silently become the signed AI-EMR. A selected sample crosses into the longitudinal clinical record only through `promoteObservationToClinicalRecord()` with an identified clinician review.
- Raw camera/audio is not persisted by the Visit OS kernel and recording remains disabled by default.

Continue in this order, reconciling active UI work instead of overwriting it:
1. **Runtime integration:** couple WebRTC call state to `VisitOperatingState.media`; selected patient and clinician identities must come from authenticated application state, never room-name inference.
2. **Device adapter boundary:** normalize supported BLE/USB/local-network/vendor-cloud/FHIR feeds into `VisitDeviceObservation`. Preserve manufacturer/model/firmware, source timestamp, standard code where known, and signal quality. Do not claim support for a device until its adapter is actually implemented and tested.
3. **Secure transport:** for remote patient devices, prefer authenticated/authorized transport or an encrypted WebRTC data channel. Do not place patient device data onto the current generic unauthenticated room relay merely because it is convenient.
4. **AI-EMR visit surface:** project `buildAiEmrVisitContext()` into the existing AI-EMR/Clinical/Body command space. Keep camera, live vitals/trends, device health and review actions compact around the patient/body focal canvas. Respect the one-line primary-UI rule and progressive disclosure.
5. **Ambient visit intelligence:** only after explicit audio/video AI consent, produce source-linked draft transcript/note candidates. Generated findings remain drafts until clinician review; no autonomous diagnosis, prescription, order, procedure target or emergency disposition.
6. **Record interoperability:** after clinician acceptance/signing, map eligible measurements to FHIR R4 Observation using verified LOINC/UCUM and the existing SATUSEHAT pathway. Preserve Encounter, subject, effective time, performer/device provenance and review state.
7. **Reliability:** add reconnect/backpressure handling, device clock-skew detection, stale-stream detection, adapter-level validation, audit events, fail-closed consent revocation, and production observability before calling the stream continuous.
8. **Validation:** maintain deterministic Visit OS tests plus browser camera/WebRTC smoke, device-adapter fixtures, FHIR/SATUSEHAT conformance checks and mobile behavior. Never weaken clinical/security gates merely to make CI green.

Freshness in the Visit OS is transport freshness, not clinical severity: `ageMs = max(0, now - receivedAt)`; ≤30 s fresh, 30–120 s delayed, >120 s stale. Clinical alert thresholds must remain separate evidence-backed logic.

The durable boundary is: **live encounter context ≠ signed clinical record**. Device streams and AI drafts may inform the clinician; clinical commitment remains provenance-preserving, consent-aware and human-reviewed.


## Body Exposure Blender-first asset handoff — 2026-09-18

The owner explicitly wants Body Exposure to stop treating Three.js code as a substitute for anatomical assets. The durable pipeline and multi-agent work contract are now:

- `DOCS/BODY-3D-ASSET-PIPELINE.md`
- `DOCS/BODY-3D-MULTIAGENT-CONTRACT.md`
- `scripts/blender/build_panacea_whole_body.py`
- `src/lib/anatomy/wholeBodyAssetContract.ts`

Immediate source-continuity fixes already landed on main:
- `integumentary-surface` resolves the complete compatible `surface.glb` catalogue instead of depending on a nonexistent generic “skin” source node;
- whole-body ocular lookup now uses the actual `nervous.glb` ocular compartments plus `muscular.glb` extraocular context;
- the compatible male whole-body reproductive set now explicitly includes penis/glans, erectile tissue, testes, epididymides, deferent ducts, seminal vesicles and prostate where source names resolve;
- female vagina/uterus/ovary anatomy remains available in the separate HRA female pelvis module; additionally, the HRA Visible Human Female united v1.5 whole-body source is now pinned as a pipeline-ready candidate, but neither may be visually fitted into the male Z-Anatomy reference body.

Tomorrow/next Body 3D lane priority:
1. run the Blender assembly pipeline against the seven compatible `public/anatomy/*.glb` source layers;
2. inspect the exported manifest, exact source-name retention, whole-body alignment, file size and visual artifact before committing generated binary output;
3. wire the accepted asset through the canonical Three.js runtime rather than adding a second renderer;
4. implement atlas-grade select/search/focus/hide/fade/isolate/show-others/layer controls around one continuous body canvas;
5. acquire/audit the pinned HRA female united v1.5 reference with `scripts/bangun/acquire-hra-female-v1_5.mjs`; keep fascia, skin depth and external female genital surface claims blocked until exact source geometry/nodes are verified.

Astra/Blender owns asset assembly/packaging work; Claude Code owns Three.js/runtime integration; ChatGPT Work owns provenance/source-gap/acceptance/reconciliation. This is lane responsibility, not permanent file ownership: re-read latest main and active overlap before every shared-file edit.


## Body Exposure one-projector continuation — 2026-09-18

The owner explicitly wants Body Exposure to reach the capability class of a detailed interactive anatomy atlas: exact structure selection, lesion-localization teaching, education, simulation, imaging, surgical layers and biological scale transitions must stay inside one unified human simulation projector rather than fragmenting into unrelated pages.

Already landed on main:
- exact rendered source-mesh picking in `BodyAllSystems3D` using raycasting; selected source anatomy is visually isolated without mutating canonical GLTF geometry;
- persistent selected-structure context in `UnifiedHumanSimulationProjector`;
- first-class projector domains for Localization and Imaging, reusing the existing tract-based `LokalisasiLesiPanel` and source-grounded volumetric/DICOM teaching panel;
- continuous representation ladder: whole body → system → organ → tissue → cell → organelle → molecule → genome;
- structure teaching explanation inside the same projector;
- Body Exposure top-level modes now drive the projector directly; the historical Body Explorer remains preserved as an on-demand deep-reference lab;
- regression contract: `scripts/uji/body-exposure-one-projector.mts`.

Next deep work should extend rather than replace this contract:
1. propagate exact selected source node into physiology, pathophysiology, pharmacology, imaging and surgery adapters so those projections are structure-specific, not only system-specific;
2. extend educational lesion localization beyond the current tract/cranial-nerve engine with source-backed peripheral nerve, root/dermatome/myotome, spinal cord, brain vascular territory and musculoskeletal lesion maps; never claim patient-specific localization from generic atlas data;
3. register verified tissue/histology/cellular assets per organ so semantic scale transitions replace representation at real source-resolution boundaries rather than enlarging gross meshes;
4. integrate patient-specific imaging only from actual uploaded/authorized DICOM with explicit registration/provenance and a clear distinction between atlas reference and patient data;
5. AR/WebXR may be added as a spatial educational view of the same selected source structure, never as operative navigation or patient-specific anatomy without validated registration and review;
6. preserve mobile 390×844, WebGL fallback, source provenance, fail-closed missing anatomy and Academic Accuracy Gate behavior.


## Body Exposure universal gold-standard directive — 2026-09-18

There is no privileged “Eye Gold Standard.” The quality target is universal across the whole body and every biological scale.

The canonical registry is now:
- `src/lib/anatomy/universalAtlasStandard.ts`
- `src/pages/bodyhub/UniversalAtlasDepthRail.tsx`
- `src/pages/bodyhub/MolecularChemistryStage.tsx`
- `scripts/uji/universal-atlas-standard.mts`

Required product behavior:
- every body system must ultimately satisfy the same ladder: gross anatomy → histology/microanatomy → cell → organelle → chemistry → genome;
- examples such as nails, sebaceous glands, areola, nephron, kidney microstructure, lens, auricle, cornea, eyelid, tunica intima/media/adventitia, genital/reproductive anatomy, ATP, NAD+/NADH, glucose, proteins, peptides and compounds are part of the universal target, not special-case side modules;
- gross geometry, histology, cells and molecular structures must each come from the appropriate source class; never enlarge a gross mesh and call it microscopic anatomy;
- missing microanatomy remains an explicit source gap until licensed/verified assets exist;
- molecular/compound nodes must bind to verified identifiers/provenance before 3D chemical structures are called source-backed;
- keep the UI compact and visual-first: one depth rail, progressive disclosure, no duplicate scale navigation walls.

The first runtime implementation is already visible in Unified Human Simulation Projector: a universal depth rail replaces the duplicate scale rail, and the molecular stage now exposes ATP/NAD+/NADH/glucose chemistry context across all systems with PubChem references for the verified core compounds.

Continue by adding real source adapters and assets, not more placeholder prose.


## Camera-only Personal Digital Human handoff — 2026-09-19

The owner explicitly wants a game-quality **“digitally import myself”** experience using an ordinary RGB camera as the baseline input, not a manual cosmetic character creator.

Canonical references:
- `DOCS/PERSONAL-DIGITAL-HUMAN.md`
- `DOCS/CLAUDE-CONTINUATION-PERSONAL-DIGITAL-HUMAN.md`
- `src/lib/personalAvatar.ts`
- `src/pages/bodyhub/PersonalAvatarCameraCapture.tsx`
- `scripts/uji/personal-avatar-camera-contract.mts`

First runtime slice: camera-only guided 9-view capture, automatic 3×3 QA preview, ephemeral raw-frame lifecycle, consent/reconstruction contract and a “My Body” projection in the existing Unified Human Simulation Projector.

Critical boundary: **camera-derived PersonalAvatar is patient-specific external appearance only. It is not patient-specific internal anatomy.** Internal patient anatomy requires verified imaging or another validated patient-specific source. Do not use generic atlas organs as if they were reconstructed from the camera.

Continue by implementing a real reconstruction adapter (parametric body/face fit → clothed surface reconstruction → texture/material → rig → LOD) without creating a competing Body renderer. Preserve privacy, provenance, mobile performance and deterministic acceptance. Do not claim game-quality reconstruction is complete until an actual tested reconstruction backend produces a rigged asset.


## Production UX + unified personal body directive — 2026-09-19

The owner explicitly considers the current product **not production-ready yet**. Treat this as an R&D / product-hardening objective, not as a request to keep adding disconnected features.

### One personal body everywhere

Profile, Clinical and Your Body must converge on the same canonical personal-body experience:
- personal outer-body avatar;
- source-backed 3D anatomy context;
- longitudinal patient state;
- Clinical / AI-EMR context;
- explicit provenance boundaries.

Use `src/components/PersonalBodyUnifiedSurface.tsx` rather than inventing another body renderer.

The current surface composes the existing personal avatar renderer and canonical anatomy projector in one product surface. The long-term target is to admit the camera-reconstructed rigged PersonalAvatar into the same canonical Three.js scene once a real reconstruction backend exists and is validated. Do not fake that milestone.

### Share

Personal body sharing must always be user-triggered. The current export shares the personal avatar render through the Web Share API when supported and downloads a PNG otherwise. Never auto-share or publish clinical overlays, private records or raw camera frames.

### Product simplicity

R&D must optimize for:
- fewer visible choices;
- six-or-fewer primary destinations per surface when practical;
- progressive disclosure for secondary features;
- one focal action / visual per viewport;
- readable contrast;
- minimal text on the primary scroll;
- clear one-line guidance with detail behind disclosure;
- no gradient/card mosaic merely to make a page look busy;
- preserve features rather than deleting them: move secondary tools under More / disclosure.

Use successful consumer apps as interaction-quality benchmarks, not as copyrighted asset sources.

### Drug-dose completeness

Dose coverage is incomplete and must continue improving, but **never by guessing**. Three acceptable sources are:
1. exact curated SKDI therapy corpus mappings;
2. verified official product-label dosage text through the existing label integration;
3. another authoritative dose source only after provenance and indication/route matching are explicit.

Route/indication mismatches are worse than blanks. Keep rejected mappings rejected until a genuinely matching source exists. Track coverage numerically and continue safe mapping passes.

### Self-development loop

Do not wait for the owner to invent every feature. For each major surface:
1. observe concrete friction from code, QA, screenshots and real interaction;
2. identify the smallest high-impact usability/clinical gap;
3. design a non-destructive fix;
4. implement with deterministic acceptance;
5. measure readability, reachability, latency and mobile behavior;
6. ship only when exact-head gates are green;
7. continue to the next independent bottleneck.

The target is not feature count. The target is a coherent, enjoyable, obvious-to-use, medically trustworthy product.


## Ruthless simplicity is the default product law — 2026-09-19

The owner explicitly wants Panacea to feel radically simple and obvious even when the underlying system is technically deep. The canonical contract is `DOCS/RUTHLESS-SIMPLICITY.md`; the active global presentation layer is `public/panacea-ruthless-simple-v50.css`.

Apply this to **workflow, architecture, frontend, backend, data flow, navigation and UI/UX**, not only cosmetics:
- one focal purpose and one primary action per viewport;
- six-or-fewer primary choices per surface when practical;
- major features reachable in at most two intentional interactions from Home;
- visual/data-first primary scroll; interpretation behind one-tap disclosure;
- decoration must communicate meaning or be removed;
- one canonical source/state/renderer per concern before adding another abstraction;
- reduce duplicate workflows, duplicate pages and duplicate controls;
- preserve useful capability by grouping or hiding secondary tools rather than deleting it;
- keep safety-critical information, provenance, consent and clinician-review state visible when required.

Use the formulas from the contract when simplifying competing designs:
`Perceived Complexity = Visible Choices × Hierarchy Levels × Simultaneous Contexts`
and
`Task Cost = User Interactions + Context Switches + Required Decisions + Waiting`.

Do not reintroduce gradient/card-wall/glow-heavy presentation as a default aesthetic. Clinical/Body canvases may remain immersive when functionally justified, but controls around them must stay quiet and obvious.

## Visit OS secure realtime handoff — 2026-09-19

The generic `server/src/realtime.ts` room relay remains preserved for existing Consult/WebRTC behavior and must not be represented as the secure Visit OS transport. `server/src/visitRealtimePolicy.ts` now defines the fail-closed authorization boundary: authentication alone is insufficient; the exact patient/clinician membership, visit id, role, visit window, and bounded signaling envelope must all agree.

Current blocker before wiring a production `/visit-ws` path: the backend has no canonical server-side visit/encounter membership registry that can resolve `visitId -> exact patientUserId + clinicianUserId + lifecycle/window`. Do not authorize from a client-supplied room name, client role, owner/admin privilege, generic chat membership, or atlas/AI state. Next independent implementation should first add/reuse an authoritative visit membership source, then bind authenticated session identity to this policy, add replay/sequence protection and audit events, and only then migrate Visit OS signaling away from the generic relay. Preserve existing Consult compatibility during migration.
## Medical Device Fabric continuation — 2026-09-20

The owner wants Panacea to study and connect the medical-device industry broadly, including AVVIGO+-class cath-lab systems, and provide a detailed analyzer layer without creating a vendor-by-vendor architectural mess.

Canonical foundation now landed:
- `DOCS/MEDICAL-DEVICE-FABRIC.md`
- `src/lib/medicalDeviceIntegrationCatalog.ts`
- `scripts/qa/medical-device-integration-catalog.test.mjs`

The catalog covers major device families across bedside monitoring, ECG/telemetry, cath-lab coronary physiology, IVUS/OCT, angiography/fluoroscopy, CT/MRI/X-ray, ultrasound, ventilation/anesthesia, infusion, dialysis/CRRT, ECMO, central lab/POC, spirometry, EEG/EMG, endoscopy, surgical navigation/robotics, ophthalmology, implantable cardiac devices, fetal/neonatal monitoring, digital pathology, rehabilitation, home devices and wearables.

Architecture rule: this is one shared Medical Device Fabric underneath Visit OS, Clinical, AI-EMR, Your Body and Body Exposure. Do not create another patient state, visit kernel, imaging stack or EMR. Reuse:
- `visitOperatingSystem.ts` for live visit/session state;
- `visitDeviceAdapters.ts` for scalar Visit OS adapter normalization;
- `visitFhirObservation.ts` for clinician-accepted FHIR publication;
- the existing DICOM modules for imaging;
- `panaceaLongitudinalState.ts` as the longitudinal source of truth.

Interoperability preference order: DICOM/DICOMweb; IHE Devices profiles (DEC/ACM/IDCO/IPEC/PIV); IEEE 11073 where applicable; HL7 v2 for existing enterprise feeds; FHIR R4 for normalized publication; then documented BLE/USB/serial/TCP or authorized vendor SDK/cloud adapters. Never claim vendor/model support from catalog presence alone.

Safety boundary is inbound/read-only by default. Do not add therapy actuation for pumps, ventilators, dialysis/ECMO, implant programming, navigation/robotics or other high-risk devices unless a separately regulated and validated bidirectional pathway exists. Device data may inform clinicians and AI context; it does not autonomously diagnose, prescribe or change treatment.

Next long-running implementation order:
1. add a canonical non-scalar device event envelope for waveforms, alarms, settings, therapy-delivery events and image/report references;
2. add deterministic technical-QC analyzers for identity, timestamps, clock skew, replay, units, signal quality, sample completeness and liveness;
3. build real vendor/model adapters only from documented/authorized interfaces, beginning with bedside monitors and ventilators, then infusion pumps, cath-lab IVUS/physiology, lab/POC and implant interrogation;
4. keep high-frequency waveforms in bounded time-series/waveform storage and imaging in DICOM/DICOMweb; do not flatten them into ordinary FHIR scalar rows;
5. maintain a conformance matrix per vendor/model/firmware/interface with tested fields, fixture, limitations and last validation date;
6. project only normalized provenance-preserving results into Clinical/AI-EMR/Body surfaces, and publish clinically committed data only through the existing review/FHIR boundary.

For AVVIGO+-class systems, model intravascular imaging and coronary physiology as coordinated streams. Public product literature is enough to design the data contract, not enough to claim an AVVIGO+ connector. A real Boston Scientific integration requires an authorized interface/export path plus fixtures and validation.

Use exact formulas only when prerequisites are met and version them with provenance. Examples already captured in the fabric spec include:
`age_ms = max(0, now - receivedAt)`,
`Δt = receivedAt - capturedAt`,
`PP = SBP - DBP`,
`MAP ≈ DBP + (SBP - DBP)/3`,
`SI = HR/SBP`,
`FFR = Pd/Pa` under valid hyperemic/calibrated conditions,
`P/F = PaO2/FiO2`,
`Cstat = VT/(Pplat - PEEP)`, and
`ΔP = Pplat - PEEP`.
Vendor-specific indexes must come from validated vendor/clinical definitions rather than guessed formulas.


## Sport Science + Adventure / Rescue OS continuation — 2026-09-20

The owner wants Panacea to unify deep sport-science analysis with expedition, diving, travel, tactical and rescue operation modes, including difficult terrain, caves, offshore environments and aviation connectivity context.

Canonical foundation now landed:
- `src/lib/sportAdventureRescueOS.ts`
- `DOCS/SPORT-ADVENTURE-RESCUE-OS.md`
- `scripts/qa/sport-adventure-rescue-os.test.mjs`
- `src/lib/satelliteMeshNetworkResilience.ts`

Sport-science coverage currently includes running, cycling, swimming, triathlon/Ironman, tennis, padel, HYROX, strength/gym, tactical fitness and diving. Keep analysis multidimensional: physiology, biomechanics, technique, tactics, internal/external load, recovery, environment, equipment and safety. Never fabricate a metric that the connected device/source does not actually provide.

Underwater communication rule is non-negotiable: do not represent GNSS or ordinary satellite RF as a direct underwater link. The canonical path is underwater acoustic/optical/tether communication -> local repeaters when needed -> entrance/surface gateway -> cellular/LEO satellite or another authorized surface backhaul. Cave/overhead environments should support breadcrumb/repeater nodes plus offline store-and-forward. WHOI-style buoy/node/vehicle acoustic relays are a useful reference architecture, but no vendor/model connector may be claimed until a real authorized adapter and fixtures exist.

Rescue positioning must preserve three distinct truth states:
- measured;
- relay-derived;
- drift-estimated.

The drift estimate is a search aid only. The current deterministic projection uses current/subject vectors and expands uncertainty with time; never display it as a real GNSS/acoustic fix. Preserve last trusted fix, timestamp, source, accuracy, confidence, route history and search-radius uncertainty.

Certified emergency systems remain independent and primary. Panacea may complement but must not replace 406 MHz EPIRB/PLB/AIS-SART maritime distress systems or 406 MHz ELT aviation distress locating. Panacea does not control aircraft or vessels and does not become a decompression computer.

Next long-running implementation order:
1. define a separate expedition/rescue device-adapter catalog for sports wearables, dive computers, acoustic modems, cave repeaters, surface buoys/boat gateways, PLB/EPIRB/AIS-SART/ELT metadata feeds and authorized aircraft/vessel telemetry without mixing them into patient truth;
2. add concrete adapter interfaces with identity, timestamp, location accuracy, confidence, battery, link quality, firmware/model and provenance; start with read-only fixtures, not vendor claims;
3. extend diving from manual log to optional imported depth-profile/current/position/communications context while preserving the existing rule that Panacea is not the decompression authority;
4. add offline-first mission/event storage and delayed synchronization so cave/remote segments can safely reconnect without replay/duplication;
5. add rescue track fusion with last-known-position timeline, current/wind/environment sources, uncertainty growth, breadcrumb history and responder export; preserve measured vs estimated styling and semantics;
6. connect Sport Science/Training to the shared sport profile registry rather than creating new isolated sport pages; allow discipline-specific deeper analyzers for running, cycling, swimming, triathlon/Ironman, tennis, padel, HYROX, strength and tactical work;
7. for aviation, restrict Panacea to authorized communication/health/location context, crew/passenger wearable integration and rescue-support telemetry. Never add flight-control actuation or claim replacement of ATC/ELT-certified systems;
8. maintain deterministic QA for no-direct-underwater-satellite claims, certified-system non-replacement, confidence decay, stale-fix behavior, failover and offline/store-forward semantics.

Useful formulas already encoded:
`distance = speed * elapsedSeconds`
`north = distance * cos(bearing)`
`east = distance * sin(bearing)`
`dLat = north / EarthRadius`
`dLon = east / (EarthRadius * cos(latitude))`
`searchRadius = sqrt(accuracy^2 + (t*sigma_current)^2 + (t*sigma_subject)^2)`

Do not hide uncertainty for a cleaner UI. Rescue usefulness depends on truth about what is known, what was relayed and what is only estimated.


## Future Wearable Environment OS continuation — 2026-09-20

The owner wants Panacea to evolve into a universal wearable **body + environment + position + vehicle + rescue OS** for future devices, not a set of isolated watch integrations.

Canonical foundation now landed:
- `src/lib/wearableEnvironmentOS.ts`
- `DOCS/FUTURE-WEARABLE-ENVIRONMENT-OS.md`
- `scripts/qa/wearable-environment-os.test.mjs`
- existing `sportAdventureRescueOS.ts` and `satelliteMeshNetworkResilience.ts` remain upstream/shared layers.

Environment domains include terrain/topography, geology, atmosphere/weather, ocean/current/waves, bathymetry, marine biodiversity, indoor positioning, aviation, maritime and motorsport. Every source-backed observation must preserve source identity, timestamp, confidence/uncertainty, location context and units.

Reference-source direction:
- GEBCO for global terrain/bathymetry context, preserving grid/source-resolution limits;
- NOAA operational marine/weather model families where coverage applies for currents, wind, waves, water level, temperature and salinity;
- OBIS for marine-biodiversity occurrence/reference context, never as guaranteed species presence;
- Aviation Weather Center / FAA sources for aviation weather context, while approved aviation planning/ATC systems remain authoritative.

Diving motion analysis now has a source-aware hover/trim proxy and Archimedes physics helper. Preserve the boundary: no guessed BCD volume, no automatic ballast prescription, no decompression/ascent authority. Hover score is for longitudinal technique analysis only.

The finding network must be authorization-first and fail closed. Supported conceptual sources include GNSS, UWB, BLE, Wi-Fi RTT, venue gateways, crowd/mesh relays, acoustic underwater relays, vehicle relays and satellite backhaul. Child/dependent tracking requires guardian authorization; consenting adults/team members require explicit consent or scoped event/rescue authorization; covert tracking is prohibited. Build rotating/short-lived identifiers, bounded retention, purpose limitation and auditability before any production crowd-relay design.

Routing is advisory only. Panacea may rank precomputed candidate routes using time + weather + terrain/airspace + communications + uncertainty, but must not become a certified flight planner, marine passage planner, parachute authority or vehicle control system. Fastest is never allowed to silently override safer/higher-authority constraints.

Extreme-event coverage currently includes Ironman, Tour de France-style stages, HYROX, ultramarathon, ultra-trail, open-water swimming, adventure racing, skydiving, F1, Daytona/endurance motorsport, rally and rowing. Expand through the same registry rather than creating unrelated pages. Do not create a fake universal “mental toughness” score from wearable telemetry; use explicit self-report/validated cognitive tasks and preserve uncertainty.

Next long-running implementation order:
1. add a canonical environment-source adapter interface and conformance matrix (source, version, spatial/temporal resolution, units, uncertainty, licensing, stale/failure semantics);
2. implement source adapters behind that interface for terrain/bathymetry, marine currents/weather, biodiversity and aviation weather where terms/API access permit;
3. connect the environment snapshot into Training/Sport Science, Dive Log/Adventure Rescue and authorized navigation/rescue context without creating duplicate state;
4. add offline geospatial tile/cache contracts for remote travel, diving and emergency use, with explicit data-age indicators;
5. add indoor authorized-finding fusion for UWB/BLE/Wi-Fi/venue/crowd relays and outdoor handoff to GNSS/cellular/satellite, preserving privacy and authorization at every hop;
6. extend dive hover analysis from depth/IMU samples to connected dive-computer/pressure/current context when real adapters exist; keep decompression separate;
7. add event-specific analysis adapters for Ironman/Tour/HYROX/ultra/open-water/F1/Daytona/rally/skydiving while preserving event-specific units and source truth;
8. add route/environment uncertainty visualizations that separate measured, forecast, modeled, relayed and derived values;
9. maintain deterministic tests for privacy, no-covert-tracking, no-certified-navigation replacement, no-direct-underwater-satellite claims, derived-vs-measured location, and advisory-only routing.

Useful formulas already encoded:
- terrain slope: `atan(deltaElevation / horizontalDistance)`;
- vector components: `north = speed*cos(theta)`, `east = speed*sin(theta)` using an explicit direction-toward convention;
- dive hover: `1 / (1 + depthSD/0.30 + verticalSpeedRMS/0.10 + trimRMS/20)` as an educational motion proxy;
- Archimedes: `F_b = rho*g*V`, `F_net = F_b - m*g`;
- route advisory cost: `0.30*time + 0.30*weather + 0.20*terrain/airspace + 0.10*comms + 0.10*uncertainty`.

Do not hide model/source uncertainty to make the interface feel more confident.


## Universal Sport OS continuation — 2026-09-20

The owner wants Panacea to become a universal scientific operating system for essentially every sport, with deep physiology, biomechanics, technique, tactics, environment, equipment, positioning, communications and safety rather than shallow sport labels.

Canonical foundation now landed:
- `src/lib/universalSportOS.ts`
- `DOCS/UNIVERSAL-SPORT-OS.md`
- `scripts/qa/universal-sport-os.test.mjs`
- existing `sportAdventureRescueOS.ts`, `wearableEnvironmentOS.ts` and `satelliteMeshNetworkResilience.ts` remain shared upstream layers.

The universal registry currently covers 50+ contexts spanning endurance, racquet, bat-and-ball, team field/court, combat, strength, precision, water, mountain/winter, aerial, motorsport, equestrian, gymnastics and tactical domains. Key explicitly requested profiles include tennis, baseball, F1, Daytona/endurance racing, MotoGP, scuba, freediving, triathlon/Ironman, cycling, HYROX, tactical fitness and skydiving.

Scientific graph definitions are first-class contracts. Core graph families include HR response, internal load, pace/power vs HR, tennis work:rest, baseball Statcast-style velocity/spin and exit-velocity/launch-angle, motorsport driver physiology + g-load, vehicle brake/throttle/speed, MotoGP lean angle, diving depth/absolute pressure, hovering/vertical control, freediving depth/HR/SpO2, and environmental wind/current overlays. Rendering should use these contracts rather than inventing separate data schemas per page.

Source discipline is mandatory:
- all metrics require a real source;
- measured and estimated values remain distinct;
- wearable VO2 estimate != measured VO2;
- blood lactate requires a measured source, never an HR-only guess;
- vehicle telemetry requires explicit authorized access;
- MLB Statcast-like definitions may be used as metric semantics, but Panacea must not imply access to proprietary MLB data feeds;
- MotoGP/F1 telemetry semantics may guide contracts, but no team/series private data should be claimed without authorization;
- dive/freedive physiology graphs never become decompression or blackout predictors.

Reference foundations captured in the docs/code registry include PubMed endurance physiology, ITF tennis conditioning, MLB Statcast, FIA medical/safety material, MotoGP official telemetry descriptions, Divers Alert Network buoyancy/pressure physiology, and modern freediving physiology reviews.

Useful formulas already encoded:
- `sRPE = durationMinutes * RPE`;
- `P_abs = P_surface + rho*g*h`;
- Boyle approximation `V2 = V1*P1/P2`;
- resultant g `sqrt(ax^2+ay^2+az^2)/g0`;
- two-trial critical speed `(D2-D1)/(T2-T1)`.

Next long-running implementation order:
1. add a canonical time-series/event envelope shared by sport metrics, environment, vehicle and wearable streams with monotonic sequence, timestamp quality, units, source, confidence, device identity and synchronization quality;
2. build adapter/conformance interfaces for HR/HRV sensors, running pods, cycling power meters, swimming/dive computers, tennis/baseball radar/camera systems, authorized motorsport telemetry and event timing feeds;
3. implement a scientific graph renderer that consumes `SCIENTIFIC_SPORT_GRAPHS` and refuses incompatible units or unsynchronized overlays;
4. deepen tennis into serve/shot/rally/court-position + physiology/tactical graphs while preserving source confidence;
5. deepen baseball into pitch, bat, batted-ball, baserunning and player-position analysis using Statcast-like public definitions without claiming MLB feed access;
6. deepen motorsport into human + vehicle + track/weather synchronized analysis for F1, endurance/Daytona, MotoGP, rally and karting; no vehicle control, no medical fitness determination;
7. deepen scuba/freediving into pressure/depth/current/temperature/communications + physiology with true dive-computer source data, preserving the existing no-decompression-planner and no-blackout-prediction rules;
8. expand the registry with additional sports by composing existing metric packs before inventing new schemas;
9. keep global primary UI simple: users choose sport/session first, then the scientific graph deck progressively discloses physiology, technique/tactics and environment rather than showing dozens of charts simultaneously.

Do not create a fake universal athlete score or mental-toughness score. Cross-sport comparison should preserve sport-specific units, source quality and uncertainty.


## Tactical Athlete OS continuation — 2026-09-20

The owner wants Panacea's sport analyzer to reach elite military/law-enforcement human-performance rigor. Interpret this as **public-source tactical-athlete science and evidence fusion**, not operational combat/intelligence capability.

Canonical foundation now landed:
- `src/lib/tacticalAthleteOS.ts`
- `DOCS/TACTICAL-ATHLETE-OS.md`
- `scripts/qa/tactical-athlete-os.test.mjs`
- shared upstream layers remain `universalSportOS.ts`, `wearableEnvironmentOS.ts`, `sportAdventureRescueOS.ts` and `satelliteMeshNetworkResilience.ts`.

Public framework anchors captured:
- U.S. Army H2F for integrated physical, cognitive/mental, nutrition and sleep readiness with multidisciplinary performance teams;
- U.S. Marine Corps Force Fitness for holistic/progressive functional exercise science and physical readiness;
- FBI public PFT for continuous pull-ups/chin-ups, 300 m sprint, continuous push-ups and 1.5 mile run;
- load-carriage, gait, power/agility, foot-march cognition and military heat-illness research.

Allowed analyzer domains: aerobic/anaerobic capacity, strength, power, muscular endurance, loaded mobility, agility, movement quality, cognitive performance, sleep, nutrition, heat/environment, recovery, team training readiness and **benign** precision-under-fatigue tasks.

Hard boundaries are non-negotiable:
- no operational mission planning;
- no weapons optimization or weapon-use coaching;
- no targeting/surveillance graph;
- no pursuit/evasion instruction;
- no covert tracking;
- no military/police/intelligence fitness-for-duty certification;
- no medical diagnosis from performance telemetry;
- no fake mental-toughness score.

The current transparent training-readiness proxy is:
`TARI = 0.30*physical + 0.20*loadedMobility + 0.20*recoverySleep + 0.15*cognitiveRetention + 0.10*environmentTolerance + 0.05*dataConfidence`.
Each component must already be normalized 0–1 from documented measurements/baselines. TARI is not an occupational certification.

Matched-task retention helpers are encoded:
- higher-is-better: `retention = loadedOrFatigued / freshBaseline`;
- lower-is-better time: `retention = freshBaseline / loadedOrFatigued`;
- relative load: `externalLoadKg / bodyMassKg`;
- fatigue delta reports worsening relative to the same baseline task.

“Palantir-level” is only a benign data-engineering analogy here: same-metric/same-unit multi-source evidence fusion weighted by confidence with source IDs and timestamps preserved. Never extend this into person-targeting, social surveillance or covert location graphs.

Canonical graph families now include loaded vs unloaded locomotion, agility retention under load, power retention after prolonged load carriage, cognition after fatigue, benign precision-task retention, sleep vs next-day performance and heat+load+HR+pace+RPE overlays.

Next long-running implementation order:
1. connect Tactical Athlete OS to the Universal Sport scientific graph renderer once that exists; do not create another chart schema;
2. add a synchronized tactical-session envelope for wearable, timing-gate, environment and test events with timestamp quality and device provenance;
3. add test protocols for loaded locomotion, agility, sprint/endurance, strength/endurance, reaction/attention and benign precision tasks, with versioned course/test definitions;
4. add baseline-vs-loaded and baseline-vs-fatigued longitudinal comparisons rather than unsupported universal pass/fail thresholds;
5. integrate H2F-style sleep/recovery/nutrition/cognitive context into training planning without diagnosing or certifying duty fitness;
6. add team-level aggregate training dashboards only from consented participant data, with minimum group-size/privacy controls and no individual surveillance targeting;
7. add heat/WBGT/terrain/load overlays from the Environment OS, preserving data age/source and never diagnosing heat stroke from wearable signals;
8. expand public-source tactical-athlete evidence from military, fire, law-enforcement and SAR exercise-science literature while excluding operational tactics, weapon procedures and restricted/nonpublic doctrine;
9. maintain deterministic QA for every boundary above.


## Unified Sport / Performance / Population Safety continuation — 2026-09-20

The owner's preceding sport/wearable/tactical/rescue prompts are now one canonical system rather than separate feature requests.

Core modules landed on main:
- `src/lib/universalSportOS.ts`
- `src/lib/wearableEnvironmentOS.ts`
- `src/lib/sportAdventureRescueOS.ts`
- `src/lib/satelliteMeshNetworkResilience.ts`
- `src/lib/tacticalAthleteOS.ts`
- `src/lib/performanceTelemetryEnvelope.ts`
- `src/lib/performanceResilienceProfile.ts`
- `src/lib/tacticalPerformanceCoach.ts`
- `src/lib/sportSpecificCoaching.ts`
- `src/lib/populationSafetyOS.ts`
- `src/lib/performanceOperatingOrchestrator.ts`
- `DOCS/UNIFIED-SPORT-PERFORMANCE-SAFETY-OS.md`

Canonical runtime decision order is:
`Population Safety -> synchronized/source-valid telemetry -> scientific analysis -> objective performance resilience -> actionable coaching -> sport-specific playbook -> reassessment`.

Population safety is the prime directive. Performance optimization is rank 6 after immediate life safety, participant/buddy/team/bystander protection, venue/route/environment hazard control, communications/location/data integrity, and privacy/consent. Missing or unknown high-consequence safety context fails closed. No score, graph, resilience profile or coaching plan may override the safety gate.

All sport outputs should move beyond scores. When enough valid data exists, give a concise actionable coaching result with: limitation, rationale, procedure, progression, stop/modify criteria, reassessment interval and evidence/source confidence. Current sport-specific playbooks cover tennis, baseball, Formula racing, MotoGP, road running, cycling, swimming, triathlon/Ironman, HYROX, scuba, freediving and tactical fitness. Expand through the same playbook contract.

Mental toughness/resilience must remain evidence-honest. Keep validated psychometric/self-report instruments separate from objective task-performance retention under fatigue/pressure. The latter may produce an observed retention profile only when enough distinct task classes are present; it is not personality, diagnosis, employability or duty-fitness certification.

“Tactical” remains elite human-performance science, not operational harm. Do not implement weapon-use optimization, human targeting, covert surveillance, pursuit/evasion operations or operational mission planning. Safe analogues are sport precision/visual search, authorized situational awareness, obstacle/agility route choice, search-and-rescue planning and objective resilience testing.

All new real-time sources must flow through `performanceTelemetryEnvelope.ts`: metric/unit, source/device, measured/estimated/derived/relayed truth class, captured/received time, timestamp quality, confidence/uncertainty, sequence and optional position. Scientific overlays must pass synchronization/clock-skew gates before combining human, vehicle, environment, GPS, camera/radar or dive streams.

Next implementation priorities:
1. build real authorized adapters into the canonical telemetry envelope rather than adding per-page custom ingestion;
2. implement a reusable scientific graph renderer over existing graph contracts with unit/time/source validation;
3. wire the Performance Operating Orchestrator into existing Training/Sport Science/Adventure surfaces without creating duplicate patient or athlete state;
4. expand sport-specific coaching playbooks and test protocols using authoritative/public evidence;
5. wire environment/rescue safety signals into Population Safety before performance recommendations;
6. maintain privacy/minimum-group controls for team/population analytics;
7. keep full deterministic QA in the build gate and never weaken safety/scientific tests to get green.


## Dive Expedition Field Science continuation — 2026-09-20

The owner's latest diving direction is now an additive extension of the existing Universal Sport / Adventure / Environment / Network stack rather than a new page or duplicate communications architecture.

Canonical foundation landed on main:
- `src/lib/diveExpeditionFieldScienceOS.ts`
- `scripts/qa/dive-expedition-field-science-os.test.mjs`
- `DOCS/DIVE-EXPEDITION-FIELD-SCIENCE-OS.md`
- the QA test is included in the normal frontend build gate.

Current capabilities:
- source/provenance-aware reef/coral field observations with depth, method, optional imagery/taxon/position context, bleaching/live-tissue fractions and observer confidence;
- confidence-weighted observational reef-condition summary;
- marine specimen record + chain-of-custody contract;
- invasive sampling fails closed without explicit `permitRef` and `authorityRef`;
- exact surface-interval bookkeeping from timestamps only;
- composition of the existing underwater relay plan with the defensive network failover kernel;
- online / degraded / offline-store-and-forward expedition connectivity states;
- direct satellite/GNSS underwater remains explicitly false.

Scientific/safety formulas:
- `SurfaceIntervalMinutes = (nextSubmergedAt - previousSurfacedAt) / 60,000`;
- `WeightedBleaching = sum(confidence_i * bleachingFraction_i) / sum(confidence_i)`.

Hard boundaries:
- no coral-harvest/tissue-collection procedure generation;
- no protected-species or permit-scope inference;
- no decompression recommendation from surface interval;
- no claim that biodiversity occurrence data guarantees current presence;
- no direct underwater satellite/GNSS claim;
- preserve chain-of-custody, source identity and uncertainty.

Next long-running work:
1. connect actual authorized dive-computer adapters through `performanceTelemetryEnvelope.ts` instead of page-local ingestion;
2. add reef imagery annotation adapters that preserve model/source confidence and never silently convert AI classification into verified taxonomy;
3. integrate OBIS occurrence context and NOAA/other authoritative reef/environment sources through the Environment OS source-adapter/conformance layer, including license/version/data-age semantics;
4. add offline expedition sync queues and geospatial cache/data-age contracts for no-service dives;
5. add specimen workflow persistence/audit storage without adding collection instructions or inferring legal authority;
6. wire surface interval, reef observations, environment and connectivity into the existing Diving/Adventure UI through progressive disclosure, not a new mega-page;
7. extend field science beyond coral through the same observation/specimen contracts where scientifically appropriate;
8. maintain deterministic tests for permit fail-closed behavior, source provenance, direct-underwater-satellite prohibition, offline store-and-forward, and no-decompression-authority substitution.


## Historical prompt continuity contract — 2026-09-20

The owner's Panacea requirements are cumulative across conversations, model changes and subscription periods. A requirement is not expired merely because it was requested before a model/subscription change or because a newer implementation lane exists.

Interpretation rules:
1. newest explicit owner instruction wins when two requirements truly conflict;
2. otherwise preserve older unfinished intent and integrate it into the current shared architecture;
3. do not resurrect already-superseded implementation details when the capability is already delivered more strongly;
4. do not duplicate a capability that already exists—extend or compose the canonical engine;
5. do not delete working capability merely to simplify code/UI; simplify access, presentation and architecture while preserving useful function;
6. long-running/unresolved requirements stay in this ledger or the canonical task system until shipped, superseded or explicitly dropped;
7. safety, security, privacy, licensing, scientific provenance and clinical human-review boundaries remain hard constraints over all historical prompts.

Standing product principles that apply across historical and new work:
- ruthless simplicity inside and outside: simple data flow, backend/API/state ownership, navigation and UI;
- maximum ~2 interactions from Home to important capabilities where practical;
- visual/data-first surfaces with interpretation behind progressive disclosure;
- wide whitespace and one clear focal purpose per viewport despite high functional density;
- functional Motion UI, not decorative animation;
- three-system convergence rather than page proliferation: Home/OS, Clinical, and the shared Human/Body exploration space, with existing canonical routes preserved as needed;
- AI-EMR, longitudinal patient state, chatbot/orchestration, Body Exposure, wearables/devices, evidence and safety should share contracts rather than copy state;
- Body Exposure remains one whole-body-first semantic-zoom projector from body -> system -> organ -> tissue -> cell -> organelle -> molecule/pathway -> genome;
- preserve and build on useful work from Claude Code, ChatGPT/Codex and prior agents; understand -> integrate -> improve;
- use plugins/connectors when they materially improve correctness or execution, but avoid creating duplicate external systems when the repository already has a canonical source of truth.


## Environment source adapter continuation — 2026-09-20

The first long-running Environment OS priority is now landed on main as an additive canonical contract:
- `src/lib/environmentSourceAdapter.ts`
- `scripts/qa/environment-source-adapter.test.mjs`
- `DOCS/ENVIRONMENT-SOURCE-ADAPTER.md`
- the test is included in the normal frontend build gate.

This supersedes the earlier unfinished instruction to create a canonical environment-source adapter/conformance matrix. Do not create a second source registry.

Current source contracts cover GEBCO 2026, NOAA Operational Forecast Systems, OBIS and Aviation Weather Center. Every source declares version/snapshot semantics, supported domains, truth class, payload kinds, spatial/temporal resolution, units, uncertainty, licensing/authority references, stale behavior and explicit failure semantics.

Freshness formula:
`ageMs = max(0, nowMs - observedAtMs)`
A source is stale only when its adapter defines `staleAfterMs` and `ageMs > staleAfterMs`; otherwise freshness remains `age-unknown` until a product-specific adapter provides authoritative valid-time logic.

Scientific/source boundaries:
- GEBCO grid resolution is not measurement uncertainty; preserve TID/source-data class where available.
- NOAA OFS values remain modeled/forecast context and do not silently become measured observations.
- OBIS occurrence records do not imply present-time species presence and are not converted into a fake numeric presence score.
- Aviation Weather Center products remain observation/forecast context and do not replace certified flight planning, ATC or operational aviation authority.
- unit conversion must be explicit at the adapter boundary; incompatible units fail closed.
- missing provenance, stale cycle, out-of-domain data or unsupported payload type must remain visible failure states.

Next Environment OS work should build on this contract:
1. implement read-only source-specific fetch/parse adapters only where API terms/access permit;
2. build source-specific metric/unit mappings on top of `environmentTelemetryBridge.ts`; the canonical provenance-safe projection into `performanceTelemetryEnvelope.ts` is landed and must not be duplicated;
3. build persistent geospatial tile/blob storage, eviction and sync queues on top of `environmentOfflineCache.ts`; digest/source-version/license/data-age/forecast-target metadata gating is landed and must not be duplicated;
4. connect environment snapshots to Diving/Adventure/Training and Population Safety without creating duplicate state;
5. preserve privacy/authorization rules for any position/finding source.

## Forecast semantics clarification — 2026-09-20

The owner explicitly wants future predictions and favorable/adverse scenarios preserved. Future target times are valid for forecasts; they must not be mislabeled as measured observations.

`assessEnvironmentForecast()` in `src/lib/environmentSourceAdapter.ts` now admits source-backed forecast metadata with separate `issuedAt` and `validAt`, model version, source reference and explicit uncertainty. `horizonMs = validAt - issuedAt`; freshness uses `now - issuedAt`, never the future target time. Metadata admission does not establish predictive skill, calibrated probability or suitability for clinical/safety decisions. Unknown probabilities remain unknown.

Continuation: connect this contract to authorized forecast adapters and existing graph surfaces; preserve favorable/adverse scenarios with model assumptions and source-stated intervals, without inventing probabilities or presenting scenarios as measurements. The current change is a metadata contract, not a live forecasting model or UI integration.


## Environment geospatial persistence continuation — 2026-09-21

The persistent geospatial cache/sync layer is implemented on the current continuation branch as an additive layer on top of the canonical Environment OS contracts:
- `src/lib/environmentGeospatialStore.ts`
- `scripts/qa/environment-geospatial-store.test.mjs`
- `DOCS/ENVIRONMENT-GEOSPATIAL-PERSISTENCE.md`
- the deterministic QA is included in the normal frontend build gate.

Do not create a second offline-cache metadata model. `EnvironmentOfflineCacheEntry` remains the source of truth for source/version/license/digest/data-age/forecast-target metadata.

Geospatial payload admission is fail-closed:
`persist = validCanonicalOfflineMetadata AND byteLengthMatch AND SHA256(payload)=declaredDigest`.

Eviction preserves current context over invalid/historical-only records, then uses least-recently-used order; protected pinned records are not silently deleted. Location-derived cache records require an explicit consent scope reference and the canonical record stores no patient identity by default.

Persistent sync retry uses:
`delayMs = min(maxDelayMs, baseDelayMs * 2^(attemptsAfterFailure - 1))`.

Remaining Environment OS continuation after this lands:
1. authorized read-only source-specific fetch/parse adapters where terms/access permit;
2. source-specific metric/unit mappings on top of `environmentTelemetryBridge.ts`;
3. connect admitted snapshots to Diving/Adventure/Training and Population Safety through shared state;
4. browser quota-pressure, IndexedDB migration/recovery and offline/online transition smoke tests;
5. preserve source licensing, forecast issue/target separation, provenance, consent and location privacy.


## Pioneer publication & discovery session

For dedicated frontier research-idea work, use [docs/PIONEER_PUBLICATION_DISCOVERY_SESSION.md](docs/PIONEER_PUBLICATION_DISCOVERY_SESSION.md) as the canonical session protocol.

This mode is for publication ideas, scientific-gap discovery, new datasets, methods, biomarkers, mechanisms, interventions, and translational hypotheses. It must remain subordinate to the Panacea Constitution and Academic Accuracy Gate.

Key rules:
- Never certify novelty from model memory alone.
- Treat "unsolved", "no dataset exists", "first", and "discovery" as evidence-dependent claims.
- Record reproducible literature/trial/patent/dataset searches and nearest prior art.
- Require falsifiability, provenance, reproducibility, ethics/safety, and applicability before promotion.
- Preserve rejected hypotheses and negative searches when useful.
- Use independent adversarial review rather than allowing one model to invent and self-certify novelty.
- Because the repository is public, do not commit confidential/patent-sensitive enabling detail, protected patient information, NDA material, or trade secrets without authorization.


## Interactive surgical simulation directive — 2026-09-21

The owner explicitly requires Body Exposure to progress beyond static surgical-layer teaching into an interactive 3D-capable surgical simulation system. Preserve the existing source-grounded SurgicalLab, but treat it as the anatomical-reference layer underneath a reusable simulation runtime rather than the final product.

Initial required procedure catalogue:
- CABG;
- Cimino AV fistula;
- exploratory laparotomy;
- cesarean section;
- mastectomy;
- lesion/soft-tissue excision;
- laparoscopic surgery;
- VP shunt;
- craniectomy;
- appendectomy;
- then expand across the major surgical specialties without creating isolated toy pages.

The runtime must converge on one shared architecture:
1. procedure/scenario state machine with explicit phases and restart/replay;
2. shared Body Exposure anatomy context and exact-source structure highlighting where geometry exists;
3. operating-room / procedure scene state, instrument state, anatomy target state, hazard state and telemetry;
4. interaction validation, safety/accuracy/efficiency metrics and error feedback;
5. procedure-specific 3D assets, camera/port/trajectory context, instrument collision and later deformable-tissue / fluid / bleeding physics only when validated;
6. complications and branching scenarios as explicit simulation states, not fabricated patient-specific predictions;
7. mobile/desktop interaction with progressive loading and graceful WebGL degradation;
8. source provenance, evidence boundary, academic review and clear educational-vs-clinical labeling.

Do not call a generic animation, static layer list or scripted slideshow a surgical simulator. A mature module should allow the learner to act on a stateful environment and receive objective state/telemetry feedback. At the same time, do not invent operative geometry or claim physical realism before validation. The current lightweight runtime is a scaffold; the continuation target is high-fidelity validated simulation built on the same contracts.
