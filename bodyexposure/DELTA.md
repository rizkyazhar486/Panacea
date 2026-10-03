# Delta: current implementation vs. Body Exposure master directive

Status as of master v009 (2026-10-03).

## Body matrix

| Body | Status | Notes |
|---|---|---|
| Adult male | **source_backed** | 2,610 structures, all systems, Z-Anatomy/BodyParts3D |
| Adult female | **source_backed_partial** | 848 structures (+ spinal cord C1–S4, mammary gland architecture), HuBMAP VH_Female: organs, female pelvis, uterus/adnexa, heart, airway, kidneys, eyes, knees, brain. No full skeleton, musculature or peripheral nerves |
| Pregnant | placeholder | ICRP pregnant-female mesh phantoms (fetal ages 8–38 wk) are in public consultation; data not released |
| Fetus | placeholder | comes with the ICRP pregnant-female phantoms (not released) |
| Neonate / infant / child (5, 10 y) / adolescent | **source_backed**, live in app | ICRP Publication 156 CT-based phantoms, male + female (10 bodies, 102–140 structures each); gross-anatomy gate 10/10 on every body |
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
| Exploded / cutaway / section | **In app:** section plane (sagittal, coronal, axial, with slider), reversible system dispersion (P = P0 + d·E·w), two-point measurement, continuous layer peel (skin → muscle & fascia → bone; the selected structure is never peeled), plus the existing ghost/isolate/hide/search/focus. The 4K exploded and cutaway scenes remain |
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

## SOP gross-anatomy gate (§11)

All 12 populated bodies pass (2 adults + 10 paediatric). See QA.md.

## Owner reference set and coverage check (2026-10-03)

- 71 owner-supplied reference files were registered (`manifest/references.json`, `references/README.md`). All are AI-generated (ChatGPT or Tripo), so they serve as **art direction and scope only**. No geometry was merged.
- The reference 12-system checklist was run against the inventory (`manifest/reference_coverage.json`). Adult male 58/67, adult female 41/67.
- New open dependencies: the male **rectum, anal canal, ileum and caecum** (absent from Z-Anatomy too), and the female **axial skeleton and upper GI tract** (absent from HuBMAP VH_F).

## v010: adult male gut audit against BodyParts3D 4.0 (2026-10-03)

- BodyParts3D 4.0, the source Z-Anatomy was built from, is registered to the male frame. Global fit on 277 shared structures, then pelvic ICP: median surface distance 1.1 mm.
- Three Z-Anatomy gut labels are corrected from geometry and landmarks: "Sigmoid colon" → **Rectum**, "Jejunum" → **Jejunum and ileum**, "Descending colon" → **Descending and sigmoid colon**. Old IDs are kept in `panacea_previous_ids`.
- Added: **external anal sphincter** (BodyParts3D). Not added: the **caecum**, which would sit 60% inside the existing small-intestine mesh. It stays an open dependency.
- The male gross-anatomy gate still passes. The adult male now has 3,877 structures. The structure manifest was also regenerated: the committed copy predated the paediatric left/right ID fix and now matches the shipped GLBs.

## v011: ICRP Publication 145 adult reference bodies (2026-10-03)

- Added `ICRP.ADULT.MALE` (176 cm) and `ICRP.ADULT.FEMALE` (163 cm), 93 structures each, linked into the master and published as the **"ICRP reference" variant** of the adult entries. The default variants stay Z-Anatomy (male) and Visible Human/HuBMAP (female).
- This closes the adult female's axial-skeleton and upper-GI gap with a complete, internally consistent body, not by grafting anatomy from another individual.
- Gross-anatomy gate: both pass. App: variant selector on the adult tabs; the browser check covers the ICRP female (163 cm, 93 structures, ribs searchable).
- Builder fixes found on the adult data: drop "Air remaining", classify "Teeth" and "Cranium cortical surrounding frontal sinus", readable ICRP airway names.

## P5: adult male skeletal rig (2026-10-04)

- `pipeline/build_rig.py` builds `bodies/PANACEA_RIG_ADULT_MALE.blend` (local, not committed: .blend). The master and the web export pipeline are untouched.
- **Joint centres from source geometry, ISB definitions (Wu et al. 2002, 2005):** hip and shoulder by sphere fit on the femoral and humeral heads (femoral radius 23.8 mm, RMS 1.2 mm); knee and elbow at the epicondyle midpoint; ankle at the malleolus midpoint; wrist at the styloid-tip midpoint; spine at intervertebral disc centroids. Values and methods are in `manifest/rig_adult_male.json`.
- **39 bones; all 645 skeletal and joint meshes rigidly bound.** Rule-based binding; 39 nearest-segment assignments are listed for review. 14 multi-segment ligaments are flagged: rigid binding is only an approximation for them.
- **ROM limits:** AAOS normal values (Greene & Heckman 1994) as local rotation limits. The sign of each axis is set numerically on the rig.
- **QA** (`pipeline/check_rig_pose.py` → `qa_reports/rig_pose_adult_male.json`): a test pose keeps every mesh with its bone; a 170° knee request is clamped to 132.8° (135° AAOS limit minus the rest angle); hip flexion moves the knee anteriorly. Left/right segment lengths match within 0.01 mm.
- Not yet: soft-tissue skinning (muscle and skin deformation), scapulothoracic and atlantoaxial joints as separate bones, rigs for the other bodies, and posing in the app.
