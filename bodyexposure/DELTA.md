# Delta: current implementation vs. Body Exposure master directive

Status as of master v005 (2026-10-03).

## Body matrix

| Body | Status | Notes |
|---|---|---|
| Adult male | **source_backed** | 2,610 structures, all systems, Z-Anatomy/BodyParts3D |
| Adult female | **source_backed_partial** | 801 structures, HuBMAP VH_Female: organs, female pelvis, uterus/adnexa, heart, airway, kidneys, eyes, knees, brain. No full skeleton, musculature or peripheral nerves |
| Pregnant | placeholder | needs gestation-staged maternal + fetal source data |
| Fetus | placeholder | needs fetal anatomy by gestational week |
| Neonate / infant / toddler / child / adolescent | placeholder | needs paediatric source anatomy; adult scaling is prohibited |
| Older adult | placeholder | needs older-adult source anatomy |

## Systems (adult male)

| Present | Missing in this frame |
|---|---|
| Skin envelope (regional), muscles, tendons, retinacula/aponeuroses, bones, cartilage, **intervertebral discs (new, reconstructed)**, arteries/veins, heart (chambers, valves, coronaries), brain (gyri, ventricles, falx, tentorium), spinal cord, plexuses, sympathetic trunk, lymph nodes, spleen, thymus, airway to segmental bronchi, lungs, pleura, GI tract, liver segments, pancreas, kidneys, ureters, bladder, endocrine glands, male reproductive organs, eye, inner/middle ear | Joint capsules, menisci, labra, bursae; kidney internal structure; rectum, anal canal; pericardium; eye choroid; semicircular canals; thoracic duct; deep fascia sheets; body-cavity volumes |

## Architecture

| Item | Status |
|---|---|
| Canonical frame, units, naming, per-body root collections | done |
| Semantic metadata on every mesh, manifest export | done (`manifest/`) |
| Label anchors | 16 skeletal anchors, approximate |
| Material library, lighting, AgX, 13 camera presets | done |
| 4K benchmarks | male layered, male+female lineup, female layered |
| Exploded / cutaway | render-time scripts exist (`render_benchmarks.py`); not yet a reversible in-app mode |
| LOD / web GLB derivation | **not started** (master is 6.8 M vertices) |
| Rigging, physiology, pathology, imaging, micro/molecular | not started |

## Next targets (priority order)

1. LOD derivation and a web export of the canonical male with metadata as glTF `extras`.
2. Female body completion from the HuBMAP VH_Female organ set (v1.2–v1.4 parts).
3. Missing male structures that can be reconstructed from source geometry without
   invention (joint capsules from the articular surfaces, pericardium from the heart surface).
4. Source acquisition for paediatric, pregnancy and fetal bodies.
