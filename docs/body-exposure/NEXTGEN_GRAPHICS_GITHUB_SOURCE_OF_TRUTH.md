# Body Exposure — GitHub-first graphics continuity directive

**Owner direction (2026-10-29): STOP using Blender for this workstream. Commit durable source, decisions, and reproducible evidence directly to GitHub.** Do not require local Blender execution to continue GitHub-side engineering. Do not delete, rewrite, or invalidate any prior Blender scripts or assets; they are retained as historical work. This document does not claim previously local files have been uploaded.

## Authority, context, and scope

- Canonical repository: https://github.com/rizkyazhar486/Panacea
- Snapshot inspected: `main` at `8a3dc7d76382bdc4d1c531904aa3e8b126cd1f82` (2026-10-29).
- Previous graphics addition: PR #2899 (merged as `35d1ad61799a46ed11795f2d2fb5d7b30e9e55a1`).
- Existing sources of truth to **reuse**, never duplicate: `bodyexposure/README.md`, `bodyexposure/DELTA.md`, `bodyexposure/QA.md`, `bodyexposure/PROVENANCE.md`, `public/bodyexposure/body_matrix.json`, existing glTF/meshopt exports, and `src/domains/body-exposure/bodyExposureEnterpriseEngine.ts`.
- Higher-order `AGENTS.md`, clinical governance, privacy and exact-head acceptance requirements continue to apply.

## Non-negotiables

1. **Preserve existing work**: add or deepen; never delete model sources, previously authored code, mesh metadata, licences, provenance, existing scene capabilities or acceptance tests to improve a score.
2. **GitHub is the durable decision and implementation log**: every evidence-producing change must have a commit, path, input-source provenance, version, reproducible validation command and PR or merge reference. Do not retain unique decisions only in conversations or transient agent context.
3. **No Blender dependency for this phase**: prioritize repository-native validation, asset manifests, web rendering, GLB/glTF metadata, compressed PBR textures, browser quality evidence, tests, documentation and canonical integration. Do not schedule or execute Blender and do not ask for it as an implicit prerequisite. Preserve its earlier outputs and references.
4. **Do not fabricate assets or proof**: 8K render resolution is not proof of an 8K texture; an enum labelled `ULTRA_AAA` is not proof of topology optimization; selecting `CYCLES_GPU_ACCELERATED` in code is not proof a GPU renderer ran. Real proof must include an actual artifact plus measured metrics.
5. **Anatomy and identity are different**: an atlas, demographic body, AI-generated avatar, and patient-specific reconstruction must be explicitly differentiated. Never infer unmeasured internal anatomy from a face photo. No PHI, identifiable facial scans, DICOM from patients, secrets or private clinical material in this public repository; use consent-governed private storage and integrity references.
6. **Clinical boundary**: display/reference anatomy remains educational or research-only unless separate authorized clinical validation exists. For unknown measurements, status must be 'not measured' rather than approximated as fact.
7. **No false superiority claims**: 'Black Myth: Wukong / RDR / GTA / FIFA / NBA 2K quality' and 'beyond Unreal Engine' are aspirational aesthetic benchmarks, not current outcomes or scientifically comparable metrics.

## Evidence-backed baseline

The inspected `public/bodyexposure/body_matrix.json` reports 208 body-system entries; the adult male has 3,877 structures, adult female has 841 (partial), fetal atlas has 14 (partial), and MNI152 nervous atlas has 556. The manifest also includes pediatric variants and partial older-adult references; pregnancy and toddler entries remain placeholders. These are **structure inventory counts**, not percentages of anatomy quality or individual accuracy.

Existing work already includes body-system GLBs, source/accuracy metadata, meshopt/LOD, multi-angle/cutaway/exploded views, cinematic render scripts, procedural tissue materials, several rig/motion features, and physiology modules. Preserve and deepen these instead of creating parallel systems. Historical QA notes unresolved topological and anatomical source defects, partial soft-tissue rigging, and missing individual-specific models. See `bodyexposure/QA.md` and `bodyexposure/DELTA.md`; those historical documents may have stale summary headings, so newer canonical manifest and measured artifacts win.

**Directive 060 / PR #2899 gap:** the current `bodyExposureEnterpriseEngine.ts` decides `AAA_CINEMATIC_GRADE` from configuration strings and an SSS numeric threshold, reports topology status without inspecting geometry, reports a render backend without invoking it, and constructs a `provenanceHash` from `Math.random()`. Tests check these labels, not a GLB, texture, image or actual render. Treat these as configuration/UI claims, **not proof of graphics readiness**. Preserve module while introducing evidence-gated quality evaluation and eventually migrate consumers with parity tests.

## Implementation lanes — GitHub-native only

### G0: Canonical asset catalogue and immutable provenance (first)

- Create per-asset manifest records: content-addressed SHA-256, source URL/DOI, licence and redistribution determination, anatomy nomenclature/ontology, coordinate frame, individual-vs-atlas flag, measurement method, asset version, resolution/geometry statistics, source-to-derived links, and review status.
- Reconcile references with `public/bodyexposure/body_matrix.json` and per-structure `panacea_structure_id`. Preserve the canonical identity and patient-state boundaries.
- Maintain machine-readable gaps, ownership, acceptance tests and evidence links in `NEXTGEN_GRAPHICS_GAP_LEDGER.json`.
- Treat locally known `.blend` and raw data as **not backed up** until the actual bytes are stored in a verified durable asset location and hash/retention verified. A pathname or document is not a backup.

