# Claude Code continuation — Panaceamed unified body + camera-only personal digital human

Continue Panaceamed autonomously from the **latest actual main** of `rizkyazhar486/Panacea`.

The main objective remains:

**Make Body Exposure + Clinical + AI-EMR one unified, longitudinal, source-backed medical command system — whole-body first, then system → organ → tissue → cell → organelle → molecule/pathway → genome/DNA — without deleting or overwriting existing work.**

Important status update: PR #1868 and #1869 were already merged into main before this handoff. The last main observed when this prompt was written was `b802ec16b181442dead4dabf2fcdd5b1f7176b4e`, but DO NOT assume it is still current. Fetch/re-read latest main and all active PRs before editing anything.

## Collaboration rules

Preserve all valid work already created by Claude Code, ChatGPT, the user, and other agents.

Default behavior: **understand → preserve → integrate → repair → extend → validate**.

Do not destructively rewrite, remove features, duplicate systems, create competing renderers, or replace functioning architecture merely because a cleaner implementation is possible.

If another active PR owns a shared file, avoid overlap or wait/rebase/replay appropriately.

Never force merge. Never trust stale green CI.

Before every merge:
- verify latest main;
- verify exact PR HEAD;
- verify ancestry and changed-file overlap;
- run fresh required gates;
- use expected-head protected merge;
- if main moved, sync/replay and rerun required gates.

## FIRST: verify completed work, then move on

PR #1868 and #1869 are already merged. Confirm their merge commits are ancestors of current main and do not reopen/replay them unless a real regression is found.

## SECOND: reduce stale PR debt

There are at least 100 currently open PRs. Do not merge them all.

For every stale PR: compare against current main; close superseded/duplicated work; preserve unique useful capability; replay only valuable unfinished slices onto exact latest main; prefer small independent PRs.

Particularly audit #1848, #1827, #1820 and related replay chains.

The objective is one canonical implementation, not a graveyard of competing replays.

## THIRD: Body Exposure highest-priority unfinished work

Continue the one-projector architecture. Do NOT create another renderer or Body Exposure page.

Exact source anatomy selection must persist into physiology, pathophysiology, pharmacology, imaging, surgery, endoscopy, lesion localization and education where medically appropriate.

Never convert generic atlas anatomy into patient-specific diagnostic, procedural, surgical, endoscopic or treatment claims.

### Blender-first pipeline

Use:
- `DOCS/BODY-3D-ASSET-PIPELINE.md`
- `DOCS/BODY-3D-MULTIAGENT-CONTRACT.md`
- `scripts/blender/build_panacea_whole_body.py`
- `src/lib/anatomy/wholeBodyAssetContract.ts`

Verify exact source names, provenance, alignment, scale, transforms, materials, overlap, manifest, size/performance, mobile rendering and visual artifacts before admitting binaries.

Only wire accepted assets through the existing canonical Three.js renderer.

Refine: **select → search → focus → hide → fade → isolate → show others → layer controls**.

Do not visually fit female HRA geometry into the male Z-Anatomy body without validated registration. Missing fascia, skin depth, external genital surface and microanatomy stay explicit source gaps.

## FOURTH: universal biological depth

Maintain:

**whole body → system → organ → tissue → cell → organelle → molecule/pathway → genome/DNA**

Never enlarge gross meshes and call them microanatomy.

Prioritize cardiovascular, nervous, respiratory, renal, endocrine, GI/hepatobiliary, musculoskeletal, reproductive, integumentary, sensory/ENT/eye, hematologic/immune/lymphatic.

Add real gross anatomy, histology, tissue microanatomy, cells, organelles, chemistry/pathways and genomic context from the proper source class.

Never fabricate sources, identifiers, anatomy, validation or review.

## FIFTH: lesion localization

Extend source-backed deterministic educational mappings for peripheral nerves, roots, dermatomes, myotomes, spinal cord patterns, brain vascular territories and major MSK localization.

Do not claim patient-specific localization from generic atlas data.

## SIXTH: Clinical + AI-EMR integration

Body Exposure = shared visual body workspace.
Clinical = reasoning/evidence/action layer.
AI-EMR = longitudinal source of truth.
AI Chat = conversational orchestration.

Use one canonical patient/event state:

**patient/encounter → observations → findings → provenance/confidence/time → body visualization → clinical reasoning → clinician review → AI-EMR**

AI-generated content remains distinct from clinician-reviewed facts.

## SEVENTH: Visit Operating System

