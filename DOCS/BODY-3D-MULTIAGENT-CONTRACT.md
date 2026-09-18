# Body Exposure 3D — Claude Code × Astra × ChatGPT Work Contract

Effective: 2026-09-18  
Source of truth: latest GitHub `main`.

## Mission

Build Body Exposure toward a high-fidelity, source-backed anatomical atlas with a simple whole-body entry state and increasing complexity only through selection, layer disclosure and semantic zoom.

Target experience:
- mature anatomy-atlas level gross anatomy;
- face, integument, eye, neurovascular detail and reproductive anatomy are not optional edge cases;
- source-backed sex-specific anatomy;
- Blender asset pipeline + Three.js runtime;
- microscopic depth changes representation rather than magnifying gross geometry.

## Shared rules

Every agent must:

1. fetch latest `main` before material work;
2. inspect overlapping recent commits/PRs;
3. preserve useful landed work;
4. never force-push or rewrite shared history;
5. never invent anatomy, source registration, review, provenance or licenses;
6. never call a regional asset "whole body";
7. never align two different reference bodies by eye;
8. keep patient-specific signals separate from generic reference anatomy;
9. retain exact source mesh names and provenance;
10. fail closed when geometry or cross-scale evidence is missing;
11. run/inspect relevant exact-head CI after shipping;
12. leave a durable handoff when blocked.

## Lane A — Astra / Blender asset engineering

Primary responsibility:
- source acquisition audit;
- Blender scene assembly;
- geometry packaging;
- layer organization;
- materials;
- source-name preservation;
- GLB export;
- asset manifest;
- LOD experiments only after QA;
- rendered artifact screenshots/turntables for inspection.

Start with:
`scripts/blender/build_panacea_whole_body.py`

Astra must first assemble the already-compatible Z-Anatomy whole-body layers:
- surface;
- skeleton;
- muscle;
- cardiovascular;
- nervous/ocular;
- lymphoid;
- visceral/male reproductive.

Expected output:
- `public/anatomy-v2/whole-body-reference.glb`
- `public/anatomy-v2/whole-body-reference.manifest.json`

Do not add those generated binaries to main until:
- file size is acceptable for the runtime strategy;
- exact source object names/extras survive export;
- whole-body relative coordinates are preserved;
- a browser artifact proves surface + eye + internal systems remain aligned;
- attribution/share-alike requirements are preserved.

Then research/prepare the female reference lane using HRA. Do not fit `obgin.glb` into the male reference body.

Astra may use Blender Python and headless Blender. Geometry should be edited only when the edit is source-derived and traceable. Cosmetic material work is allowed; anatomical sculpting from imagination is not.

## Lane B — Claude Code / Three.js runtime engineering

Primary responsibility:
- runtime asset registry;
- streaming;
- system/layer visibility;
- picking;
- search;
- hide/fade/isolate/select-others;
- clipping;
- camera focus;
- semantic zoom;
- responsive/mobile behavior;
- accessibility;
- integration with Unified Human Simulation Projector.

Immediate runtime requirements:
1. whole-body surface is actually reachable;
2. ocular source structures remain connected to the whole body;
3. male reproductive structures remain connected to the whole body;
4. female regional reference remains explicitly separate until compatible;
5. no second competing renderer if the canonical loader/runtime can be extended.

Prefer extending:
- `src/lib/anatomy/pemuatAtlas.ts`
- `src/lib/anatomy/wholeBodyAssetContract.ts`
- `src/lib/bodySystemSourceWave.ts`
- `src/components/BodyAllSystems3D.tsx`
- Unified Human Simulation Projector

Do not delete specialty modules; deep organ modules become drill-down assets from the same selection context.

## Lane C — ChatGPT Work / provenance, integration and QA

Primary responsibility:
- source/license evaluation;
- machine-readable source-gap ledger;
- cross-reference coordinate-space guard;
- biomedical boundary review;
- acceptance tests;
- non-overlap reconciliation;
- product integration across Body Exposure, Clinical and AI-EMR context.

Current immediate fixes landed:
- integument target can select the complete `surface.glb` source catalogue;
- whole-body eye lookup uses actual ocular source bundles instead of the wrong visceral lookup;
- male reproductive whole-body targets include penile/erectile, testicular, epididymal, deferent-duct, seminal-vesicle and prostate structures;
- female whole-body absence remains explicit rather than fabricated.

## Work locking

No permanent file ownership exists.

Before editing a shared file, an agent must:
- re-fetch latest main;
- check open overlapping work;
- keep the diff minimal;
- replay onto latest main if main moved.

For high-conflict runtime files such as `BodyAllSystems3D.tsx`, `BodyExposureOS.tsx`, `UnifiedHumanSimulationProjector.tsx` and shared source registries, only one active lane should make a material edit at a time.

Blender scripts, asset manifests and new source-audit files are preferred for parallel work because they minimize runtime overlap.

## Required order

### Wave 0 — repair source continuity
- integument surface;
- eye;
- male reproductive;
- source-gap ledger.

### Wave 1 — Blender whole-body assembly
- seven compatible layers;
- manifest;
- source-name preservation;
- visual QA;
- file-size/performance audit.

### Wave 2 — runtime atlas behavior
- whole-body default;
- layer rail;
- select/search;
- focus;
- fade/hide/isolate/show others;
- clipping;
- progressive loading.

### Wave 3 — sex-specific reference anatomy
- keep male and female references explicit;
- ingest compatible female reference assets;
- vagina/uterus/ovary/tube/pelvic floor and external-genital surface only from source-backed female geometry;
- never superimpose sex-specific anatomy without an explicit educational comparison mode.

### Wave 4 — organ depth
Priority:
1. eye/orbit;
2. brain/CNS;
3. heart/cardiovascular;
4. respiratory;
5. abdomen/pelvis;
6. musculoskeletal;
7. remaining systems.

### Wave 5 — tissue → cell → molecular
Only after source-backed cross-scale edges exist.

## Definition of done for one structure

A structure is not "done" because it appears on screen.

```
Done =
  sourceGeometryPresent
  ∧ exactIdentity
  ∧ provenance
  ∧ selectable
  ∧ searchable
  ∧ focusable
  ∧ layer/systemContext
  ∧ hideFadeIsolateCompatible
  ∧ mobileUsable
  ∧ tested
```

For clinically sensitive spatial claims, appropriate human review gates still apply.

## Validation

Minimum:
- deterministic source-contract tests;
- Body 3D Render Acceptance when applicable;
- Stabilization Acceptance;
- mobile 390×844 WebGL smoke;
- no canvas obstruction;
- no stale-green reuse after main moves;
- performance evidence for new heavy assets.

## Stop conditions

Stop and record a blocker instead of fabricating when:
- the license is unclear;
- the source mesh identity is unclear;
- reference coordinate spaces differ;
- the source lacks the requested anatomy;
- registration error is unmeasured;
- binary size destroys mobile usability;
- CI proves a regression;
- a concurrent lane owns the same high-conflict edit.