### G1: PBR fidelity and high-resolution surface material proof

- Reuse existing material/provenance definitions. Register actual albedo/base-color, normal, ORM (occlusion/roughness/metallic), thickness/subsurface and displacement map assets when present and legally reusable.
- Validate dimensions/bit depth/channels/color spaces, UV islands/overlap and texel density, and sample crops with baseline image comparisons. Never label procedural noise as a measured human skin/tissue scan.
- 8192x8192 maps are **optional cinematic source assets**, not a universal requirement for real-time mobile. Use KTX2/Basis Universal, mipmaps, adaptive LOD and fallbacks for production, with tested GPU-device performance. No 8K texture claim until real assets and hashes are recorded.

### G2: Mesh and anatomical topology proof

- Validate actual glTF/GLB triangle counts, degenerate triangles, normals, winding, open/nonmanifold boundaries by anatomical class, UV and material completeness, per-system semantic labels, laterality, scale and bounding-box sanity. Open vessel endpoints may be expected and must be classified rather than blindly closed.
- Preserve source mesh and derive reversible web LODs. Compare source-to-LOD geometrical deviation per structure with explicit tolerances and report all exceptions, especially thin vessels, nerves, small joint surfaces and cut anatomical edges.
- Avoid optimizing based on arbitrary 'ULTRA_AAA' labels; record measured geometry and artifact hashes.

### G3: Personalization with consent and confidence

- Distinguish `reference_atlas`, `synthetic_appearance`, `individual_external_scan`, `individual_imaging`, and `measured_physiology`; derive no authority from photorealism.
- Source exterior visual features and anthropometry only from consented individual inputs. Internal personalized anatomy requires relevant, clinically suitable individual imaging/measurements; missingness remains explicit.
- Store identifiable scans and PHI in controlled non-public encrypted storage; Git only stores nonidentifying schema, approved source hashes/aliases, code and test fixtures.

### G4: Web runtime quality, identity and safety

- Reuse existing CanonicalBody and Three.js rendering, camera, picking, and system hierarchy; do not rewrite UI or make a second source of truth.
- Measure FPS p50/p95 frame time, load time, network bytes, GPU memory when available, shader compilation, device and browser, motion/LOD transitions, screenshot regressions and 390px/desktop accessibility. Report actual device and exact head.
- Preserve educational vs measured vs illustrative labels, fail-closed unloaded/missing data, structure provenance and patient privacy across avatar modes.

### G5: Independent visual acceptance

- Capture reproducible raw images and compare side-by-side against a fixed revision, viewpoint, lighting, and asset checksum. Allow human artistic review but do not mark clinical or individual anatomical validity from aesthetics.
- Benchmark geometry, texture and memory objectively; no subjective 'AAA 10/10' gate without an explicitly specified method, qualified reviewers and repeatability.

## Minimum evidence for an accepted graphics claim

For any asset or rendered output record:
- A real content-addressed artifact `sha256` and verified source/derived chain.
- Resolved asset URI/location and lawful redistribution / confidentiality classification.
- Actual mesh/texture metrics and tool + version used to measure them.
- Render screenshot or video capture with dimensions, renderer + browser/device and reproducible settings.
- Test link and exact tested commit SHA.
- Known defects, not-measured fields, review limitations and decision owner.

Estimated uncompressed RGBA8 texture footprint with a complete mip pyramid:

`bytes ≈ texture_count × width × height × 4 × 4/3`.

For four 8192x8192 RGBA8 maps this is approximately 1.33 GiB, **before** mesh, rendertargets, additional textures, or compression. Actual memory must be measured on target hardware. Four 8K maps are not a default web requirement.

## Permanent handoff contract for Argon / Gemini / Claude / GPT

1. Read `AGENTS.md`, this document, `NEXTGEN_GRAPHICS_GAP_LEDGER.json`, `bodyexposure/README.md`, `bodyexposure/QA.md`, `bodyexposure/PROVENANCE.md` and the latest canonical manifest before editing.
2. Fetch current `origin/main`; inspect open PRs and avoid overlapping changes.
3. Select exactly one highest-value unverified gap. Write additive source, tests, negative controls and evidence; do not change clinical authority and do not destroy existing work.
4. Commit and push to GitHub with an accurate message. Open a PR, obtain exact-head CI evidence and follow existing merge/review policy. Keep the gap ledger aligned with observed outcomes, not claimed outcomes.
5. Every completion summary must include: branch, commit SHA, changed paths, real checks, passed/failed assertions, actual artifacts, blocked dependencies and next safe action.
6. **No Blender execution for this workstream unless the owner explicitly reverses the instruction.**

## Durable binary asset storage

GitHub only persists the bytes actually committed or uploaded; a local filename, screenshot or external link does not recover a missing source asset. If original meshes/textures exceed ordinary Git limits, use explicitly governed Git LFS, GitHub release assets where appropriate, or a private versioned object store with checksum validation and access/retention controls. Track each asset's immutable version and backup restore test in the registry. Do not upload copyrighted/unlicensed sources or patient data to this public repository.

## Source references

- https://github.com/rizkyazhar486/Panacea/pull/2899
- `bodyexposure/README.md`
- `bodyexposure/DELTA.md`
- `bodyexposure/QA.md`
- `bodyexposure/PROVENANCE.md`
- `public/bodyexposure/body_matrix.json`
- `src/domains/body-exposure/bodyExposureEnterpriseEngine.ts`
- `AGENTS.md`
