# Delta: current implementation vs. Body Exposure master directive

Status as of master v006 (2026-10-03).

## Body matrix

| Body | Status | Notes |
|---|---|---|
| Adult male | **source_backed** | 2,610 structures, all systems, Z-Anatomy/BodyParts3D |
| Adult female | **source_backed_partial** | 848 structures (+ spinal cord C1–S4, mammary gland architecture), HuBMAP VH_Female: organs, female pelvis, uterus/adnexa, heart, airway, kidneys, eyes, knees, brain. No full skeleton, musculature or peripheral nerves |
| Pregnant | placeholder | needs gestation-staged maternal + fetal source data |
| Fetus | placeholder | needs fetal anatomy by gestational week |
| Neonate / infant / toddler / child / adolescent | placeholder | needs paediatric source anatomy; adult scaling is prohibited |
| Older adult | placeholder | needs older-adult source anatomy |

## Systems (adult male)

| Present | Missing in this frame |
|---|---|
| Skin envelope (regional), muscles, tendons, retinacula/aponeuroses, bones, cartilage, **intervertebral discs (new, reconstructed)**, **pericardium (new, approximate)**, arteries/veins, heart (chambers, valves, coronaries), brain (gyri, ventricles, falx, tentorium), spinal cord, plexuses, sympathetic trunk, lymph nodes, spleen, thymus, airway to segmental bronchi, lungs, pleura, GI tract, liver segments, pancreas, kidneys, ureters, bladder, endocrine glands, male reproductive organs, eye, inner/middle ear | Joint capsules, menisci, labra, bursae; kidney internal structure; rectum, anal canal; eye choroid; semicircular canals; thoracic duct; deep fascia sheets; body-cavity volumes |

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
2. Missing male structures that can be reconstructed from source geometry without
   invention (joint capsules from the articular surfaces, pericardium from the heart surface).
3. Source acquisition for paediatric, pregnancy and fetal bodies. HuBMAP ships a placenta (v1.2) but no gravid uterus or fetus, so a pregnant body is still blocked on source data.
