# QA record

Engineering checks run on the master. These are measurements, not clinical validation, and
no aggregate quality score is claimed: the reference measurements needed for one do not exist
yet.

## Whole-body frame (adult male)

| Check | Result |
|---|---|
| Stature (vertex z-extent) | 1.696 m (0.009 → 1.705 m) |
| Pose | Anatomical position: palms anterior, radius/ulna parallel (anterior and lateral viewport review) |
| Left/right mirror symmetry of paired bone centroids | all pairs within 4 mm |
| Knee vs hip–ankle line | 1.8 mm medial-lateral, 7.2 mm antero-posterior |
| ASIS–pubic plane tilt | 0.5° (neutral) |
| Lateral malleolus below medial malleolus | yes, by 20 mm (anatomically expected) |
| Layer alignment | muscle, vessel, nerve, visceral, lymphoid and surface layers share the skeleton's frame (bounds and viewport overlap checks) |

## Laterality audit

- All 2,610 male structures have unique IDs; no Blender `.001` duplicates remain.
- 1 source naming error corrected (eyelashes), 1 merged source object flagged (right vagus).
- 219 unpaired organs had their geometric side suffix removed (an early pass had produced
  names like `RIGHT_VENTRICLE.L`).
- Female: cardiac structures whose names contain "left"/"right" (left ventricle, right
  coronary artery…) are kept unpaired; the side words are part of the name.

## Intervertebral discs (23, C2–C3 to L5–S1)

| Check | Result |
|---|---|
| Vertices inside adjacent bone | 0 for all 23 (after the push-out pass; 45–243 per disc before it) |
| Manifold | all 23 closed manifold |
| Disc share of C2–L5 column path | 0.256 (Gray's: about one quarter) |
| Cranio-caudal trend of centre height | cervical 2.7–4.7 mm, thoracic 3.9–8.1 mm, lumbar 6.2–16.3 mm |
| Lordotic wedge L4–L5 | anterior 9.2 mm > posterior 7.1 mm |

Known: some posterior heights read low (C4–C5 0.5 mm, C7–T1 0.6 mm). Those posterior
probes fall where the convex outline overfills the endplate, and the minimum-thickness
clamp sets the floor. Needs review against imaging.

## Pericardium and heart–lung relationship

| Check | Result |
|---|---|
| Sampled heart-chamber vertices outside the sac | 0 / 3,671 |
| Coronary/epicardial vessels inside the sac | included by construction (27 structures) |
| Sac vertices inside lung tissue (3-ray parity), before → after lung correction | left upper lobe 114 → 10 of 2,143; the other lobes 0–50 of 2,143 |
| Surface | smooth after morphological closing; first attempts showed coronary imprints and pits (fixed) |

Iterations that failed and were replaced, kept here for the record:
- Corrective smoothing alone let the heart poke through.
- A Laplacian pre-smooth wrinkled the surface and left 8% of chamber vertices outside.

## Web derivatives

| Check | Result |
|---|---|
| Files | 108 GLB: 2 bodies × 12–14 systems × 4 LODs, plus the lymph-node tissue module |
| Size | 315 MB raw → 87 MB meshopt-compressed; male LOD2 = 1.05 M triangles in 9.2 MB |
| Structure names and provenance extras after compression | preserved in 108 / 108 files (checked by `pack_web.py`) |
| LOD2 mean geometric error vs master | 0.03–0.39 mm by system (worst single case: hair, 7.8 mm max) |
| Browser test at 390×844 (Chromium, three r185) | male LOD2: 2,611 structures in 0.7 s; female LOD2: 841 in 0.12 s; 0 load failures; tap-to-identify returns ID, system, laterality, status and source |

## Pass v007

- **Joint capsule reconstruction: attempted and rejected.** Distance-rule attachment regions
  produced a cap over the femoral head and acetabulum instead of a sleeve from the
  acetabular rim to the intertrochanteric line. The objects were deleted, not shipped. Real
  source capsules were then found in the full Z-Anatomy model and used instead.
- Knee, reviewed anterior and posterior: the cruciate ligaments cross in the intercondylar
  notch; the menisci sit on the tibial plateau; the collateral and popliteofibular ligaments
  are in place.
- Femur and hip bone attachments: the vastus intermedius origin covers the anterior shaft,
  the iliacus origin the iliac fossa, and the adductor and pectineus origins the pubic region.
- Source discs: 0 vertices left inside bone after correction (14–33 % before).

## Defects found in the previous pass and fixed

1. **Female frame mismatch.** The spinal cord and breast tissue added later sat 1.2 m to the
   side and 0.67 m low. They were imported at source coordinates while the rest of the
   female body carried a display offset. The alignment check at the time only compared the
   front-to-back axis, so it missed this. Fix: every female mesh is baked to one canonical
   frame (feet at z = 0) with no hidden hierarchy offsets. Re-check: the C5 cord segment is
   above the aortic arch, and the L1 segment is level with the upper kidneys.
2. **System misroutes from keyword collisions:** 57 female and 3 male structures; see
   PROVENANCE.
3. **Kidney sub-part laterality:** the side was embedded mid-name; fixed for 69 structures.
4. **Lymph-node tissue model filed as part of the female body:** moved to
   `21_MICROSCOPY` as `MODULE.TISSUE.LYMPH_NODE`.
5. **Viewer:** the surface system was missing from the load list, and overlapping loads
   raced each other.

## Mesh topology (from `manifest/qa_summary.json`)

- Male vessels: 663 of 676 meshes are open. That is expected: the source models vessel
  segments as open-ended tubes.
- Male nervous: 70 meshes have non-manifold edges and the ethmoid/occipital/Vertebra T8
  meshes have residual open edges. These come from the source and have not been repaired.
- Totals: male 5.0 M vertices, female 1.78 M. That is far above a mobile web budget, so
  LOD derivation is required before any web export.

## Render QA

- Bugs caught by visual review and fixed: overexposure (AgX highlight desaturation), serous
  membranes hiding the viscera, sub-collections excluded from the view layer (vessels and
  nerves missing from renders), anchors computed before matrix update (all at the origin).
- Opened-thorax frame: the translucent lungs expose the cut ends of source pulmonary vessels where they stop inside the lung. This is a source limitation, left visible on purpose.
- Benchmarks (`renders/`) were checked at 100 % crop for readability of the brachial
  neurovascular bundle, intercostal vessels and bowel.