Continue: authenticated patient/clinician state → WebRTC media state → real device adapters → normalized device observations → secure transport → Body/Clinical/AI-EMR live projection → consent-gated ambient drafting → clinician review → FHIR R4/SATUSEHAT → reconnect/backpressure/clock-skew/stale-stream/audit/consent revocation/observability.

Preserve: **live encounter context ≠ signed clinical record**.

## EIGHTH: camera-only Personal Digital Human / “import myself”

This is now a first-class requirement.

Primary UX is NOT a manual game character creator.

Target:

**one ordinary RGB camera → short guided scan → automatic reconstruction → rigged high-fidelity personal surface avatar → My Body / Clinical / AI-EMR**

Normal phone/laptop camera is sufficient for baseline. LiDAR, depth cameras, manual measurements and wearables are optional enrichments.

Use `DOCS/PERSONAL-DIGITAL-HUMAN.md`, `src/lib/personalAvatar.ts` and `PersonalAvatarCameraCapture.tsx` as canonical starting points.

The first slice already provides one-camera guided capture, nine-view 3×3 QA, ephemeral raw-frame lifecycle, explicit truth boundary and a My Body projection. Do not call game-quality reconstruction complete.

### Reconstruction adapter

Implement:

**RGB frames → segmentation → body/face landmarks → parametric fit → multi-view clothed surface reconstruction → texture/material → mesh cleanup → rig → LOD → PersonalAvatar asset**

Evaluate SMPL-X, FLAME/DECA, PIFuHD/ICON/ECON-class methods or a licensed equivalent. Do not copy proprietary FIFA/GTA/Nintendo assets or code; match capability class only.

### Three truth layers

1. `PersonalAvatar` = patient-specific external visual shell.
2. `ReferenceAnatomy` = source-backed atlas.
3. `PatientSpecificAnatomy` = verified internal anatomy from real patient imaging/data.

**Camera avatar ≠ patient-specific internal anatomy.**

Never infer organ morphology, pathology, operative target, radiologic truth or diagnosis from appearance alone.

### 4D

`4D = 3D + t`.

Progressively support breathing, posture, walking/running, ROM/exam positions, rehab and longitudinal external-body comparison.

### 3×3 QA

Preserve: front, front-left 45°, left, back-left 45°, back, back-right 45°, right, front-right 45°, face close-up.

Future video may use many more internal keyframes while the user still experiences a simple scan.

### AI-EMR / Clinical use

Support pain/body-location mapping, surface finding annotation, wound/body-region documentation, posture comparison, rehab/exercise demonstration, longitudinal external-body change and patient education.

Do not place raw camera frames into the signed AI-EMR by default.

### Privacy

Raw frames are highly sensitive: explicit consent, ephemeral default, no silent browser persistence, no upload until authorized reconstruction, encrypted authenticated transport, explicit retention/deletion, auditable subject binding.

Do not repurpose unauthenticated visit-room signaling as avatar upload transport.

### Quantitative targets

`E_M = |M_avatar - M_reference| / M_reference × 100%`

Never call inferred dimensions clinical measurements.

`S_total = w_f S_f + w_b S_b + w_p S_p + w_t S_t + w_m S_m`, `Σw_i = 1`.

60 fps ≈ 16.7 ms/frame; 30 fps ≈ 33.3 ms/frame. 4K textures may be a high-end tier, not a mobile requirement.

## Product/UI rules

No card wall. Body/patient/anatomy canvas remains focal. Visual-first scrolling: anatomy, chart, waveform, trend, number, status, one-line label. Interpretation goes behind contextual disclosure.

Preserve wide whitespace, hierarchy, 390×844 mobile behavior, reduced motion, 2-step access, progressive disclosure, one focal point and functional Motion UI.

## Validation

Every meaningful increment gets a deterministic test. Never weaken validators to make CI green.

Preserve anatomy provenance, exact source mapping, WebGL fallback, mobile behavior, performance, safety, Academic Accuracy Gate, consent, provenance, identity, timestamp, source, auditability, fail-closed behavior and privacy boundaries.

## Execution strategy

**small verified increment → deterministic test → build/uji → PR → exact-head CI → reconcile latest main → safe merge → verify on main → next capability**

Long/source-blocked work must become a concrete `CLAUDE.md` continuation item.

Priority:

**stabilization → active PR reconciliation → whole-body source integrity → Blender acceptance → PersonalAvatar reconstruction adapter → structure-specific projections → microanatomy → lesion localization → Clinical/AI-EMR integration → Visit/device OS → polish**

The target is a coherent, medically trustworthy system where one longitudinal patient connects personal visual identity, anatomy, physiology, disease, imaging, pharmacology, simulation, Clinical, AI-EMR and real encounter data.
