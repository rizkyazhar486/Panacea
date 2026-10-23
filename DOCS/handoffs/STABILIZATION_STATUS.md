# Panacea Stabilization Status

Last updated: 2026-09-08

## Baseline

- Production baseline: `c2c9ff350a0e0ca0d3f75015afa7fabebe60781f` (`c2c9ff3`)
- Safety branch: `stabilization-baseline-2026-09-08-c2c9ff3`
- Working branch: `claude/continue-previous-task-un3s83`
- The working branch was fast-forwarded to the production baseline without rewriting history or force-pushing.

## Production state

The baseline is deployable, but deployment success must not be interpreted as proof that every feature is production-complete.

Observed repository facts:

- The frontend production `build` script runs note-index validation, `tsc -b`, and `vite build`.
- The Vercel production workflow installs dependencies, runs `vercel build --prod`, deploys the prebuilt artifact, and performs an HTTP smoke check when a deployment is created.
- The Vercel workflow does **not** run `npm run uji`; frontend test status must therefore be tracked separately.
- The server CI workflow is the authoritative place for server typecheck/build/tests.
- This execution environment cannot clone the repository or run npm against GitHub because outbound container network access is unavailable. Local test commands must not be reported as executed. Repository CI/check-runs are used as verification evidence until a connected runner executes the requested commands.

## Routes audited

- `/` — Home
- `/body-explorer` — Body Explorer / Body Exposure
- `/radiology` — Radiology
- `/frontier-health` — Frontier Health OS
- `/knowledge-bridge` — Knowledge Bridge
- `/clinical-hub` — Clinical Hub
- `/med-study` — Med Study Hub

Additional route inventory remains in progress.

## Known crash / performance risks

### Body3D source-geometry deformation — P0

`src/components/Body3D.tsx` currently applies per-frame scale changes to source anatomy for physiology teaching motion, including heart, lung, arterial, digestive, and muscle structures. This makes real source meshes visibly deform/pulse and is the direct cause of the toy-like physiology appearance reported by the product owner.

Stabilization rule: source anatomy geometry must keep its anatomical dimensions. Physiology should be represented by data overlays, flow/conduction cues, camera/section changes, or validated state visualizations rather than repeatedly scaling the anatomical mesh.

### Continuous 3D rendering — P0/P1

The Body3D viewer currently maintains an animation loop while mounted. The stabilization pass must stop or suspend expensive rendering when the viewer is off-screen or the document is hidden, restart deterministically, and clean up animation frames/listeners/observers.

### WebGL/mobile pressure — P1

- Pixel ratio is capped, but the mobile budget still needs explicit verification.
- Heavy anatomy layers are large and must remain lazy/on-demand.
- A WebGL failure must remain local to the feature and never cause a blank application.

## Existing strengths to preserve

- Router-level lazy loading and `Suspense` are already used broadly.
- Body Explorer already lazy-loads physiology, genomics, cell, surgery, whole-body precision, biomedical engine, and other heavy labs.
- Anatomy assets use named source nodes and preserve original GLTF names for precise structure identification.
- A shared model cache already prevents obvious repeated network downloads of the same anatomy source file.
- Radiology teaching modes explicitly distinguish rendered anatomy from real patient imaging.

## Completed stabilization actions

- Captured immutable baseline SHA.
- Created safety baseline branch.
- Safely synchronized the required Claude working branch to current `main` by fast-forward only.
- Audited the production build/deploy workflow instead of assuming deployment equals full test coverage.
- Identified the exact Body3D mesh-deformation behavior responsible for the reported pulsing/toy-like anatomy.

## In progress

- Explicit feature readiness registry.
- Recoverable feature-level error boundary with Retry / Back / Lightweight mode.
- Body3D non-deforming physiology stabilization.
- Visibility/off-screen rendering suspension and deterministic cleanup.
- Critical-route smoke coverage and 390×844 browser verification.

## Deferred external integrations

These must remain explicit adapter/data requirements rather than simulated production features when the required data or infrastructure is absent:

- patient-specific DICOM segmentation/reconstruction
- Oxford Nanopore basecalling/alignment requiring external processing
- whole-genome CRISPR off-target search requiring indexed reference genome
- methylation clocks requiring validated methylation inputs
- single-cell / spatial-omics imports requiring real source datasets
- wearable/vendor APIs requiring user authorization and vendor access

## Performance observations

Priority order:

1. prevent crashes / blank screens
2. keep source anatomy static and anatomically faithful
3. suspend invisible/off-screen 3D work
4. preserve route-level lazy loading
5. avoid duplicate renderers and model downloads
6. verify mobile GPU/memory behavior at 390×844
7. polish visual sophistication only after the above is green

## Production verification

| Check | Baseline evidence | Status |
|---|---|---|
| Frontend install | GitHub/Vercel workflow | observed in CI workflow |
| Frontend TypeScript | `npm run build` includes `tsc -b` | covered by production build path |
| Frontend build | production build/check-run | passed on baseline |
| Frontend `npm run uji` | not part of Vercel production workflow | **not yet independently verified here** |
| Server typecheck | server CI workflow | requires current check-run verification |
| Server build | server CI workflow | requires current check-run verification |
| Server tests | server CI workflow | requires current check-run verification |
| Mobile 390×844 | browser verification required | pending |
| Desktop browser | browser verification required | pending |
| Vercel deployment | production workflow | baseline deployable |
| Production HTTP smoke | Vercel workflow | available on actual deploy runs |

## Remaining backlog

P0: Body3D source-mesh deformation, feature-local recovery, route stability.

P1: Whole-body exact selection/camera integration, shared renderer ownership, mobile lifecycle/memory, physiology data overlays.

P2: provenance/evidence classification, genomics/cell/surgery/radiology integration, data truth boundaries.

P3: Home widget completeness, Med Study simplification and audience-depth modes, Library/motivation/story data, workout achievements/gamification, sourced news.

P4: additive visual polish of existing stable surfaces and seven new innovation concepts only after the core application is stable.

## Definition of done

No feature is called production-complete merely because a card, page, type, mock dataset, animation, or README exists. Applicable requirements include functional entry point, real state/integration, empty/loading/error/unsupported states, provenance, missing-data/uncertainty handling, mobile safety, tests, no fabricated patient data, no duplicate calculation engine, no duplicate renderer, clean TypeScript/build, and production smoke verification.
