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

- `pipeline/build_rig.py` builds `bodies/PANACEA_RIG_ADULT_MALE.blend` (local .blend, not committed). The master and the web export pipeline are untouched.
- **Joint centres from source geometry, ISB definitions (Wu et al. 2002, 2005):** hip and shoulder by sphere fit on the femoral and humeral heads (femoral radius 23.8 mm, RMS 1.2 mm); knee and elbow at the epicondyle midpoint; ankle at the malleolus midpoint; wrist at the styloid-tip midpoint; spine at intervertebral disc centroids. Values and methods are in `manifest/rig_adult_male.json`. An independent recomputation agreed within 1–6 mm.
- **39 bones; all 645 skeletal and joint meshes rigidly bound.** 33 nearest-segment assignments are listed for review. Multi-segment ligaments, including the costotransverse and rib-head ligaments, are flagged: rigid binding is only an approximation for them.
- **ROM limits are mostly AAOS normal values** (Greene & Heckman 1994) as local rotation limits, with the sign of each axis tested numerically on the rig. Deviations:
  - Forearm rotation is measured from the anatomical rest pose, which is full supination: pronation 0–160°, equal to AAOS 80 + 80 about neutral.
  - Shoulder adduction is 0, because the arm is already against the trunk; horizontal adduction is not modelled.
  - The clavicle and spine have no limits.
- **QA** (`pipeline/check_rig_pose.py` → `qa_reports/rig_pose_adult_male.json`) checks:
  - a 170° knee request clamps to 132.8°;
  - hip flexion moves the knee anteriorly;
  - wrist flexion moves the hand anteriorly;
  - the pronation limit moves the anterior forearm medially;
  - no mesh ends up more than 25 cm from its bone. This only catches gross misbinding (wrong segment or side). Ribs, costal cartilages and the sternum are excluded.
- **Known limits:**
  - The patella is bound to the thigh, though it actually tracks the tibia.
  - Ribs are bound to their vertebrae and the sternum to T4, so posing thoracic segments individually would separate the cage.
  - No soft-tissue skinning yet.
  - The scapulothoracic and atlantoaxial joints are not separate bones.
  - No rigs yet for the other bodies, and no posing in the app.

## Web polygon budget: initial load ≤ 80,000 triangles per body (2026-10-04)

- New **LOD4** (`export_web_lods.py --lods LOD4`): per-system triangle budgets. Within each system every structure keeps a floor of 8 triangles, so none disappear, and the rest is shared in proportion to surface area. The default-visible systems (surface, skeletal, cardiovascular, respiratory, digestive, urinary, reproductive) sum to ≤ 80,000 triangles per body.
- Non-manifold edges (for example the cavernous sinus and falx cerebri sheets) blocked collapse decimation. LOD4 export splits those edges on a temporary copy, with identical vertex positions. The master is unchanged.
- Measured, after the bbox-escape gate below: adult male initial load 77,956 triangles (all systems 133,412), adult female 77,922 (127,661). Paediatric and ICRP bodies already fit at LOD3 (32,000–44,000). Shape error per structure is in `web/lod_report.json`; for example, the scapula has 0.2 mm mean and 0.9 mm max.
- **App:**
  - Light (default on every screen) uses LOD4 where it exists.
  - Systems now load incrementally: only enabled systems on first load, others when switched on.
  - Search uses a per-body index (`<tag>.index.json`), so structures in unloaded systems are still found; selecting one loads its system first.
- **Gates:** `pipeline/check_web_budget.py` counts triangles from the published GLBs and fails above 80,000. The browser check asserts the initial load is ≤ 80k and covers lazy loading (sciatic nerve from the unloaded nervous system).

## Decimation safety gate and 2M render proxy (2026-10-09)

- **Bbox-escape gate** (`pipeline/lod_budget.py`): collapse decimation can move vertices outside a structure's own bounding box. On non-manifold meshes whose edges were split, it can explode them by tens of metres; the cavernous sinus reached 49 m at some ratios. Any structure that leaves its source bbox by more than max(3 mm, 5 % of its diagonal) is fixed in steps:
  1. the decimation ratio is relaxed (×2, ×4, ×8);
  2. if that fails, the unsplit mesh is used;
  3. if that also fails, the structure is not decimated.
  The extra triangles are absorbed by the other structures in the same system. `export_web_lods.py` then refuses to write any GLB that still escapes.
- The re-exported LOD4 replaces the earlier one. That earlier one was not exploded (no mesh over 1 m), but some thin vessels sat up to about 15 mm outside their bbox. To stay at or under 80k without loosening the tolerance, the adult male gets tighter non-vascular budgets: its 677 vessels need about 45,800 triangles. Skeletal error is still small (scapula 0.37 mm mean, 2 mm max).
- **2M render proxy** (`pipeline/build_render_proxy.py` → `bodies/PANACEA_RENDER_2M_ADULT_MALE.blend`, local; report `manifest/render_proxy_adult_male.json`):
  - 11,541,912 → 2,022,441 triangles over 3,877 structures. The budget is 2,000,000; the overshoot comes from structures the bbox gate relaxed.
  - Shape error: median of per-structure mean 0.055 mm; 95th percentile of per-structure max 1.046 mm. The worst outliers are thin attachment-area meshes, listed in the report.
  - Smart UV on all 3,877 structures.
  - 42 tissue materials upgraded to procedural PBR derived from geometry: object-space albedo and roughness variation, micro bump, and cavity darkening from pointiness. This is appearance only, not measured tissue texture; each material carries `panacea_material_note`. No fibre direction, pores or patterns were invented.
