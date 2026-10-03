# Delta: current implementation vs. Body Exposure master directive

Status as of master v008 (2026-10-03).

## Body matrix

| Body | Status | Notes |
|---|---|---|
| Adult male | **source_backed** | 2,610 structures, all systems, Z-Anatomy/BodyParts3D |
| Adult female | **source_backed_partial** | 848 structures (+ spinal cord C1–S4, mammary gland architecture), HuBMAP VH_Female: organs, female pelvis, uterus/adnexa, heart, airway, kidneys, eyes, knees, brain. No full skeleton, musculature or peripheral nerves |
| Pregnant | placeholder | ICRP pregnant-female mesh phantoms (fetal ages 8–38 wk) are in public consultation; data not released |
| Fetus | placeholder | comes with the ICRP pregnant-female phantoms (not released) |
| Neonate / infant / child (5, 10 y) / adolescent | **source_backed** (local) | ICRP Publication 156 CT-based phantoms, male + female (10 bodies, 102–140 structures each). Not shipped: ICRP redistribution terms unstated |
| Toddler | placeholder | no open 2–3 y source; ICRP covers 0/1/5/10/15 y and interpolation would be invented anatomy |
| Older adult | placeholder | no open age-specific (65+) whole-body phantom found |

## Systems (adult male)

| Present | Missing in this frame |
|---|---|
| Skin envelope (regional), muscles, tendons, retinacula/aponeuroses, bones, cartilage, **intervertebral discs (new, reconstructed)**, **pericardium (new, approximate)**, **1,238 structures from full Z-Anatomy: ligaments, menisci, capsules, bursae, tendon sheaths, fasciae, 705 muscle origin/insertion areas**, arteries/veins, heart (chambers, valves, coronaries), brain (gyri, ventricles, falx, tentorium), spinal cord, plexuses, sympathetic trunk, lymph nodes, spleen, thymus, airway to segmental bronchi, lungs, pleura, GI tract, liver segments, pancreas, kidneys, ureters, bladder, endocrine glands, male reproductive organs, eye, inner/middle ear | Kidney internal structure; rectum, anal canal; eye choroid; semicircular canals; thoracic duct; deep fascia sheets; body-cavity volumes |

## Architecture

| Item | Status |
|---|---|
| Canonical frame, units, naming, per-body root collections | done |
| Semantic metadata on every mesh, manifest export | done (`manifest/`) |
| Label anchors | 16 skeletal anchors, approximate |
| Material library, lighting, AgX, 13 camera presets | done |
| 4K benchmarks | 6 frames: male layered, male+female lineup, female layered, opened thorax (pericardium), cutaway digital twin, exploded systems |
| Exploded / cutaway | 4K render scenes (`render_benchmarks.py`); not yet a reversible in-app mode |
| LOD / web GLB derivation | **done**: 4 LODs × 24 body-system files, meshopt-compressed, error-measured; verified in a standalone three.js viewer. **Live in the app** at `#/body-exposure/canonical` (LOD2/LOD3, 22 MB) |
| Rigging, physiology, pathology, imaging, micro/molecular | not started |

## Next targets (priority order)

1. Link the canonical page from the existing 3D Body explorer (`BodyExplorer.tsx`; needs the owner's uncommitted changes there to land first).
2. Use Z-Anatomy label leader lines as source-backed landmark anchors (requires evaluating their hook modifiers and validating against bone surfaces).
3. Source acquisition for paediatric, pregnancy and fetal bodies. HuBMAP ships a placenta (v1.2) but no gravid uterus or fetus, so a pregnant body is still blocked on source data.

## SOP breadth gate (target-lock SOP §10)

| Canonical body | Structural presence | Source |
|---|---|---|
| Adult male | yes | Z-Anatomy / BodyParts3D |
| Adult female | yes (partial systems) | HuBMAP VH_Female |
| Neonate | yes (M + F) | ICRP 156 |
| Infant | yes (M + F) | ICRP 156 |
| Child | yes (5 y, 10 y; M + F) | ICRP 156 |
| Adolescent | yes (M + F) | ICRP 156 |
| Pregnant | **blocked** | data not released |
| Fetus | **blocked** | data not released |
| Older adult | **blocked** | no open source found |

Gate status: 6 / 9. The three blocked classes need source data, not modelling effort.