- **8K render** (`pipeline/render_8k.py`, 7680×4320): anterior deep view (translucent skin) beside the muscle layer. The JPEG is in `renders/`; the 16-bit PNG stays local.
- Not yet: baked texture maps (the procedural materials are resolution-independent, so 8K renders need no texture files), proxies for the other bodies, and animation.

## Rig axes, hinge fit, pronation axis and ROM animation (2026-10-09)

- **Flexion axes (ISB):** knee, elbow, ankle and wrist rotate about the femoral-epicondyle, humeral-epicondyle, malleolar and radial–ulnar styloid lines, not simply perpendicular to the bone. Measured as the angle between lines, the axes change by 3.7°, 8.2°, 43.2° and 7.2° (right side; the left mirrors it).
- **Hinge centre fit** (`pipeline/fit_hinge_centres.py` → `manifest/rig_hinge_refinement.json`): the ISB landmark midpoints are coordinate-system landmarks, not the functional hinge. Starting from the ISB centre, each hinge centre is moved only in the plane perpendicular to its axis, within ±12 mm per direction on a 2 mm grid, to minimise child-into-parent penetration across the AAOS range.

  | Hinge | Shift | Penetration before → after |
  |---|---|---|
  | Elbow | 2.8 mm | 0.23 → 0.0 mm |
  | Ankle | 0.0 mm | 0.78 → 0.78 mm |
  | Wrist (proximal carpal row against radius and ulna) | 0.0 mm | 0.0 → 0.0 mm |

  - The elbow and ankle shifts reach the edge of the search window, so they are bounded results, not converged optima.
  - An independent circle fit puts the centre of curvature of the distal humerus and the talar dome 5.8 mm and 4.9 mm from the refined centres, against 11.3 mm and 16.5 mm from the ISB centres.
  - The fit's nearest-normal penetration test is unreliable for thin parallel bones. A pronation-axis fit was tried and rejected because it made radius–ulna overlap worse under the parity test.
- **Pronation axis:** a new bone `FOREARM_ROT` runs from the radial head centre to the ulnar head centre. The radius, the distal radio-ulnar joint and the hand follow it, so the radius rotates about the ulna and the ulna stays on the humeroulnar hinge. Before this fix, rotating the whole forearm drove the ulna up to 7.9 mm into the humerus.
- **ROM animation** (`pipeline/animate_rom.py` → `bodies/PANACEA_RIG_ADULT_MALE_ROM.blend`, local; preview `renders/rom_preview_1280x720.mp4`):
  - 793 frames at 24 fps, 11 movements; each joint goes 0 → limit → 0, using AAOS normal values except as listed below.
  - Animation caps below the rig's AAOS limits, each set by measurement:
    - Shoulder flexion 120°: the glenohumeral share of 180° under the 2:1 scapulohumeral rhythm (Inman et al. 1944). Without scapular rotation, 180° drives the scapula about 10 mm into the humerus.
    - Shoulder abduction 90°: more conservative than the 2:1 share.
    - Forearm pronation 120° of 160°: beyond about 120° the lunate meets the ulnar head, because the TFCC disc is not modelled and the distal axis point is approximate.
  - Hip flexion is performed with the knee flexed, as AAOS measures it.
  - QA (`qa_reports/rig_rom_animation.json`): peak excursions are knee 129.6°, elbow 149.9°, hip 120.0° and shoulder 120.0°.
  - Penetration is measured on 13 bone pairs per side, both sides (26 entries), in both directions, using 3-ray parity, every 12 frames plus every movement peak. A pair whose object is missing now fails the run instead of being skipped; this had silently dropped the wrist pairs.
  - Maximum penetration is 1.31 mm, at the femur–tibia (knee flexion) and ulna–lunate (pronation) pairs. The wrist carpal pairs reach at most 1.31 mm. The limit is 1.5 mm, and articular cartilage is not modelled.
  - The tibia–fibula pair overlaps by 1.44 mm in the source mesh at rest; it is not affected by the animation.
- **In the app** (Canonical Body → Adult male → Motion):
  - The rig (`adult_male.rig_rom.glb`, 645 bone and joint meshes, 33,642 triangles in the GLB, meshopt, 1.4 MB) plays the clip labelled **Simulation**.
  - Controls: play/pause, timeline scrub and 0.25–2× speed. The panel sits below the canvas.
  - Timing:
    - Time comes from `THREE.Timer` real elapsed time with Page Visibility, not frame counts.
    - Timeline times use the same frame/fps scale as the glTF keys, and the parser accepts at most half a frame of rounding.
    - UI state updates at about 10 Hz while playing and once on pause, not every frame.
  - The engine (`engine/motionTimeline.ts`) has 17 positive and negative unit tests. The browser check confirms the canvas changes while playing and that scrubbing reaches the named movement.
  - Skeleton and joints only: muscles and skin are not rigged.
  - Known gaps:
    - Selecting a bone in motion mode shows its details, but there is no highlight.
    - The rig's camera framing assumes the default 30° field of view.
- Not yet: gait or other recorded motion (needs an open motion-capture dataset), video → rig retargeting, scapulothoracic, atlantoaxial and TFCC modelling, and soft-tissue deformation.
